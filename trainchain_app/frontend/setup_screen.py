# frontend/setup_screen.py
"""
First-launch environment setup screen.

Shown exactly once — the first time the app is run on a machine where
.trainchain_env/ does not yet exist. Calls env_setup.setup_env() in a
background thread, streams progress to the UI, then transitions to the
normal LoginWindow on completion.

If the user already has a working env this screen is never shown (main.py
checks is_env_ready() before instantiating it).
"""

import sys
import threading
from pathlib import Path
from typing import Callable

from PyQt6.QtCore import Qt, pyqtSignal, QObject
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QLabel, QMainWindow, QProgressBar,
    QPushButton, QVBoxLayout, QWidget,
)

# Project root is one directory above this file
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from env_setup import setup_env  # noqa: E402


# ---------------------------------------------------------------------------
# Signal bridge (worker thread → Qt main thread)
# ---------------------------------------------------------------------------

class _Signals(QObject):
    progress = pyqtSignal(int)    # 0–100
    log      = pyqtSignal(str)    # status text
    finished = pyqtSignal()       # setup complete
    error    = pyqtSignal(str)    # setup failed


# ---------------------------------------------------------------------------
# SetupScreen
# ---------------------------------------------------------------------------

class SetupScreen(QMainWindow):
    """
    One-time environment setup window.

    Parameters
    ----------
    on_complete : callable
        No-arg callback invoked (on the main thread) after successful setup.
        Typically opens the LoginWindow and closes this window.
    """

    def __init__(self, on_complete: Callable):
        super().__init__()
        self._on_complete = on_complete

        self.setWindowTitle("TrainChain — First-Time Setup")
        self.setGeometry(200, 200, 560, 340)
        self.setMinimumSize(480, 280)
        self.setWindowFlag(Qt.WindowType.WindowCloseButtonHint, False)

        self._sig = _Signals()
        self._sig.progress.connect(self._on_progress)
        self._sig.log.connect(self._on_log)
        self._sig.finished.connect(self._on_finished)
        self._sig.error.connect(self._on_error)

        # ── Layout ──────────────────────────────────────────────────────────
        container = QWidget()
        layout = QVBoxLayout()
        layout.setContentsMargins(30, 30, 30, 30)
        layout.setSpacing(18)

        title = QLabel("Setting up Training Environment")
        title.setFont(QFont("Helvetica", 14, QFont.Weight.Bold))
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        subtitle = QLabel(
            "This happens once. TrainChain is downloading the Python packages\n"
            "needed to run training jobs (~2–4 GB). Please stay connected."
        )
        subtitle.setFont(QFont("Helvetica", 10))
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setWordWrap(True)
        layout.addWidget(subtitle)

        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, 100)
        self.progress_bar.setValue(0)
        layout.addWidget(self.progress_bar)

        self.status_label = QLabel("Initialising…")
        self.status_label.setFont(QFont("Courier New", 9))
        self.status_label.setWordWrap(True)
        self.status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.status_label)

        # Retry button — shown only on failure
        self.retry_button = QPushButton("Retry Setup")
        self.retry_button.setFont(QFont("Helvetica", 11, QFont.Weight.Bold))
        self.retry_button.setFixedSize(160, 40)
        self.retry_button.clicked.connect(self._start_setup)
        self.retry_button.setVisible(False)
        layout.addWidget(self.retry_button, alignment=Qt.AlignmentFlag.AlignCenter)

        layout.addStretch()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self.setStyleSheet("""
            QMainWindow { background-color: #F0F2F5; }
            QLabel { color: #1A3C5A; }
            QProgressBar {
                border: 1px solid #D1D9E6; border-radius: 4px;
                background-color: #FFFFFF; height: 22px; text-align: center;
            }
            QProgressBar::chunk { background-color: #2E5BFF; border-radius: 3px; }
            QPushButton {
                background-color: #2E5BFF; color: #FFFFFF;
                border: 1px solid #1A3C5A; border-radius: 4px; padding: 6px;
            }
            QPushButton:hover { background-color: #4870FF; }
        """)

        # Kick off setup automatically
        self._start_setup()

    # ── Setup worker ──────────────────────────────────────────────────────

    def _start_setup(self):
        self.retry_button.setVisible(False)
        self.progress_bar.setValue(0)
        self.status_label.setText("Starting…")
        threading.Thread(target=self._setup_worker, daemon=True).start()

    def _setup_worker(self):
        try:
            setup_env(
                progress_cb=lambda pct: self._sig.progress.emit(pct),
                log_cb=lambda msg: self._sig.log.emit(msg),
            )
            self._sig.finished.emit()
        except Exception as exc:
            self._sig.error.emit(str(exc))

    # ── Slots ─────────────────────────────────────────────────────────────

    def _on_progress(self, pct: int):
        self.progress_bar.setValue(pct)

    def _on_log(self, msg: str):
        # Show only the last ~100 chars to keep the label tidy
        self.status_label.setText(msg[-100:] if len(msg) > 100 else msg)

    def _on_finished(self):
        self.status_label.setText("Setup complete!")
        self.progress_bar.setValue(100)
        # Hand off to the main app flow
        self._on_complete()

    def _on_error(self, msg: str):
        self.status_label.setText(f"Setup failed:\n{msg}")
        self.retry_button.setVisible(True)


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = QApplication(sys.argv)

    def _done():
        print("Setup complete — would open LoginWindow here.")

    win = SetupScreen(on_complete=_done)
    win.show()
    sys.exit(app.exec())
