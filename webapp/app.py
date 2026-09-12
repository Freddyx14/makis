import json
import asyncio
import os
import secrets
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from itsdangerous import BadSignature, URLSafeTimedSerializer

from . import db
from .extract import extract_site
from .models import ApproveInput, CampaignInput, EditInput, GenerateInput, LoginInput
from .providers import DemoProvider, provider

load_dotenv(db.ROOT / ".env")
STATIC = Path(__file__).parent / "static"


def session_secret():
    if os.getenv("APP_SECRET"):
        return os.environ["APP_SECRET"]
    # Persist development sessions across restarts without placing a secret in Git.
    folder = Path(os.getenv("DATABASE_PATH", str(db.ROOT / "data" / "makis.sqlite3"))).parent
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / ".session-secret"
    try:
        with path.open("x", encoding="utf-8") as stream:
            stream.write(secrets.token_urlsafe(48))
    except FileExistsError:
        pass
    return path.read_text(encoding="utf-8").strip()


serializer = URLSafeTimedSerializer(session_secret(), salt="makis-session")


def now():
    return datetime.now(timezone.utc).isoformat()


@asynccontextmanager
async def lifespan(app):
    if os.getenv("APP_ENV") == "production" and (not os.getenv("DEMO_PASSWORD") or len(os.getenv("APP_SECRET", "")) < 32):
        raise RuntimeError("Producción requiere DEMO_PASSWORD y APP_SECRET de al menos 32 caracteres.")
    db.init()
    async def scheduler():
        from .workflow import scheduled_mock_tick
        while True:
            await asyncio.sleep(60)
            await asyncio.to_thread(scheduled_mock_tick)
    task = asyncio.create_task(scheduler())
    try:
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(title="Makis · Entrada y dirección", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.middleware("http")
async def boundaries(request: Request, call_next):
    # Without a password this is strictly a loopback-only development app.
    if not os.getenv("DEMO_PASSWORD") and request.client and request.client.host not in ("127.0.0.1", "::1", "testclient"):
        return JSONResponse({"detail": "Configura DEMO_PASSWORD para acceso remoto."}, status_code=403)
    if request.method in ("POST", "PATCH", "DELETE"):
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") != str(request.base_url).rstrip("/"):
            return JSONResponse({"detail": "Origen no autorizado."}, status_code=403)
        if request.headers.get("content-type", "").split(";")[0] != "application/json":
            return JSONResponse({"detail": "Se requiere JSON."}, status_code=415)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    return response


def session_owner(request: Request):
    try:
        return serializer.loads(request.cookies.get("makis_session", ""), max_age=7 * 86400)
    except BadSignature:
        raise HTTPException(401, "Inicia una sesión para continuar.")


def set_session(response: Response, owner):
    response.set_cookie("makis_session", serializer.dumps(owner), httponly=True, samesite="strict",
                        secure=os.getenv("APP_ENV") == "production", max_age=7 * 86400)


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/session")
def session(request: Request, response: Response):
    try:
        session_owner(request)
        authenticated = True
    except HTTPException:
        authenticated = False
    if not os.getenv("DEMO_PASSWORD") and not authenticated:
        set_session(response, str(uuid4()))
        authenticated = True
    configured = os.getenv("LLM_PROVIDER", "demo") == "compatible" and all(os.getenv(k) for k in ("LLM_API_KEY", "LLM_MODEL", "LLM_BASE_URL"))
    return {"authenticated": authenticated, "password_required": bool(os.getenv("DEMO_PASSWORD")),
            "provider": "Modelo configurado" if configured else "Modo demo · sin LLM",
            "llm_ready": bool(configured), "crawl_limit": max(1, min(int(os.getenv("CRAWL_MAX_PAGES", "20")), 100))}


@app.post("/api/login")
def login(body: LoginInput, request: Request, response: Response):
    if not secrets.compare_digest(body.password.encode(), os.getenv("DEMO_PASSWORD", "").encode()):
        raise HTTPException(401, "Contraseña incorrecta.")
    try:
        owner = session_owner(request)
    except HTTPException:
        owner = str(uuid4())
    set_session(response, owner)
    return {"ok": True}


def campaign_for(conn, campaign_id, owner):
    row = conn.execute("SELECT * FROM campaigns WHERE id=? AND owner=?", (campaign_id, owner)).fetchone()
    if not row:
        raise HTTPException(404, "Campaña no encontrada.")
    return dict(row)


def latest(conn, cid):
    return conn.execute("SELECT * FROM briefs WHERE campaign_id=? ORDER BY version DESC LIMIT 1", (cid,)).fetchone()


def ensure_mutable(conn, cid, expected):
    workflow = conn.execute("SELECT payload FROM lab_state WHERE campaign_id=?", (cid,)).fetchone()
    if workflow and json.loads(workflow["payload"]).get("research"):
        raise HTTPException(409, "Este brief ya tiene investigación asociada. Crea una nueva campaña para cambiarlo sin invalidar los resultados.")
    if conn.execute("SELECT 1 FROM jobs WHERE campaign_id=? AND status IN ('queued','running')", (cid,)).fetchone():
        raise HTTPException(409, "Hay una generación en curso. Espera a que termine.")
    current = latest(conn, cid)
    if (current["version"] if current else 0) != expected:
        raise HTTPException(409, "El brief cambió en otra pestaña. Recarga antes de guardar.")
    return current


@app.get("/api/campaigns")
def campaigns(owner=Depends(session_owner)):
    with db.connect() as conn:
        rows = conn.execute("SELECT * FROM campaigns WHERE owner=? ORDER BY created_at DESC", (owner,)).fetchall()
        return [{**dict(r), "input": json.loads(r["input"])} for r in rows]


@app.post("/api/campaigns", status_code=201)
def create_campaign(body: CampaignInput, owner=Depends(session_owner)):
    cid = str(uuid4())
    with db.connect() as conn:
        conn.execute("INSERT INTO campaigns VALUES (?,?,?,?,?)", (cid, owner, body.model_dump_json(), "draft", now()))
    return {"id": cid}


@app.get("/api/campaigns/{cid}/brief")
def get_brief(cid: str, owner=Depends(session_owner)):
    with db.connect() as conn:
        campaign = campaign_for(conn, cid, owner)
        campaign["input"] = json.loads(campaign["input"])
        versions = [{**dict(r), "contenido": json.loads(r["contenido"])} for r in conn.execute(
            "SELECT * FROM briefs WHERE campaign_id=? ORDER BY version DESC", (cid,))]
        jobs = [dict(r) for r in conn.execute("SELECT id,status,progress,message,created_at FROM jobs WHERE campaign_id=? ORDER BY created_at DESC", (cid,))]
        runs = [{**dict(r), "input": json.loads(r["input"]), "output": json.loads(r["output"])} for r in conn.execute(
            "SELECT * FROM agent_runs WHERE campaign_id=? ORDER BY created_at DESC", (cid,))]
    return {"campaign": campaign, "versions": versions, "jobs": jobs, "runs": runs}


def progress(jid, amount, message):
    with db.connect() as conn:
        conn.execute("UPDATE jobs SET status='running',progress=?,message=? WHERE id=?", (amount, message, jid))


def run_director(cid, jid, campaign, params):
    start = time.monotonic()
    extraction, output, model, tokens = {}, {}, "no ejecutado", None
    result_status, status, message = "error", "error", "No se pudo generar el brief. Revisa la configuración y vuelve a intentarlo."
    brief = None
    try:
        progress(jid, 5, "Preparando contexto del negocio")
        if params["descripcion_manual"]:
            extraction = {"pages": [], "manual": params["descripcion_manual"], "warnings": [], "discovered": 0, "attempted": 0, "limited": False}
        elif params["ejemplo"]:
            extraction = {"pages": [], "manual": "Negocio ficticio: Kintu Café. Tostador peruano de café de especialidad con venta online, suscripciones mensuales y envíos en Lima. Compra directamente a pequeños productores de Cajamarca y ofrece café recién tostado.",
                          "warnings": ["Ejemplo ficticio para explorar la interfaz. No se visitó ninguna web."], "discovered": 0, "attempted": 0, "limited": False}
        else:
            extraction = extract_site(campaign["url"], lambda p, m: progress(jid, p, m))
        if not extraction.get("pages") and not extraction.get("manual"):
            status, result_status = "needs_description", "needs_description"
            message = "No pudimos leer suficiente contenido. Añade una descripción del negocio para continuar."
        else:
            progress(jid, 65, "Director · estructurando el brief maestro")
            llm = DemoProvider() if params["ejemplo"] else provider()
            model = llm.name
            brief, tokens = llm.generate(campaign, extraction, params["instrucciones"])
            output = brief.model_dump(mode="json")
            result_status, status = "completed", "review"
            message = "Brief listo para tu revisión."
    except Exception:
        # Never return exception text: provider responses can include secrets/content.
        pass
    with db.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        if brief:
            current = latest(conn, cid)
            version = current["version"] + 1 if current else 1
            source = "demo" if model.startswith("demo-") else "ia"
            conn.execute("INSERT INTO briefs(campaign_id,version,contenido,source,created_at) VALUES (?,?,?,?,?)", (cid, version, db.dumps(output), source, now()))
        conn.execute("UPDATE campaigns SET status=? WHERE id=?", (status, cid))
        conn.execute("UPDATE jobs SET status=?,progress=?,message=? WHERE id=?", (result_status, 100, message, jid))
        conn.execute("INSERT INTO agent_runs VALUES (?,?,?,?,?,?,?,?,?,?)", (
            jid, cid, 1, db.dumps({"campaign": campaign, "instructions": params["instrucciones"], "extraction": extraction}),
            db.dumps(output or {"message": message}), model, tokens, round(time.monotonic() - start, 2), result_status, now()))


@app.post("/api/campaigns/{cid}/brief", status_code=202)
def generate(cid: str, body: GenerateInput, tasks: BackgroundTasks, owner=Depends(session_owner)):
    with db.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        campaign = campaign_for(conn, cid, owner)
        ensure_mutable(conn, cid, body.expected_version)
        if not body.ejemplo:
            try:
                provider()
            except ValueError as exc:
                raise HTTPException(422, str(exc))
        jid = str(uuid4())
        conn.execute("INSERT INTO jobs VALUES (?,?,?,?,?,?,?)", (jid, cid, "queued", 0, "En cola", body.model_dump_json(), now()))
        conn.execute("UPDATE campaigns SET status='generating' WHERE id=?", (cid,))
    tasks.add_task(run_director, cid, jid, json.loads(campaign["input"]), body.model_dump())
    return {"job_id": jid}


@app.patch("/api/campaigns/{cid}/brief")
def edit(cid: str, body: EditInput, owner=Depends(session_owner)):
    with db.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        campaign_for(conn, cid, owner)
        ensure_mutable(conn, cid, body.expected_version)
        version = body.expected_version + 1
        conn.execute("INSERT INTO briefs(campaign_id,version,contenido,source,created_at) VALUES (?,?,?,?,?)", (cid, version, body.contenido.model_dump_json(), "humano", now()))
        conn.execute("UPDATE campaigns SET status='review' WHERE id=?", (cid,))
    return {"version": version}


@app.post("/api/campaigns/{cid}/brief/approve")
def approve(cid: str, body: ApproveInput, owner=Depends(session_owner)):
    with db.connect() as conn:
        conn.execute("BEGIN IMMEDIATE")
        campaign_for(conn, cid, owner)
        current = ensure_mutable(conn, cid, body.expected_version)
        if not current:
            raise HTTPException(404, "Primero genera un brief.")
        conn.execute("UPDATE briefs SET aprobado_at=COALESCE(aprobado_at, ?) WHERE campaign_id=? AND version=?", (now(), cid, body.expected_version))
        conn.execute("UPDATE campaigns SET status='ready_for_research' WHERE id=?", (cid,))
    return {"status": "ready_for_research", "message": "Brief aprobado. Continúa con la investigación en el laboratorio."}


from .workflow import build_router
app.include_router(build_router(session_owner, campaign_for, latest, now, progress))
