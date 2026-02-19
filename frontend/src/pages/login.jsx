"use client"

import { useState, useContext } from "react"
import Web3 from "web3"
import { UserContext } from "../context/UserContext"
import { useToast } from "../context/ToastContext"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { switchToPolygonAmoy, checkNetwork } from "../../utils/contract"

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { saveAddress } = useContext(UserContext)
  const toast = useToast();
  const navigate = useNavigate();


  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true)
        
        // Check if user is on Polygon Amoy network
        const isCorrectNetwork = await checkNetwork();
        
        if (!isCorrectNetwork) {
          const confirmSwitch = window.confirm(
            "This app requires Polygon Amoy Testnet. Would you like to switch networks now?"
          );
          
          if (confirmSwitch) {
            await switchToPolygonAmoy();
          } else {
            toast.warning("Please switch to Polygon Amoy Testnet to continue");
            setLoading(false);
            return;
          }
        }
        
        const web3 = new Web3(window.ethereum)
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const accounts = await web3.eth.getAccounts()
        const userAddress = accounts[0]
        saveAddress(userAddress)
        navigate("/home")
      } catch (error) {
        console.error("Error connecting wallet:", error)
        toast.error("Failed to connect wallet. Please try again.")
      } finally {
        setLoading(false)
      }
    } else {
      toast.error("MetaMask is not installed. Please install MetaMask to continue.")
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-2xl rounded-3xl p-10 max-w-md w-full mx-4 text-center"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome to</h1>
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
          Decentralized AI
        </h2>
        <p className="text-lg text-gray-700 mb-8 leading-relaxed">
          Connect your MetaMask wallet to unlock the power of decentralized intelligence.
        </p>
        <motion.button
          onClick={connectWallet}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-bold text-lg shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Connect Wallet</span>
            </>
          )}
        </motion.button>
        <p className="text-sm text-gray-500 mt-6 italic">
          Ensure MetaMask is installed and unlocked. App requires Polygon Amoy Testnet.
        </p>
      </motion.div>
    </div>
  )
}

export default Login

