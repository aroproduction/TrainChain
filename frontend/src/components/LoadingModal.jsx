import { motion, AnimatePresence } from "framer-motion"
import { Loader } from "lucide-react"

export default function LoadingModal({ isOpen, message = "Processing...", subMessage = "" }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="flex flex-col items-center">
              {/* Animated spinner */}
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader size={32} className="text-blue-600 animate-pulse" />
                </div>
              </div>

              {/* Message */}
              <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                {message}
              </h3>
              {subMessage && (
                <p className="text-sm text-gray-500 text-center max-w-xs">
                  {subMessage}
                </p>
              )}

              {/* Animated dots */}
              <div className="flex gap-2 mt-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-blue-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
