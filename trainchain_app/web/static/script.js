async function connectMetaMask() {
    if (window.ethereum) {
        try {
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            const walletAddress = accounts[0];
            
            // Send wallet address to Flask backend
            fetch("/authenticate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: walletAddress })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    document.getElementById("status").innerText = "Authenticated successfully!";
                    setTimeout(() => window.close(), 2000);
                }
            });

        } catch (error) {
            document.getElementById("status").innerText = "User denied access!";
        }
    } else {
        document.getElementById("status").innerText = "MetaMask not installed!";
    }
}

document.getElementById("connectBtn").addEventListener("click", connectMetaMask);
