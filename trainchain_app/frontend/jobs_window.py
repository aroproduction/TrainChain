# jobs_window.py
import sys
import requests
import subprocess
from PyQt6.QtWidgets import QMainWindow, QLabel, QVBoxLayout, QWidget, QApplication, QPushButton, QProgressBar
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
import threading

class JobsPage(QMainWindow):
    def __init__(self, wallet_address):
        super().__init__()
        self.wallet_address = wallet_address
        self.setWindowTitle("Available Jobs")
        self.setGeometry(100, 100, 600, 400)
        self.setMinimumSize(500, 300)
        self.job_id = None
        self.job_type = None

        # Main widget and layout with professional spacing
        container = QWidget()
        self.layout = QVBoxLayout()
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(15)

        # Job details label
        self.label = QLabel(f"Wallet: {self.wallet_address}\nFetching job details...", self)
        self.label.setFont(QFont("Helvetica", 12, QFont.Weight.Bold))
        self.label.setWordWrap(True)
        self.label.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.layout.addWidget(self.label)

        # Start Training button (initially hidden)
        self.start_button = QPushButton("Start Training", self)
        self.start_button.setFont(QFont("Helvetica", 12, QFont.Weight.Bold))
        self.start_button.setFixedSize(220, 45)
        self.start_button.clicked.connect(self.start_training)
        self.start_button.setVisible(False)
        self.layout.addWidget(self.start_button, alignment=Qt.AlignmentFlag.AlignCenter)

        # Loader and warning (initially hidden)
        self.loader = QProgressBar(self)
        self.loader.setRange(0, 0)  # Indeterminate mode
        self.loader.setVisible(False)
        self.layout.addWidget(self.loader)

        self.warning_label = QLabel("Please don't close this app while training is in progress!", self)
        self.warning_label.setFont(QFont("Helvetica", 10, QFont.Weight.Bold))
        self.warning_label.setStyleSheet("color: #D32F2F;")  # Red for warning
        self.warning_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.warning_label.setVisible(False)
        self.layout.addWidget(self.warning_label)

        self.layout.addStretch()
        container.setLayout(self.layout)
        self.setCentralWidget(container)

        # Professional stylesheet
        self.setStyleSheet("""
            QMainWindow {
                background-color: #F0F2F5;
            }
            QLabel {
                color: #1A3C5A;
                padding: 10px;
                background-color: #FFFFFF;
                border: 1px solid #D1D9E6;
                border-radius: 4px;
            }
            QPushButton {
                background-color: #2E5BFF;
                color: #FFFFFF;
                border: 1px solid #1A3C5A;
                border-radius: 4px;
                padding: 8px;
            }
            QPushButton:hover {
                background-color: #4870FF;
            }
            QProgressBar {
                border: 1px solid #D1D9E6;
                border-radius: 4px;
                background-color: #FFFFFF;
                height: 20px;
            }
        """)

        self.fetch_job_details()

    def fetch_job_details(self):
        """Send a GET request to the backend to fetch job details"""
        try:
            response = requests.get(f"http://localhost:4000/jobs/contributor/get-job?contributorAddress={self.wallet_address}")
            print("response", response.json())
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self.job_id = data.get("id")
                    self.job_type = data.get("job_type")
                    job_description = data.get("job_type", "No description available")
                    reward = data.get("reward", "N/A")
                    self.label.setText(
                        f"Wallet: {self.wallet_address}\n"
                        f"Job ID: {self.job_id}\n"
                        f"Description: {job_description}\n"
                        f"Reward: {reward} ETH"
                    )
                    self.start_button.setVisible(True)  # Show button if job is available
                else:
                    self.label.setText(f"Wallet: {self.wallet_address}\nCurrently no jobs are available.")
                    self.start_button.setVisible(False)
            elif response.status_code == 201:
                self.label.setText(f"Wallet: {self.wallet_address}\nCurrently no jobs are available.")
                self.start_button.setVisible(False)
            else:
                self.label.setText(f"Error fetching job details. Status: {response.status_code}")
                self.start_button.setVisible(False)
        except requests.RequestException as e:
            self.label.setText(f"Request failed: {str(e)}")
            self.start_button.setVisible(False)

    def start_training(self):
        """Run Docker commands for training based on job details"""
        self.start_button.setEnabled(False)  # Disable button during training
        self.loader.setVisible(True)  # Show loader
        self.warning_label.setVisible(True)  # Show warning

        # Determine Docker image tag based on job_type
        docker_tag = "yolo-training" if self.job_type == "image_processing" else "default-training"

        # Docker commands
        commands = [
            ["docker", "pull", f"aroproduction/trainchain:{docker_tag}"],
            ["docker", "run", "--gpus", "all", "--shm-size=4g", "--memory=5g", 
             "-e", f"JOB_ID={self.job_id}", 
             "-e", "API_URL=http://host.docker.internal:4000", 
             f"aroproduction/trainchain:{docker_tag}"]
        ]

        def run_docker():
            try:
                for cmd in commands:
                    subprocess.run(cmd, check=True)
                self.label.setText(f"Wallet: {self.wallet_address}\nTraining completed for Job ID: {self.job_id}")
            except subprocess.CalledProcessError as e:
                self.label.setText(f"Error running Docker: {str(e)}")
            finally:
                self.loader.setVisible(False)
                self.warning_label.setVisible(False)
                self.start_button.setEnabled(True)
                self.start_button.setVisible(False)  # Hide button after completion

        # Run Docker commands in a separate thread to keep UI responsive
        threading.Thread(target=run_docker, daemon=True).start()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    wallet_address = "0x123456789ABCDEF"
    window = JobsPage(wallet_address)
    window.show()
    sys.exit(app.exec())