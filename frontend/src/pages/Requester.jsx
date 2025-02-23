import { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import ImageClassificationForm from "../components/ModelForms/imageClassification"

const modelTypes = [
  "Image Classification",
  "Sentiment Analysis",
]

export default function RequesterPage() {
  const [selectedModel, setSelectedModel] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const controls = useAnimation()
  const navigate = useNavigate()

  useEffect(() => {
    controls.start((i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 },
    }))
  }, [controls])

  return (
    <>
      <Navbar />

      {/* Background Splashes */}
      <div className="fixed inset-0 w-full h-full bg-white -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 opacity-50 rounded-full blur-[150px]"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-purple-300 opacity-50 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-20 left-40 w-96 h-96 bg-pink-300 opacity-50 rounded-full blur-[150px]"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-300 opacity-50 rounded-full blur-[150px]"></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-yellow-300 opacity-50 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-red-300 opacity-50 rounded-full blur-[150px]"></div>
      </div>

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

        {/* View My Requests Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="px-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all shadow-md mb-10"
          onClick={() => navigate("/my-requests")}
        >
          Previous Requests
        </motion.button>

        {/* Label + Dropdown Container */}
        <div className="flex flex-col w-full max-w-3xl mb-8">
          {/* Dropdown Wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Dropdown Button */}
            <div
              className="flex justify-between items-center w-[87%] px-4 py-4 rounded-t-xl
                 bg-white border border-gray-300 mx-auto
                 text-gray-700 cursor-pointer shadow-sm mb-1"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {selectedModel || "Select a model..."}
              {dropdownOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>

            {/* Dropdown Items */}
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="absolute top-[90%] left-0 right-0 mx-auto w-[87%] shadow-lg rounded-b-xl border-[1px] mt-1 overflow-hidden z-50 bg-white"
              >
                {modelTypes.map((model) => (
                  <div
                    key={model}
                    className="px-4 py-2 text-gray-700 cursor-pointer hover:bg-gray-100 mx-auto"
                    onClick={() => {
                      setSelectedModel(model)
                      setDropdownOpen(false)
                    }}
                  >
                    {model}
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        

        {/* Model Form */}
        {selectedModel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl bg-white shadow-xl rounded-2xl border border-gray-200 transform hover:shadow-2xl transition-all duration-300 z-10 flex justify-center items-center"
          >
            {selectedModel === "Image Classification" && <ImageClassificationForm />}
          </motion.div>
        )}
      </div>

      <Footer />
    </>
  )
}
