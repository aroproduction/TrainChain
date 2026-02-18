; TrainChain.iss
; Inno Setup script — produces a single TrainChain-Setup.exe installer.
;
; Prerequisites
;   1. Install Inno Setup 6  →  https://jrsoftware.org/isdl.php
;   2. Build the PyInstaller bundle first:
;        pyinstaller trainchain.spec --clean
;   3. Open this file in the Inno Setup IDE (or run iscc TrainChain.iss)
;
; The installer will:
;   - Copy TrainChain.exe + _internal\  to  %ProgramFiles%\TrainChain\
;   - Create a Desktop shortcut  (optional — user can deselect)
;   - Create a Start Menu entry
;   - Register an Add/Remove Programs entry with an uninstaller
;   - NOT bundle the .trainchain_env\ directory (it is created on first run)

; ---------------------------------------------------------------------------
; [Setup] — metadata & behaviour
; ---------------------------------------------------------------------------
[Setup]
AppName=TrainChain
AppVersion=1.2.0
AppPublisher=TrainChain
AppPublisherURL=https://github.com/aroproduction/TrainChain
AppSupportURL=https://github.com/aroproduction/TrainChain/issues
AppUpdatesURL=https://github.com/aroproduction/TrainChain/releases

; Default install dir — %ProgramFiles%\TrainChain
DefaultDirName={autopf}\TrainChain
; Default Start Menu folder
DefaultGroupName=TrainChain
; Allow the user to choose a different directory
DisableDirPage=no

; Output
OutputDir=dist\installer
OutputBaseFilename=TrainChain-Setup
SetupIconFile=assets\icon.ico

; Compression — best ratio, solid archive
Compression=lzma2/ultra64
SolidCompression=yes
InternalCompressLevel=ultra64

; Require admin rights so we can write to %ProgramFiles%
PrivilegesRequired=admin

; Minimum Windows version: Windows 10
MinVersion=10.0

; Architecture — x64 only (PyInstaller output is native x64)
ArchitecturesInstallIn64BitMode=x64compatible
ArchitecturesAllowed=x64compatible

; Show a "Ready to Install" page so the user can review choices
DisableReadyPage=no

; Uninstall
UninstallDisplayIcon={app}\TrainChain.exe
UninstallDisplayName=TrainChain

; Wizard appearance
WizardStyle=modern

; ---------------------------------------------------------------------------
; [Languages]
; ---------------------------------------------------------------------------
[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

; ---------------------------------------------------------------------------
; [Tasks] — optional user choices during install
; ---------------------------------------------------------------------------
[Tasks]
Name: "desktopicon";    Description: "Create a &Desktop shortcut";    GroupDescription: "Additional shortcuts:"; Flags: unchecked
Name: "startmenuicon"; Description: "Create a &Start Menu shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce

; ---------------------------------------------------------------------------
; [Files] — what gets copied where
; ---------------------------------------------------------------------------
[Files]
; Main executable
Source: "dist\TrainChain\TrainChain.exe"; DestDir: "{app}"; Flags: ignoreversion

; Entire _internal folder (PyQt6, DLLs, Python runtime, web assets, etc.)
Source: "dist\TrainChain\_internal\*"; DestDir: "{app}\_internal"; \
    Flags: ignoreversion recursesubdirs createallsubdirs

; ---------------------------------------------------------------------------
; [Icons] — shortcuts
; ---------------------------------------------------------------------------
[Icons]
; Start Menu
Name: "{group}\TrainChain";           Filename: "{app}\TrainChain.exe"; IconFilename: "{app}\TrainChain.exe"; Tasks: startmenuicon
Name: "{group}\Uninstall TrainChain"; Filename: "{uninstallexe}"

; Desktop
Name: "{autodesktop}\TrainChain"; Filename: "{app}\TrainChain.exe"; IconFilename: "{app}\TrainChain.exe"; Tasks: desktopicon

; ---------------------------------------------------------------------------
; [Run] — optionally launch after install
; ---------------------------------------------------------------------------
[Run]
Filename: "{app}\TrainChain.exe"; \
    Description: "Launch TrainChain now"; \
    Flags: nowait postinstall skipifsilent

; ---------------------------------------------------------------------------
; [UninstallDelete] — clean up files the app creates at runtime
; ---------------------------------------------------------------------------
[UninstallDelete]
; Remove the uv-managed training venv created on first run
Type: filesandordirs; Name: "{app}\.trainchain_env"
; Remove any leftover log files written next to the exe
Type: files; Name: "{app}\trainchain_error.log"
Type: files; Name: "{app}\trainchain_training.log"
