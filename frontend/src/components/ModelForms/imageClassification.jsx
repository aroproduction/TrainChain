import React, { useState, useContext, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { UserContext } from "../../context/UserContext";
import axios from "axios";
import { createJob } from "../../../utils/contract";

// Reusable CustomDropdown Component
function CustomDropdown({ label, options, value, setValue }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-xl font-medium text-gray-700 mb-2">
        {label}
      </label>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative "
      >
        {/* Dropdown Button */}
        <div
          className="flex justify-between items-center w-full px-4 py-4 rounded-t-xl bg-white border border-gray-300 text-gray-700 cursor-pointer shadow-sm hover:border-blue-400 focus:ring-2 focus:ring-blue-400"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          {value || `Select ${label.toLowerCase()}...`}
          {dropdownOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>

        {/* Dropdown Items */}
        {dropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-[90%] left-0 right-0 mx-auto w-full shadow-lg rounded-b-xl border-[1px] mt-2 overflow-hidden z-50 bg-white"
          >
            {options.map((option) => (
              <div
                key={option}
                className="px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 mx-auto"
                onClick={() => {
                  setValue(option);
                  setDropdownOpen(false);
                }}
              >
                {option}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function ImageClassificationForm() {
  const [model, setModel] = useState("yolo v11");
  const [epochs, setEpochs] = useState("100");
  const [imgsz, setImgsz] = useState("640");
  const [exportFormat, setExportFormat] = useState("PyTorch(pt)");
  const [numClasses, setNumClasses] = useState("");
  const [classes, setClasses] = useState("");
  const [datasetFolderName, setDatasetFolderName] = useState("");
  const [files, setFiles] = useState([]);
  const [reward, setReward] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { userAddress } = useContext(UserContext);

  const modelVersions = ["yolo v8", "yolo v9", "yolo v10", "yolo v11"];
  const imgszOptions = ["256", "512", "640", "1024", "2048"];
  const exportFormatOptions = [
    "PyTorch(pt)",
    "onnx",
    "tflite",
    "tfjs",
    "torchscript",
    "ncnn",
  ];

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    const allFiles = [];
  
    // Convert FileList to an array
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
  
      // Only push actual files (ignore directories)
      if (file.type) {
        allFiles.push(file);
      }
    }
  
    setFiles(allFiles);
  };

  useEffect(() => {
    const ep = parseInt(epochs, 10) || 0;
    const totalFiles = files.length;
    const rewardInUSD = totalFiles * ep * 0.001;
    const rewardInPOL = rewardInUSD / 0.33;
    setReward(rewardInPOL.toFixed(2));
  }, [epochs, files]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userAddress) {
      alert("Please authenticate with MetaMask first.");
      return;
    }

    setIsLoading(true);

    console.log("files:", files.length);

    if (
      !model ||
      !epochs ||
      !imgsz ||
      !exportFormat ||
      !numClasses ||
      !classes ||
      !datasetFolderName ||
      files.length === 0
    ) {
      alert("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();

    formData.append("model", model);
    formData.append("epochs", epochs);
    formData.append("imgsz", imgsz);
    formData.append("exportFormat", exportFormat);
    formData.append("numClasses", numClasses);
    formData.append("classes", classes);
    formData.append("folderName", datasetFolderName);
    formData.append("reward", reward);
    formData.append("requesterAddress", userAddress);

    // Append files
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    for(var pair of formData.entries()) {
      console.log(pair[0]+ ', '+ pair[1]); 
    }

    try {
      console.log("Uploading dataset folder...");
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/jobs/image_processing/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status !== 200) {
        alert("Something went wrong while uploading files!");
        return;
      }
  
      // Extract IPFS CIDs from the response
      console.log("Response:", response.data);
      const { id, folder_cid, metadata_cid } = response.data.job; // Make sure backend returns these
  
      // Step 2: List job on Blockchain
      console.log("Listing job on blockchain...", folder_cid, metadata_cid);
      const tx = await createJob(
        id, // Job ID
        datasetFolderName,
        folder_cid, // CID of uploaded dataset folder
        metadata_cid, // CID of metadata
        "image_classification", // Training type
        model, // Model type
        reward.toString() // Reward in ETH
      );
  
      if (tx) {
        alert("Job successfully listed on blockchain!");
      } else {
        alert("Blockchain transaction failed!");
      }
    } catch (error) {
      console.error("Error uploading job :", error);
      alert("Something went wrong!", error.message);
    } finally {
      setIsLoading(false);
    }

    // Reset form fields
    setModel("yolo v11");
    setEpochs("100");
    setImgsz("640");
    setExportFormat("PyTorch(pt)");
    setNumClasses("");
    setClasses("");
    setDatasetFolderName("");
    setFiles([]);
    setReward(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl p-8 bg-white shadow-xl rounded-2xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300 z-10"
    >
      {/* Custom Dropdown for Model */}
      <CustomDropdown
        label="Model"
        options={modelVersions}
        value={model}
        setValue={setModel}
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Epochs
      </label>
      <input
        type="number"
        value={epochs}
        onChange={(e) => setEpochs(e.target.value)}
        placeholder="Number of epochs"
        className="w-full p-4 px-7 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400 appearance-none"
      />

      {/* Custom Dropdown for Image Size */}
      <CustomDropdown
        label="Image Size (imgsz)"
        options={imgszOptions}
        value={imgsz}
        setValue={setImgsz}
      />

      {/* Custom Dropdown for Export Format */}
      <CustomDropdown
        label="Export Format"
        options={exportFormatOptions}
        value={exportFormat}
        setValue={setExportFormat}
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Number of Classes
      </label>
      <input
        type="number"
        value={numClasses}
        onChange={(e) => setNumClasses(e.target.value)}
        placeholder="Enter number of classes"
        className="w-full p-4 px-7 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400 appearance-none"
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Class Names (comma-separated)
      </label>
      <input
        type="text"
        value={classes}
        onChange={(e) => setClasses(e.target.value)}
        placeholder="Enter class names"
        className="w-full p-4 px-7 border rounded-lg mb-6 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400"
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Dataset Folder Name
      </label>
      <input
        type="text"
        value={datasetFolderName}
        onChange={(e) => setDatasetFolderName(e.target.value)}
        placeholder="Enter dataset folder name"
        className="w-full p-4 px-7 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400 appearance-none"
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Upload Dataset Folder
      </label>
      <input
        type="file"
        multiple
        directory=""
        webkitdirectory=""
        onChange={handleFileChange}
        className="w-full p-4 px-7 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400 appearance-none"
      />

      <label className="block text-xl font-medium text-gray-700 mb-2">
        Reward Value
      </label>
      <input
        type="decimal"
        value={reward}
        onChange={(e) => setReward(e.target.value)}
        placeholder="Enter reward value"
        className="w-full p-4 px-7 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400 text-lg transition-all duration-300 hover:border-blue-400 appearance-none"
      />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-full mt-6 py-4 bg-blue-600 text-white text-xl font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-lg ${
          isLoading ? "cursor-not-allowed" : "cursor-pointer"
        }`}
        onClick={handleSubmit}
      >
        {isLoading ? "Uploading..." : "Upload Job"}
      </motion.button>
    </motion.div>
  );
}
