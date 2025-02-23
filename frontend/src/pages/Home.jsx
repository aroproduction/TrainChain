import { useContext } from "react"
import { UserContext } from "../context/UserContext"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
import { UploadCloud, Cpu } from "lucide-react"

const HomePage = () => {
    const { userAddress } = useContext(UserContext)

    return (
        <>
            <Navbar />
            {/* bg-gradient-to-br from-purple-200 via-pink-200 to-blue-200 */}
            <div className="min-h-screen bg-gray-100 py-24 transition-all duration-1000 ease-in-out">
                {/* Header Section */}
                <motion.header
                    className="bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 shadow-lg rounded-lg mx-6 my-8 p-6 overflow-hidden relative"
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="relative z-10">
                        <motion.h1
                            className="text-3xl font-bold text-gray-900 text-center break-words"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            Welcome, {userAddress}
                        </motion.h1>
                        <motion.p
                            className="mt-4 text-gray-700 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            Choose your role to begin your journey in decentralized AI.
                        </motion.p>
                    </div>
                </motion.header>

                {/* Role Selection Section */}
                <section className="flex flex-col md:flex-row justify-center items-stretch gap-8 mx-6 py-10">
                    {/* Requester Card */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 shadow-2xl rounded-2xl p-10 cursor-pointer flex flex-col justify-center items-center overflow-hidden relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <Link to="/requester" className="w-full flex flex-col items-center relative z-10">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                                <UploadCloud
                                    size={64}
                                    className="mb-4 text-blue-500 transition-colors duration-300 group-hover:text-blue-700"
                                />
                            </motion.div>
                            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-4">Requester Section</h1>
                            <p className="text-gray-600 text-center">
                                Stake coins and upload your dataset to initiate a model training job.
                            </p>
                        </Link>
                    </motion.div>

                    {/* Contributor Card */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex-1 bg-gradient-to-br from-green-100 to-green-200 shadow-2xl rounded-2xl p-10 cursor-pointer flex flex-col justify-center items-center overflow-hidden relative group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-green-300 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        <Link to="/contributor" className="w-full flex flex-col items-center relative z-10">
                            <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                                <Cpu
                                    size={64}
                                    className="mb-4 text-green-500 transition-colors duration-300 group-hover:text-green-700"
                                />
                            </motion.div>
                            <h1 className="text-2xl font-semibold text-gray-900 text-center mb-4">Contributor Section</h1>
                            <p className="text-gray-600 text-center">
                                Use your GPU power to train AI models on data provided by requesters.
                            </p>
                        </Link>
                    </motion.div>
                </section>

                {/* Additional Info Section */}
                <motion.section
                    className="mt-12 mx-6 p-6 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 shadow-lg rounded-lg overflow-hidden relative"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                >
                    <div className="relative z-10">
                        <motion.h2
                            className="text-xl font-bold text-gray-800 mb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                        >
                            About Our Platform
                        </motion.h2>
                        <motion.p
                            className="text-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            Our decentralized AI platform empowers users by enabling requesters to list their AI model training jobs
                            and stake coins, while contributors can leverage their computing power to train models. We aim to
                            democratize AI by making training more accessible and cost-effective. Explore both sections to see how you
                            can contribute or request training services.
                        </motion.p>
                    </div>
                </motion.section>
            </div>
            <Footer />
        </>
    )
}

export default HomePage

