# frontend/main.py
import sys
import os
import threading
from pathlib import Path
from PyQt6.QtWidgets import QApplication

# Add project root to sys.path (works for both dev and packaged app)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.server import run_server
from frontend.login_window import LoginWindow
from frontend.setup_screen import SetupScreen
from frontend.jobs_window import JobsPage
from frontend.session import load_session
from env_setup import is_env_ready


def start_flask():
    """Run Flask server in a separate thread"""
    threading.Thread(target=run_server, daemon=True).start()


if __name__ == "__main__":
    start_flask()
    app = QApplication(sys.argv)

    def _launch_main_ui():
        """Show login or jobs page depending on stored session."""
        wallet = load_session()
        if wallet:
            # Valid session found — skip login entirely
            jobs_window = JobsPage(wallet)
            jobs_window.show()
            return jobs_window          # keep a reference so Qt doesn't GC it
        else:
            login_window = LoginWindow()
            login_window.show()
            return login_window

    if is_env_ready():
        # Normal launch: training environment already exists
        _main_window = _launch_main_ui()
    else:
        # First launch: show setup screen, then open login on completion
        def _on_setup_complete():
            global _main_window
            _main_window = _launch_main_ui()
            setup_win.close()

        setup_win = SetupScreen(on_complete=_on_setup_complete)
        setup_win.show()

    sys.exit(app.exec())