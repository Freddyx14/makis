"""Offline five-stage acceptance checks. Uses a temporary database."""
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from webapp import db
from webapp.app import app
from webapp.workflow import scheduled_mock_tick


class LabTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {"DATABASE_PATH":str(Path(self.folder.name)/"lab.sqlite3"), "LLM_PROVIDER":"demo", "DEMO_PASSWORD":"", "APP_ENV":"development"})
        self.env.start()
        self.client = TestClient(app)
        self.client.__enter__()
        self.client.get("/api/session")
        self.cid = self.client.post("/api/campaigns",json={"url":"https://example.com","objetivo":"leads","presupuesto":"2500","moneda":"PEN","duracion_semanas":2}).json()["id"]
        self.client.post(f"/api/campaigns/{self.cid}/brief",json={"ejemplo":True})

    def tearDown(self):
        self.client.__exit__(None,None,None)
        self.env.stop()
        self.folder.cleanup()

    def state(self):
        return self.client.get(f"/api/campaigns/{self.cid}/workflow").json()

    def act(self,action,status=200,**args):
        response=self.client.post(f"/api/campaigns/{self.cid}/workflow",json={"action":action,"expected_version":self.state()["version"],**args})
        self.assertEqual(response.status_code,status,response.text)
        return response.json()

    def prepare(self):
        self.client.post(f"/api/campaigns/{self.cid}/brief/approve",json={"expected_version":1})
        self.act("research")
        self.act("strategies")
        self.act("select",item_id=self.state()["strategies"][0]["id"])

    def test_complete_demo(self):
        self.act("research",409)
        self.prepare()
        self.assertEqual(len(self.state()["research"]["hallazgos"]),5)
        self.assertEqual(len(self.state()["debate"]),5)
        self.act("content")
        piece=next(p for p in self.state()["pieces"] if p["tipo"]!="email")
        self.act("publish",409,item_id=piece["id"])
        self.act("approve_piece",item_id=piece["id"])
        self.act("publish",item_id=piece["id"])
        self.act("publish",item_id=piece["id"])
        self.assertEqual(len(self.state()["executions"]),1)
        self.assertEqual(self.state()["executions"][0]["mode"],"mock")
        self.act("regenerate_piece",409,item_id=piece["id"])
        self.act("simulate",valor_conversion=100)
        metrics=self.state()["metrics"]
        self.assertAlmostEqual(sum(m["inversion"] for m in metrics),2500)
        self.act("simulate",valor_conversion=100)
        self.assertEqual(metrics,self.state()["metrics"])
        self.act("report")
        self.assertTrue(all(l["confianza"]=="baja" for l in self.state()["learnings"]))
        derived=self.act("iterate")["id"]
        fresh=self.client.get(f"/api/campaigns/{derived}/workflow").json()
        self.assertEqual(fresh["iteration"],2)
        self.assertFalse(fresh["pieces"])

    def test_manual_replacement_concurrency_and_isolation(self):
        self.prepare()
        self.act("simulate")
        self.act("manual_metrics",metrics=[{"canal":"meta_ads","fecha":"2026-09-12","impresiones":1000,"clics":50,"leads":10,"clientes":2,"inversion":100,"ingresos":300}])
        rows=[m for m in self.state()["metrics"] if m["canal"]=="meta_ads"]
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["cpl"],10)
        self.assertEqual(rows[0]["roas"],3)
        self.assertEqual(self.client.post(f"/api/campaigns/{self.cid}/workflow",json={"action":"simulate","expected_version":0}).status_code,409)
        with TestClient(app) as other:
            other.get("/api/session")
            self.assertEqual(other.get(f"/api/campaigns/{self.cid}/workflow").status_code,404)

    def test_scheduler_only_approved_and_once(self):
        self.prepare()
        self.act("content")
        piece=next(p for p in self.state()["pieces"] if p["tipo"]!="email")
        self.act("schedule",409,item_id=piece["id"],programada_para="bad")
        self.act("approve_piece",item_id=piece["id"])
        self.act("schedule",422,item_id=piece["id"],programada_para="bad")
        self.act("schedule",item_id=piece["id"],programada_para=(datetime.now(timezone.utc)+timedelta(days=1)).isoformat())
        with db.connect() as conn:
            row=conn.execute("SELECT * FROM lab_state WHERE campaign_id=?",(self.cid,)).fetchone()
            state=json.loads(row["payload"])
            for p in state["pieces"]:
                p["programada_para"]=(datetime.now(timezone.utc)-timedelta(minutes=1)).isoformat()
            conn.execute("UPDATE lab_state SET payload=? WHERE campaign_id=?",(db.dumps(state),self.cid))
        scheduled_mock_tick()
        scheduled_mock_tick()
        self.assertEqual(len(self.state()["executions"]),1)


if __name__=="__main__":
    unittest.main()
