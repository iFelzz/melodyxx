"""
Melodyxx — Lightweight Internal Analytics & Metrics Engine
Tracks bandwidth, stream counts, popular tracks, search trends, concurrency,
active user sessions (with IP and Country), and daily unique visitors
with zero-database in-memory storage and debounced JSON persistence.
"""

import os
import re
import json
import time
import logging
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
def _resolve_analytics_path() -> Path:
    env_path = os.getenv("ANALYTICS_FILE_PATH")
    if env_path:
        p = Path(env_path)
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    data_dir_env = os.getenv("MELODYXX_DATA_DIR")
    if data_dir_env:
        d = Path(data_dir_env)
        d.mkdir(parents=True, exist_ok=True)
        return d / "analytics.json"

    docker_data = Path("/app/data")
    if docker_data.exists() and docker_data.is_dir():
        return docker_data / "analytics.json"

    local_data = BASE_DIR / "data"
    if local_data.exists() and local_data.is_dir():
        return local_data / "analytics.json"

    return BASE_DIR / "analytics.json"


ANALYTICS_FILE = _resolve_analytics_path()

_GEO_CACHE: Dict[str, dict] = {}

_COUNTRY_NAMES: Dict[str, str] = {
    "AD": "Andorra", "AE": "United Arab Emirates", "AF": "Afghanistan", "AG": "Antigua and Barbuda",
    "AI": "Anguilla", "AL": "Albania", "AM": "Armenia", "AO": "Angola", "AQ": "Antarctica",
    "AR": "Argentina", "AS": "American Samoa", "AT": "Austria", "AU": "Australia", "AW": "Aruba",
    "AX": "Aland Islands", "AZ": "Azerbaijan", "BA": "Bosnia and Herzegovina", "BB": "Barbados",
    "BD": "Bangladesh", "BE": "Belgium", "BF": "Burkina Faso", "BG": "Bulgaria", "BH": "Bahrain",
    "BI": "Burundi", "BJ": "Benin", "BL": "Saint Barthelemy", "BM": "Bermuda", "BN": "Brunei",
    "BO": "Bolivia", "BQ": "Bonaire", "BR": "Brazil", "BS": "Bahamas", "BT": "Bhutan",
    "BV": "Bouvet Island", "BW": "Botswana", "BY": "Belarus", "BZ": "Belize", "CA": "Canada",
    "CC": "Cocos Islands", "CD": "DR Congo", "CF": "Central African Republic", "CG": "Republic of the Congo",
    "CH": "Switzerland", "CI": "Cote d'Ivoire", "CK": "Cook Islands", "CL": "Chile", "CM": "Cameroon",
    "CN": "China", "CO": "Colombia", "CR": "Costa Rica", "CU": "Cuba", "CV": "Cape Verde",
    "CW": "Curacao", "CX": "Christmas Island", "CY": "Cyprus", "CZ": "Czechia", "DE": "Germany",
    "DJ": "Djibouti", "DK": "Denmark", "DM": "Dominica", "DO": "Dominican Republic", "DZ": "Algeria",
    "EC": "Ecuador", "EE": "Estonia", "EG": "Egypt", "EH": "Western Sahara", "ER": "Eritrea",
    "ES": "Spain", "ET": "Ethiopia", "FI": "Finland", "FJ": "Fiji", "FK": "Falkland Islands",
    "FM": "Micronesia", "FO": "Faroe Islands", "FR": "France", "GA": "Gabon", "GB": "United Kingdom",
    "GD": "Grenada", "GE": "Georgia", "GF": "French Guiana", "GG": "Guernsey", "GH": "Ghana",
    "GI": "Gibraltar", "GL": "Greenland", "GM": "Gambia", "GN": "Guinea", "GP": "Guadeloupe",
    "GQ": "Equatorial Guinea", "GR": "Greece", "GS": "South Georgia", "GT": "Guatemala", "GU": "Guam",
    "GW": "Guinea-Bissau", "GY": "Guyana", "HK": "Hong Kong", "HM": "Heard Island", "HN": "Honduras",
    "HR": "Croatia", "HT": "Haiti", "HU": "Hungary", "ID": "Indonesia", "IE": "Ireland",
    "IL": "Israel", "IM": "Isle of Man", "IN": "India", "IO": "British Indian Ocean Territory", "IQ": "Iraq",
    "IR": "Iran", "IS": "Iceland", "IT": "Italy", "JE": "Jersey", "JM": "Jamaica",
    "JO": "Jordan", "JP": "Japan", "KE": "Kenya", "KG": "Kyrgyzstan", "KH": "Cambodia",
    "KI": "Kiribati", "KM": "Comoros", "KN": "Saint Kitts and Nevis", "KP": "North Korea", "KR": "South Korea",
    "KW": "Kuwait", "KY": "Cayman Islands", "KZ": "Kazakhstan", "LA": "Laos", "LB": "Lebanon",
    "LC": "Saint Lucia", "LI": "Liechtenstein", "LK": "Sri Lanka", "LR": "Liberia", "LS": "Lesotho",
    "LT": "Lithuania", "LU": "Luxembourg", "LV": "Latvia", "LY": "Libya", "MA": "Morocco",
    "MC": "Monaco", "MD": "Moldova", "ME": "Montenegro", "MF": "Saint Martin", "MG": "Madagascar",
    "MH": "Marshall Islands", "MK": "North Macedonia", "ML": "Mali", "MM": "Myanmar", "MN": "Mongolia",
    "MO": "Macau", "MP": "Northern Mariana Islands", "MQ": "Martinique", "MR": "Mauritania", "MS": "Montserrat",
    "MT": "Malta", "MU": "Mauritius", "MV": "Maldives", "MW": "Malawi", "MX": "Mexico",
    "MY": "Malaysia", "MZ": "Mozambique", "NA": "Namibia", "NC": "New Caledonia", "NE": "Niger",
    "NF": "Norfolk Island", "NG": "Nigeria", "NI": "Nicaragua", "NL": "Netherlands", "NO": "Norway",
    "NP": "Nepal", "NR": "Nauru", "NU": "Niue", "NZ": "New Zealand", "OM": "Oman",
    "PA": "Panama", "PE": "Peru", "PF": "French Polynesia", "PG": "Papua New Guinea", "PH": "Philippines",
    "PK": "Pakistan", "PL": "Poland", "PM": "Saint Pierre and Miquelon", "PN": "Pitcairn", "PR": "Puerto Rico",
    "PS": "Palestine", "PT": "Portugal", "PW": "Palau", "PY": "Paraguay", "QA": "Qatar",
    "RE": "Reunion", "RO": "Romania", "RS": "Serbia", "RU": "Russia", "RW": "Rwanda",
    "SA": "Saudi Arabia", "SB": "Solomon Islands", "SC": "Seychelles", "SD": "Sudan", "SE": "Sweden",
    "SG": "Singapore", "SH": "Saint Helena", "SI": "Slovenia", "SJ": "Svalbard and Jan Mayen", "SK": "Slovakia",
    "SL": "Sierra Leone", "SM": "San Marino", "SN": "Senegal", "SO": "Somalia", "SR": "Suriname",
    "SS": "South Sudan", "ST": "Sao Tome and Principe", "SV": "El Salvador", "SX": "Sint Maarten", "SY": "Syria",
    "SZ": "Eswatini", "TC": "Turks and Caicos Islands", "TD": "Chad", "TF": "French Southern Territories", "TG": "Togo",
    "TH": "Thailand", "TJ": "Tajikistan", "TK": "Tokelau", "TL": "Timor-Leste", "TM": "Turkmenistan",
    "TN": "Tunisia", "TO": "Tonga", "TR": "Turkey", "TT": "Trinidad and Tobago", "TV": "Tuvalu",
    "TW": "Taiwan", "TZ": "Tanzania", "UA": "Ukraine", "UG": "Uganda", "UM": "United States Minor Outlying Islands",
    "US": "United States", "UY": "Uruguay", "UZ": "Uzbekistan", "VA": "Vatican City", "VC": "Saint Vincent and the Grenadines",
    "VE": "Venezuela", "VG": "British Virgin Islands", "VI": "U.S. Virgin Islands", "VN": "Vietnam", "VU": "Vanuatu",
    "WF": "Wallis and Futuna", "WS": "Samoa", "XK": "Kosovo", "YE": "Yemen", "YT": "Mayotte",
    "ZA": "South Africa", "ZM": "Zambia", "ZW": "Zimbabwe",
}


def country_code_to_flag(code: str) -> str:
    """Convert a 2-letter ISO country code into its emoji flag."""
    if not code or len(code) != 2:
        return "🌐"
    code = code.upper()
    try:
        return chr(ord(code[0]) + 127397) + chr(ord(code[1]) + 127397)
    except Exception:
        return "🌐"


def is_private_ip(ip: str) -> bool:
    """Check if an IP address is a loopback or private network IP."""
    if not ip or ip in ("127.0.0.1", "::1", "localhost"):
        return True
    if ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172."):
        return True
    return False


def resolve_geo(ip: str, cf_country: Optional[str] = None) -> dict:
    """Resolve country, country code, and national flag from IP or Cloudflare header."""
    if not ip:
        return {"country": "Unknown", "country_code": "XX", "flag": "🌐"}

    # Cloudflare Country header provided (zero-latency in production)
    if cf_country and len(cf_country) == 2 and cf_country != "XX":
        code = cf_country.upper()
        cname = _COUNTRY_NAMES.get(code, code)
        return {"country": cname, "country_code": code, "flag": country_code_to_flag(code)}

    if ip in _GEO_CACHE:
        return _GEO_CACHE[ip]

    if is_private_ip(ip):
        res = {"country": "Localhost / Dev", "country_code": "LOC", "flag": "🏠"}
        _GEO_CACHE[ip] = res
        return res

    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,country,countryCode"
        req = urllib.request.Request(url, headers={"User-Agent": "Melodyxx-Analytics/1.0"})
        with urllib.request.urlopen(req, timeout=2.5) as r:
            payload = json.loads(r.read().decode("utf-8"))
            if payload.get("status") == "success":
                code = payload.get("countryCode", "XX")
                cname = payload.get("country", "Unknown")
                res = {
                    "country": cname,
                    "country_code": code,
                    "flag": country_code_to_flag(code),
                }
                _GEO_CACHE[ip] = res
                return res
    except Exception:
        pass

    res = {"country": "Unknown", "country_code": "XX", "flag": "🌐"}
    _GEO_CACHE[ip] = res
    return res


def parse_device_info(
    user_agent: str,
    client_hint_platform_version: str = "",
    client_device_override: str = "",
) -> str:
    """Parse precise OS version and Browser version from User-Agent and Client Hints."""
    if client_device_override and client_device_override.strip():
        override = client_device_override.strip()
        if len(override) >= 3 and override != "Unknown OS • Unknown Browser":
            return override

    if not user_agent:
        return "Desktop • Browser"

    ua = user_agent
    ua_lower = ua.lower()

    # 1. Parse OS with version
    os_name = "Desktop"
    if "android" in ua_lower:
        match = re.search(r"android\s+([\d.]+)", ua_lower)
        os_name = f"Android {match.group(1).split('.')[0]}" if match else "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        match = re.search(r"os\s+([\d_]+)", ua_lower)
        if match:
            ver = match.group(1).replace("_", ".").split(".")[0]
            os_name = f"iOS {ver}"
        else:
            os_name = "iOS"
    elif "windows" in ua_lower:
        if "windows nt 10.0" in ua_lower:
            # Differentiate Windows 11 vs Windows 10 via Client Hint platform version if available
            # Chromium returns platformVersion >= 13.0.0 on Windows 11
            if client_hint_platform_version:
                try:
                    major = int(client_hint_platform_version.strip('"').split('.')[0])
                    os_name = "Windows 11" if major >= 13 else "Windows 10"
                except Exception:
                    os_name = "Windows 10/11"
            else:
                os_name = "Windows 10/11"
        elif "windows nt 6.3" in ua_lower:
            os_name = "Windows 8.1"
        elif "windows nt 6.2" in ua_lower:
            os_name = "Windows 8"
        elif "windows nt 6.1" in ua_lower:
            os_name = "Windows 7"
        elif "windows nt 6.0" in ua_lower:
            os_name = "Windows Vista"
        elif "windows nt 5.1" in ua_lower or "windows nt 5.2" in ua_lower:
            os_name = "Windows XP"
        elif "windows nt 5.0" in ua_lower:
            os_name = "Windows 2000"
        else:
            os_name = "Windows"
    elif "macintosh" in ua_lower or "mac os" in ua_lower:
        match = re.search(r"mac os x\s+([\d_]+)", ua_lower)
        if match:
            parts = match.group(1).replace("_", ".").split(".")
            ver = ".".join(parts[:2]) if len(parts) > 1 else parts[0]
            os_name = f"macOS {ver}"
        else:
            os_name = "macOS"
    elif "linux" in ua_lower:
        os_name = "Linux"

    # 2. Parse Browser with major version
    browser = "Browser"
    if "edg/" in ua_lower or "edge/" in ua_lower:
        match = re.search(r"edg(?:e)?\/(\d+)", ua_lower)
        browser = f"Edge {match.group(1)}" if match else "Edge"
    elif "opr/" in ua_lower or "opera/" in ua_lower:
        match = re.search(r"(?:opr|opera)\/(\d+)", ua_lower)
        browser = f"Opera {match.group(1)}" if match else "Opera"
    elif "samsungbrowser/" in ua_lower:
        match = re.search(r"samsungbrowser\/(\d+)", ua_lower)
        browser = f"Samsung {match.group(1)}" if match else "Samsung"
    elif "chrome/" in ua_lower or "crios/" in ua_lower:
        match = re.search(r"(?:chrome|crios)\/(\d+)", ua_lower)
        browser = f"Chrome {match.group(1)}" if match else "Chrome"
    elif "firefox/" in ua_lower or "fxios/" in ua_lower:
        match = re.search(r"(?:firefox|fxios)\/(\d+)", ua_lower)
        browser = f"Firefox {match.group(1)}" if match else "Firefox"
    elif "safari/" in ua_lower and "chrome/" not in ua_lower:
        match = re.search(r"version\/(\d+)", ua_lower)
        browser = f"Safari {match.group(1)}" if match else "Safari"

    return f"{os_name} • {browser}"


class AnalyticsEngine:
    def __init__(self, persistence_file: Path = ANALYTICS_FILE):
        self.file_path = persistence_file
        self.started_at = time.time()
        self._dirty = False
        self._last_save = time.time()

        # In-memory transient active sessions (sliding window of 5 minutes)
        self.active_sessions: Dict[str, dict] = {}

        # Daily unique IP tracker { "YYYY-MM-DD": set(ips) }
        self.daily_ips: Dict[str, set] = {}

        # Persistent metrics state
        self.data: Dict[str, Any] = {
            "total_streams": 0,
            "total_bytes_streamed": 0,
            "total_searches": 0,
            "total_artist_searches": 0,
            "total_previews": 0,
            "total_unique_visitors": 0,
            "peak_concurrency": 0,
            "top_tracks": {},            # Backward-compat "Artist - Title": count
            "top_streamed_tracks": {},   # In-browser audio player streams
            "top_downloaded_tracks": {}, # MP3 file downloads
            "top_artists": {},           # "Artist Name": count
            "top_searched_tracks": {}, # "Search Query": count
            "top_countries": {},  # "Country Name": count
            "daily_stats": {},    # "YYYY-MM-DD": { streams, bytes, searches, previews, unique_visitors }
            "history_created_at": datetime.now(timezone.utc).isoformat(),
        }

        self._load()

    def _today_key(self) -> str:
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    def _get_today_bucket(self) -> dict:
        today = self._today_key()
        if today not in self.data["daily_stats"]:
            self.data["daily_stats"][today] = {
                "streams": 0,
                "bytes": 0,
                "searches": 0,
                "previews": 0,
                "unique_visitors": 0,
            }
        # Keep only the last 30 days to ensure minimal disk footprint (<50 KB)
        if len(self.data["daily_stats"]) > 35:
            sorted_keys = sorted(self.data["daily_stats"].keys())
            for old_key in sorted_keys[:-30]:
                self.data["daily_stats"].pop(old_key, None)

        return self.data["daily_stats"][today]

    def _load(self) -> None:
        """Load persisted metrics from disk if present."""
        # Auto-migration: if target file doesn't exist yet but legacy analytics.json exists in root, copy it over
        legacy_file = BASE_DIR / "analytics.json"
        if not self.file_path.exists() and legacy_file.exists():
            try:
                if self.file_path.resolve() != legacy_file.resolve():
                    self.file_path.parent.mkdir(parents=True, exist_ok=True)
                    self.file_path.write_text(legacy_file.read_text(encoding="utf-8"), encoding="utf-8")
                    logger.info("Migrated legacy analytics.json from %s to %s", legacy_file, self.file_path)
            except Exception as mig_err:
                logger.warning("Could not auto-migrate legacy analytics file: %s", mig_err)

        if self.file_path.exists():
            try:
                content = self.file_path.read_text(encoding="utf-8")
                loaded = json.loads(content)
                if isinstance(loaded, dict):
                    # Merge keys
                    for k in ("total_streams", "total_bytes_streamed", "total_searches",
                              "total_artist_searches", "total_previews", "total_unique_visitors", "peak_concurrency"):
                        if k in loaded:
                            self.data[k] = loaded[k]
                    if isinstance(loaded.get("top_tracks"), dict):
                        self.data["top_tracks"] = loaded["top_tracks"]
                    if isinstance(loaded.get("top_streamed_tracks"), dict):
                        self.data["top_streamed_tracks"] = loaded["top_streamed_tracks"]
                    elif isinstance(loaded.get("top_tracks"), dict):
                        self.data["top_streamed_tracks"] = dict(loaded["top_tracks"])
                    if isinstance(loaded.get("top_downloaded_tracks"), dict):
                        self.data["top_downloaded_tracks"] = loaded["top_downloaded_tracks"]
                    if isinstance(loaded.get("top_artists"), dict):
                        self.data["top_artists"] = loaded["top_artists"]
                    if isinstance(loaded.get("top_searched_tracks"), dict):
                        self.data["top_searched_tracks"] = loaded["top_searched_tracks"]
                    if isinstance(loaded.get("top_countries"), dict):
                        # Normalize any raw ISO codes (e.g. 'IE', 'SE') to full official names
                        normalized_countries: Dict[str, int] = {}
                        for k_c, v_c in loaded["top_countries"].items():
                            clean_k = str(k_c).strip()
                            if len(clean_k) == 2 and clean_k.upper() in _COUNTRY_NAMES:
                                full_name = _COUNTRY_NAMES[clean_k.upper()]
                                normalized_countries[full_name] = normalized_countries.get(full_name, 0) + int(v_c)
                            else:
                                normalized_countries[clean_k] = normalized_countries.get(clean_k, 0) + int(v_c)
                        self.data["top_countries"] = normalized_countries
                    if isinstance(loaded.get("daily_stats"), dict):
                        self.data["daily_stats"] = loaded["daily_stats"]
                    if loaded.get("history_created_at"):
                        self.data["history_created_at"] = loaded["history_created_at"]
                    logger.info("Analytics data loaded successfully (%d streams recorded).", self.data["total_streams"])
            except Exception as exc:
                logger.warning("Could not read analytics file (%s). Starting fresh.", exc)

    def save(self, force: bool = False) -> None:
        """Debounced flush to disk (at most once every 15 seconds unless forced)."""
        now = time.time()
        if not self._dirty and not force:
            return
        if not force and (now - self._last_save) < 15:
            return

        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.file_path.write_text(json.dumps(self.data, indent=2), encoding="utf-8")
            self._dirty = False
            self._last_save = now
        except Exception as exc:
            logger.warning("Failed to save analytics file: %s", exc)

    # ── Metric Recording Methods ──────────────────────────────

    def record_activity(
        self,
        ip: str,
        action: str,
        cf_country: Optional[str] = None,
        user_agent: str = "",
        session_id: Optional[str] = None,
        client_device: Optional[str] = None,
        client_hint_platform_version: str = "",
    ) -> None:
        """Record a visitor interaction, resolve geo location, and track unique daily visitors."""
        now = time.time()
        today = self._today_key()

        clean_sid = (session_id or "").strip()
        # Derive unique session key (supports CGNAT by differentiating multiple users sharing 1 IP)
        if clean_sid:
            session_key = f"{ip}::{clean_sid}"
        else:
            # If no session_id is provided, check if this IP already has active sessions
            # Reuse existing session for this IP to prevent phantom duplication from media/subrequests
            existing_for_ip = [k for k, s in self.active_sessions.items() if s.get("ip") == ip]
            if existing_for_ip:
                matching = [k for k in existing_for_ip if self.active_sessions[k].get("user_agent") == user_agent]
                session_key = matching[0] if matching else existing_for_ip[0]
                clean_sid = self.active_sessions[session_key].get("session_id", "")
            else:
                ua_hash = abs(hash(user_agent)) % 100000 if user_agent else "0"
                session_key = f"{ip}::ua_{ua_hash}"

        # Track daily unique visitor by unique visitor session key
        if today not in self.daily_ips:
            self.daily_ips[today] = set()

        if session_key not in self.daily_ips[today]:
            self.daily_ips[today].add(session_key)
            today_bucket = self._get_today_bucket()
            today_bucket["unique_visitors"] = today_bucket.get("unique_visitors", 0) + 1
            self.data["total_unique_visitors"] = self.data.get("total_unique_visitors", 0) + 1
            self._dirty = True

        # Resolve Geo
        geo = resolve_geo(ip, cf_country)
        country_name = geo["country"]

        # Update top countries
        if country_name and country_name != "Localhost / Dev" and country_name != "Unknown":
            self.data["top_countries"][country_name] = self.data["top_countries"].get(country_name, 0) + 1
            self._dirty = True

        # Resolve device
        prev = self.active_sessions.get(session_key)
        action_count = (prev.get("action_count", 0) + 1) if prev else 1

        new_device = parse_device_info(
            user_agent,
            client_hint_platform_version=client_hint_platform_version,
            client_device_override=client_device or "",
        )

        # Retain higher fidelity info if prev already has specific Windows 11 / Windows 10 vs generic fallback
        if prev and prev.get("device"):
            prev_dev = prev["device"]
            if ("Windows 11" in prev_dev or "Windows 10" in prev_dev) and "Windows 10/11" in new_device:
                new_device = prev_dev
            elif "Browser" in new_device and "Browser" not in prev_dev:
                new_device = prev_dev

        device = new_device

        # Preserve specific streaming track title if current incoming action is generic ping
        final_action = action
        if prev and prev.get("last_action"):
            prev_act = prev["last_action"]
            if prev_act.startswith("Streaming: ") and action in ("Listening Preview", "Online", "Browsing App"):
                if (now - prev.get("last_seen", now)) < 45:
                    final_action = prev_act

        # Update active session with session_key
        self.active_sessions[session_key] = {
            "session_id": clean_sid,
            "session_key": session_key,
            "ip": ip,
            "country": country_name,
            "country_code": geo["country_code"],
            "flag": geo["flag"],
            "device": device,
            "user_agent": user_agent,
            "last_action": final_action,
            "last_seen": now,
            "action_count": action_count,
        }

    def remove_session(self, ip: str, session_id: Optional[str] = None) -> bool:
        """Immediately remove an active visitor session upon browser close / pagehide leave beacon."""
        clean_sid = (session_id or "").strip()
        removed = False
        if clean_sid:
            session_key = f"{ip}::{clean_sid}"
            if session_key in self.active_sessions:
                self.active_sessions.pop(session_key, None)
                removed = True
        to_delete = [
            k for k, s in self.active_sessions.items()
            if (clean_sid and s.get("session_id") == clean_sid) or (not clean_sid and (k == ip or s.get("ip") == ip))
        ]
        for k in to_delete:
            self.active_sessions.pop(k, None)
            removed = True
        return removed

    def record_search(self, query: str, ip: str = "", cf_country: Optional[str] = None, user_agent: str = "", session_id: Optional[str] = None) -> None:
        """Record a single track search query and update top searched track rankings."""
        self.data["total_searches"] += 1
        clean_query = query.strip()
        if clean_query and not clean_query.startswith("http://") and not clean_query.startswith("https://") and len(clean_query) >= 2:
            norm_query = clean_query.title() if clean_query.islower() else clean_query
            curr = self.data.setdefault("top_searched_tracks", {}).get(norm_query, 0)
            self.data["top_searched_tracks"][norm_query] = curr + 1
            if len(self.data["top_searched_tracks"]) > 50:
                sorted_searches = sorted(self.data["top_searched_tracks"].items(), key=lambda x: x[1], reverse=True)
                self.data["top_searched_tracks"] = dict(sorted_searches[:50])

        self._get_today_bucket()["searches"] += 1
        self._dirty = True
        if ip:
            self.record_activity(ip, f"Searching: {clean_query[:35]}", cf_country, user_agent, session_id=session_id)
        self.save()

    def record_artist_search(self, artist_name: str, ip: str = "", cf_country: Optional[str] = None, user_agent: str = "", session_id: Optional[str] = None) -> None:
        """Record an artist search and increment popularity rank."""
        self.data["total_artist_searches"] += 1
        clean_name = artist_name.strip().title()
        if clean_name and len(clean_name) > 1:
            curr = self.data["top_artists"].get(clean_name, 0)
            self.data["top_artists"][clean_name] = curr + 1
            if len(self.data["top_artists"]) > 50:
                sorted_artists = sorted(self.data["top_artists"].items(), key=lambda x: x[1], reverse=True)
                self.data["top_artists"] = dict(sorted_artists[:50])

        self._get_today_bucket()["searches"] += 1
        self._dirty = True
        if ip:
            self.record_activity(ip, f"Browsing Artist: {clean_name[:35]}", cf_country, user_agent, session_id=session_id)
        self.save()

    def record_preview(self, title: str = "", ip: str = "", cf_country: Optional[str] = None, user_agent: str = "", session_id: Optional[str] = None) -> None:
        """Record an in-browser audio preview playback."""
        self.data["total_previews"] += 1
        self._get_today_bucket()["previews"] += 1
        self._dirty = True
        if ip:
            action_desc = f"Playing Preview: {title[:35]}" if title else "Listening Preview"
            self.record_activity(ip, action_desc, cf_country, user_agent, session_id=session_id)
        self.save()

    def record_concurrency(self, active_count: int) -> None:
        """Update peak concurrency tracker."""
        if active_count > self.data.get("peak_concurrency", 0):
            self.data["peak_concurrency"] = active_count
            self._dirty = True

    def record_stream_chunk(self, bytes_count: int) -> None:
        """Accumulate streamed bytes."""
        if bytes_count > 0:
            self.data["total_bytes_streamed"] += bytes_count
            self._get_today_bucket()["bytes"] += bytes_count
            self._dirty = True

    def record_stream_complete(
        self,
        title: str,
        artist: str,
        bytes_streamed: int = 0,
        ip: str = "",
        cf_country: Optional[str] = None,
        user_agent: str = "",
        quality: str = "320",
        session_id: Optional[str] = None,
    ) -> None:
        """Record a completed track stream (in-browser preview) or MP3 file download."""
        if quality == "Preview":
            self.data["total_previews"] += 1
            self._get_today_bucket()["previews"] += 1
        else:
            self.data["total_streams"] += 1
            self._get_today_bucket()["streams"] += 1

        # Track popularity
        clean_artist = artist.strip() if artist and artist != "Unknown Artist" else ""
        clean_title = title.strip()
        track_key = f"{clean_artist} - {clean_title}" if clean_artist else clean_title
        if track_key:
            # General backward-compatible top tracks
            curr = self.data["top_tracks"].get(track_key, 0)
            self.data["top_tracks"][track_key] = curr + 1
            if len(self.data["top_tracks"]) > 50:
                sorted_tracks = sorted(self.data["top_tracks"].items(), key=lambda x: x[1], reverse=True)
                self.data["top_tracks"] = dict(sorted_tracks[:50])

            # Separate metrics: Streamed (In-browser Player) vs Downloaded (MP3 file)
            if quality == "Preview":
                curr_s = self.data.setdefault("top_streamed_tracks", {}).get(track_key, 0)
                self.data["top_streamed_tracks"][track_key] = curr_s + 1
                if len(self.data["top_streamed_tracks"]) > 50:
                    sorted_s = sorted(self.data["top_streamed_tracks"].items(), key=lambda x: x[1], reverse=True)
                    self.data["top_streamed_tracks"] = dict(sorted_s[:50])
            else:
                curr_d = self.data.setdefault("top_downloaded_tracks", {}).get(track_key, 0)
                self.data["top_downloaded_tracks"][track_key] = curr_d + 1
                if len(self.data["top_downloaded_tracks"]) > 50:
                    sorted_d = sorted(self.data["top_downloaded_tracks"].items(), key=lambda x: x[1], reverse=True)
                    self.data["top_downloaded_tracks"] = dict(sorted_d[:50])

        self._dirty = True
        if ip:
            if quality == "Preview":
                action_desc = f"Streaming: {clean_title[:30]}"
            else:
                action_desc = f"Downloaded {quality}k MP3: {clean_title[:30]}"
            self.record_activity(ip, action_desc, cf_country, user_agent, session_id=session_id)
        self.save(force=True)

    # ── Summary & Reporting ───────────────────────────────────

    def get_summary(self, current_active_streams: int = 0) -> Dict[str, Any]:
        """Generate comprehensive real-time metrics report including active users and geography."""
        now = time.time()
        uptime_seconds = int(now - self.started_at)
        days, rem = divmod(uptime_seconds, 86400)
        hours, rem = divmod(rem, 3600)
        minutes, seconds = divmod(rem, 60)
        uptime_str = f"{days}d {hours}h {minutes}m {seconds}s" if days else f"{hours}h {minutes}m {seconds}s"

        today_bucket = self._get_today_bucket()
        total_bytes = self.data["total_bytes_streamed"]
        mb_streamed = round(total_bytes / (1024 * 1024), 2)
        gb_streamed = round(total_bytes / (1024 * 1024 * 1024), 3)

        # Prune inactive sessions older than 90 seconds (1.5 minutes)
        cutoff = now - 90
        active_keys = [k for k, s in self.active_sessions.items() if s.get("last_seen", 0) >= cutoff]
        self.active_sessions = {k: self.active_sessions[k] for k in active_keys}

        # Build active user list sorted by most recent activity
        sorted_sessions = sorted(
            self.active_sessions.values(),
            key=lambda x: x.get("last_seen", 0),
            reverse=True
        )[:50]

        # Count occurrence of each IP to identify shared networks / CGNAT
        ip_counts: Dict[str, int] = {}
        for s in sorted_sessions:
            ip_val = s.get("ip", "")
            if ip_val:
                ip_counts[ip_val] = ip_counts.get(ip_val, 0) + 1

        ip_user_index: Dict[str, int] = {}
        active_users_list = []
        for s in sorted_sessions:
            elapsed = int(now - s.get("last_seen", now))
            if elapsed < 10:
                human_seen = "Just now"
            elif elapsed < 60:
                human_seen = f"{elapsed}s ago"
            else:
                human_seen = f"{elapsed // 60}m ago"

            dev = s.get("device", "Desktop • Browser")
            if dev in ("Windows • Chrome", "Windows • Edge", "Desktop • Browser") and s.get("user_agent"):
                dev = parse_device_info(s.get("user_agent", ""))

            ip_val = s.get("ip", "")
            sid = s.get("session_id", "")
            short_session = ""
            if sid:
                clean_chars = [c for c in sid if c.isalnum()]
                short_session = f"#{''.join(clean_chars[-4:])}" if len(clean_chars) >= 4 else f"#{sid[:4]}"
            elif s.get("session_key") and "ua_" in s.get("session_key", ""):
                short_session = f"#{s.get('session_key').split('ua_')[-1][:4]}"

            is_shared = ip_counts.get(ip_val, 0) > 1
            if is_shared:
                ip_user_index[ip_val] = ip_user_index.get(ip_val, 0) + 1
                client_label = f"User #{ip_user_index[ip_val]}"
            else:
                client_label = ""

            active_users_list.append({
                "ip": ip_val,
                "session_id": sid,
                "short_session": short_session,
                "is_shared_ip": is_shared,
                "client_label": client_label,
                "country": s.get("country", "Unknown"),
                "country_code": s.get("country_code", "XX"),
                "flag": s.get("flag", "🌐"),
                "device": dev,
                "last_action": s.get("last_action", "Active"),
                "last_seen_human": human_seen,
                "action_count": s.get("action_count", 1),
            })

        # Sort top streamed tracks (played in browser)
        streamed_dict = self.data.get("top_streamed_tracks", {})
        sorted_streamed = sorted(streamed_dict.items(), key=lambda x: x[1], reverse=True)[:10]
        top_streamed_list = [{"name": k, "streams": v} for k, v in sorted_streamed]

        # Sort top downloaded tracks (saved as MP3)
        downloaded_dict = self.data.get("top_downloaded_tracks", {})
        sorted_downloaded = sorted(downloaded_dict.items(), key=lambda x: x[1], reverse=True)[:10]
        top_downloaded_list = [{"name": k, "downloads": v} for k, v in sorted_downloaded]

        # Sort top searched tracks
        sorted_searches = sorted(self.data.get("top_searched_tracks", {}).items(), key=lambda x: x[1], reverse=True)[:10]
        top_searched_tracks_list = [{"query": k, "searches": v} for k, v in sorted_searches]

        # Sort top artists
        sorted_artists = sorted(self.data["top_artists"].items(), key=lambda x: x[1], reverse=True)[:10]
        top_artists_list = [{"name": k, "searches": v} for k, v in sorted_artists]

        # Sort top countries
        sorted_countries = sorted(self.data.get("top_countries", {}).items(), key=lambda x: x[1], reverse=True)[:10]
        top_countries_list = []
        for raw_cname, count in sorted_countries:
            clean_name = str(raw_cname).strip()
            code = ""
            cname = clean_name
            if len(clean_name) == 2 and clean_name.upper() in _COUNTRY_NAMES:
                code = clean_name.upper()
                cname = _COUNTRY_NAMES[code]
            else:
                code = next((k for k, v in _COUNTRY_NAMES.items() if v.lower() == clean_name.lower()), "")

            top_countries_list.append({
                "country": cname,
                "country_code": code,
                "flag": country_code_to_flag(code) if code else "🌐",
                "visits": count,
            })

        return {
            "status": "healthy",
            "uptime_seconds": uptime_seconds,
            "uptime_human": uptime_str,
            "started_at": datetime.fromtimestamp(self.started_at, tz=timezone.utc).isoformat(),
            "active_streams": current_active_streams,
            "active_users_count": len(self.active_sessions),
            "peak_concurrency": self.data.get("peak_concurrency", 0),
            "total_streams": self.data["total_streams"],
            "total_bytes_streamed": total_bytes,
            "total_mb_streamed": mb_streamed,
            "total_gb_streamed": gb_streamed,
            "total_searches": self.data["total_searches"],
            "total_artist_searches": self.data["total_artist_searches"],
            "total_previews": self.data["total_previews"],
            "total_unique_visitors": self.data.get("total_unique_visitors", 0),
            "today": {
                "date": self._today_key(),
                "streams": today_bucket.get("streams", 0),
                "mb_streamed": round(today_bucket.get("bytes", 0) / (1024 * 1024), 2),
                "searches": today_bucket.get("searches", 0),
                "previews": today_bucket.get("previews", 0),
                "unique_visitors": today_bucket.get("unique_visitors", 0),
            },
            "active_users": active_users_list,
            "top_tracks": top_streamed_list,
            "top_streamed_tracks": top_streamed_list,
            "top_downloaded_tracks": top_downloaded_list,
            "top_searched_tracks": top_searched_tracks_list,
            "top_artists": top_artists_list,
            "top_countries": top_countries_list,
            "recent_days": self.data.get("daily_stats", {}),
        }

    def reset(self) -> None:
        """Reset all metrics."""
        self.data["total_streams"] = 0
        self.data["total_bytes_streamed"] = 0
        self.data["total_searches"] = 0
        self.data["total_artist_searches"] = 0
        self.data["total_previews"] = 0
        self.data["total_unique_visitors"] = 0
        self.data["peak_concurrency"] = 0
        self.data["top_tracks"].clear()
        self.data.setdefault("top_streamed_tracks", {}).clear()
        self.data.setdefault("top_downloaded_tracks", {}).clear()
        self.data.setdefault("top_searched_tracks", {}).clear()
        self.data["top_artists"].clear()
        self.data.get("top_countries", {}).clear()
        self.data["daily_stats"].clear()
        self.active_sessions.clear()
        self.daily_ips.clear()
        self.save(force=True)


# Global singleton instance
analytics = AnalyticsEngine()
