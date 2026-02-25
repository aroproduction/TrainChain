"""
spec_check.py — Hardware pre-flight check for LLM finetuning.

Run inside the uv-managed venv:
    .trainchain_env/Scripts/python.exe spec_check.py --model-name <name>

Prints a single JSON object to stdout:
{
    "ok":          bool,        # False only when RAM or disk are critically low
    "errors":      [str, ...],  # hard blockers
    "warnings":    [str, ...],  # advisory — training still allowed
    "vram_gb":     float|null,  # null if no CUDA GPU detected
    "ram_gb":      float,
    "disk_free_gb": float|null
}

Exit code is always 0 — callers check the "ok" field.
"""

import argparse
import json
import shutil
import sys

import psutil

# ---------------------------------------------------------------------------
# VRAM budget per model family (rough guidance in GB; weights + gradient states)
# ---------------------------------------------------------------------------
_VRAM_REQUIREMENTS: dict[str, float] = {
    "tinyllama":  4.0,
    "smollm2":    5.0,
    "smollm":     4.0,
    "qwen2.5":    5.0,
    "qwen2":      5.0,
    "qwen":       5.0,
    "phi-3":      6.0,
    "phi":        6.0,
    "gemma-2":    6.0,
    "gemma":      5.0,
    "llama-3":    6.0,
    "mistral":    6.0,
}
_DEFAULT_VRAM_REQ = 4.0

# Minimum system requirements (hard errors if below)
_MIN_RAM_GB  = 8.0
_MIN_DISK_GB = 10.0


def _get_vram_gb() -> float | None:
    """Return total VRAM of device 0 in GB, or None if no CUDA GPU found."""
    try:
        import torch  # noqa: PLC0415 — lazy import so psutil alone works fine
        if torch.cuda.is_available():
            return torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    except Exception:
        pass
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="TrainChain hardware spec check")
    parser.add_argument("--model-name", default="",  help="HuggingFace model ID")
    parser.add_argument("--disk-path",  default=".", help="Path used to measure free disk")
    args = parser.parse_args()

    errors:   list[str] = []
    warnings: list[str] = []

    # ── GPU / VRAM ────────────────────────────────────────────────────────────
    vram_gb = _get_vram_gb()
    model_lower = args.model_name.lower()
    req_vram = next(
        (v for k, v in _VRAM_REQUIREMENTS.items() if k in model_lower),
        _DEFAULT_VRAM_REQ,
    )

    if vram_gb is None:
        warnings.append(
            "No CUDA GPU detected — training will run on CPU (significantly slower)."
        )
    elif vram_gb < req_vram:
        warnings.append(
            f"GPU VRAM may be insufficient: {vram_gb:.1f} GB detected, "
            f"{req_vram:.1f} GB recommended for {args.model_name or 'this model'}. "
            "Training will attempt to use available VRAM."
        )

    # ── System RAM ────────────────────────────────────────────────────────────
    ram_gb = psutil.virtual_memory().total / (1024 ** 3)
    if ram_gb < _MIN_RAM_GB:
        errors.append(
            f"Insufficient RAM: {ram_gb:.1f} GB available, "
            f"{_MIN_RAM_GB:.0f} GB minimum required."
        )

    # ── Free disk ─────────────────────────────────────────────────────────────
    disk_free_gb: float | None = None
    try:
        disk_free_gb = shutil.disk_usage(args.disk_path).free / (1024 ** 3)
        if disk_free_gb < _MIN_DISK_GB:
            errors.append(
                f"Insufficient disk space: {disk_free_gb:.1f} GB free, "
                f"{_MIN_DISK_GB:.0f} GB required for model download and adapter files."
            )
    except Exception as exc:
        warnings.append(f"Could not measure free disk space: {exc}")

    result = {
        "ok":          len(errors) == 0,
        "errors":      errors,
        "warnings":    warnings,
        "vram_gb":     round(vram_gb, 2) if vram_gb is not None else None,
        "ram_gb":      round(ram_gb, 2),
        "disk_free_gb": round(disk_free_gb, 2) if disk_free_gb is not None else None,
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
