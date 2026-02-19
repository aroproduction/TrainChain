import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Shield,
} from "lucide-react"
import { ethers } from "ethers"
import { UserContext } from "../../context/UserContext"

export default function WalletPage() {
  const { userAddress } = useContext(UserContext)
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchBalance = async () => {
    if (!window.ethereum || !userAddress) {
      setBalance("0.00")
      setIsLoading(false)
      return
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balanceWei = await provider.getBalance(userAddress)
      const balanceInPOL = parseFloat(ethers.formatEther(balanceWei)).toFixed(4)
      setBalance(balanceInPOL)
    } catch (err) {
      console.error("Error fetching balance:", err)
      setBalance("0.00")
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchBalance()
  }, [userAddress])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchBalance()
    setTimeout(() => setRefreshing(false), 600)
  }

  const handleCopy = () => {
    if (userAddress) {
      navigator.clipboard.writeText(userAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortenedAddress = userAddress
    ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`
    : "Not connected"

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
      >
        Wallet
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        Manage your funds, check your balance and interact with the Polygon network.
      </motion.p>

      {/* Main balance card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-6xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-8 md:p-10 text-white mb-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <WalletIcon size={24} />
              </div>
              <span className="text-lg font-medium text-gray-300">POL Balance</span>
            </div>
            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <RefreshCw
                size={18}
                className={`text-gray-300 ${refreshing ? "animate-spin" : ""}`}
              />
            </motion.button>
          </div>

          <div className="mb-8">
            {isLoading ? (
              <div className="h-16 w-56 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              <motion.h2
                key={balance}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-5xl md:text-6xl font-bold tracking-tight"
              >
                {balance} <span className="text-2xl font-normal text-gray-400">POL</span>
              </motion.h2>
            )}
          </div>

          {/* Wallet address */}
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-5 py-4 border border-white/10">
            <span className="text-base text-gray-400 font-mono flex-1 truncate">
              {userAddress || "Not connected"}
            </span>
            <motion.button
              onClick={handleCopy}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {copied ? (
                <CheckCircle size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-gray-400" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Info cards */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <TrendingUp size={22} className="text-green-600" />
            </div>
            <span className="text-gray-500">Network</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">Polygon Amoy</p>
          <p className="text-sm text-gray-400 mt-1">Testnet</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Shield size={22} className="text-blue-600" />
            </div>
            <span className="text-gray-500">Status</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {userAddress ? "Connected" : "Disconnected"}
          </p>
          <p className="text-sm text-gray-400 mt-1">MetaMask</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <WalletIcon size={22} className="text-purple-600" />
            </div>
            <span className="text-gray-500">Address</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 font-mono">{shortenedAddress}</p>
          <p className="text-sm text-gray-400 mt-1">Your wallet</p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-6xl"
      >
        <div className="w-full max-w-6xl pt-8 border-t border-gray-200/60">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.a
              href={
                userAddress
                  ? `https://amoy.polygonscan.com/address/${userAddress}`
                  : "#"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all group"
              whileHover={{ y: -3 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <ExternalLink size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">View on Explorer</p>
                  <p className="text-sm text-gray-400">Polygon Amoy Scan</p>
                </div>
              </div>
            </motion.a>

            <motion.a
              href="https://faucet.polygon.technology/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-all group"
              whileHover={{ y: -3 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <ArrowDownLeft size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">Get Test POL</p>
                  <p className="text-sm text-gray-400">Polygon Faucet</p>
                </div>
              </div>
            </motion.a>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
