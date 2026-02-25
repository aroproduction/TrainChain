"""
aggregator.py — FedAvg over LoRA adapter directories.
Adapted from fed_experiment/3_aggregate.py for use as a library.
"""

import json
import os
import shutil


def fedavg(adapter_dirs: list, weights: list) -> dict:
    """
    Weighted average of LoRA adapter weight tensors.
    adapter_dirs — list of paths to extracted adapter directories
    weights      — list of floats (e.g. shard sizes); normalised internally
    Returns dict of {tensor_key: averaged_tensor}
    """
    import torch
    from safetensors.torch import load_file

    total = sum(weights)
    norm  = [w / total for w in weights]
    print(f"[fedavg] Weights (normalised): {[f'{w:.4f}' for w in norm]}")

    averaged = {}
    for i, (adapter_dir, w) in enumerate(zip(adapter_dirs, norm)):
        print(f"[fedavg] Loading adapter {i+1}/{len(adapter_dirs)}: {adapter_dir}")
        sf_path  = os.path.join(adapter_dir, "adapter_model.safetensors")
        bin_path = os.path.join(adapter_dir, "adapter_model.bin")

        if os.path.exists(sf_path):
            tensors = load_file(sf_path, device="cpu")
        elif os.path.exists(bin_path):
            import torch as _t
            tensors = _t.load(bin_path, map_location="cpu")
        else:
            raise FileNotFoundError(f"No adapter weights found in {adapter_dir}")

        for key, tensor in tensors.items():
            t = tensor.float()
            if key not in averaged:
                averaged[key] = torch.zeros_like(t)
            averaged[key] += w * t

    print(f"[fedavg] Averaged {len(averaged)} tensors.")
    return averaged


def save_merged_adapter(averaged: dict, source_config_dir: str, output_dir: str) -> None:
    """
    Save averaged tensors as a new adapter. Copies adapter_config.json from
    source_config_dir (must be the first contributor's adapter directory).
    """
    import torch
    from safetensors.torch import save_file

    os.makedirs(output_dir, exist_ok=True)

    # Store in bfloat16 — matches training precision, halves file size vs float32
    save_file(
        {k: v.to(torch.bfloat16) for k, v in averaged.items()},
        os.path.join(output_dir, "adapter_model.safetensors"),
    )
    print(f"[save] Merged weights saved ({os.path.getsize(os.path.join(output_dir, 'adapter_model.safetensors')) / 1e6:.1f} MB)")

    cfg_src = os.path.join(source_config_dir, "adapter_config.json")
    cfg_dst = os.path.join(output_dir, "adapter_config.json")
    if os.path.exists(cfg_src):
        shutil.copy2(cfg_src, cfg_dst)

    meta = {"aggregation_method": "FedAvg", "n_adapters": len(averaged)}
    with open(os.path.join(output_dir, "trainchain_meta.json"), "w") as f:
        json.dump(meta, f, indent=2)


def run_fedavg(adapter_dirs: list, shard_sizes: list, output_dir: str) -> str:
    """
    Full pipeline: FedAvg → save merged adapter.
    Returns output_dir path.
    """
    if len(adapter_dirs) < 2:
        raise ValueError("Need at least 2 adapters for FedAvg")
    if len(shard_sizes) != len(adapter_dirs):
        raise ValueError("shard_sizes length must match adapter_dirs length")

    averaged = fedavg(adapter_dirs, shard_sizes)
    save_merged_adapter(averaged, adapter_dirs[0], output_dir)
    return output_dir