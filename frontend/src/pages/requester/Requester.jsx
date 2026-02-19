import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Image, Smile, Upload, Cpu, CheckCircle } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import ImageClassificationForm from "../../components/ModelForms/imageClassification"

// — Sub-page imports —
import MyJobsTab from "./MyJobsTab"
import DatasetsPage from "./Datasets"
import PaymentsPage from "./Payments"
import WalletPage from "../shared/Wallet"

const modelTypes = ["Image Classification", "Sentiment Analysis"]

const modelIcons = {
  "Image Classification": <Image size={20} className="mr-2" />,
  "Sentiment Analysis": <Smile size={20} className="mr-2" />,
}

const workflowSteps = [
  {
    title: "Upload Your Data",
    description: "Securely upload your dataset through our encrypted channels",
    icon: <Upload className="w-8 h-8 text-white sm:w-6 sm:h-6" />,
    color: "bg-blue-500",
  },
  {
    title: "Model Training",
    description: "Our distributed network trains your model efficiently",
    icon: <Cpu className="w-8 h-8 text-white sm:w-6 sm:h-6" />,
    color: "bg-purple-500",
  },
  {
    title: "Get Results",
    description: "Download your trained model or integrate via API",
    icon: <CheckCircle className="w-8 h-8 text-white sm:w-6 sm:h-6" />,
    color: "bg-green-500",
  },
]

/* ══════════════════════════════════════════════
   Create Job sub-view (extracted from old page)
   ══════════════════════════════════════════════ */
function CreateJobTab() {
  const [selectedModel, setSelectedModel] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 relative">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 md:mb-6 text-gray-800 pt-2 z-10"
      >
        Create Training Request
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-8 lg:mb-12 text-center max-w-2xl"
      >
        Select a model type to start creating your training request. Choose from
        our available models and fill in the required details to get started.
      </motion.p>

      {/* Dropdown */}
      <div className="flex flex-col w-full max-w-3xl mb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative"
        >
          <div
            className="flex justify-between items-center w-[87%] px-4 py-4 rounded-t-xl
              bg-white/90 backdrop-blur-sm border border-gray-200 mx-auto text-gray-700 cursor-pointer shadow-sm mb-1
              hover:bg-white transition-colors duration-200"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {selectedModel || "Select a model..."}
            {dropdownOpen ? (
              <ChevronUp size={24} />
            ) : (
              <ChevronDown size={24} />
            )}
          </div>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute top-[90%] left-0 right-0 mx-auto w-[87%] shadow-lg rounded-b-xl border mt-1 overflow-hidden z-50 bg-white"
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

      {/* Form */}
      {selectedModel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="w-full max-w-2xl bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl border border-gray-200 hover:shadow-2xl transition-all duration-300 z-10 flex justify-center items-center"
        >
          {selectedModel === "Image Classification" && (
            <ImageClassificationForm />
          )}
        </motion.div>
      )}

      {/* Workflow */}
      <div className="w-full max-w-6xl px-4 mt-20 pt-8 border-t border-gray-200/60">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
          Simple 3-Step Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workflowSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <div
                className={`${step.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}
              >
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm">{step.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="h-0.5 flex-1 bg-gray-200 rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   Main Requester page — tab router
   ══════════════════════════════════════ */
export default function RequesterPage() {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get("tab") || "create-job"

  const renderTab = () => {
    switch (tab) {
      case "create-job":
        return <CreateJobTab />
      case "my-jobs":
        return <MyJobsTab />
      case "datasets":
        return <DatasetsPage />
      case "payments":
        return <PaymentsPage />
      case "wallet":
        return <WalletPage />
      default:
        return <CreateJobTab />
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