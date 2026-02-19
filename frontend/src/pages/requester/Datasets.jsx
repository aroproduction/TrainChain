import { useState, useEffect, useContext } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Database,
  Download,
  Lock,
  Shield,
  Search,
  FileArchive,
  HardDrive,
  ChevronDown,
  Info,
  ExternalLink,
  Loader,
} from "lucide-react"
import axios from "axios"
import { UserContext } from "../../context/UserContext"

const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs"

export default function DatasetsPage() {
  const { userAddress } = useContext(UserContext)
  const [datasets, setDatasets] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [metadataMap, setMetadataMap] = useState({})
  const [downloadingId, setDownloadingId] = useState(null)

  useEffect(() => {
    const fetchDatasets = async () => {
      setIsLoading(true)
      try {
        const address = userAddress || localStorage.getItem("userAddress")
        if (!address) {
          setDatasets([])
          setIsLoading(false)
          return
        }
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/jobs/my-requests?requesterAddress=${address}`
        )
        const jobs = Array.isArray(response.data) ? response.data : []
        setDatasets(jobs)

        const metaPromises = jobs.map(async (job) => {
          if (job.metadata_cid) {
            try {
              const metaRes = await axios.get(`${IPFS_GATEWAY}/${job.metadata_cid}`, { timeout: 8000 })
              return { jobId: job.id, metadata: metaRes.data }
            } catch {
              return { jobId: job.id, metadata: null }
            }
          }
          return { jobId: job.id, metadata: null }
        })

        const metaResults = await Promise.allSettled(metaPromises)
        const metaMap = {}
        metaResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            metaMap[result.value.jobId] = result.value.metadata
          }
        })
        setMetadataMap(metaMap)
      } catch (err) {
        console.error("Error fetching datasets:", err)
        setDatasets([])
      }
      setIsLoading(false)
    }
    fetchDatasets()
  }, [userAddress])

  const filtered = datasets.filter((ds) => {
    const meta = metadataMap[ds.id]
    const folderName = meta?.folderName || ""
    return (
      (ds.job_type || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(ds.id).includes(searchQuery) ||
      folderName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const downloadDataset = async (jobId) => {
    setDownloadingId(jobId)
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
      alert("Failed to download dataset")
    }
    setDownloadingId(null)
  }

  const formatJobType = (type) => {
    if (!type) return "Unknown"
    return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
      >
        My Datasets
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        View, manage and download all your uploaded training datasets stored on IPFS.
      </motion.p>

      {/* IPFS Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">IPFS Decentralized Storage</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                Your datasets are stored on IPFS via Pinata. Each dataset has a unique CID
                (Content Identifier) that you can verify independently. Encryption will be
                added in a future update for end-to-end security.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Database size={22} className="text-blue-600" />
            </div>
            <span className="text-gray-500">Total Datasets</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {isLoading ? "—" : datasets.length}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <HardDrive size={22} className="text-purple-600" />
            </div>
            <span className="text-gray-500">Storage</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">IPFS</p>
          <p className="text-sm text-gray-400 mt-1">Pinata Gateway</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <Lock size={22} className="text-green-600" />
            </div>
            <span className="text-gray-500">Encryption</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">Planned</p>
          <p className="text-sm text-gray-400 mt-1">Coming soon</p>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search datasets by name, type, or job ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 pl-12 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white/90 backdrop-blur-sm text-base"
          />
        </div>
      </motion.div>

      {/* Dataset list */}
      <div className="w-full max-w-6xl space-y-4">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="mt-4 text-gray-500">Loading datasets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200 shadow-md text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Database size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No datasets found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Upload a dataset by creating a training job to get started.
            </p>
          </motion.div>
        ) : (
          filtered.map((ds, index) => {
            const meta = metadataMap[ds.id]
            const folderName = meta?.folderName || `Dataset #${ds.id}`
            const fileCount = meta?.fileNames?.length || null

            return (
              <motion.div
                key={ds.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-white/60 transition-colors"
                  onClick={() => setExpandedId(expandedId === ds.id ? null : ds.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileArchive size={22} className="text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-base truncate">
                        {folderName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400">Job #{ds.id}</span>
                        <span className="text-sm text-gray-300">•</span>
                        <span className="text-sm text-gray-400">{formatJobType(ds.job_type)}</span>
                        {fileCount && (
                          <>
                            <span className="text-sm text-gray-300">•</span>
                            <span className="text-sm text-gray-400">
                              {fileCount} file{fileCount !== 1 ? "s" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          ds.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : ds.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {ds.status}
                      </span>
                      <span className="text-sm text-gray-400 hidden sm:block">
                        {new Date(ds.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <motion.div
                        animate={{ rotate: expandedId === ds.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={20} className="text-gray-400" />
                      </motion.div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === ds.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Files</p>
                            <p className="text-base font-semibold text-gray-800">
                              {fileCount ? fileCount.toLocaleString() : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Reward</p>
                            <p className="text-base font-semibold text-gray-800">{ds.reward} POL</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Uploaded</p>
                            <p className="text-base font-semibold text-gray-800">
                              {new Date(ds.created_at).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Status</p>
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                                ds.status === "completed"
                                  ? "text-green-700 bg-green-100"
                                  : ds.status === "pending"
                                  ? "text-yellow-700 bg-yellow-100"
                                  : "text-blue-700 bg-blue-100"
                              }`}
                            >
                              {ds.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                              Folder CID
                            </p>
                            <p className="text-sm font-mono text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg">
                              {ds.folder_cid}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                              Metadata CID
                            </p>
                            <p className="text-sm font-mono text-gray-600 truncate bg-gray-50 px-3 py-2 rounded-lg">
                              {ds.metadata_cid}
                            </p>
                          </div>
                        </div>

                        {meta?.fileNames && meta.fileNames.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                              Files in Dataset
                            </p>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 max-h-36 overflow-y-auto">
                              {meta.fileNames.map((fname, i) => (
                                <p key={i} className="text-sm text-gray-600 font-mono py-0.5 truncate">
                                  {fname}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => downloadDataset(ds.id)}
                            disabled={downloadingId === ds.id}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all text-sm font-medium text-gray-700 disabled:opacity-50"
                          >
                            {downloadingId === ds.id ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            {downloadingId === ds.id ? "Downloading..." : "Download"}
                          </button>
                          <a
                            href={`${IPFS_GATEWAY}/${ds.folder_cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all text-sm font-medium text-indigo-700"
                          >
                            <ExternalLink size={16} />
                            View on IPFS
                          </a>
                          {ds.metadata_cid && (
                            <a
                              href={`${IPFS_GATEWAY}/${ds.metadata_cid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-all text-sm font-medium text-purple-700"
                            >
                              <ExternalLink size={16} />
                              View Metadata
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Info note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-6xl flex items-start gap-2 mt-8 sm:mt-12 lg:mt-16 text-sm text-gray-400"
      >
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <p>
          Datasets are stored on IPFS and can be independently verified using the CID links above.
          Encryption will be enabled in a future update to provide end-to-end data security.
        </p>
      </motion.div>
    </div>
  )
}
