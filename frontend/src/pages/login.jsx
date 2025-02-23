"use client"

import { useState, useContext } from "react"
import Web3 from "web3"
import { UserContext } from "../context/UserContext"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

const Login = () => {
  const [loading, setLoading] = useState(false)
  const { saveAddress } = useContext(UserContext)
  const navigate = useNavigate();


  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true)
        const web3 = new Web3(window.ethereum)
        await window.ethereum.request({ method: "eth_requestAccounts" })
        const accounts = await web3.eth.getAccounts()
        const userAddress = accounts[0]
        saveAddress(userAddress)
        navigate("/home")
      } catch (error) {
        console.error("Error connecting wallet:", error)
        alert("Failed to connect wallet. Please try again.")
      } finally {
        setLoading(false)
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to continue.")
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
        <p className="text-sm text-gray-500 mt-6 italic">Ensure MetaMask is installed and unlocked to proceed.</p>
      </motion.div>
    </div>
  )
}

export default Login

