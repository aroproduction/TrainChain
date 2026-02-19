import { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  Search,
  Receipt,
  TrendingUp,
  Coins,
  ExternalLink,
  Loader,
} from "lucide-react"
import axios from "axios"
import { UserContext } from "../../context/UserContext"

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const POLYGONSCAN_URL = "https://amoy.polygonscan.com"

const statusConfig = {
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Completed" },
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100", label: "Pending" },
  in_progress: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100", label: "In Progress" },
  failed: { icon: XCircle, color: "text-red-600", bg: "bg-red-100", label: "Failed" },
}

function formatJobType(type) {
  if (!type) return "Unknown"
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function PaymentsPage() {
  const { userAddress } = useContext(UserContext)
  const [transactions, setTransactions] = useState([])
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true)
      try {
        const address = userAddress || localStorage.getItem("userAddress")
        if (!address) {
          setTransactions([])
          setIsLoading(false)
          return
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/jobs/my-requests?requesterAddress=${address}`
        )
        const jobs = Array.isArray(response.data) ? response.data : []

        const txns = jobs.map((job) => {
          const isCompleted = job.status === "completed"
          const isFailed = job.status === "failed"
          const isPending = job.status === "pending"
          return {
            id: `job_${job.id}`,
            jobId: job.id,
            type: "stake",
            direction: "out",
            description: `Training Job #${job.id} — ${formatJobType(job.job_type)}`,
            amount: job.reward ? String(job.reward) : "0",
            token: "POL",
            status: isCompleted ? "completed" : isFailed ? "failed" : isPending ? "pending" : "in_progress",
            date: job.created_at,
            requesterAddress: job.requester_address,
            contributorAddress: job.contributor_address,
          }
        })

        setTransactions(txns)
      } catch (err) {
        console.error("Error fetching payments:", err)
        setTransactions([])
      }
      setIsLoading(false)
    }
    fetchPayments()
  }, [userAddress])

  const filtered = transactions.filter((tx) => {
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(tx.jobId).includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  const totalStaked = transactions
    .filter((tx) => tx.status === "completed" || tx.status === "in_progress")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)

  const totalPending = transactions
    .filter((tx) => tx.status === "pending" || tx.status === "in_progress")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
      >
        Payment History
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        Track all your staked tokens, completed payments, and transaction history on-chain.
      </motion.p>

      {/* Summary Cards */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
              <ArrowUpRight size={22} className="text-red-600" />
            </div>
            <span className="text-gray-500">Total Staked</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "—" : totalStaked.toFixed(4)}{" "}
            <span className="text-base font-normal text-gray-400">POL</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock size={22} className="text-amber-600" />
            </div>
            <span className="text-gray-500">Pending / In Progress</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "—" : totalPending.toFixed(4)}{" "}
            <span className="text-base font-normal text-gray-400">POL</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Receipt size={22} className="text-indigo-600" />
            </div>
            <span className="text-gray-500">Transactions</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : transactions.length}
          </p>
        </motion.div>
      </div>

      {/* Blockchain explorer */}
      {CONTRACT_ADDRESS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="w-full max-w-6xl mb-8"
        >
          <a
            href={`${POLYGONSCAN_URL}/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-200 rounded-xl hover:from-purple-100 hover:to-indigo-100 transition-colors text-sm font-medium text-indigo-700"
          >
            <ExternalLink size={16} />
            View Smart Contract on PolygonScan
          </a>
        </motion.div>
      )}

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transactions by job ID or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/90 backdrop-blur-sm text-base"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Filter size={18} className="text-gray-500" />
              <span className="text-gray-600">Filter</span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl z-20 p-2 border border-gray-100"
                >
                  {["all", "completed", "pending", "in_progress", "failed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setFilterStatus(s); setShowFilters(false) }}
                      className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                        filterStatus === s
                          ? "bg-indigo-50 text-indigo-700 font-medium"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Transaction list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-6xl space-y-4"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-gray-500">Loading transactions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200 shadow-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Receipt size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No transactions found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Your payment history will appear here as you create training jobs.
            </p>
          </div>
        ) : (
          filtered.map((tx, index) => {
            const statusCfg = statusConfig[tx.status] || statusConfig.pending
            const StatusIcon = statusCfg.icon
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight size={20} className="text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base truncate">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">
                        {new Date(tx.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {tx.contributorAddress && (
                        <>
                          <span className="text-sm text-gray-300">•</span>
                          <span className="text-sm text-gray-400 font-mono truncate max-w-[160px]">
                            To: {tx.contributorAddress}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-base text-red-600">
                      -{tx.amount} {tx.token}
                    </p>
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs mt-1 font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </div>
                  </div>
                </div>

                {CONTRACT_ADDRESS && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-3">
                    <a
                      href={`${POLYGONSCAN_URL}/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <ExternalLink size={14} />
                      View on PolygonScan
                    </a>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Info note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-400 mt-10"
      >
        Transaction data is derived from your training jobs on the Polygon Amoy network.
        Click "View on PolygonScan" to verify transactions on the blockchain.
      </motion.p>
    </div>
  )
}
