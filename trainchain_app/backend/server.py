from flask import Flask, request, jsonify, render_template, send_from_directory
import os

app = Flask(__name__, 
    template_folder='../web/templates',
    static_folder='../web/static')

# Store the authenticated wallet address
authenticated_wallet = None

# Mock job database (Replace this with a real database or blockchain interaction)
JOB_DATABASE = {
    "0x123456789ABCDEF": {
        "job_id": "JOB001",
        "description": "Train a deep learning model on image data",
        "reward": "0.5 ETH"
    },
    "0x987654321FEDCBA": {
        "job_id": "JOB002",
        "description": "Fine-tune an NLP model for sentiment analysis",
        "reward": "0.8 ETH"
    }
}

@app.route('/login')
def login():
    """Serves the MetaMask login page"""
    return render_template('index.html')

@app.route('/authenticate', methods=['POST'])
def authenticate():
    """Handles MetaMask authentication"""
    global authenticated_wallet
    data = request.json
    authenticated_wallet = data.get('wallet')
    return jsonify({"status": "success"})

@app.route('/get_wallet')
def get_wallet():
    """Returns the authenticated wallet address"""
    return jsonify({"wallet": authenticated_wallet})

@app.route("/get_job_details", methods=["GET"])
def get_job_details():
    """Fetches job details for a given wallet address"""
    wallet_address = request.args.get("wallet")

    if not wallet_address:
        return jsonify({"error": "Wallet address is required"}), 400

    # Fetch job details if available
    job_data = JOB_DATABASE.get(wallet_address)

    if job_data:
        return jsonify(job_data)
    else:
        return jsonify({"message": "No jobs found for this wallet address"}), 404

# ✅ Add the missing `run_server` function
def run_server():
    """Starts the Flask server without debug mode to prevent threading issues"""
    app.run(host="127.0.0.1", port=5000, debug=False)  # ✅ Debug mode OFF in thread


if __name__ == "__main__":
    run_server()
