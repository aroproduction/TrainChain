import { motion } from "framer-motion"
import { Download, CheckCircle, Monitor, Cpu, Shield, Upload, Zap } from "lucide-react"

export default function DownloadAppTab() {
  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 sm:px-8 md:px-12 lg:px-20 relative">
      {/* Hero header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-4 text-gray-800 pt-2"
      >
        Download Training App
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-sm md:text-base text-gray-500 mb-10 text-center max-w-2xl"
      >
        Install the TrainChain desktop app to connect your GPU and start earning
        rewards by training AI models.
      </motion.p>

      {/* Main download card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-6xl mb-10"
      >
        <div className="relative bg-gradient-to-r from-green-600 to-green-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
          }} />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-300 opacity-40 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-green-400 opacity-30 rounded-full blur-3xl" />

          <div className="relative z-10 p-8 md:p-12 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0 md:mr-8 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-white/15 rounded-xl">
                    <Download size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">TrainChain Desktop</h2>
                    <p className="text-green-200">v1.2 • Windows</p>
                  </div>
                </div>
                <p className="text-green-100 mb-8 text-base leading-relaxed">
                  The TrainChain desktop application connects your GPU to our decentralized
                  training network. Simply install, log in with your wallet, and start earning
                  rewards by training AI models for requesters.
                </p>
                <motion.a
                  href="https://github.com/aroproduction/TrainChain/releases/download/v1.2/TrainChain-Setup.exe"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={20} className="text-green-600" />
                  Download for Windows
                </motion.a>
              </div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="hidden md:flex justify-center items-center"
              >
                <Cpu size={140} className="text-white/80" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* How it works — 4-step process */}
      <div className="w-full max-w-6xl px-4 mb-10 pt-8 border-t border-gray-200/60">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
          Simple 4-Step Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: "1",
              title: "Install & Launch",
              description: "Download and install the TrainChain app on your Windows machine.",
              icon: <Download className="w-8 h-8 text-white" />,
              color: "bg-green-500",
            },
            {
              step: "2",
              title: "Connect Wallet",
              description: "Log in using your MetaMask wallet address to link your account.",
              icon: <Shield className="w-8 h-8 text-white" />,
              color: "bg-blue-500",
            },
            {
              step: "3",
              title: "Accept a Job",
              description: "Browse available training jobs on the website and accept one.",
              icon: <Upload className="w-8 h-8 text-white" />,
              color: "bg-purple-500",
            },
            {
              step: "4",
              title: "Train & Earn",
              description: "The app trains the model on your GPU and you earn POL tokens.",
              icon: <Zap className="w-8 h-8 text-white" />,
              color: "bg-amber-500",
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <div className="h-0.5 flex-1 bg-gray-200 rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* System Requirements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-6xl mb-8"
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Monitor size={22} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">System Requirements</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Windows 10 or higher",
              "NVIDIA GPU with CUDA support",
              "4 GB RAM minimum",
              "MetaMask browser extension",
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                <span className="text-base text-gray-700">{req}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Open source note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-6xl"
      >
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white overflow-hidden shadow-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-white/15 rounded-xl flex-shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Open Source & Verifiable</h3>
              <p className="text-indigo-100 text-sm leading-relaxed">
                TrainChain is fully open source. You can verify the app code, inspect the
                smart contract, and audit all transactions on the blockchain.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
