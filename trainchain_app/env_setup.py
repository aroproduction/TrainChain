"""
env_setup.py — uv-managed virtual environment bootstrap helper.

Called by SetupScreen (frontend/setup_screen.py) in a background thread.
Bundles the uv binary inside the PyInstaller package; falls back to PATH lookup.

Public API
----------
    ENV_DIR       : Path  — absolute path to .trainchain_env/
    is_env_ready  : () -> bool
    get_python_bin: () -> Path
    setup_env     : (progress_cb, log_cb) -> None   # raises on failure
"""

import os
import platform
import subprocess
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# When frozen by PyInstaller, _MEIPASS is the temp extraction folder.
# When running from source, use the directory that contains this file.
if getattr(sys, "frozen", False):
    _BASE = Path(sys._MEIPASS)          # type: ignore[attr-defined]
else:
    _BASE = Path(__file__).resolve().parent

# The managed env lives next to the executable / project root
# sys.executable points to the frozen exe or the real python.
_APP_DIR = Path(sys.executable).parent if getattr(sys, "frozen", False) else _BASE

ENV_DIR = _APP_DIR / ".trainchain_env"

# ---------------------------------------------------------------------------
# uv binary location
# ---------------------------------------------------------------------------

def _uv_bin() -> Path:
    """
    Return the path to the bundled uv binary.
    Falls back to uv found on PATH (handy during development).
    """
    system = platform.system()
    if system == "Windows":
        candidates = [_BASE / "uv.exe", _BASE / "bin" / "uv.exe"]
    else:
        candidates = [_BASE / "uv", _BASE / "bin" / "uv"]

    for c in candidates:
        if c.exists():
            return c

    # Fallback: uv somewhere on PATH
    import shutil
    path_uv = shutil.which("uv")
    if path_uv:
        return Path(path_uv)

    raise FileNotFoundError(
        "uv binary not found. Bundle uv.exe next to the executable "
        "or install it (https://github.com/astral-sh/uv)."
    )


# ---------------------------------------------------------------------------
# Python binary inside the managed env
# ---------------------------------------------------------------------------

def get_python_bin() -> Path:
    """Return the Python executable inside the managed venv."""
    system = platform.system()
    if system == "Windows":
        return ENV_DIR / "Scripts" / "python.exe"
    return ENV_DIR / "bin" / "python"


def is_env_ready() -> bool:
    """True if the managed venv already exists and has a python binary."""
    return get_python_bin().exists()


def load_api_url() -> str:
    """
    Return the API_URL from the .env file next to the app.
    Falls back to the production URL if the file or key is missing.
    """
    _DEFAULT = "https://trainchain.onrender.com"
    env_file = _APP_DIR / ".env"
    if not env_file.exists():
        return _DEFAULT
    try:
        from dotenv import dotenv_values
        config = dotenv_values(env_file)
        return config.get("API_URL", _DEFAULT).rstrip("/")
    except Exception:
        return _DEFAULT


# ---------------------------------------------------------------------------
# Package groups & first-time setup
# ---------------------------------------------------------------------------

# torch + torchvision must come from the PyTorch CUDA index on Windows/Linux
# so that the GPU-enabled wheels are installed instead of the CPU-only PyPI
# builds.  CUDA 12.8 is the current stable choice (matches PyTorch 2.10.0).
# On macOS the default PyPI wheels already include the MPS backend.
_TORCH_INDEX_URL = "https://download.pytorch.org/whl/cu128"

_TORCH_PACKAGES = ["torch", "torchvision"]

# Everything else comes from standard PyPI
_OTHER_PACKAGES = [
    "ultralytics",
    "requests",
    "psutil",
    "pyyaml",
    "python-dotenv",
]

# LLM finetuning stack (installed after the base packages)
# These are only needed for llm_finetune jobs, but we pre-install them
# so the first LLM job starts immediately without an extra setup delay.
_LLM_PACKAGES = [
    "transformers",
    "peft",
    "datasets",
    "accelerate",
    "safetensors",
    "sentencepiece",
]


def setup_env(progress_cb=None, log_cb=None) -> None:
    """
    Create the uv-managed venv and install all ML dependencies.

    Parameters
    ----------
    progress_cb : callable(int) | None
        Called with an integer 0-100 as overall progress.
    log_cb : callable(str) | None
        Called with each line of output so the UI can display live logs.
    """

    def _progress(pct: int):
        if progress_cb:
            progress_cb(pct)

    def _log(msg: str):
        print(msg, flush=True)
        if log_cb:
            log_cb(msg)

    uv = _uv_bin()
    python_bin = str(get_python_bin())
    # Match the venv Python to the version that built this exe.
    # If they differ, C extensions in the venv will load the wrong pythonXY.dll
    # (PyInstaller puts its own dll on the search path).
    _py_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    _log(f"Using uv: {uv}")
    _log(f"Creating venv at: {ENV_DIR} (Python {_py_version})")
    _progress(5)

    # 1. Create the venv
    _run([str(uv), "venv", str(ENV_DIR), "--python", _py_version], _log)
    _progress(15)

    # 2. Install torch + torchvision from the CUDA-enabled index
    #    (Windows & Linux need this; macOS uses PyPI which has MPS support built-in)
    if platform.system() == "Darwin":
        _log("macOS detected — installing torch from PyPI (MPS backend included) …")
        _run(
            [str(uv), "pip", "install"] + _TORCH_PACKAGES + ["--python", python_bin],
            _log,
        )
    else:
        _log(f"Installing torch + torchvision (CUDA 12.8) from {_TORCH_INDEX_URL} …")
        _run(
            [str(uv), "pip", "install"] + _TORCH_PACKAGES
            + ["--index-url", _TORCH_INDEX_URL, "--python", python_bin],
            _log,
        )
    _progress(60)

    # 3. Install remaining packages one-by-one so we can report progress
    total = len(_OTHER_PACKAGES)
    for idx, pkg in enumerate(_OTHER_PACKAGES):
        _log(f"Installing {pkg} …")
        _run(
            [str(uv), "pip", "install", pkg, "--python", python_bin],
            _log,
        )
        _progress(60 + int(25 * (idx + 1) / total))

    # 4. Install LLM training packages
    _log("Installing LLM finetuning dependencies \u2026")
    llm_total = len(_LLM_PACKAGES)
    for idx, pkg in enumerate(_LLM_PACKAGES):
        _log(f"Installing {pkg} \u2026")
        _run(
            [str(uv), "pip", "install", pkg, "--python", python_bin],
            _log,
        )
        _progress(85 + int(13 * (idx + 1) / llm_total))

    _progress(100)
    _log("Environment setup complete.")


def _run(cmd: list[str], log_cb) -> None:
    """Run a subprocess, streaming each output line through log_cb."""
    # On Windows, CREATE_NO_WINDOW prevents a black console from flashing up
    # behind the PyQt window while uv/pip are running.
    kwargs = {}
    if platform.system() == "Windows":
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
        **kwargs,
    )
    assert process.stdout is not None
    for line in process.stdout:
        log_cb(line.rstrip())
    process.wait()
    if process.returncode != 0:
        raise RuntimeError(f"Command failed (exit {process.returncode}): {' '.join(cmd)}")
