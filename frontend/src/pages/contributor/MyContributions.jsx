import { useState, useEffect, useContext } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle,
  Clock,
  Zap,
  Cpu,
  Layers,
  Tag,
  Award,
  Loader,
  ExternalLink,
  ChevronDown,
  Search,
} from "lucide-react"
import axios from "axios"
import { UserContext } from "../../context/UserContext"

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"

const statusConfig = {
  in_progress: { icon: Zap, color: "text-amber-600", bg: "bg-amber-100", label: "In Progress" },
  completed: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100", label: "Completed" },
  pending: { icon: Clock, color: "text-blue-600", bg: "bg-blue-100", label: "Pending" },
  failed: { icon: Clock, color: "text-red-600", bg: "bg-red-100", label: "Failed" },
}

function formatJobType(type) {
  if (!type) return "Unknown"
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function MyContributionsTab() {
  const { userAddress } = useContext(UserContext)
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchContributions = async () => {
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
        console.error("Error fetching contributions:", err)
        setJobs([])
      }
      setIsLoading(false)
    }
    fetchContributions()
  }, [userAddress])

  const completedCount = jobs.filter((j) => j.status === "completed").length
  const inProgressCount = jobs.filter((j) => j.status === "in_progress").length
  const totalEarned = jobs
    .filter((j) => j.status === "completed")
    .reduce((sum, j) => sum + parseFloat(j.reward || 0) * 0.9, 0)

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
        My Contributions
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        Track all training jobs you've worked on, view results, and monitor your progress.
      </motion.p>

      {/* Stats */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Layers size={22} className="text-indigo-600" />
            </div>
            <span className="text-gray-500">Total Jobs</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : jobs.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <CheckCircle size={22} className="text-green-600" />
            </div>
            <span className="text-gray-500">Completed</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : completedCount}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Zap size={22} className="text-amber-600" />
            </div>
            <span className="text-gray-500">In Progress</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : inProgressCount}
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by job ID, type, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/90 backdrop-blur-sm text-base"
          />
        </div>
      </motion.div>

      {/* Job list */}
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
            <p className="mt-4 text-gray-500">Loading contributions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200 shadow-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Cpu size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? "No matching contributions" : "No contributions yet"}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? "Try a different search to find your contributions."
                : "Accept a training job and start contributing your GPU power to see your work here."}
            </p>
          </div>
        ) : (
          filtered.map((job, index) => {
            const cfg = statusConfig[job.status] || statusConfig.pending
            const StatusIcon = cfg.icon
            const earning = parseFloat(job.reward || 0) * 0.9
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/60 transition-colors"
                  onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Tag size={20} className="text-indigo-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900 text-base">
                          Job #{job.id}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}
                        >
                          <StatusIcon size={12} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400">
                          {formatJobType(job.job_type)}
                        </span>
                        <span className="text-sm text-gray-300">•</span>
                        <span className="text-sm text-gray-400">
                          {new Date(job.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-base font-bold text-green-600">
                        {earning.toFixed(2)} POL
                      </span>
                      <motion.div
                        animate={{ rotate: expandedId === job.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} className="text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {expandedId === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Requester</p>
                          <p className="text-sm font-mono text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg">
                            {job.requester_address}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Reward</p>
                          <p className="text-base font-semibold text-gray-800">
                            {job.reward} POL
                            <span className="text-sm text-gray-400 font-normal ml-1">(90% = {earning.toFixed(4)})</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Folder CID</p>
                          <p className="text-sm font-mono text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg">
                            {job.folder_cid}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Trained Model</p>
                          <p className="text-sm font-mono text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg">
                            {job.trained_model_cid || "Not yet submitted"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {job.folder_cid && (
                          <a
                            href={`${IPFS_GATEWAY}/${job.folder_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all"
                          >
                            <ExternalLink size={16} />
                            View Dataset on IPFS
                          </a>
                        )}
                        {job.trained_model_cid && (
                          <a
                            href={`${IPFS_GATEWAY}/${job.trained_model_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-all"
                          >
                            <ExternalLink size={16} />
                            View Model on IPFS
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
