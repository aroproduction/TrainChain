# jobs_window.py
"""
Jobs window for TrainChain contributor app.

Docker dependency removed (Phase 4.3).
Training now runs inside the uv-managed venv via train_yolo.py.
"""

import sys
import os
import json
import threading
import subprocess
import traceback
from pathlib import Path

import requests
from PyQt6.QtWidgets import (
    QMainWindow, QLabel, QVBoxLayout, QWidget, QApplication,
    QPushButton, QProgressBar, QRadioButton, QGroupBox, QMessageBox,
)
from PyQt6.QtCore import Qt, pyqtSignal, QObject
from PyQt6.QtGui import QFont

# Resolve project root so this file works both from source and when frozen.
_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent  # trainchain_app/

sys.path.insert(0, str(_ROOT))
from env_setup import get_python_bin, ENV_DIR, load_api_url  # noqa: E402

# Absolute path to train_yolo.py shipped with the app
_TRAIN_YOLO  = _ROOT / "train_yolo.py"
_TRAIN_LLM   = _ROOT / "training" / "train_llm.py"
_SPEC_CHECK  = _ROOT / "training" / "spec_check.py"

# API base URL — read from .env, falls back to production
_API_URL = load_api_url()

# Log file written next to the exe / project root for post-mortem debugging
_LOG_FILE = _ROOT / "trainchain_error.log"
_TRAINING_LOG_FILE = _ROOT / "trainchain_training.log"


def _write_log(text: str) -> None:
    """Append text to the persistent error log file."""
    try:
        with open(_LOG_FILE, "a", encoding="utf-8") as f:
            import datetime
            f.write(f"\n{'='*60}\n{datetime.datetime.now().isoformat()}\n{text}\n")
    except Exception:
        pass  # never crash the UI trying to write a log


def _write_training_log(lines: list[str], job_id: str) -> None:
    """Write the full training subprocess output to trainchain_training.log."""
    try:
        import datetime
        with open(_TRAINING_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n{'='*60}\n{datetime.datetime.now().isoformat()}  job_id={job_id}\n")
            f.write("\n".join(lines))
            f.write("\n")
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Qt signal helper (thread → main-thread UI updates)
# ---------------------------------------------------------------------------

class _Signals(QObject):
    log        = pyqtSignal(str)
    done       = pyqtSignal(bool, str)   # success, message
    spec_check = pyqtSignal(bool, str)  # passed, display_message

# ---------------------------------------------------------------------------
# JobsPage
# ---------------------------------------------------------------------------

class JobsPage(QMainWindow):
    def __init__(self, wallet_address: str):
        super().__init__()
        self.wallet_address = wallet_address
        self.setWindowTitle("Available Jobs")
        self.setGeometry(100, 100, 620, 460)
        self.setMinimumSize(530, 480)

        self.job_id    = None
        self.job_type  = None
        self.use_gpu   = True
        self._job_data = {}

        self._signals = _Signals()
        self._signals.log.connect(self._on_log)
        self._signals.done.connect(self._on_done)
        self._signals.spec_check.connect(self._on_spec_check_done)
        self._training_process: subprocess.Popen | None = None  # tracked for cancellation

        container = QWidget()
        self.layout = QVBoxLayout()
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(15)

        self.label = QLabel(
            f"Wallet: {self.wallet_address}\nFetching job details…", self
        )
        self.label.setFont(QFont("Helvetica", 12, QFont.Weight.Bold))
        self.label.setWordWrap(True)
        self.label.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.layout.addWidget(self.label)

        # Hardware spec check result (shown for LLM finetune jobs)
        self.spec_label = QLabel("", self)
        self.spec_label.setFont(QFont("Helvetica", 10))
        self.spec_label.setWordWrap(True)
        self.spec_label.setVisible(False)
        self.layout.addWidget(self.spec_label)

        # Refresh button (shown when no job assigned yet, or shard not ready)
        self.refresh_button = QPushButton("🔄  Refresh / Check for Jobs", self)
        self.refresh_button.setFont(QFont("Helvetica", 10))
        self.refresh_button.setFixedSize(220, 38)
        self.refresh_button.clicked.connect(self.fetch_job_details)
        self.refresh_button.setVisible(False)
        self.layout.addWidget(self.refresh_button, alignment=Qt.AlignmentFlag.AlignCenter)

        self.hardware_group = QGroupBox("Select Hardware")
        self.hardware_group.setFont(QFont("Helvetica", 11))
        hw_layout = QVBoxLayout()
        self.gpu_radio = QRadioButton("GPU (faster training)")
        self.cpu_radio = QRadioButton("CPU (compatible with all machines)")
        self.gpu_radio.setChecked(True)
        self.gpu_radio.toggled.connect(self._on_hardware_selected)
        hw_layout.addWidget(self.gpu_radio)
        hw_layout.addWidget(self.cpu_radio)
        self.hardware_group.setLayout(hw_layout)
        self.hardware_group.setVisible(False)
        self.layout.addWidget(self.hardware_group)

        self.start_button = QPushButton("Start Training", self)
        self.start_button.setFont(QFont("Helvetica", 12, QFont.Weight.Bold))
        self.start_button.setFixedSize(220, 45)
        self.start_button.clicked.connect(self.start_training)
        self.start_button.setVisible(False)
        self.layout.addWidget(self.start_button, alignment=Qt.AlignmentFlag.AlignCenter)

        self.loader = QProgressBar(self)
        self.loader.setRange(0, 0)
        self.loader.setVisible(False)
        self.layout.addWidget(self.loader)

        # Live training log (last line of subprocess stdout)
        self.log_label = QLabel("", self)
        self.log_label.setFont(QFont("Courier New", 9))
        self.log_label.setWordWrap(True)
        self.log_label.setVisible(False)
        self.layout.addWidget(self.log_label)

        self.warning_label = QLabel(
            "Please don't close this app while training is in progress!", self
        )
        self.warning_label.setFont(QFont("Helvetica", 10, QFont.Weight.Bold))
        self.warning_label.setStyleSheet("color: #D32F2F;")
        self.warning_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.warning_label.setVisible(False)
        self.layout.addWidget(self.warning_label)

        self.layout.addStretch()
        container.setLayout(self.layout)
        self.setCentralWidget(container)

        self.setStyleSheet("""
            QMainWindow { background-color: #F0F2F5; }
            QLabel {
                color: #1A3C5A; padding: 10px;
                background-color: #FFFFFF;
                border: 1px solid #D1D9E6; border-radius: 4px;
            }
            QPushButton {
                background-color: #2E5BFF; color: #FFFFFF;
                border: 1px solid #1A3C5A; border-radius: 4px; padding: 8px;
            }
            QPushButton:hover { background-color: #4870FF; }
            QProgressBar {
                border: 1px solid #D1D9E6; border-radius: 4px;
                background-color: #FFFFFF; height: 20px;
            }
            QGroupBox {
                background-color: #FFFFFF; border: 1px solid #D1D9E6;
                border-radius: 4px; padding: 15px; margin-top: 15px;
            }
            QRadioButton { color: #1A3C5A; padding: 5px; }
        """)

        self.fetch_job_details()

    # ── Slots ─────────────────────────────────────────────────────────────

    def _on_hardware_selected(self):
        self.use_gpu = self.gpu_radio.isChecked()

    def _on_log(self, line: str):
        self.log_label.setText(line[-120:])

    def _on_done(self, success: bool, message: str):
        self._training_process = None  # process has exited
        self.loader.setVisible(False)
        self.warning_label.setVisible(False)
        self.log_label.setVisible(False)
        self.start_button.setEnabled(True)
        self.start_button.setVisible(not success)
        self.hardware_group.setEnabled(True)
        if success:
            self.label.setStyleSheet(
                "color: #1B5E20; padding: 10px; background-color: #E8F5E9;"
                "border: 1px solid #A5D6A7; border-radius: 4px;"
            )
            self.label.setText(
                f"✅ Training completed successfully!\nJob ID: {self.job_id}\n"
                f"Wallet: {self.wallet_address}"
            )
            self.hardware_group.setVisible(False)
        else:
            self.label.setText(
                f"Wallet: {self.wallet_address}\nTraining failed \u2014 see details below."
            )
            _write_log(message)
            dlg = QMessageBox(self)
            dlg.setWindowTitle("Training Error")
            dlg.setIcon(QMessageBox.Icon.Critical)
            dlg.setText("Training failed. Full details:")
            dlg.setDetailedText(message)
            dlg.setStandardButtons(QMessageBox.StandardButton.Ok)
            dlg.exec()

    def _kill_training(self) -> None:
        """Terminate the training subprocess if it is still running."""
        proc = self._training_process
        if proc is not None and proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        self._training_process = None

    def closeEvent(self, event):
        """Kill the training process when the window is closed."""
        self._kill_training()
        super().closeEvent(event)

    # ── API fetch ─────────────────────────────────────────────────────────

    def fetch_job_details(self):
        # Reset spec label for a fresh check
        self.spec_label.setVisible(False)
        self.spec_label.setText("")
        self.refresh_button.setVisible(False)

        try:
            # ── 1. Check for an image-processing job (existing flow) ──────────
            response = requests.get(
                f"{_API_URL}/jobs/contributor/get-job"
                f"?contributorAddress={self.wallet_address}",
                timeout=15,
            )
            if response.status_code == 200:
                data = response.json()
                if "id" in data:
                    self._job_data = data
                    self.job_id   = data.get("id")
                    self.job_type = data.get("job_type")
                    self.label.setText(
                        f"Wallet: {self.wallet_address}\n"
                        f"Job ID: {self.job_id}\n"
                        f"Type: {self.job_type}\n"
                        f"Reward: {data.get('reward', 'N/A')} POL"
                    )
                    self.hardware_group.setVisible(True)
                    self.start_button.setVisible(True)
                    return

            # ── 2. Check for an LLM federated finetuning slot ─────────────────
            llm_res = requests.get(
                f"{_API_URL}/jobs/llm/my-slot",
                params={"contributorAddress": self.wallet_address},
                timeout=15,
            )
            if llm_res.status_code == 200:
                slot = llm_res.json()
                if slot and "job_id" in slot:
                    self._job_data = slot
                    self.job_id    = slot.get("job_id")
                    self.job_type  = "llm_finetune"

                    # Already submitted — training complete
                    if slot.get("slot_status") == "submitted" or slot.get("adapter_cid"):
                        self.label.setText(
                            f"Wallet: {self.wallet_address}\n"
                            f"Job ID: {self.job_id}\n"
                            f"Model: {slot.get('model_name', 'N/A')}\n"
                            f"\u2705 LoRA adapter submitted successfully! "
                            f"Waiting for aggregation to complete."
                        )
                        self.hardware_group.setVisible(False)
                        self.start_button.setVisible(False)
                        return

                    # Sharding still in progress — shard_cid not yet assigned
                    if not slot.get("shard_cid"):
                        self.label.setText(
                            f"Wallet: {self.wallet_address}\n"
                            f"Job ID: {self.job_id}\n"
                            f"Model: {slot.get('model_name', 'N/A')}\n"
                            f"\u23f3 Waiting for dataset sharding to complete\u2026\n"
                            f"Tap Refresh in a moment."
                        )
                        self.hardware_group.setVisible(False)
                        self.start_button.setVisible(False)
                        self.refresh_button.setVisible(True)
                        return

                    # Shard ready — show job info and run hardware spec check
                    self.label.setText(
                        f"Wallet: {self.wallet_address}\n"
                        f"Job ID: {self.job_id}\n"
                        f"Type: LLM Finetune\n"
                        f"Model: {slot.get('model_name', 'N/A')}\n"
                        f"Reward: {slot.get('reward', 'N/A')} POL\n"
                        f"Slot: #{slot.get('slot_index', '?')}\n"
                        f"\u23f3 Checking hardware compatibility\u2026"
                    )
                    self.hardware_group.setVisible(True)
                    self.start_button.setVisible(True)
                    self.start_button.setEnabled(False)  # disabled until spec check passes
                    # Run spec check in background so UI stays responsive
                    threading.Thread(
                        target=self._run_spec_check,
                        args=(slot.get("model_name", ""),),
                        daemon=True,
                    ).start()
                    return

            # ── 3. Nothing found ──────────────────────────────────────────────
            self.label.setText(
                f"Wallet: {self.wallet_address}\nNo jobs available."
            )
        except requests.RequestException as exc:
            self.label.setText(f"Request failed: {exc}")

        self.start_button.setVisible(False)
        self.hardware_group.setVisible(False)
        self.refresh_button.setVisible(True)

    # ── Training (no Docker — runs train_yolo.py in the uv venv) ─────────

    def start_training(self):
        self.start_button.setEnabled(False)
        self.loader.setVisible(True)
        self.log_label.setVisible(True)
        self.warning_label.setVisible(True)
        self.hardware_group.setEnabled(False)
        threading.Thread(target=self._run_training, daemon=True).start()

    def _run_training(self):
        try:
            python_bin = get_python_bin()
            if not python_bin.exists():
                self._signals.done.emit(
                    False,
                    f"Training environment not found at:\n{python_bin}\n\n"
                    "Please restart the app to run first-time setup.",
                )
                return

            job_type = self.job_type or "image_processing"
            if job_type == "llm_finetune":
                self._run_llm(python_bin, self._job_data)
            elif job_type == "image_processing":
                self._run_yolo(python_bin, self._job_data)
            else:
                self._signals.done.emit(False, f"Unsupported job type: {job_type}")
        except Exception as exc:
            self._signals.done.emit(False, f"{exc}\n\n{traceback.format_exc()}")

    def _run_yolo(self, python_bin: Path, job_data: dict):
        cmd = [
            str(python_bin),
            str(_TRAIN_YOLO),
            "--job-id",             str(self.job_id),
            "--api-url",            _API_URL,
            "--contributor-wallet", self.wallet_address,
        ]

        hardware = "GPU" if self.use_gpu else "CPU"
        self._signals.log.emit(
            f"Starting YOLO training for Job {self.job_id} using {hardware}…"
        )

        env = os.environ.copy()
        if not self.use_gpu:
            env["CUDA_VISIBLE_DEVICES"] = ""

        # Suppress console window on Windows (app is windowed, not console)
        popen_kwargs = {}
        if os.name == "nt":
            popen_kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                # Force UTF-8 so YOLO's progress bars (which use Unicode
                # box-drawing chars) don't crash on Windows cp1252 terminals.
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                env=env,
                **popen_kwargs,
            )
            self._training_process = process
            assert process.stdout is not None
            output_lines: list[str] = []
            for line in process.stdout:
                stripped = line.rstrip()
                output_lines.append(stripped)
                self._signals.log.emit(stripped)
            process.wait()
            _write_training_log(output_lines, str(self.job_id))

            if process.returncode == 0:
                self._signals.done.emit(True, "")
            else:
                tail = "\n".join(output_lines[-50:])  # last 50 lines
                self._signals.done.emit(
                    False,
                    f"Training script exited with code {process.returncode}.\n\n"
                    f"Command:\n{' '.join(str(c) for c in cmd)}\n\n"
                    f"Last output:\n{tail}",
                )
        except Exception as exc:
            self._kill_training()
            self._signals.done.emit(
                False,
                f"{exc}\n\n{traceback.format_exc()}"
            )

    # ── LLM: hardware spec check ──────────────────────────────────────────

    def _on_spec_check_done(self, passed: bool, message: str) -> None:
        """Called on the main thread when spec_check.py finishes."""
        slot = self._job_data
        base_info = (
            f"Wallet: {self.wallet_address}\n"
            f"Job ID: {self.job_id}\n"
            f"Type: LLM Finetune\n"
            f"Model: {slot.get('model_name', 'N/A')}\n"
            f"Reward: {slot.get('reward', 'N/A')} POL\n"
            f"Slot: #{slot.get('slot_index', '?')}"
        )
        self.label.setText(base_info)

        if passed:
            self.spec_label.setStyleSheet(
                "color: #1B5E20; background-color: #E8F5E9; "
                "border: 1px solid #A5D6A7; border-radius: 4px; padding: 8px;"
            )
        else:
            self.spec_label.setStyleSheet(
                "color: #B71C1C; background-color: #FFEBEE; "
                "border: 1px solid #EF9A9A; border-radius: 4px; padding: 8px;"
            )
        self.spec_label.setText(message)
        self.spec_label.setVisible(True)
        # Enable Start Training button only when spec check passes
        self.start_button.setEnabled(passed)

    def _run_spec_check(self, model_name: str) -> None:
        """Run spec_check.py in the managed venv; emit result to main thread."""
        try:
            python_bin = get_python_bin()
            if not python_bin.exists():
                self._signals.spec_check.emit(
                    False,
                    "\u26a0\ufe0f Training environment not set up. "
                    "Restart the app to install dependencies.",
                )
                return

            if not _SPEC_CHECK.exists():
                # Spec script missing — allow training rather than hard-block
                self._signals.spec_check.emit(
                    True,
                    "\u26a0\ufe0f Hardware check unavailable (script not found). "
                    "Proceeding anyway.",
                )
                return

            popen_kw: dict = {}
            if os.name == "nt":
                popen_kw["creationflags"] = subprocess.CREATE_NO_WINDOW

            proc = subprocess.run(
                [
                    str(python_bin), str(_SPEC_CHECK),
                    "--model-name", model_name,
                    "--disk-path",  str(_ROOT),
                ],
                capture_output=True,
                text=True,
                timeout=60,
                **popen_kw,
            )

            stdout = proc.stdout.strip()
            if not stdout:
                self._signals.spec_check.emit(
                    True,
                    "\u2705 Hardware check produced no output \u2014 proceeding.",
                )
                return

            result   = json.loads(stdout)
            errors   = result.get("errors",   [])
            warnings = result.get("warnings", [])
            vram_gb  = result.get("vram_gb")
            ram_gb   = result.get("ram_gb", 0)

            if result["ok"]:
                parts = []
                if vram_gb is not None:
                    parts.append(f"VRAM: {vram_gb} GB")
                parts.append(f"RAM: {ram_gb} GB")
                hw_str = "  |  ".join(parts)
                if warnings:
                    msg = f"\u26a0\ufe0f {warnings[0]}\n({hw_str})"
                    self._signals.spec_check.emit(True, msg)
                else:
                    self._signals.spec_check.emit(
                        True,
                        f"\u2705 Hardware OK \u2014 {hw_str}",
                    )
            else:
                self._signals.spec_check.emit(
                    False,
                    "\u274c " + "  |  ".join(errors),
                )
        except Exception as exc:
            # Never hard-block training on a failed spec check
            self._signals.spec_check.emit(
                True,
                f"\u26a0\ufe0f Hardware check failed ({exc}) \u2014 proceeding anyway.",
            )

    # ── LLM: training runner ──────────────────────────────────────────────

    def _run_llm(self, python_bin: Path, slot_data: dict) -> None:
        """Invoke train_llm.py for a federated LLM finetuning job."""
        if not _TRAIN_LLM.exists():
            self._signals.done.emit(
                False,
                f"LLM training script not found:\n{_TRAIN_LLM}\n\n"
                "Please reinstall the application.",
            )
            return

        cmd = [
            str(python_bin),
            str(_TRAIN_LLM),
            "--job-id",             str(self.job_id),
            "--api-url",            _API_URL,
            "--contributor-wallet", self.wallet_address,
        ]

        hardware = "GPU" if self.use_gpu else "CPU"
        self._signals.log.emit(
            f"Starting LLM finetuning for Job {self.job_id} using {hardware}\u2026"
        )

        env = os.environ.copy()
        if not self.use_gpu:
            env["CUDA_VISIBLE_DEVICES"] = ""
        # Ensure the subprocess prints UTF-8 so emoji log lines don't crash
        # on Windows cp1252 terminals (same reason _run_yolo sets this).
        env["PYTHONIOENCODING"] = "utf-8"

        popen_kw: dict = {}
        if os.name == "nt":
            popen_kw["creationflags"] = subprocess.CREATE_NO_WINDOW

        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                env=env,
                **popen_kw,
            )
            self._training_process = process
            assert process.stdout is not None
            output_lines: list[str] = []
            for line in process.stdout:
                stripped = line.rstrip()
                output_lines.append(stripped)
                self._signals.log.emit(stripped)
            process.wait()
            _write_training_log(output_lines, str(self.job_id))

            if process.returncode == 0:
                self._signals.done.emit(True, "")
            elif process.returncode == 2:
                # Shard not ready — surface a friendly retry message
                self._signals.done.emit(
                    False,
                    "Dataset shard is not ready yet.\n\n"
                    "The backend is still sharding the dataset. "
                    "Please wait a few minutes, tap Refresh, and try again.",
                )
            else:
                tail = "\n".join(output_lines[-50:])
                self._signals.done.emit(
                    False,
                    f"LLM training exited with code {process.returncode}.\n\n"
                    f"Command:\n{' '.join(str(c) for c in cmd)}\n\n"
                    f"Last output:\n{tail}",
                )
        except Exception as exc:
            self._kill_training()
            self._signals.done.emit(False, f"{exc}\n\n{traceback.format_exc()}")


# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = JobsPage("0x123456789ABCDEF")
    window.show()
    sys.exit(app.exec())