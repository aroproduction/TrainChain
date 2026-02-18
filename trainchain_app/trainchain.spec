# trainchain.spec
# PyInstaller spec for the TrainChain contributor app.
#
# Build command (run from trainchain_app/):
#   pyinstaller trainchain.spec
#
# This spec:
#   - Bundles the PyQt6 app + Flask backend into a single-folder dist/
#   - Includes uv.exe (Windows) / uv (Linux/macOS) so the app can create the
#     training venv on first launch without any external dependency
#   - Includes train_yolo.py and env_setup.py as data files (run at runtime
#     by the managed venv's Python, not by the frozen interpreter)
#   - Includes the web/ templates and static assets for the Flask auth page

import os
import sys
from pathlib import Path

block_cipher = None

# ---------------------------------------------------------------------------
# Locate the uv binary to bundle
# ---------------------------------------------------------------------------

_here = Path(SPECPATH)  # trainchain_app/   (PyInstaller sets SPECPATH)

if sys.platform == "win32":
    _uv_names = ["uv.exe"]
else:
    _uv_names = ["uv"]

_uv_path = None
for _name in _uv_names:
    _candidate = _here / _name
    if _candidate.exists():
        _uv_path = str(_candidate)
        break

if _uv_path is None:
    import shutil as _shutil
    _uv_path = _shutil.which("uv")

if _uv_path is None:
    raise FileNotFoundError(
        "uv binary not found next to trainchain.spec or on PATH.\n"
        "Download it from https://github.com/astral-sh/uv/releases and place\n"
        f"it in {_here} before building."
    )

# ---------------------------------------------------------------------------
# Data files
# ---------------------------------------------------------------------------

added_datas = [
    # uv binary — lands at the root of the bundle (_MEIPASS)
    (_uv_path, "."),

    # Training scripts — run by the managed venv's python at runtime
    (str(_here / "train_yolo.py"), "."),
    (str(_here / "env_setup.py"),  "."),

    # .env config — read at runtime for API_URL
    (str(_here / ".env"), "."),

    # Flask web assets
    (str(_here / "web" / "templates"), "web/templates"),
    (str(_here / "web" / "static"),    "web/static"),

    # App icon bundled so PyQt6 can load it at runtime
    (str(_here / "assets" / "icon.png"), "assets"),
]

# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

a = Analysis(
    [str(_here / "frontend" / "main.py")],
    pathex=[str(_here)],
    binaries=[],
    datas=added_datas,
    hiddenimports=[
        # Flask / Werkzeug internals that PyInstaller misses
        "flask",
        "werkzeug",
        "werkzeug.serving",
        "werkzeug.debug",
        "jinja2",
        "jinja2.ext",
        # PyQt6 platform plugin
        "PyQt6.QtCore",
        "PyQt6.QtGui",
        "PyQt6.QtWidgets",
        # requests
        "requests",
        "urllib3",
        "certifi",
        "charset_normalizer",
        "idna",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Heavy ML libs are intentionally NOT frozen — they live in the
        # uv-managed .trainchain_env/ venv instead.
        "torch", "ultralytics", "transformers", "numpy", "cv2",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

# ---------------------------------------------------------------------------
# Executable
# ---------------------------------------------------------------------------

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="TrainChain",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,          # No console window (GUI app)
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(_here / "assets" / "icon.ico"),
)

# ---------------------------------------------------------------------------
# One-folder bundle (recommended — keeps uv.exe and venv next to the exe)
# ---------------------------------------------------------------------------

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="TrainChain",
)
