import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  Clock,
  XCircle,
  Tag,
  Search,
  Download,
  Cpu,
  Zap,
  Award,
  Filter,
  ChevronDown,
  ArrowLeft,
} from "lucide-react"
import { useSearchParams } from "react-router-dom"
import axios from "axios"
import JobDetails from "../../components/JobDetails"

// Other tab pages
import MyContributionsTab from "./MyContributions"
import EarningsTab from "./Earnings"
import DownloadAppTab from "./DownloadApp"
import WalletPage from "../shared/Wallet"

const statusColors = {
  pending: "bg-emerald-500",
  in_progress: "bg-amber-500",
  completed: "bg-blue-600",
}

const statusIcons = {
  pending: <Clock className="text-white" size={16} />,
  in_progress: <Zap className="text-white" size={16} />,
  completed: <CheckCircle className="text-white" size={16} />,
}

const jobTypeIcons = {
  image_processing: "🖼️",
  "text-classification": "📝",
  "object-detection": "🔍",
  "sentiment-analysis": "😊",
  "language-model": "💬",
  "reinforcement-learning": "🎮",
  llm_finetune: "🧠",
  default: "🤖",
}

/* ════════════════
   Job Card
   ════════════════ */
function JobCard({ job, onClick }) {
  const getJobTypeIcon = (type) => {
    if (!type) return jobTypeIcons.default
    const normalizedType = type.toLowerCase()
    for (const [key, value] of Object.entries(jobTypeIcons)) {
      if (normalizedType.includes(key)) return value
    }
    return jobTypeIcons.default
  }

  const [hoverPosition, setHoverPosition] = useState({ x: 50, y: 50 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setHoverPosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
    setIsHovering(true)
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "Unknown date"
    const date = new Date(timestamp)
    return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })}(UST)`
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
      }}
      whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.2 } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(circle at ${hoverPosition.x}% ${hoverPosition.y}%, rgba(59, 130, 246, 0.3), transparent 70%)`,
          boxShadow: isHovering ? "0 0 20px 5px rgba(59, 130, 246, 0.3)" : "none",
        }}
      />
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10 transition-opacity duration-300 ${
          isHovering ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-500 ${
          isHovering ? "border-blue-400/50" : ""
        }`}
        style={{ boxShadow: isHovering ? "0 0 15px rgba(59, 130, 246, 0.4)" : "none" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/50 backdrop-blur-sm border border-white/20 shadow-xl rounded-2xl transition-all duration-300 group-hover:shadow-2xl" />

      <div className="relative p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <span
            className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg ${statusColors[job.status]}`}
          >
            {statusIcons[job.status]} {job.status.replace("_", " ")}
          </span>
          <span className="text-3xl">{getJobTypeIcon(job.job_type)}</span>
        </div>
        <div className="mb-4">
          <p className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
            <Tag size={16} className="text-blue-500" /> {job.job_type || "Unknown Job Type"}
          </p>
          <p className="text-sm text-gray-500 mb-3 break-words">
            <span className="font-medium text-gray-700">Requester:</span>
            <br />
            {job.requester_address?.substring(0, 16)}...
          </p>
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between" />
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500">{formatDateTime(job.created_at)}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full font-medium w-[40%]"
          >
            <Award size={14} />
            <span>{Number(job.reward || 0).toFixed(3)} POL</span>
          </motion.div>
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        style={{ boxShadow: "0 0 10px rgba(59, 130, 246, 0.7)" }}
      />
    </motion.div>
  )
}

/* ════════════════════════════════════════════
   Available Jobs tab (original design)
   ════════════════════════════════════════════ */
function AvailableJobsTab() {
  const [, setSearchParams] = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [filter, setFilter] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/get-jobs`)
        if (response.status === 200) {
          setJobs(Array.isArray(response.data) ? response.data : [])
        } else {
          setError("Failed to fetch jobs")
          setJobs([])
        }
      } catch (error) {
        console.error("Error:", error)
        setError("Error fetching jobs")
        setJobs([])
      }
      setIsLoading(false)
    }
    fetchJobs()
  }, [])

  const filteredJobs = Array.isArray(jobs)
    ? jobs.filter((job) => {
        const matchesSearch =
          job?.requester_address?.toLowerCase().includes(search.toLowerCase()) ||
          job?.job_type?.toLowerCase().includes(search.toLowerCase())
        if (filter === "all") return matchesSearch
        return matchesSearch && job.status === filter
      })
    : []

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    if (sortBy === "oldest") return new Date(a.created_at || 0) - new Date(b.created_at || 0)
    if (sortBy === "highest-reward")
      return Number.parseFloat(b.reward || 0) - Number.parseFloat(a.reward || 0)
    if (sortBy === "lowest-reward")
      return Number.parseFloat(a.reward || 0) - Number.parseFloat(b.reward || 0)
    return 0
  })

  if (selectedJob) {
    return (
      <div className="py-8 px-4 sm:px-8 md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-6xl mx-auto"
        >
          <button
            onClick={() => setSelectedJob(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-300 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full shadow-md"
          >
            <ArrowLeft size={18} />
            <span>Back to jobs</span>
          </button>
          <JobDetails selectedJob={selectedJob} onBack={() => setSelectedJob(null)} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 overflow-hidden">
      <div className="max-w-7xl w-full py-8 mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative mb-16 bg-gradient-to-r from-green-600 to-green-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
              backdropFilter: "blur(5px)",
            }}
          />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-300 opacity-40 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-400 opacity-30 rounded-full blur-3xl" />

          <div className="relative z-10 p-10 md:p-16 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-8 md:mb-0 md:mr-8 max-w-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
                  Contribute Your{" "}
                  <span className="text-yellow-300 inline-block relative">
                    Computing Power
                    <span className="absolute bottom-1 left-0 w-full h-1 bg-yellow-400/50 rounded-full" />
                  </span>
                </h1>
                <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
                  Join our decentralized network of contributors and earn rewards by training AI models with your GPU.
                </p>
                <motion.button
                  onClick={() => setSearchParams({ tab: "download-app" })}
                  className="inline-flex items-center justify-center gap-2 bg-white text-green-700 font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={20} className="text-green-600" />
                  <span>Download Training Software</span>
                </motion.button>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="hidden md:flex justify-center items-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-700 rounded-full opacity-30 blur-xl" />
                  <motion.div
                    animate={{ rotate: 360, transition: { duration: 30, repeat: Infinity, ease: "linear" } }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at center, transparent 40%, rgba(16, 185, 129, 0.4) 70%, transparent 75%)",
                    }}
                  />
                  <Cpu size={180} className="text-white relative z-10" />
                </div>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-800/70 to-transparent" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold text-center mt-4 mb-16 text-gray-800 font-serif"
        >
          Available Jobs
        </motion.h1>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by job type, folder name, or requester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-4 pl-12 border rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg bg-white/90 backdrop-blur-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-sm py-4 px-6 rounded-xl shadow-lg text-gray-700 hover:text-blue-600 transition-colors duration-300"
              >
                <Filter size={20} />
                <span>Filters</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showFilters ? "rotate-180" : ""}`}
                />
              </motion.button>

              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-20 p-4"
                >
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                    <div className="space-y-2">
                      {["all", "pending", "in_progress", "completed"].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilter(status)}
                          className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                            filter === status ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                          }`}
                        >
                          {status === "all" ? "All Jobs" : status.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Sort By</h3>
                    <div className="space-y-2">
                      {[
                        { id: "newest", label: "Newest First" },
                        { id: "oldest", label: "Oldest First" },
                        { id: "highest-reward", label: "Highest Reward" },
                        { id: "lowest-reward", label: "Lowest Reward" },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`block w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 ${
                            sortBy === option.id ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {filter !== "all" && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                Status: {filter.replace("_", " ")}
                <button onClick={() => setFilter("all")} className="ml-1 hover:text-blue-900">×</button>
              </div>
            )}
            {search && (
              <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                Search: {search}
                <button onClick={() => setSearch("")} className="ml-1 hover:text-blue-900">×</button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96">
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full" />
              <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-6 text-gray-600 text-lg">Loading available jobs...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl text-center"
          >
            <XCircle className="mx-auto mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">Error Loading Jobs</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors duration-300"
            >
              Try Again
            </button>
          </motion.div>
        ) : sortedJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-blue-50 border border-blue-200 text-blue-700 p-8 rounded-xl text-center"
          >
            <Search className="mx-auto mb-4" size={40} />
            <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
            <p>We couldn&apos;t find any jobs matching your search criteria.</p>
            {(search || filter !== "all") && (
              <button
                onClick={() => { setSearch(""); setFilter("all") }}
                className="mt-4 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              style={{ perspective: "1000px" }}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            >
              {sortedJobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   Main Contributor page — tab router
   ══════════════════════════════════════ */
export default function ContributorPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "available-jobs"

  const renderTab = () => {
    switch (tab) {
      case "available-jobs":
        return <AvailableJobsTab />
      case "my-contributions":
        return <MyContributionsTab />
      case "earnings":
        return <EarningsTab />
      case "wallet":
        return <WalletPage />
      case "download-app":
        return <DownloadAppTab />
      default:
        return <AvailableJobsTab />
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        {renderTab()}
      </motion.div>
    </AnimatePresence>
  )
}

