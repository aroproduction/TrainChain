import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import {
  Award,
  CheckCircle,
  Clock,
  Loader,
  ExternalLink,
  ArrowDownLeft,
  Receipt,
  TrendingUp,
  Search,
} from "lucide-react"
import axios from "axios"
import { UserContext } from "../../context/UserContext"

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS
const POLYGONSCAN_URL = "https://amoy.polygonscan.com"

function formatJobType(type) {
  if (!type) return "Unknown"
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function EarningsTab() {
  const { userAddress } = useContext(UserContext)
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchEarnings = async () => {
      setIsLoading(true)
      try {
        const address = userAddress || localStorage.getItem("userAddress")
        if (!address) {
          setJobs([])
          setIsLoading(false)
          return
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/jobs/contributor/all-jobs?contributorAddress=${address}`
        )
        const data = Array.isArray(response.data) ? response.data : []
        setJobs(data)
      } catch (err) {
        console.error("Error fetching earnings:", err)
        setJobs([])
      }
      setIsLoading(false)
    }
    fetchEarnings()
  }, [userAddress])

  const completedJobs = jobs.filter((j) => j.status === "completed")
  const pendingJobs = jobs.filter((j) => j.status === "in_progress")

  const totalEarned = completedJobs.reduce(
    (sum, j) => sum + parseFloat(j.reward || 0) * 0.9, 0
  )
  const totalPending = pendingJobs.reduce(
    (sum, j) => sum + parseFloat(j.reward || 0) * 0.9, 0
  )

  const filtered = jobs.filter((j) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      String(j.id).includes(q) ||
      (j.job_type || "").toLowerCase().includes(q) ||
      (j.status || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
      >
        Earnings
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        View your rewards from completed training jobs on the Polygon Amoy network.
      </motion.p>

      {/* Summary cards */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Award size={22} className="text-green-600" />
            </div>
            <span className="text-gray-500">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {isLoading ? "—" : totalEarned.toFixed(4)}{" "}
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
            <span className="text-gray-500">Pending</span>
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
              <CheckCircle size={22} className="text-indigo-600" />
            </div>
            <span className="text-gray-500">Jobs Completed</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : completedJobs.length}
          </p>
        </motion.div>
      </div>

      {/* How earnings work banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">How Earnings Work</h3>
              <p className="text-green-100 text-sm leading-relaxed">
                When a job is completed, 90% of the staked reward goes to you as the contributor.
                A 10% platform fee is deducted and sent to the platform wallet. Payments are
                settled on-chain via the Polygon Amoy network.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Blockchain explorer */}
      {CONTRACT_ADDRESS && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
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

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.37 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by job ID, type, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white/90 backdrop-blur-sm text-base"
          />
        </div>
      </motion.div>

      {/* Earnings list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-6xl space-y-4"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-green-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-green-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-gray-500">Loading earnings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-16 border border-gray-200 shadow-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Award size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No earnings yet</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Complete training jobs to start earning POL tokens. Your earnings will appear here.
            </p>
          </div>
        ) : (
          filtered.map((job, index) => {
            const isCompleted = job.status === "completed"
            const earning = parseFloat(job.reward || 0) * 0.9
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200 shadow-md hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? "bg-green-100" : "bg-amber-100"
                  }`}>
                    {isCompleted ? (
                      <ArrowDownLeft size={20} className="text-green-600" />
                    ) : (
                      <Clock size={20} className="text-amber-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base truncate">
                      Job #{job.id} — {formatJobType(job.job_type)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-400">
                        {new Date(job.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-sm text-gray-300">•</span>
                      <span className="text-sm text-gray-400 font-mono truncate max-w-[160px]">
                        From: {job.requester_address}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${isCompleted ? "text-green-600" : "text-amber-600"}`}>
                      {isCompleted ? "+" : "~"}{earning.toFixed(4)} POL
                    </p>
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs mt-1 font-medium ${
                        isCompleted ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {isCompleted ? "Earned" : "Pending"}
                    </div>
                  </div>
                </div>

                {CONTRACT_ADDRESS && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
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
        Earnings are settled on-chain via the Polygon Amoy network. Click "View on PolygonScan" to verify.
      </motion.p>
    </div>
  )
}
