"""
blockchain.py — Call completeFederatedJob() on the deployed contract.
Uses the same owner/deployer private key as the Node backend.
"""

import os
from web3 import Web3

_rpc_url          = os.getenv("POLYGON_RPC_URL")
_private_key      = os.getenv("PRIVATE_KEY")
_contract_address = os.getenv("CONTRACT_ADDRESS")

# Minimal ABI — only the functions this service needs
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "uint256", "name": "_jobId",           "type": "uint256"},
            {"internalType": "string",  "name": "_mergedAdapterCID","type": "string"},
        ],
        "name": "completeFederatedJob",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "uint256", "name": "_jobId", "type": "uint256"}],
        "name": "getFedJobDetails",
        "outputs": [
            {"internalType": "string",  "name": "datasetCID",      "type": "string"},
            {"internalType": "string",  "name": "metadataCID",     "type": "string"},
            {"internalType": "string",  "name": "modelName",       "type": "string"},
            {"internalType": "address", "name": "requester",       "type": "address"},
            {"internalType": "uint8",   "name": "maxContributors", "type": "uint8"},
            {"internalType": "uint8",   "name": "submittedCount",  "type": "uint8"},
            {"internalType": "uint256", "name": "contributorCount","type": "uint256"},
            {"internalType": "uint256", "name": "stakeAmount",     "type": "uint256"},
            {"internalType": "bool",    "name": "isCompleted",     "type": "bool"},
            {"internalType": "string",  "name": "mergedAdapterCID","type": "string"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


def _get_contract():
    w3 = Web3(Web3.HTTPProvider(_rpc_url))
    if not w3.is_connected():
        raise ConnectionError(f"Cannot connect to RPC: {_rpc_url}")
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(_contract_address),
        abi=CONTRACT_ABI,
    )
    return w3, contract


def complete_federated_job_on_chain(job_id: int, merged_adapter_cid: str) -> str:
    """
    Calls completeFederatedJob(jobId, mergedAdapterCID) as the owner wallet.
    Returns the transaction hash as a hex string.
    """
    w3, contract = _get_contract()

    account       = w3.eth.account.from_key(_private_key)
    nonce         = w3.eth.get_transaction_count(account.address, "latest")
    gas_price     = w3.eth.gas_price

    tx = contract.functions.completeFederatedJob(job_id, merged_adapter_cid).build_transaction({
        "from":     account.address,
        "nonce":    nonce,
        "gasPrice": gas_price,
    })

    # Let web3 estimate gas
    tx["gas"] = w3.eth.estimate_gas(tx)

    signed   = w3.eth.account.sign_transaction(tx, _private_key)
    tx_hash  = w3.eth.send_raw_transaction(signed.raw_transaction)
    receipt  = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)

    if receipt.status != 1:
        raise RuntimeError(f"completeFederatedJob tx failed. Hash: {tx_hash.hex()}")

    print(f"[chain] completeFederatedJob confirmed. Tx: {tx_hash.hex()}")
    return tx_hash.hex()