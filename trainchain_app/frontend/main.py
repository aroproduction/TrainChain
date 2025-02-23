# frontend/main.py
import sys
import os
import threading
from PyQt6.QtWidgets import QApplication

# Add project root to sys.path (works for both dev and packaged app)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.server import run_server
from frontend.login_window import LoginWindow

def start_flask():
    """Run Flask server in a separate thread"""
    threading.Thread(target=run_server, daemon=True).start()

if __name__ == "__main__":
    start_flask()  # Start the Flask authentication server
    app = QApplication(sys.argv)
    login_window = LoginWindow()
    login_window.show()
    sys.exit(app.exec())