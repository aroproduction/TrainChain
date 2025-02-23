import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { ChevronDown, Download, Loader, Folder, Database, BrainCircuit } from "lucide-react"
import axios from "axios"

export default function MyRequests() {
  const [requests, setRequests] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/my-requests?requesterAddress=${localStorage.getItem("userAddress")}`,
      )
      const fetchedData = Array.isArray(response.data) ? response.data : []
      setRequests(fetchedData)
      setIsLoading(false)
    }

    fetchRequests()
  }, [])

  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    inProgress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    Failed: "bg-red-100 text-red-800"
  }

  const jobTypeIcons = {
    training: <BrainCircuit size={20} className="text-purple-600" />,
    data_processing: <Database size={20} className="text-blue-600" />,
    default: <Folder size={20} className="text-gray-600" />
  }

  const downloadDataset = async (jobId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/get-dataset/${jobId}`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/zip'
          }
        }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dataset_${jobId}.zip`;

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading dataset:", error);
      alert("Failed to download dataset");
    }
  };

  const downloadModel = async (jobId) => {

    console.log("Downloading model for job ID:", jobId);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/jobs/get-model/${jobId}`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/zip'
          }
        }
      );
      
      console.log(response);
      

      const blob = new Blob([response.data], { type: 'application/zip' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Trained_Model_${jobId}.zip`;

      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading model:", error);
      alert("Failed to download model");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navbar />
      <main className="flex-grow flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full space-y-8 pt-20"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-800 font-serif mb-8">My Requests</h1>

          <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 sm:p-8">
              { isLoading && <Loader size={32} className="animate-spin mx-auto" /> }
              {!isLoading && requests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">You have not made any requests yet.</p>
              ) : (
                <ul className="space-y-4">
                  {requests.map((request) => (
                    <motion.li
                      key={request.id}
                      layout
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {jobTypeIcons[request.job_type] || jobTypeIcons.default}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-800">Request #{request.id}</span>
                                <span className={`px-2 py-1 rounded-full text-sm ${statusStyles[request.status]}`}>
                                  {request.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">
                                Created: {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ rotate: expandedId === request.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={20} className="text-gray-600" />
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
                            <div className="p-4 bg-gray-50 space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                  <p className="text-gray-500">Requester Address</p>
                                  <p className="text-gray-800 font-mono truncate">{request.requester_address}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500">Folder CID</p>
                                  <p className="text-gray-800 font-mono truncate">{request.folder_cid}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500">Metadata CID</p>
                                  <p className="text-gray-800 font-mono truncate">{request.metadata_cid}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-gray-500">Last Updated</p>
                                  <p className="text-gray-800">
                                    {new Date(request.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={() => downloadDataset(request.id)}
                                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                  download
                                >
                                  <Download size={16} className="mr-2 text-gray-700" />
                                  <span className="text-gray-700 text-sm">Download Dataset</span>
                                </button>

                                {request.status === "completed" ? (
                                  <button
                                    onClick={() => downloadModel(request.id)}
                                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
                                    download
                                  >
                                    <Download size={16} className="mr-2" />
                                    <span className="text-sm">Download Model</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
                                    <Loader size={16} className="mr-2 animate-spin" />
                                    <span className="text-sm">Model Not Ready</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-md"
              onClick={() => navigate("/requester")}
            >
              Back to Requester Page
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}