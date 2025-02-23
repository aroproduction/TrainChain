import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext.jsx";

const UserProtectWrapper = ({ children }) => {
    const { userAddress, loading, clearAddress } = useContext(UserContext);
    const navigate = useNavigate();
    const [verifying, setVerifying] = useState(true); // Track verification state

    useEffect(() => {
        const verifyWallet = async () => {
            if (loading) return; // Wait until loading is finished

            if (!userAddress) {
                navigate("/login");
                return;
            }

            if (!window.ethereum) {
                console.error("MetaMask is not installed!");
                clearAddress(); // Clear stored address since MetaMask is missing
                navigate("/login");
                return;
            }

            try {
                // Get the currently connected wallet (without prompting the user)
                const accounts = await window.ethereum.request({ method: "eth_accounts" });

                if (accounts.length === 0 || accounts[0].toLowerCase() !== userAddress.toLowerCase()) {
                    console.warn("⚠️ Wallet address mismatch or not connected!");
                    clearAddress(); // Clear invalid wallet
                    navigate("/login");
                    return;
                }

                console.log("✅ Wallet verified successfully!");
            } catch (error) {
                console.error("Error verifying wallet:", error);
                navigate("/login");
            } finally {
                setVerifying(false); // End verification process
            }
        };

        verifyWallet();
    }, [userAddress, loading, navigate, clearAddress]);

    // Show a loading indicator while verifying the wallet
    if (loading || verifying) {
        return <div>Loading...</div>; // Replace with a spinner if desired
    }

    return <>{children}</>;
};

export default UserProtectWrapper;
