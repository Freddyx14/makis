import json
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def dumps(value):
    return json.dumps(value, ensure_ascii=False, default=str)


@contextmanager
def connect():
    path = Path(os.getenv("DATABASE_PATH", str(ROOT / "data" / "makis.sqlite3")))
    path.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(path, timeout=15)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init():
    with connect() as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript("""
        CREATE TABLE IF NOT EXISTS campaigns (
          id TEXT PRIMARY KEY, owner TEXT NOT NULL, input TEXT NOT NULL,
          status TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS campaigns_owner ON campaigns(owner);
        CREATE TABLE IF NOT EXISTS briefs (
          id INTEGER PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id),
          version INTEGER NOT NULL, contenido TEXT NOT NULL, source TEXT NOT NULL,
          created_at TEXT NOT NULL, aprobado_at TEXT,
          UNIQUE(campaign_id, version));
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id),
          status TEXT NOT NULL, progress INTEGER NOT NULL, message TEXT NOT NULL,
          input TEXT NOT NULL, created_at TEXT NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS one_active_job ON jobs(campaign_id)
          WHERE status IN ('queued', 'running');
        CREATE TABLE IF NOT EXISTS agent_runs (
          id TEXT PRIMARY KEY, campaign_id TEXT NOT NULL REFERENCES campaigns(id),
          stage INTEGER NOT NULL, input TEXT NOT NULL, output TEXT NOT NULL,
          model TEXT NOT NULL, tokens INTEGER, duration REAL NOT NULL,
          status TEXT NOT NULL, created_at TEXT NOT NULL);
        """)
        # One application worker: an interrupted run is explicit and can be retried.
        db.execute("""INSERT OR IGNORE INTO agent_runs
          (id,campaign_id,stage,input,output,model,tokens,duration,status,created_at)
          SELECT id,campaign_id,1,input,'{"message":"Ejecución interrumpida por reinicio del servidor."}',
                 'interrumpido',NULL,0,'error',created_at FROM jobs WHERE status IN ('queued','running')""")
        db.execute("UPDATE campaigns SET status='error' WHERE id IN "
                   "(SELECT campaign_id FROM jobs WHERE status IN ('queued','running'))")
        db.execute("UPDATE jobs SET status='error', message='El servidor se reinició. Vuelve a generar el brief.' "
                   "WHERE status IN ('queued','running')")
