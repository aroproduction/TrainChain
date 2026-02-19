import { useContext, useState, useEffect } from "react"
import { UserContext } from "../context/UserContext"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useSearchParams } from "react-router-dom"
import Footer from "../components/Footer"
import WalletPage from "./shared/Wallet"
import {
    UploadCloud,
    Cpu,
    Zap,
    Shield,
    Users,
    DollarSign,
    ChevronRight,
    Sun,
    Moon,
    ArrowRight,
} from "lucide-react"

const HomePage = () => {
    const { userAddress } = useContext(UserContext)
    const [searchParams] = useSearchParams()
    const tab = searchParams.get("tab")
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode)
    }

    const shortenedAddress = userAddress
        ? `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`
        : "Connect Wallet"

    // Handle wallet tab
    if (tab === "wallet") {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="wallet"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    <WalletPage />
                </motion.div>
            </AnimatePresence>
        )
    }

    return (
        <>
            <div className={`min-h-screen transition-colors duration-500 relative bg-gray-50 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>

                {/* Background & Welcome Container */}
                <div className="relative shadow-xl p-6 pt-6">
                    {/* Animated Background */}
                    <div className={`absolute inset-0 overflow-hidden transition-colors duration-500 ${isDarkMode ? "bg-gray-800" : "bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500"}`}>
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute rounded-full opacity-20 bg-white"
                                style={{
                                    width: Math.random() * 100 + 50,
                                    height: Math.random() * 100 + 50,
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [Math.random() * 100, Math.random() * -100],
                                    x: [Math.random() * 100, Math.random() * -100],
                                }}
                                transition={{
                                    repeat: Number.POSITIVE_INFINITY,
                                    repeatType: "reverse",
                                    duration: Math.random() * 10 + 10,
                                }}
                            />
                        ))}
                    </div>

                    {/* Welcome Section */}
                    <motion.section
                        className="p-6 relative"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isVisible ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="container mx-auto">
                            <motion.div
                                className="text-center mb-16 max-w-3xl mx-auto"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="inline-block mb-3">
                                    <motion.div
                                        className={`px-4 py-1 rounded-full text-sm font-medium ${isDarkMode ? "bg-gray-800 text-purple-300" : "bg-purple-100 text-purple-600"}`}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {userAddress ? "Welcome Back" : "Get Started Today"}
                                    </motion.div>
                                </div>
                                <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    {userAddress ? `Welcome, ${shortenedAddress}` : "Join Our Decentralized AI Network"}
                                </h2>
                                <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"} max-w-2xl mx-auto`}>
                                    {userAddress
                                        ? "Continue your journey in decentralized AI by choosing your role below."
                                        : "Connect your wallet to start training models or contributing computing power to the network."}
                                </p>
                            </motion.div>
                        </div>
                    </motion.section>
                </div>

                {/* Role Selection Section - Enhanced */}
                <section className={`py-12 px-6 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
                    <div className="container mx-auto max-w-6xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Requester Card */}
                            <motion.div
                                whileHover={{ scale: 1.03, y: -5 }}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className={`relative overflow-hidden rounded-2xl ${isDarkMode
                                    ? "bg-gradient-to-br from-blue-900/40 to-blue-800/40 border border-blue-700/30"
                                    : "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50"
                                    } shadow-xl`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-blue-500/10" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-blue-500/10" />

                                <div className="p-8 relative z-10">
                                    <div
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? "bg-blue-900/50" : "bg-blue-100"
                                            }`}
                                    >
                                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                                            <UploadCloud size={32} className={isDarkMode ? "text-blue-300" : "text-blue-500"} />
                                        </motion.div>
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                        Requester Portal
                                    </h3>

                                    <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                        Need AI models trained on your data? Stake tokens and upload your dataset to initiate training jobs at
                                        a fraction of traditional costs.
                                    </p>

                                    <ul className="space-y-3 mb-8">
                                        {[
                                            "Cost-effective model training",
                                            "Secure & private data handling",
                                            "Customizable training parameters",
                                            "Access to distributed compute power",
                                        ].map((feature, index) => (
                                            <motion.li
                                                key={index}
                                                className={`flex items-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -10 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                            >
                                                <div className={`mr-2 ${isDarkMode ? "text-blue-300" : "text-blue-500"}`}>
                                                    <ChevronRight size={16} />
                                                </div>
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>

                                    <Link to="/requester?tab=create-job">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`w-full py-3 px-6 rounded-lg flex items-center justify-center ${isDarkMode
                                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                                : "bg-blue-500 hover:bg-blue-600 text-white"
                                                } font-medium transition-colors`}
                                        >
                                            Start as Requester
                                            <ArrowRight className="ml-2" size={18} />
                                        </motion.button>
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Contributor Card */}
                            <motion.div
                                whileHover={{ scale: 1.03, y: -5 }}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 30 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className={`relative overflow-hidden rounded-2xl ${isDarkMode
                                    ? "bg-gradient-to-br from-green-900/40 to-green-800/40 border border-green-700/30"
                                    : "bg-gradient-to-br from-green-50 to-green-100 border border-green-200/50"
                                    } shadow-xl`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-green-500/10" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-green-500/10" />

                                <div className="p-8 relative z-10">
                                    <div
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isDarkMode ? "bg-green-900/50" : "bg-green-100"
                                            }`}
                                    >
                                        <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                                            <Cpu size={32} className={isDarkMode ? "text-green-300" : "text-green-500"} />
                                        </motion.div>
                                    </div>

                                    <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                        Contributor Portal
                                    </h3>

                                    <p className={`mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                        Have idle GPU power? Earn tokens by contributing your computing resources to train AI models for
                                        requesters in our network.
                                    </p>

                                    <ul className="space-y-3 mb-8">
                                        {[
                                            "Earn tokens for your compute power",
                                            "Flexible contribution schedules",
                                            "Automated payment system",
                                            "Support cutting-edge AI research",
                                        ].map((feature, index) => (
                                            <motion.li
                                                key={index}
                                                className={`flex items-center ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -10 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                            >
                                                <div className={`mr-2 ${isDarkMode ? "text-green-300" : "text-green-500"}`}>
                                                    <ChevronRight size={16} />
                                                </div>
                                                {feature}
                                            </motion.li>
                                        ))}
                                    </ul>

                                    <Link to="/contributor?tab=available-jobs">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`w-full py-3 px-6 rounded-lg flex items-center justify-center ${isDarkMode
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "bg-green-500 hover:bg-green-600 text-white"
                                                } font-medium transition-colors`}
                                        >
                                            Start as Contributor
                                            <ArrowRight className="ml-2" size={18} />
                                        </motion.button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* About Platform Section */}
                <section className={`py-20 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
                    <div className="container mx-auto px-6 sm:px-8 md:px-8 lg:px-12">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <motion.div
                                className="lg:w-1/2"
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : -30 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="inline-block mb-3">
                                    <div
                                        className={`px-4 py-1 rounded-full text-sm font-medium ${isDarkMode ? "bg-gray-800 text-purple-300" : "bg-purple-100 text-purple-600"
                                            }`}
                                    >
                                        Our Mission
                                    </div>
                                </div>
                                <h2 className={`text-3xl md:text-4xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                    Democratizing AI for Everyone
                                </h2>
                                <p className={`text-lg mb-6 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    Our decentralized AI platform empowers users by enabling requesters to list their AI model training jobs
                                    and stake tokens, while contributors can leverage their computing power to train models.
                                </p>
                                <p className={`text-lg mb-8 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                                    We aim to democratize AI by making training more accessible and cost-effective, creating a sustainable
                                    ecosystem where everyone benefits from shared resources and expertise.
                                </p>
                                <Link to="/about">
                                    <motion.button
                                        className={`px-6 py-3 rounded-lg ${isDarkMode
                                            ? "bg-transparent border border-purple-500 text-purple-300 hover:bg-purple-900/20"
                                            : "bg-transparent border border-purple-500 text-purple-700 hover:bg-purple-100"
                                            } font-medium transition-colors flex items-center`}
                                        whileHover={{ scale: 1.05, x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Learn More About Us <ChevronRight className="ml-1" size={18} />
                                    </motion.button>
                                </Link>
                            </motion.div>

                            <motion.div
                                className="lg:w-1/2"
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 30 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className={`rounded-2xl overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-gray-100"} p-1`}>
                                    <div className="grid grid-cols-2 gap-1">
                                        {[
                                            {
                                                title: "Secure Data",
                                                icon: <Shield size={24} />,
                                                color: isDarkMode ? "bg-red-900/30 text-red-300" : "bg-red-100 text-red-500",
                                            },
                                            {
                                                title: "Fast Training",
                                                icon: <Zap size={24} />,
                                                color: isDarkMode ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-100 text-yellow-500",
                                            },
                                            {
                                                title: "Fair Rewards",
                                                icon: <DollarSign size={24} />,
                                                color: isDarkMode ? "bg-green-900/30 text-green-300" : "bg-green-100 text-green-500",
                                            },
                                            {
                                                title: "Global Network",
                                                icon: <Users size={24} />,
                                                color: isDarkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-500",
                                            },
                                        ].map((item, index) => (
                                            <motion.div
                                                key={index}
                                                className={`${isDarkMode ? "bg-gray-700" : "bg-white"} p-6 rounded-xl flex flex-col items-center text-center`}
                                                whileHover={{ y: -5 }}
                                            >
                                                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center mb-4`}>
                                                    {item.icon}
                                                </div>
                                                <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{item.title}</h3>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>


            </div>
            {/* Dark Mode Toggle Button repositioned to bottom-right */}
            <motion.button
                className={`fixed z-[100] bottom-4 right-4 p-3 rounded-full shadow-lg ${
                    isDarkMode 
                        ? "bg-gray-700 hover:bg-gray-600" 
                        : "bg-gray-200 hover:bg-gray-300"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
            >
                {isDarkMode ? 
                    <Sun className="text-yellow-300" size={20} /> : 
                    <Moon className="text-gray-700" size={20} />
                }
            </motion.button>
            <Footer />
        </>
    )
}

export default HomePage

