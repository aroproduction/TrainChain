# login_window.py
import sys
import webbrowser
import time
import requests
from PyQt6.QtWidgets import QMainWindow, QPushButton, QLabel, QVBoxLayout, QWidget, QApplication, QMessageBox
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from .jobs_window import JobsPage
from .session import save_session

class LoginWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("MetaMask Authentication")
        self.setGeometry(100, 100, 500, 300)
        self.setMinimumSize(400, 250)

        # Main widget and layout with clean spacing
        container = QWidget()
        layout = QVBoxLayout()
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(20)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Formal, prominent label
        self.label = QLabel("Click below to authenticate with MetaMask", self)
        self.label.setFont(QFont("Helvetica", 14, QFont.Weight.Bold))  # Larger, professional font
        self.label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.label)

        # Polished button
        self.login_button = QPushButton("Login with MetaMask", self)
        self.login_button.setFont(QFont("Helvetica", 12, QFont.Weight.Bold))  # Bold and readable
        self.login_button.setFixedSize(220, 45)
        self.login_button.clicked.connect(self.authenticate)
        layout.addWidget(self.login_button, alignment=Qt.AlignmentFlag.AlignCenter)

        container.setLayout(layout)
        self.setCentralWidget(container)

        # Professional, formal stylesheet
        self.setStyleSheet("""
            QMainWindow {
                background-color: #F0F2F5;  /* Light gray background */
            }
            QLabel {
                color: #1A3C5A;         /* Deep navy text */
                padding: 10px;
            }
            QPushButton {
                background-color: #2E5BFF;  /* Professional blue */
                color: #FFFFFF;
                border: 1px solid #1A3C5A;
                border-radius: 4px;
                padding: 8px;
            }
            QPushButton:hover {
                background-color: #4870FF;  /* Slightly lighter blue on hover */
            }
        """)

    def authenticate(self):
        """Opens MetaMask authentication page and waits for authentication."""
        webbrowser.open("http://127.0.0.1:5000/login")
        self.label.setText("Waiting for authentication...")

        wallet_address = self.wait_for_authentication()
        if wallet_address:
            self.open_jobs_page(wallet_address)
        else:
            QMessageBox.critical(self, "Authentication Failed", "Failed to authenticate with MetaMask!")

    def wait_for_authentication(self, timeout=30):
        """Continuously checks for authentication within a timeout period."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = requests.get("http://127.0.0.1:5000/get_wallet")
                data = response.json()
                if data.get("wallet"):
                    return data["wallet"]
            except requests.exceptions.RequestException:
                pass
            time.sleep(2)
        return None

    def open_jobs_page(self, wallet_address):
        """Opens Jobs Page after successful login"""
        save_session(wallet_address)
        self.jobs_window = JobsPage(wallet_address)
        self.jobs_window.show()
        self.close()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = LoginWindow()
    window.show()
    sys.exit(app.exec())