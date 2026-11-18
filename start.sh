#!/usr/bin/env bash
# ──────────────────────────────────────────────
#  Melodyxx - Startup Script (Linux / macOS)
# ──────────────────────────────────────────────

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo " =========================================="
echo "  Melodyxx - YouTube MP3 Downloader"
echo "  Powered by FastAPI + yt-dlp + FFmpeg"
echo " =========================================="
echo ""

# ── Cek Python ──────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "[ERROR] Python3 tidak ditemukan. Install Python 3.11+ terlebih dahulu."
    exit 1
fi

# ── Buat venv jika belum ada ────────────────────────────
if [ ! -f "venv/bin/python" ]; then
    echo "[SETUP] Membuat virtual environment..."
    python3 -m venv venv
fi

# ── Install dependencies ─────────────────────────────────
echo "[SETUP] Memeriksa dependencies..."
if ! venv/bin/pip install -r requirements.txt --prefer-binary --quiet --disable-pip-version-check; then
    echo "[WARN] Instalasi requirements.txt gagal, mencoba fallback instalasi otomatis..."
    venv/bin/pip install fastapi uvicorn yt-dlp python-multipart slowapi --prefer-binary --quiet --disable-pip-version-check
fi

# Verifikasi dependencies utama terpasang
if ! venv/bin/python -c "import fastapi, uvicorn, yt_dlp, slowapi" &>/dev/null; then
    echo "[ERROR] Gagal menginstal dependencies utama."
    exit 1
fi

# ── Cek FFmpeg ───────────────────────────────────────────
if [ -f "ffmpeg/bin/ffmpeg" ]; then
    echo "[OK] FFmpeg bundled ditemukan."
    export PATH="$SCRIPT_DIR/ffmpeg/bin:$PATH"
elif command -v ffmpeg &>/dev/null; then
    echo "[OK] FFmpeg ditemukan di PATH sistem."
else
    echo "[WARN] FFmpeg tidak ditemukan! Fitur download mungkin gagal."
fi

# ── Jalankan server ──────────────────────────────────────
echo ""
echo "[START] Menjalankan server di http://localhost:8000"
echo "        Tekan Ctrl+C untuk menghentikan."
echo ""

# Buka browser di background
(sleep 2 && (xdg-open http://localhost:8000 || open http://localhost:8000) 2>/dev/null) &

venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
