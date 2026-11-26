import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from fastapi import HTTPException

import main
import analytics as analytics_mod


class TestRapidAPIAuthAndEndpoints(unittest.TestCase):
    def test_verify_rapidapi_auth_when_configured(self):
        orig_secret = main.RAPIDAPI_PROXY_SECRET
        try:
            main.RAPIDAPI_PROXY_SECRET = "test-rapidapi-secret-123"

            # Missing secret header -> 403
            req_missing = SimpleNamespace(headers={})
            with self.assertRaises(HTTPException) as ctx_missing:
                main.verify_rapidapi_auth(req_missing)
            self.assertEqual(ctx_missing.exception.status_code, 403)

            # Invalid secret header -> 403
            req_invalid = SimpleNamespace(headers={"X-RapidAPI-Proxy-Secret": "wrong-secret"})
            with self.assertRaises(HTTPException) as ctx_invalid:
                main.verify_rapidapi_auth(req_invalid)
            self.assertEqual(ctx_invalid.exception.status_code, 403)

            # Valid secret header -> OK
            req_ok = SimpleNamespace(headers={
                "X-RapidAPI-Proxy-Secret": "test-rapidapi-secret-123",
                "X-RapidAPI-User": "john_doe",
                "X-RapidAPI-Subscription": "PRO",
            })
            auth = main.verify_rapidapi_auth(req_ok)
            self.assertEqual(auth["user"], "john_doe")
            self.assertEqual(auth["plan"], "PRO")
        finally:
            main.RAPIDAPI_PROXY_SECRET = orig_secret

    def test_verify_rapidapi_auth_when_unconfigured(self):
        orig_secret = main.RAPIDAPI_PROXY_SECRET
        try:
            main.RAPIDAPI_PROXY_SECRET = ""
            # Localhost is allowed in dev mode
            req_local = SimpleNamespace(headers={}, client=SimpleNamespace(host="127.0.0.1"))
            auth = main.verify_rapidapi_auth(req_local)
            self.assertEqual(auth["user"], "anonymous")

            # External IP is blocked with 403 when RAPIDAPI_PROXY_SECRET is not configured
            req_external = SimpleNamespace(headers={}, client=SimpleNamespace(host="203.0.113.1"))
            with self.assertRaises(HTTPException) as ctx:
                main.verify_rapidapi_auth(req_external)
            self.assertEqual(ctx.exception.status_code, 403)
        finally:
            main.RAPIDAPI_PROXY_SECRET = orig_secret

    def test_convert_request_model_validation(self):
        # Valid quality
        r1 = main.ConvertV1Request(url="https://youtube.com/watch?v=123", quality="192")
        self.assertEqual(r1.quality, "192")

        # Unsupported quality defaults to 320
        r2 = main.ConvertV1Request(url="https://youtube.com/watch?v=123", quality="invalid_quality")
        self.assertEqual(r2.quality, "320")

    def test_analytics_records_rapidapi_calls(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_file = Path(tmpdir) / "analytics.json"
            temp_file.write_text("{}", encoding="utf-8")
            engine = analytics_mod.AnalyticsEngine(persistence_file=temp_file)

            self.assertEqual(engine.data.get("total_rapidapi_requests", 0), 0)
            engine.record_rapidapi_call("/api/v1/search", user="dev_user", plan="ULTRA")
            summary = engine.get_summary()

            self.assertEqual(summary["total_rapidapi_requests"], 1)
            self.assertEqual(summary["today"]["rapidapi_requests"], 1)


if __name__ == "__main__":
    unittest.main()
