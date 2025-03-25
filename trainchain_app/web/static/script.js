async function connectMetaMask() {
    const statusEl = document.getElementById("status");
    
    if (window.ethereum) {
        statusEl.className = "";
        statusEl.innerText = "Connecting to MetaMask...";
        
        try {
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            const walletAddress = accounts[0];
            
            // Show abbreviated wallet address
            const shortenedAddress = walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
            statusEl.innerText = `Connected: ${shortenedAddress}`;
            
            // Send wallet address to Flask backend
            statusEl.innerText = "Authenticating...";
            
            fetch("/authenticate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: walletAddress })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    statusEl.className = "success";
                    statusEl.innerText = "Authentication successful! Redirecting...";
                    setTimeout(() => window.close(), 2000);
                } else {
                    statusEl.className = "error";
                    statusEl.innerText = "Authentication failed. Please try again.";
                }
            })
            .catch(error => {
                statusEl.className = "error";
                statusEl.innerText = "Server error. Please try again.";
                console.error("Authentication error:", error);
            });

        } catch (error) {
            if (error.code === 4001) {
                // User rejected request
                statusEl.className = "error";
                statusEl.innerText = "You rejected the connection request.";
            } else {
                statusEl.className = "error";
                statusEl.innerText = "Error connecting to MetaMask.";
                console.error("MetaMask error:", error);
            }
        }
    } else {
        statusEl.className = "error";
        statusEl.innerText = "MetaMask not detected! Please install MetaMask extension.";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("connectBtn").addEventListener("click", connectMetaMask);
});
