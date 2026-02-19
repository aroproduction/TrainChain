import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Download,
  Loader,
  Folder,
  Database,
  BrainCircuit,
  Briefcase,
  CheckCircle,
  Clock,
  Search,
  FileDown,
  AlertTriangle,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react"
import axios from "axios"
import { createJob as createJobOnChain } from "../../../utils/contract"
import { useToast } from "../../context/ToastContext"
import LoadingModal from "../../components/LoadingModal"

export default function MyJobsTab() {
  const [requests, setRequests] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [retryModal, setRetryModal] = useState({ open: false, job: null })
  const [actionLoading, setActionLoading] = useState(null)
  const [downloadingDataset, setDownloadingDataset] = useState(null)
  const [downloadingModel, setDownloadingModel] = useState(null)
  const toast = useToast();

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/jobs/my-requests?requesterAddress=${localStorage.getItem("userAddress")}`
        )
        const fetchedData = Array.isArray(response.data) ? response.data : []
        setRequests(fetchedData)
      } catch (err) {
        console.error("Error fetching requests:", err)
        setRequests([])
      }
      setIsLoading(false)
    }
    fetchRequests()
  }, [])

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    unconfirmed: "bg-red-100 text-red-800",
    inProgress: "bg-blue-100 text-blue-800",
    in_progress: "bg-blue-100 text-blue-800",
    contributor_unconfirmed: "bg-orange-100 text-orange-800",
    completed: "bg-green-100 text-green-800",
    Failed: "bg-red-100 text-red-800",
  }

  const jobTypeIcons = {
    training: <BrainCircuit size={22} className="text-purple-600" />,
    data_processing: <Database size={22} className="text-blue-600" />,
    default: <Folder size={22} className="text-gray-600" />,
  }

  const downloadDataset = async (jobId) => {
    setDownloadingDataset(jobId);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/get-dataset/${jobId}`,
        { responseType: "blob", headers: { Accept: "application/zip" } }
      )
      const blob = new Blob([response.data], { type: "application/zip" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `dataset_${jobId}.zip`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading dataset:", error)
      toast.error("Failed to download dataset")
    } finally {
      setDownloadingDataset(null);
    }
  }

  const downloadModel = async (jobId) => {
    setDownloadingModel(jobId);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/get-model/${jobId}`,
        { responseType: "blob", headers: { Accept: "application/zip" } }
      )
      const blob = new Blob([response.data], { type: "application/zip" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Trained_Model_${jobId}.zip`
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading model:", error)
      toast.error("Failed to download model")
    } finally {
      setDownloadingModel(null);
    }
  }

  const handleRetryPayment = async (jobId) => {
    setActionLoading(jobId)
    try {
      // Fetch retry info from backend
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/retry-info/${jobId}`
      )
      const info = res.data

      // Call blockchain createJob
      const tx = await createJobOnChain(
        info.id,
        info.folder_name || `dataset_${info.id}`,
        info.folder_cid,
        info.metadata_cid,
        info.job_type || "image_classification",
        info.model || "yolo v11",
        info.reward.toString()
      )

      if (tx) {
        // Confirm in backend (unconfirmed → pending)
        await axios.post(
          `${import.meta.env.VITE_API_URL}/jobs/confirm/${jobId}`
        )
        toast.success("Payment successful! Job is now listed.")
        // Refresh the list
        setRequests((prev) =>
          prev.map((r) => (r.id === jobId ? { ...r, status: "pending" } : r))
        )
      }
    } catch (error) {
      console.error("Error retrying payment:", error)
      toast.error("Payment failed. You can try again later.")
    } finally {
      setActionLoading(null)
      setRetryModal({ open: false, job: null })
    }
  }

  const handleDeleteUnconfirmed = async (jobId) => {
    setActionLoading(jobId)
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/jobs/delete/${jobId}`
      )
      toast.success("Job deleted successfully.")
      setRequests((prev) => prev.filter((r) => r.id !== jobId))
    } catch (error) {
      console.error("Error deleting job:", error)
      toast.error("Failed to delete job.")
    } finally {
      setActionLoading(null)
      setRetryModal({ open: false, job: null })
    }
  }

  const completedCount = requests.filter((r) => r.status === "completed").length
  const inProgressCount = requests.filter(
    (r) =>
      r.status === "pending" ||
      r.status === "inProgress" ||
      r.status === "in_progress" ||
      r.status === "contributor_unconfirmed"
  ).length;
  const unconfirmedJobs = requests.filter((r) => r.status === "unconfirmed");

  const filtered = requests.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      String(r.id).includes(q) ||
      (r.job_type || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q) ||
      (r.requester_address || "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl mb-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
        >
          My Training Jobs
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-sm md:text-base text-gray-500 text-center max-w-2xl mx-auto"
        >
          Track, manage, and download results from all your training requests in one place.
        </motion.p>
      </motion.div>

      {/* Stats row */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Briefcase size={22} className="text-indigo-600" />
            </div>
            <span className="text-gray-500">Total Jobs</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{requests.length}</p>
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
          <p className="text-4xl font-bold text-gray-900">{completedCount}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Clock size={22} className="text-amber-600" />
            </div>
            <span className="text-gray-500">In Progress</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">{inProgressCount}</p>
        </motion.div>
      </div>

      {/* Unconfirmed Jobs Section */}
      {unconfirmedJobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-6xl mb-8"
        >
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800">
                Action Required: Unpaid Jobs
              </h3>
            </div>
            <div className="space-y-4">
              {unconfirmedJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-4 rounded-lg flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      Job #{job.id}
                    </p>
                    <p className="text-sm text-gray-500">
                      Reward: {job.reward} POL
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRetryPayment(job.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    >
                      <RefreshCw size={14} />
                      Pay
                    </button>
                    <button
                      onClick={() => handleDeleteUnconfirmed(job.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Search bar */}
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
        className="w-full max-w-6xl"
      >
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-gray-500">Loading your jobs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200 shadow-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Briefcase size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? "No matching jobs" : "No jobs yet"}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search query to find what you're looking for."
                : "Create your first training request to get started. Your jobs will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/60 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === request.id ? null : request.id)
                  }
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                        {jobTypeIcons[request.job_type] || jobTypeIcons.default}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-800 text-base">
                            Request #{request.id}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusStyles[request.status] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(request.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {request.job_type && (
                            <span className="ml-3 text-gray-300">
                              {request.job_type
                                .split("_")
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedId === request.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={20} className="text-gray-400" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === request.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-100"
                    >
                      <div className="p-5 bg-gray-50/50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Requester Address</p>
                            <p className="text-gray-800 font-mono text-sm truncate bg-white px-3 py-2 rounded-lg">
                              {request.requester_address}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Folder CID</p>
                            <p className="text-gray-800 font-mono text-sm truncate bg-white px-3 py-2 rounded-lg">
                              {request.folder_cid}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Metadata CID</p>
                            <p className="text-gray-800 font-mono text-sm truncate bg-white px-3 py-2 rounded-lg">
                              {request.metadata_cid}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Last Updated</p>
                            <p className="text-gray-800 text-sm bg-white px-3 py-2 rounded-lg">
                              {new Date(request.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                          {request.status === "unconfirmed" ? (
                            <>
                              <button
                                onClick={() => setRetryModal({ open: true, job: request })}
                                className="flex items-center px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-medium shadow-sm"
                              >
                                <RefreshCw size={16} className="mr-2" />
                                Retry Payment
                              </button>
                              <button
                                onClick={() => setRetryModal({ open: true, job: request })}
                                className="flex items-center px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all text-sm font-medium shadow-sm"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete Job
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => downloadDataset(request.id)}
                                disabled={downloadingDataset === request.id}
                                className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {downloadingDataset === request.id ? (
                                  <>
                                    <Loader size={16} className="mr-2 text-blue-500 animate-spin" />
                                    <span className="text-gray-700">Downloading...</span>
                                  </>
                                ) : (
                                  <>
                                    <Download size={16} className="mr-2 text-gray-500" />
                                    <span className="text-gray-700">Download Dataset</span>
                                  </>
                                )}
                              </button>

                              {request.status === "completed" ? (
                                <button
                                  onClick={() => downloadModel(request.id)}
                                  disabled={downloadingModel === request.id}
                                  className="flex items-center px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {downloadingModel === request.id ? (
                                    <>
                                      <Loader size={16} className="mr-2 animate-spin" />
                                      Downloading...
                                    </>
                                  ) : (
                                    <>
                                      <FileDown size={16} className="mr-2" />
                                      Download Trained Model
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm">
                                  <Loader size={16} className="mr-2 animate-spin" />
                                  Model Not Ready
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Retry / Delete Modal */}
      <AnimatePresence>
        {retryModal.open && retryModal.job && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setRetryModal({ open: false, job: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Unconfirmed Job #{retryModal.job.id}
                  </h3>
                </div>
                <button
                  onClick={() => setRetryModal({ open: false, job: null })}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                This job was uploaded but the blockchain payment was not completed.
                You can retry the payment to list it, or delete it entirely.
              </p>

              <div className="space-y-3">
                <button
                  disabled={actionLoading === retryModal.job.id}
                  onClick={() => handleRetryPayment(retryModal.job.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === retryModal.job.id ? (
                    <Loader size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Retry Payment
                </button>

                <button
                  disabled={actionLoading === retryModal.job.id}
                  onClick={() => handleDeleteUnconfirmed(retryModal.job.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={16} />
                  Delete Job
                </button>

                <button
                  onClick={() => setRetryModal({ open: false, job: null })}
                  className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 transition text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Modal for Dataset Download */}
      <LoadingModal
        isOpen={downloadingDataset !== null}
        message="Downloading Dataset"
        subMessage="Please wait while we prepare your dataset file..."
      />

      {/* Loading Modal for Model Download */}
      <LoadingModal
        isOpen={downloadingModel !== null}
        message="Downloading Trained Model"
        subMessage="Please wait while we prepare your trained model file..."
      />
    </div>
  )
}
