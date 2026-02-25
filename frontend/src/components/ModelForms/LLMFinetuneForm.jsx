import React, { useState, useContext, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UserContext } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
import { createFederatedJob } from "../../../utils/contract";
import LoadingModal from "../LoadingModal";
import {
  classifyModelTier,
  calculateStake,
  validateReward,
  formatBreakdown,
} from "../../../utils/feeCalculator";

/* ─── Reusable dropdown ──────────────────────────────────────────── */
function CustomDropdown({ label, options, value, setValue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div
        className="flex justify-between items-center px-4 py-3 bg-white border
          border-gray-200 rounded-xl cursor-pointer shadow-sm hover:border-blue-400
          transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={value ? "text-gray-800" : "text-gray-400"}>
          {value || `Select ${label}`}
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="relative z-50 w-full bg-white border border-gray-200
              rounded-xl mt-1 shadow-lg overflow-hidden"
          >
            {options.map((opt) => (
              <div
                key={opt}
                className="px-4 py-2 text-gray-700 cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  setValue(opt);
                  setOpen(false);
                }}
              >
                {opt}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main form ──────────────────────────────────────────────────── */
export default function LLMFinetuneForm() {
  const { userAddress } = useContext(UserContext);
  const toast = useToast();

  // ── Field state ────────────────────────────────────────────────
  const [modelName, setModelName] = useState("");
  const [maxContributors, setMaxContributors] = useState("3");
  const [epochs, setEpochs] = useState("3");
  const [learningRate, setLearningRate] = useState("0.0002");
  const [loraRank, setLoraRank] = useState("8");
  const [loraAlpha, setLoraAlpha] = useState("16");
  const [maxSeqLength, setMaxSeqLength] = useState("512");
  const [rewardPerContributor, setRewardPerContributor] = useState("0.05");
  const [datasetFolderName, setDatasetFolderName] = useState("");
  const [files, setFiles] = useState([]);

  // ── UI state ───────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [breakdown, setBreakdown] = useState(null);
  const [tierLabel, setTierLabel] = useState("");
  const [rewardError, setRewardError] = useState("");

  // ── Live cost breakdown ────────────────────────────────────────
  useEffect(() => {
    if (!rewardPerContributor || !maxContributors) return;
    const tier = classifyModelTier(modelName);
    setTierLabel(tier);

    const reward = parseFloat(rewardPerContributor);
    const contribs = parseInt(maxContributors, 10);
    if (isNaN(reward) || isNaN(contribs)) return;

    const valid = validateReward(reward, contribs, tier);
    setRewardError(valid.valid ? "" : valid.message);

    const bd = calculateStake(reward, contribs);
    setBreakdown(bd);
  }, [rewardPerContributor, maxContributors, modelName]);

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userAddress) {
      toast.warning("Please authenticate with MetaMask first.");
      return;
    }
    if (rewardError) {
      toast.warning(rewardError);
      return;
    }
    if (files.length === 0) {
      toast.warning("Please upload at least one dataset file.");
      return;
    }

    setIsLoading(true);
    setLoadingMsg("Uploading dataset to IPFS…");

    /* ── Step 1: upload to backend ──── */
    let jobId, folderCid, metadataCid;
    let stakeAmount = breakdown?.stakeAmount || "0";
    try {
      const form = new FormData();
      form.append("folderName", datasetFolderName || `llm-${Date.now()}`);
      form.append("modelName", modelName);
      form.append("maxContributors", maxContributors);
      form.append("epochs", epochs);
      form.append("learningRate", learningRate);
      form.append("loraRank", loraRank);
      form.append("loraAlpha", loraAlpha);
      form.append("maxSeqLength", maxSeqLength);
      form.append("rewardPerContributor", rewardPerContributor);
      form.append("requesterAddress", userAddress);
      files.forEach((f) => form.append("files", f));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/jobs/llm/upload`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.status !== 200) {
        toast.error("Something went wrong while uploading files!");
        setIsLoading(false);
        return;
      }

      // backend returns { jobId, folderCid, metadataCid, stakeAmount } at top level
      jobId       = response.data.jobId;
      folderCid   = response.data.folderCid;
      metadataCid = response.data.metadataCid;
      // prefer the server-calculated stakeAmount over the client-side one
      stakeAmount = response.data.stakeAmount ?? stakeAmount;
    } catch (err) {
      setIsLoading(false);
      toast.error(
        err?.response?.data?.error || "Upload failed. Please try again."
      );
      return;
    }

    /* ── Step 2: MetaMask tx ──── */
    setLoadingMsg("Waiting for MetaMask confirmation…");

    // Guard: stakeAmount must be a positive number string
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setIsLoading(false);
      toast.error("Stake amount is invalid — cannot send transaction.");
      return;
    }

    console.log("[LLMFinetuneForm] createFederatedJob args:", {
      jobId, folderCid, metadataCid, modelName,
      maxContributors: parseInt(maxContributors, 10),
      stakeAmount,
    });

    let txOk = false;
    let txError = null;
    try {
      await createFederatedJob(
        jobId,
        folderCid,
        metadataCid,
        modelName,
        parseInt(maxContributors, 10),
        stakeAmount
      );
      txOk = true;
    } catch (err) {
      txError = err;
      console.error("MetaMask tx failed:", err);
    }

    if (!txOk) {
      setIsLoading(false);
      const reason = txError?.message || "Unknown error";
      toast.warning(
        `Transaction failed: ${reason}. Go to "My Jobs" to retry or delete job #${jobId}.`
      );
      return;
    }

    /* ── Step 3: confirm in backend ──── */
    setLoadingMsg("Finalising job on-chain…");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/jobs/llm/confirm/${jobId}`
      );
      toast.success("LLM fine-tune job created successfully!");
    } catch (err) {
      toast.warning(
        "Job recorded on-chain but backend confirm failed — it will self-heal."
      );
    }

    /* ── Reset ──── */
    setIsLoading(false);
    setModelName("");
    setMaxContributors("3");
    setEpochs("3");
    setLearningRate("0.0002");
    setLoraRank("8");
    setLoraAlpha("16");
    setMaxSeqLength("512");
    setRewardPerContributor("0.05");
    setDatasetFolderName("");
    setFiles([]);
    setBreakdown(null);
    setTierLabel("");
  };

  /* ── Tier badge colour ──────────────────────────────────────── */
  const tierColour = {
    small: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    large: "bg-red-100 text-red-700",
  }[tierLabel] || "";

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      {isLoading && <LoadingModal message={loadingMsg} />}

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-6 flex flex-col gap-4"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          LLM Fine-Tune Request
        </h2>

        {/* Model name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HuggingFace Model ID
            {tierLabel && (
              <span
                className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${tierColour}`}
              >
                {tierLabel}
              </span>
            )}
          </label>
          <input
            type="text"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="e.g. unsloth/Phi-3.5-mini-instruct"
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Contributors */}
        <CustomDropdown
          label="Max Contributors"
          options={["2", "3", "4", "5", "6", "7", "8", "9", "10"]}
          value={maxContributors}
          setValue={setMaxContributors}
        />

        {/* Training hyper-params */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Epochs", value: epochs, set: setEpochs, placeholder: "3" },
            { label: "Learning Rate", value: learningRate, set: setLearningRate, placeholder: "0.0002" },
            { label: "LoRA Rank", value: loraRank, set: setLoraRank, placeholder: "8" },
            { label: "LoRA Alpha", value: loraAlpha, set: setLoraAlpha, placeholder: "16" },
            { label: "Max Seq Length", value: maxSeqLength, set: setMaxSeqLength, placeholder: "512" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="number"
                step="any"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          ))}
        </div>

        {/* Reward */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reward per Contributor (POL)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={rewardPerContributor}
            onChange={(e) => setRewardPerContributor(e.target.value)}
            required
            className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none
              focus:ring-2 focus:ring-blue-300 ${
                rewardError ? "border-red-400" : "border-gray-200"
              }`}
          />
          {rewardError && (
            <p className="text-xs text-red-500 mt-1">{rewardError}</p>
          )}
        </div>

        {/* Cost breakdown */}
        {breakdown && !rewardError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800"
          >
            <p className="font-semibold mb-1">Cost Breakdown</p>
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {formatBreakdown(breakdown)}
            </pre>
          </motion.div>
        )}

        {/* Dataset folder name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dataset Folder Name (optional)
          </label>
          <input
            type="text"
            value={datasetFolderName}
            onChange={(e) => setDatasetFolderName(e.target.value)}
            placeholder="my-llm-dataset"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* File upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dataset Files (JSONL / JSON / CSV)
          </label>
          <input
            type="file"
            multiple
            accept=".jsonl,.json,.csv"
            onChange={(e) => setFiles(Array.from(e.target.files))}
            required
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0 file:bg-blue-600 file:text-white
              hover:file:bg-blue-700 cursor-pointer"
          />
          {files.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !!rewardError}
          className="mt-2 w-full py-3 bg-blue-600 text-white font-semibold rounded-xl
            hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50
            disabled:cursor-not-allowed"
        >
          {isLoading ? "Submitting…" : "Create Fine-Tune Job"}
        </button>
      </motion.form>
    </>
  );
}
