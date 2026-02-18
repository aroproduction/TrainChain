# frontend/session.py
"""
Lightweight session manager for TrainChain desktop app.

Session data is stored in a JSON file inside a platform-appropriate,
user-writable directory so it survives across runs and works correctly
in both development and PyInstaller-packaged builds.

Session file location (all platforms):
    <user data dir>/TrainChain/session.json

Public API
----------
    SESSION_DURATION_DAYS : int     — how long a session stays valid
    get_session_dir()               — returns the Path used for storage
    save_session(wallet: str)       — write / overwrite session file
    load_session() -> str | None    — return wallet if session valid, else None
    clear_session()                 — delete session file (logout)
"""

import json
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

SESSION_DURATION_DAYS: int = 10
_SESSION_FILE_NAME = "session.json"
_APP_FOLDER_NAME = "TrainChain"


def get_session_dir() -> Path:
    """
    Return a persistent, writable directory for session data.

    Priority (Windows): %APPDATA%\\TrainChain
    Priority (macOS):   ~/Library/Application Support/TrainChain
    Priority (Linux):   ~/.local/share/TrainChain

    Falls back to a '.trainchain_session' folder placed next to the
    executable / project root, so it always works even in odd environments.
    """
    system = sys.platform

    try:
        if system == "win32":
            base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
        elif system == "darwin":
            base = Path.home() / "Library" / "Application Support"
        else:
            base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))

        session_dir = base / _APP_FOLDER_NAME
        session_dir.mkdir(parents=True, exist_ok=True)
        return session_dir
    except Exception:
        # Ultimate fallback: beside the executable / project root
        fallback = Path(sys.executable).parent / ".trainchain_session"
        fallback.mkdir(parents=True, exist_ok=True)
        return fallback


def save_session(wallet: str) -> None:
    """Persist a session for *wallet* that expires after SESSION_DURATION_DAYS."""
    expiry = datetime.now(timezone.utc) + timedelta(days=SESSION_DURATION_DAYS)
    data = {
        "wallet": wallet,
        "expires_at": expiry.isoformat(),
    }
    session_file = get_session_dir() / _SESSION_FILE_NAME
    session_file.write_text(json.dumps(data, indent=2), encoding="utf-8")


def load_session() -> str | None:
    """
    Return the stored wallet address if a valid (non-expired) session exists.
    Returns None if no session file is found or the session has expired.
    """
    session_file = get_session_dir() / _SESSION_FILE_NAME
    if not session_file.exists():
        return None

    try:
        data = json.loads(session_file.read_text(encoding="utf-8"))
        wallet: str = data["wallet"]
        expires_at = datetime.fromisoformat(data["expires_at"])

        # Ensure timezone-aware comparison
        now = datetime.now(timezone.utc)
        if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now < expires_at:
            return wallet          # session still valid
        else:
            clear_session()        # expired — clean up
            return None
    except Exception:
        # Corrupted or unreadable session file — treat as no session
        clear_session()
        return None


def clear_session() -> None:
    """Delete the session file, effectively logging the user out."""
    session_file = get_session_dir() / _SESSION_FILE_NAME
    try:
        if session_file.exists():
            session_file.unlink()
    except Exception:
        pass
