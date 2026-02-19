import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Database,
  Clock,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import { useToast } from "../context/ToastContext";
import { acceptJob } from "../../utils/contract";
import LoadingModal from "./LoadingModal";

export default function JobDetails({ selectedJob, onBack }) {
  if (!selectedJob)
    return (
      <p className="text-center text-gray-500 mt-20">
        No job selected.
      </p>
    );

  const { userAddress } = useContext(UserContext);
  const toast = useToast();
  const [isApplying, setIsApplying] = useState(false);

  const ApplyJobHandler = async () => {
    setIsApplying(true);
    try {
      const initResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/jobs/contributor/apply/initiate`,
        {
          jobId: selectedJob.id,
          contributorAddress: userAddress,
        }
      );

      if (initResponse.status !== 200) {
        throw new Error(
          initResponse.data.message ||
            "Failed to initiate job acceptance."
        );
      }

      try {
        const tx = await acceptJob(selectedJob.id);
        const receipt = await tx.wait();

        if (receipt.status !== 1) {
          throw new Error("Transaction failed");
        }

        await axios.post(
          `${import.meta.env.VITE_API_URL}/jobs/contributor/apply/confirm`,
          { jobId: selectedJob.id }
        );

        toast.success("Job application successful!");
      } catch (blockchainError) {
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/jobs/contributor/apply/revert`,
            { jobId: selectedJob.id }
          );
        } catch {}

        toast.error(
          blockchainError.message ||
            "Payment failed or cancelled."
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to apply for job."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const formatJobType = (type) => {
    if (!type) return "Unknown Job";
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatReward = (reward) => {
    return `${(parseFloat(reward) || 0).toFixed(3)} POL`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto px-4 py-6"
    >

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          
          <div>
            <p className="text-sm text-gray-500 mb-1">
              Training Job #{selectedJob.id}
            </p>

            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              {formatJobType(selectedJob.job_type)}
            </h1>
          </div>

          {/* Reward */}
          {selectedJob.reward && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-4 py-3 rounded-xl">
              <Award className="text-green-600" size={22} />
              <div>
                <p className="text-xs text-green-700 font-medium">
                  Reward
                </p>
                <p className="text-lg font-semibold text-green-800">
                  {formatReward(selectedJob.reward)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6" />

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Requester */}
          {selectedJob.requester_address && (
            <InfoItem
              icon={<User size={18} />}
              label="Requester"
              value={selectedJob.requester_address}
              mono
            />
          )}

          {/* Created */}
          {selectedJob.created_at && (
            <InfoItem
              icon={<Calendar size={18} />}
              label="Created On"
              value={formatDate(selectedJob.created_at)}
            />
          )}

          {/* Dataset */}
          {selectedJob.dataset_size && (
            <InfoItem
              icon={<Database size={18} />}
              label="Dataset Size"
              value={`${selectedJob.dataset_size} MB`}
            />
          )}

          {/* Training Time */}
          {selectedJob.estimated_time && (
            <InfoItem
              icon={<Clock size={18} />}
              label="Estimated Time"
              value={selectedJob.estimated_time}
            />
          )}
        </div>

        {/* Additional */}
        {(selectedJob.model ||
          selectedJob.epochs ||
          selectedJob.training_type) && (
          <>
            <div className="border-t border-gray-200 mt-6 mb-6" />

            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-gray-600" />
                <p className="font-medium text-gray-800">
                  Additional Details
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {selectedJob.model && (
                  <DetailBox
                    label="Model"
                    value={selectedJob.model}
                  />
                )}

                {selectedJob.epochs && (
                  <DetailBox
                    label="Epochs"
                    value={selectedJob.epochs}
                  />
                )}

                {selectedJob.training_type && (
                  <DetailBox
                    label="Training Type"
                    value={formatJobType(
                      selectedJob.training_type
                    )}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Apply button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={ApplyJobHandler}
            disabled={isApplying}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl transition disabled:opacity-50"
          >
            {isApplying && (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {isApplying ? "Processing..." : "Apply for Job"}
          </button>
        </div>
      </div>

      <LoadingModal
        isOpen={isApplying}
        message="Accepting Job"
        subMessage="Please confirm the blockchain transaction in your wallet."
      />
    </motion.div>
  );
}

/* Reusable Info Item */
function InfoItem({ icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-gray-500 mt-1">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p
          className={`text-gray-900 ${
            mono ? "font-mono text-sm break-all" : "font-medium"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* Detail Box */
function DetailBox({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}
