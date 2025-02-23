# main.spec
a = Analysis(
    ['main.py'],
    pathex=['.'],  # Current directory (frontend/)
    binaries=[],
    datas=[
        ('../backend', 'backend'),
        ('../web', 'web'),
        ('.', 'frontend')  # Include all frontend files
    ],
    hiddenimports=[
        'flask',
        'PyQt6.QtCore',
        'PyQt6.QtWidgets',
        'PyQt6.QtGui',
        'frontend.jobs_window'  # Explicitly include jobs_window
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None
)
pyz = PYZ(a.pure, a.zipped_data, cipher=None)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    windowed=True
)