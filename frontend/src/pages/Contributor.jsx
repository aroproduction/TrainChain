import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Clock, XCircle, Tag, Search } from "lucide-react"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import HoverCard from "@darenft/react-3d-hover-card"
import "@darenft/react-3d-hover-card/dist/style.css"
import axios from "axios"
import JobDetails from "../components/JobDetails"

const statusColors = {
  pending: "bg-green-500",
  in_progress: "bg-yellow-500",
  completed: "bg-blue-500",
}

const statusIcons = {
  pending: <Clock className="text-white" size={16} />,
  in_progress: <XCircle className="text-white" size={16} />,
  completed: <CheckCircle className="text-white" size={16} />,
}

export default function ContributorJobs() {
  const [jobs, setJobs] = useState([]) // Initialize as empty array
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/jobs/get-jobs`);
        if (response.status === 200) {
          setJobs(Array.isArray(response.data) ? response.data : []); // Ensure jobs is always an array
        } else {
          setError("Failed to fetch jobs");
          setJobs([]);
        }
      } catch (error) {
        console.error("Error:", error);
        setError("Error fetching jobs");
        setJobs([]);
      }
      setIsLoading(false);
    };

    fetchJobs();
  }, []);

  const filteredJobs = Array.isArray(jobs) ? jobs.filter(
    (job) =>
      job?.requester_address?.toLowerCase().includes(search.toLowerCase()) ||
      job?.job_type?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  return (
    <>
      <Navbar />
      <div className="relative min-h-screen flex flex-col items-center py-20 px-4 sm:px-8 md:px-12 lg:px-20 overflow-hidden">
        {/* Fixed Background splashes */}
        <div className="fixed inset-0 z-[-1] bg-white overflow-hidden">
          <div className="absolute -top-32 -left-16 w-96 h-96 bg-green-400 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-teal-400 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute top-1/4 -left-10 w-80 h-80 bg-blue-400 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-400 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-1/3 left-16 w-[350px] h-[350px] bg-orange-400 opacity-40 blur-[100px] rounded-full"></div>
          <div className="absolute top-16 right-16 w-[250px] h-[250px] bg-red-400 opacity-40 blur-[100px] rounded-full"></div>
        </div>

        {selectedJob && (<JobDetails 
          selectedJob={selectedJob} 
          onBack={() => setSelectedJob(null)} 
        />)}
        {!selectedJob && (<div className="max-w-6xl w-full py-16">
          <motion.h1
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-extrabold text-center mb-8 text-gray-800 font-serif"
          >
            Available Jobs
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <div className="relative w-full sm:max-w-xl">
              <input
                type="text"
                placeholder="Search by job type, folder name, or requester..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-4 pl-12 border rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </motion.div>

          {isLoading && (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          )}

          <AnimatePresence>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>)}
      </div>
      <Footer />
    </>
  )
}

function JobCard({ job, onClick }) {
  return (
    <HoverCard scaleFactor={1.4}>
      <motion.div
        className="group relative shadow-xl p-1 rounded-2xl bg-white transition-all duration-300 transform hover:shadow-2xl cursor-pointer"
        onClick={onClick}
      >
        <div className="rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <span className={`flex items-center gap-1 px-3 py-1 text-white rounded-lg ${statusColors[job.status]}`}>
              {statusIcons[job.status]} {job.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-md text-gray-600 flex items-center gap-2 mb-2">
            <Tag size={16} className="text-blue-500" /> {job.job_type}
          </p>
          <p className="text-sm text-gray-500 mb-1 break-words">Requester: {job.requester_address}</p>
          <p className="text-lg font-semibold text-green-600 mb-4">Reward: {job.reward}</p>
        </div>
      </motion.div>
    </HoverCard>
  )
}
