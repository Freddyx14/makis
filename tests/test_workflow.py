"""Offline acceptance checks. No Exa or LLM calls and no real campaign database."""
import json
import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from webapp import db
from webapp.app import app
from webapp.extract import extract_site, public_address
from webapp.providers import CompatibleProvider, DemoProvider

INPUT = {"url": "https://example.com", "objetivo": "ventas", "presupuesto": "2500.00", "moneda": "PEN", "duracion_semanas": 4,
         "publico": "Personas de Lima", "notas": "No prometer resultados garantizados"}


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"DATABASE_PATH": str(Path(self.folder.name) / "test.sqlite3"), "LLM_PROVIDER": "demo", "DEMO_PASSWORD": "", "APP_ENV": "development"})
        self.env.start()
        self.client = TestClient(app)
        self.client.__enter__()
        self.client.get("/api/session")

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env.stop()
        self.folder.cleanup()

    def create(self, client=None):
        response = (client or self.client).post("/api/campaigns", json=INPUT)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["id"]

    def generate(self, cid, **extra):
        response = self.client.post(f"/api/campaigns/{cid}/brief", json={"ejemplo": True, **extra})
        self.assertEqual(response.status_code, 202, response.text)
        return self.client.get(f"/api/campaigns/{cid}/brief").json()

    def test_edit_versions_approve_and_reopen(self):
        cid = self.create()
        result = self.generate(cid)
        self.assertEqual(result["campaign"]["status"], "review")
        self.assertEqual(result["runs"][0]["tokens"], 0)
        self.assertEqual(result["versions"][0]["source"], "demo")
        brief = result["versions"][0]["contenido"]
        self.assertIsNone(brief["objetivo"]["meta_numerica"])
        self.assertEqual(brief["publico_objetivo"]["origen"], "usuario")
        brief["negocio"]["texto"] = "Contexto revisado por una persona"
        edit = self.client.patch(f"/api/campaigns/{cid}/brief", json={"expected_version": 1, "contenido": brief})
        self.assertEqual(edit.status_code, 200)
        stale = self.client.patch(f"/api/campaigns/{cid}/brief", json={"expected_version": 1, "contenido": brief})
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(self.client.post(f"/api/campaigns/{cid}/brief/approve", json={"expected_version": 1}).status_code, 409)
        self.assertEqual(self.client.post(f"/api/campaigns/{cid}/brief/approve", json={"expected_version": 2}).status_code, 200)
        # A new connection reads exactly the persisted state; no in-memory campaign state.
        again = self.client.get(f"/api/campaigns/{cid}/brief").json()
        self.assertEqual(again["campaign"]["status"], "ready_for_research")
        self.assertEqual(len(again["versions"]), 2)
        self.assertEqual(again["versions"][0]["contenido"]["negocio"]["texto"], brief["negocio"]["texto"])
        self.assertNotEqual(again["versions"][1]["contenido"]["negocio"]["texto"], brief["negocio"]["texto"])
        regenerated = self.generate(cid, expected_version=2, instrucciones="Priorizar B2B")
        self.assertEqual(len(regenerated["versions"]), 3)
        self.assertEqual(regenerated["campaign"]["status"], "review")
        self.assertIn("Priorizar B2B", regenerated["runs"][0]["input"]["instructions"])

    def test_unreadable_site_and_manual_recovery(self):
        cid = self.create()
        with patch("webapp.app.extract_site", return_value={"pages": [], "warnings": ["No disponible"], "discovered": 1, "attempted": 1, "limited": False}):
            response = self.client.post(f"/api/campaigns/{cid}/brief", json={})
        self.assertEqual(response.status_code, 202)
        data = self.client.get(f"/api/campaigns/{cid}/brief").json()
        self.assertEqual(data["campaign"]["status"], "needs_description")
        self.assertEqual(data["versions"], [])
        response = self.client.post(f"/api/campaigns/{cid}/brief", json={"descripcion_manual": "Vendemos café peruano de especialidad en Lima."})
        self.assertEqual(response.status_code, 202)
        data = self.client.get(f"/api/campaigns/{cid}/brief").json()
        self.assertEqual(data["campaign"]["status"], "review")
        self.assertEqual(data["versions"][0]["contenido"]["negocio"]["origen"], "usuario")

    def test_two_sessions_are_isolated(self):
        other = TestClient(app)
        other.get("/api/session")
        with ThreadPoolExecutor(max_workers=2) as pool:
            ids = list(pool.map(self.create, [self.client, other]))
        self.assertNotEqual(*ids)
        self.assertEqual(other.get(f"/api/campaigns/{ids[0]}/brief").status_code, 404)
        self.assertEqual(other.post(f"/api/campaigns/{ids[0]}/brief", json={"ejemplo": True}).status_code, 404)
        self.assertEqual(len(other.get("/api/campaigns").json()), 1)
        self.assertEqual(len(self.client.get("/api/campaigns").json()), 1)
        other.close()

    def test_validation_auth_and_origin(self):
        self.assertEqual(self.client.post("/api/campaigns", json={**INPUT, "presupuesto": -1}).status_code, 422)
        self.assertEqual(self.client.post("/api/campaigns", json={**INPUT, "duracion_semanas": 0}).status_code, 422)
        self.assertEqual(self.client.post("/api/campaigns", json=INPUT, headers={"origin": "https://evil.example"}).status_code, 403)
        self.assertEqual(TestClient(app).get("/api/campaigns").status_code, 401)
        self.assertEqual(self.client.get("/.env").status_code, 404)
        self.assertEqual(self.client.get("/static/../.env").status_code, 404)
        with patch.dict(os.environ, {"DEMO_PASSWORD": "test-only-password"}):
            c = TestClient(app)
            self.assertFalse(c.get("/api/session").json()["authenticated"])
            self.assertEqual(c.post("/api/login", json={"password": "wrong"}).status_code, 401)
            self.assertEqual(c.post("/api/login", json={"password": "test-only-password"}).status_code, 200)
            self.assertEqual(c.get("/api/campaigns").status_code, 200)
            c.close()

    def test_private_networks_are_rejected(self):
        for url in ("http://127.0.0.1", "http://169.254.169.254/latest", "http://[::1]/", "file:///etc/passwd", "https://example.com:9999"):
            with self.assertRaises(ValueError):
                public_address(url)
        with patch("webapp.extract.socket.getaddrinfo", return_value=[(2, 1, 6, '', ('10.0.0.1', 443))]):
            with self.assertRaises(ValueError):
                public_address("https://public-name.example")

    def test_restart_marks_interrupted_jobs_retryable(self):
        cid = self.create()
        with db.connect() as conn:
            conn.execute("INSERT INTO jobs VALUES ('interrupted',?,'running',20,'Leyendo','{}','2026-01-01')", (cid,))
            conn.execute("UPDATE campaigns SET status='generating' WHERE id=?", (cid,))
        self.assertEqual(self.client.post(f"/api/campaigns/{cid}/brief", json={"ejemplo": True}).status_code, 409)
        db.init()
        data = self.client.get(f"/api/campaigns/{cid}/brief").json()
        self.assertEqual(data["campaign"]["status"], "error")
        self.assertEqual(data["jobs"][0]["status"], "error")
        self.generate(cid)

    def test_provider_failure_does_not_become_fake_success(self):
        cid = self.create()
        with patch("webapp.app.DemoProvider.generate", side_effect=RuntimeError("private-token-123")):
            data = self.generate(cid)
        self.assertEqual(data["campaign"]["status"], "error")
        self.assertFalse(data["versions"])
        self.assertNotIn("private-token-123", str(data))

    def test_crawl_stays_on_host_and_reports_limits(self):
        def fake_fetch(url, host):
            if url.endswith("robots.txt"):
                return "User-agent: *\nDisallow: /private", url
            return ('<html><title>Café</title><body><p>' + 'Café peruano recién tostado. ' * 10 +
                    '</p><a href="/about">Acerca</a><a href="/private">Privado</a>' +
                    '<a href="https://outside.example">Fuera</a></body></html>', url)
        with patch.dict(os.environ, {"CRAWL_MAX_PAGES": "2", "EXA_API_KEY": ""}), patch("webapp.extract.public_address", return_value="93.184.215.14"), patch("webapp.extract.fetch_public", side_effect=fake_fetch):
            result = extract_site("https://example.com/", lambda *args: None)
        self.assertEqual(len(result["pages"]), 2)
        self.assertTrue(result["limited"])
        self.assertEqual(result["discovered"], 3)
        self.assertTrue(all(p["url"].startswith("https://example.com/") for p in result["pages"]))

    def test_compatible_adapter_validates_output_and_preserves_budget(self):
        extraction = {"pages": [], "manual": "Café peruano " * 1000}
        brief, _ = DemoProvider().generate(INPUT, extraction, "")
        output = brief.model_dump(mode="json")
        output["presupuesto"]["importe"] = "500"
        output["negocio"]["origen"] = "web"
        output["negocio"]["fuentes"] = ["https://unprovided.example"]
        response = MagicMock()
        response.json.return_value = {"choices": [{"message": {"content": json.dumps(output)}}], "usage": {"total_tokens": 42}}
        with patch.dict(os.environ, {"LLM_BASE_URL": "https://model.example/v1", "LLM_MODEL": "test-model", "LLM_API_KEY": "test-key"}), patch("webapp.providers.httpx.Client") as client:
            client.return_value.__enter__.return_value.post.return_value = response
            result, tokens = CompatibleProvider().generate(INPUT, extraction, "Mantener la voz de marca")
        self.assertEqual(float(result.presupuesto.importe), 2500)
        self.assertEqual(tokens, 42)
        self.assertEqual(result.negocio.origen, "hipotesis")
        self.assertFalse(result.negocio.fuentes)


if __name__ == "__main__":
    unittest.main()
