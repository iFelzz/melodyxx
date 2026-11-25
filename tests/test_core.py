import time
import unittest
from types import SimpleNamespace
from fastapi import HTTPException

import main
import metadata_resolver


class TestURLAndFilenameHelpers(unittest.TestCase):
    def test_is_youtube_url(self):
        self.assertTrue(main.is_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ"))
        self.assertTrue(main.is_youtube_url("https://youtu.be/dQw4w9WgXcQ"))
        self.assertTrue(main.is_youtube_url("https://music.youtube.com/watch?v=dQw4w9WgXcQ"))
        self.assertFalse(main.is_youtube_url("https://open.spotify.com/track/123"))
        self.assertFalse(main.is_youtube_url("coldplay yellow"))

    def test_is_non_youtube_url(self):
        self.assertTrue(main.is_non_youtube_url("https://open.spotify.com/track/123"))
        self.assertTrue(main.is_non_youtube_url("http://example.com/audio.mp3"))
        self.assertFalse(main.is_non_youtube_url("https://youtube.com/watch?v=abc"))
        self.assertFalse(main.is_non_youtube_url("just a search query"))

    def test_clean_youtube_url(self):
        cleaned = main._clean_youtube_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RD123&index=2")
        self.assertEqual(cleaned, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")

        short_cleaned = main._clean_youtube_url("https://youtu.be/dQw4w9WgXcQ?si=xyz")
        self.assertEqual(short_cleaned, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")

    def test_sanitise_filename(self):
        self.assertEqual(main.sanitise_filename('Artist: "Song" <1>?/\\|*'), "Artist Song 1")
        self.assertEqual(main.sanitise_filename("   "), "audio")


class TestInMemoryTTLCache(unittest.TestCase):
    def test_lru_eviction_and_ttl(self):
        cache = main.InMemoryTTLCache(maxsize=2, ttl_seconds=60)
        cache.set("a", 1)
        cache.set("b", 2)
        self.assertEqual(cache.get("a"), 1)  # 'a' becomes most recently used
        cache.set("c", 3)  # 'b' should be evicted
        self.assertIsNone(cache.get("b"))
        self.assertEqual(cache.get("a"), 1)
        self.assertEqual(cache.get("c"), 3)

        cache.set("exp", "val", custom_ttl=-1)
        self.assertIsNone(cache.get("exp"))
        self.assertGreaterEqual(cache.prune(), 0)


class TestAdminAuthAndClientIP(unittest.TestCase):
    def test_get_client_ip_priority(self):
        req = SimpleNamespace(
            headers={"CF-Connecting-IP": "1.2.3.4", "X-Real-IP": "5.6.7.8"},
            client=SimpleNamespace(host="9.9.9.9"),
        )
        self.assertEqual(main.get_client_ip(req), "1.2.3.4")

        req_xff = SimpleNamespace(
            headers={"X-Forwarded-For": "10.0.0.1, 10.0.0.2"},
            client=SimpleNamespace(host="9.9.9.9"),
        )
        self.assertEqual(main.get_client_ip(req_xff), "10.0.0.1")

    def test_require_admin_auth_strict_header(self):
        # Missing header
        req_missing = SimpleNamespace(headers={}, query_params={"key": main.ADMIN_KEY})
        with self.assertRaises(HTTPException) as ctx_missing:
            main._require_admin_auth(req_missing)
        self.assertEqual(ctx_missing.exception.status_code, 401)

        # Wrong header
        req_wrong = SimpleNamespace(headers={"X-Admin-Key": "wrong-key"})
        with self.assertRaises(HTTPException) as ctx_wrong:
            main._require_admin_auth(req_wrong)
        self.assertEqual(ctx_wrong.exception.status_code, 401)

        # Valid header
        req_ok = SimpleNamespace(headers={"X-Admin-Key": main.ADMIN_KEY})
        main._require_admin_auth(req_ok)


class TestMetadataResolverHelpers(unittest.TestCase):
    def test_clean_noise_and_parse_artist_title(self):
        cleaned = metadata_resolver.clean_noise("Coldplay - Yellow (Official Video) [4K]")
        self.assertEqual(cleaned, "Coldplay - Yellow")

        artist, title = metadata_resolver.parse_artist_and_title(
            "Coldplay - Yellow (Official Music Video)", "Coldplay"
        )
        self.assertEqual(artist, "Coldplay")
        self.assertEqual(title, "Yellow")

    def test_is_label_channel(self):
        self.assertTrue(metadata_resolver.is_label_channel("SMTOWN"))
        self.assertTrue(metadata_resolver.is_label_channel("HYBE LABELS"))
        self.assertFalse(metadata_resolver.is_label_channel("Coldplay"))

    def test_normalize_track_key(self):
        k1 = metadata_resolver.normalize_track_key("Yellow (Remastered)")
        k2 = metadata_resolver.normalize_track_key("Yellow")
        self.assertEqual(k1, k2)


if __name__ == "__main__":
    unittest.main()
