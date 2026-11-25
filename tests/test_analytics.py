import tempfile
import unittest
from pathlib import Path

import analytics as analytics_mod


class TestAnalyticsHelpers(unittest.TestCase):
    def test_country_code_to_flag(self):
        self.assertEqual(analytics_mod.country_code_to_flag("ID"), "🇮🇩")
        self.assertEqual(analytics_mod.country_code_to_flag("US"), "🇺🇸")
        self.assertEqual(analytics_mod.country_code_to_flag("invalid"), "🌐")

    def test_is_private_ip(self):
        self.assertTrue(analytics_mod.is_private_ip("127.0.0.1"))
        self.assertTrue(analytics_mod.is_private_ip("192.168.1.10"))
        self.assertFalse(analytics_mod.is_private_ip("8.8.8.8"))

    def test_parse_device_info(self):
        ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        info = analytics_mod.parse_device_info(ua)
        self.assertIsInstance(info, str)
        self.assertIn("Windows", info)
        self.assertIn("Chrome", info)


class TestAnalyticsEngineIsolation(unittest.TestCase):
    def test_stream_vs_preview_counters_and_reset(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            temp_file = Path(tmpdir) / "analytics.json"
            temp_file.write_text("{}", encoding="utf-8")
            engine = analytics_mod.AnalyticsEngine(persistence_file=temp_file)
            engine.record_stream_complete(
                title="Test Song",
                artist="Test Artist",
                bytes_streamed=1024 * 1024,
                quality="320",
            )
            engine.record_preview(title="Preview Song")
            engine.record_stream_complete(
                title="Preview Song",
                artist="Preview Artist",
                bytes_streamed=512 * 1024,
                quality="preview",
            )

            summary = engine.get_summary(current_active_streams=1)
            self.assertEqual(summary["total_streams"], 2)
            self.assertEqual(summary["total_previews"], 1)
            self.assertEqual(summary["active_streams"], 1)
            downloaded_names = [t["name"] for t in summary["top_downloaded_tracks"]]
            self.assertIn("Test Artist - Test Song", downloaded_names)

            engine.reset()
            after_reset = engine.get_summary()
            self.assertEqual(after_reset["total_streams"], 0)
            self.assertEqual(after_reset["total_previews"], 0)


if __name__ == "__main__":
    unittest.main()
