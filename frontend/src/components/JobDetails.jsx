import React, { useContext } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { acceptJob } from "../../utils/contract";

export default function JobDetails({ selectedJob, onBack }) {
  if (!selectedJob) return <p className="text-center text-gray-600 mt-20">No job selected.</p>;

  const { userAddress } = useContext(UserContext);

  const ApplyJobHandler = async () => {
    try {
      // Add loading state if needed
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/jobs/contributor/apply`, {
        jobId: selectedJob.id,
        contributorAddress: userAddress,
      });

      if (response.status !== 200) {
        throw new Error(response.data.message || "Job application failed due to validation.");
      }

      // Call the smart contract
      const tx = await acceptJob(selectedJob.id);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        alert("Job accepted successfully!");
      } else {
        throw new Error("Transaction failed");
      }

    } catch (error) {
      console.error("Error accepting job:", error);
      alert(error.message || "Failed to accept job. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="flex flex-col items-center py-16 px-4 sm:px-8 md:px-12 lg:px-20 bg-transparent relative"
    >
      {/* Back Button
      <button
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center text-gray-700 hover:text-black transition text-sm sm:text-base"
      >
        <ArrowLeft size={20} className="mr-1 sm:mr-2" /> Back
      </button> */}

      {/* Job Details Card */}
      <div className="bg-white shadow-lg rounded-xl p-6 sm:p-8 max-w-lg sm:max-w-2xl w-full text-center border border-gray-200">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">{selectedJob.job_type}</h1>
        <p className="text-sm sm:text-lg text-gray-600 mb-2">
          Requester: <span className="font-semibold">{selectedJob.requester_address}</span>
        </p>
        <p className="text-sm sm:text-lg text-gray-600 mb-2">
          Reward: <span className="text-green-600 font-semibold">{selectedJob.reward} ETH</span>
        </p>
        <p className="text-sm sm:text-lg text-gray-600 mb-2">
          Dataset: <span className="font-semibold">{selectedJob.dataset_size || "Unknown"} MB</span>
        </p>
        <p className="text-sm sm:text-lg text-gray-600 mb-4">
          Estimated Training Time: <span className="font-semibold">{selectedJob.estimated_time || "N/A"}</span>
        </p>

        <button
          onClick={ApplyJobHandler}
          className="mt-4 sm:mt-6 bg-blue-500 text-white px-5 py-2 sm:px-6 sm:py-3 rounded-lg shadow-md hover:bg-blue-600 transition w-full sm:w-auto"
        >
          Apply for Job
        </button>
      </div>
    </motion.div>
  );
}
