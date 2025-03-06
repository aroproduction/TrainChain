import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Image, Smile, Upload, Cpu, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import ImageClassificationForm from "../components/ModelForms/imageClassification"

const modelTypes = [
  "Image Classification",
  "Sentiment Analysis",
]

// Mapping icons to model types for visual enhancement
const modelIcons = {
  "Image Classification": <Image size={20} className="mr-2" />,
  "Sentiment Analysis": <Smile size={20} className="mr-2" />,
}

const workflowSteps = [
  {
    title: "Upload Your Data",
    description: "Securely upload your dataset through our encrypted channels",
    icon: <Upload className="w-8 h-8 text-white" />,
    color: "bg-blue-500",
  },
  {
    title: "Model Training",
    description: "Our distributed network trains your model efficiently",
    icon: <Cpu className="w-8 h-8 text-white" />,
    color: "bg-purple-500",
  },
  {
    title: "Get Results",
    description: "Download your trained model or integrate via API",
    icon: <CheckCircle className="w-8 h-8 text-white" />,
    color: "bg-green-500",
  },
]

export default function RequesterPage() {
  const [selectedModel, setSelectedModel] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  // No need for useAnimation since we're handling animations directly
  useEffect(() => {
    // Optional: Add page load animations if needed later
  }, [])

  return (
    <>
      <Navbar />

      {/* Background Splashes with Pulsing Animation */}
      <div className="fixed inset-0 w-full h-full bg-white -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 opacity-50 rounded-full blur-[150px] splash"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-300 opacity-50 rounded-full blur-[150px] splash"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-pink-300 opacity-50 rounded-full blur-[150px] splash"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-300 opacity-50 rounded-full blur-[150px] splash"></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-yellow-300 opacity-50 rounded-full blur-[150px] splash"></div>
        <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-red-300 opacity-50 rounded-full blur-[150px] splash"></div>
      </div>

      {/* CSS for Pulsing Animation (Assuming a global stylesheet) */}
      <style>
        {`
          .splash {
            animation: pulse 8s infinite ease-in-out;
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `}
      </style>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center py-20 px-4 relative">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold text-center mb-8 text-gray-800 pt-10 pb-5 z-10 font-serif"
        >
          Create Training Request
        </motion.h1>

        {/* Introductory Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-600 mb-8 text-center max-w-2xl"
        >
          Select a model type to start creating your training request. Choose from our available models and fill in the required details to get started.
        </motion.p>

        {/* View My Requests Button with Hover/Tap Effects */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all shadow-md mb-10"
          onClick={() => navigate("/my-requests")}
        >
          Previous Requests
        </motion.button>

        {/* Dropdown Container */}
        <div className="flex flex-col w-full max-w-3xl mb-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            {/* Dropdown Button */}
            <div
              className="flex justify-between items-center w-[87%] px-4 py-4 rounded-t-xl
                bg-white border border-gray-300 mx-auto text-gray-700 cursor-pointer shadow-sm mb-1
                hover:bg-gray-50 transition-colors duration-200"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedModel || "Select a model..."}
              {dropdownOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>

            {/* Dropdown Items with Icons and Staggered Animation */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-[90%] left-0 right-0 mx-auto w-[87%] shadow-lg rounded-b-xl border-[1px] mt-1 overflow-hidden z-50 bg-white"
                >
                  {modelTypes.map((model, index) => (
                    <motion.div
                      key={model}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setSelectedModel(model)
                        setDropdownOpen(false)
                      }}
                    >
                      {modelIcons[model]}
                      {model}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Model Form with Spring Animation and Gradient */}
        {selectedModel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            className="w-full max-w-2xl bg-gradient-to-br from-white to-gray-100 shadow-xl rounded-2xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300 z-10 flex justify-center items-center"
          >
            {selectedModel === "Image Classification" && <ImageClassificationForm />}
          </motion.div>
        )}

        {/* Workflow Section */}
        <div className="w-full max-w-6xl px-4 mt-28 pt-8 border-t-[2px] border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Simple 3-Step Process
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workflowSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
              >
                <div className={`${step.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-4`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>

                {/* Image placeholder - Replace with actual images */}
                <div className="mt-4 h-48 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-gray-400">Data Preview</span>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="h-1 w-8 bg-gray-200 rounded-full" />
                  {index < 2 && <div className="h-1 flex-1 bg-gray-200 rounded-full" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}