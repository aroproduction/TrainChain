import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useInView } from "framer-motion"
import { Link } from "react-router-dom"
import Navbar from "../components/Navbar"

/** BACKGROUND DECORATION COMPONENTS **/
function HeroBackground() {
  return (
    <>
      <motion.div
        className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-pink-300 opacity-50 blur-3xl rounded-full" 
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-blue-300 opacity-50 blur-3xl rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -15, 0],
        }}
        transition={{
          duration: 18,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-[40%] right-[-80px] w-64 h-64 bg-yellow-300 opacity-40 blur-2xl rounded-full"
        animate={{
          x: [0, -30, 0],
          y: [0, 20, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 backdrop-blur-[2px] z-[1]" />
    </>
  )
}

function FeaturesBackground() {
  return (
    <>
      <motion.div
        className="absolute top-[-60px] left-[20%] w-72 h-72 bg-green-300 opacity-50 blur-2xl rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-[-60px] right-[10%] w-80 h-60 bg-purple-300 opacity-60 blur-2xl rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -20, 0],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 3,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/40 backdrop-blur-[1px] z-[1]" />
    </>
  )
}

function AboutBackground() {
  return (
    <>
      <motion.div
        className="absolute top-[30%] left-[-70px] w-64 h-64 bg-orange-400 opacity-40 blur-2xl rounded-full"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          rotate: {
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          },
          scale: {
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
      />
      <motion.div
        className="absolute bottom-[20%] right-[-40px] w-56 h-56 bg-blue-400 opacity-30 blur-2xl rounded-full"
        animate={{
          rotate: [0, -360],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          rotate: {
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          },
          scale: {
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          },
        }}
      />
    </>
  )
}

function ContactBackground() {
  return (
    <>
      <motion.div
        className="absolute bottom-0 right-[-40px] w-80 h-80 bg-red-500 opacity-30 blur-3xl rounded-full"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-[20%] left-[-40px] w-72 h-72 bg-purple-500 opacity-20 blur-3xl rounded-full"
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30 backdrop-blur-[1px] z-[1]" />
    </>
  )
}

function ParticleBackground() {
  const particleCount = 30
  const particles = Array.from({ length: particleCount })

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[0]">
      {particles.map((_, index) => {
        const size = Math.random() * 6 + 2
        const initialX = Math.random() * 100
        const initialY = Math.random() * 100
        const duration = Math.random() * 20 + 10
        const delay = Math.random() * 5

        return (
          <motion.div
            key={index}
            className="absolute rounded-full bg-white opacity-70"
            style={{
              width: size,
              height: size,
              left: `${initialX}%`,
              top: `${initialY}%`,
            }}
            animate={{
              y: [0, -300, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration,
              repeat: Number.POSITIVE_INFINITY,
              delay,
              ease: "easeInOut",
            }}
          />
        )
      })}
    </div>
  )
}

function AnimatedText() {
  const prefix = "Empower "
  const suffixes = ["AI Shape the Future", "GPUs Fuel the Revolution", "Next-Gen AI Training"]

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [displayedSuffix, setDisplayedSuffix] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const typingSpeed = 30
  const pauseTime = 1000

  useEffect(() => {
    const currentSuffix = suffixes[currentSentenceIndex]
    let timeout

    if (!isDeleting && displayedSuffix === currentSuffix) {
      timeout = setTimeout(() => setIsDeleting(true), pauseTime)
    } else if (isDeleting && displayedSuffix === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false)
        setCurrentSentenceIndex((prev) => (prev + 1) % suffixes.length)
      }, pauseTime)
    } else {
      timeout = setTimeout(() => {
        const updatedSuffix = isDeleting
          ? currentSuffix.substring(0, displayedSuffix.length - 1)
          : currentSuffix.substring(0, displayedSuffix.length + 1)
        setDisplayedSuffix(updatedSuffix)
      }, typingSpeed)
    }

    return () => clearTimeout(timeout)
  }, [displayedSuffix, isDeleting, currentSentenceIndex, suffixes])

  return (
    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-5 md:mb-10 min-h-[180px] lg:min-h-[160px]">
      <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        {prefix}
      </motion.span>
      <br />
      <span className="relative">
        <motion.span
          key={currentSentenceIndex}
          className="inline-block transition-all duration-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {displayedSuffix}
        </motion.span>
        <motion.span
          className="absolute -right-[4px] bottom-0 inline-block w-[3px] h-[80%] bg-blue-600"
          animate={{
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </span>
    </h1>
  )
}

function FloatingElement({ children, delay = 0, duration = 4, yOffset = 15 }) {
  return (
    <motion.div
      animate={{
        y: [-yOffset, yOffset, -yOffset],
      }}
      transition={{
        duration,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

/** HERO SECTION **/
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0 })

  return (
    <section
      id="hero"
      ref={ref}
      className={`relative h-screen flex flex-col justify-center items-center bg-white overflow-hidden shadow-lg rounded-lg py-6 px-3 gap-7`}
    >
      <HeroBackground />
      <ParticleBackground />

      <motion.div
        className="relative z-10 text-center px-4"
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatedText />

        <motion.p
          className={`mb-10 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto`}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          Train AI models through decentralized computation and blockchain technology.
          <br />
          Join the revolution that's reshaping how AI is developed and deployed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/home"
              className={`inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 rounded-md text-white text-lg font-mono font-bold shadow-lg transition-all duration-300`}
            >
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              >
                Get Started
              </motion.span>
              <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </motion.svg>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <a
              target="_blank"
              href="https://youtu.be/Eep9EkqHGrE?si=Dw8Tfu1_pHtklFvI"
              className={`inline-flex items-center px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md text-lg font-mono font-bold shadow-md transition-all duration-300`}
            >
              Watch Demo
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/** FEATURES SECTION **/
function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0 })

  const features = [
    {
      title: "Secure Transactions",
      description: "End-to-end encrypted data transfer with blockchain verification for maximum security.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      title: "Decentralized Network",
      description: "Distributed computing across thousands of nodes ensures reliability and fault tolerance.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      ),
    },
    {
      title: "AI Model Training",
      description: "Train complex neural networks faster with distributed computing power.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      title: "IPFS for Data Storage",
      description: "Decentralized storage ensures your data remains accessible and immutable.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
    },
    {
      title: "Token-Based Incentives",
      description: "Earn tokens by contributing computational resources to the network.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: "Intuitive User Interface",
      description: "Easy-to-use dashboard for monitoring and managing your AI training jobs.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
  ]

  return (
    <section
      id="features"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center items-center bg-gray-50 py-20 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <FeaturesBackground />

      <motion.div
        className="relative z-10 w-full max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-800 font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
          >
            Revolutionary Technology
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Powerful Features for Next-Gen AI
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge technologies to create a seamless AI training experience
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="p-8 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              <FloatingElement delay={index * 0.2} yOffset={8}>
                <div className="mb-4">{feature.icon}</div>
              </FloatingElement>
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0 })

  const faqItems = [
    {
      question: "How does decentralized AI training work?",
      answer:
        "Our platform connects GPU providers with AI developers through blockchain technology, enabling secure and efficient distributed model training. The workload is split across multiple nodes, each processing a portion of the data and contributing to the final model.",
    },
    {
      question: "What hardware requirements are needed?",
      answer:
        "You need at least an NVIDIA RTX 2080 GPU, 16GB RAM, and a stable internet connection. Linux-based systems are recommended for best performance. For optimal earnings, we recommend RTX 3080 or better GPUs with at least 32GB system RAM.",
    },
    {
      question: "How are payments processed?",
      answer:
        "We use smart contracts to automatically distribute payments in cryptocurrency based on computational resources provided and tasks completed. Payments are processed every 24 hours and deposited directly to your wallet with no minimum withdrawal amount.",
    },
    {
      question: "Is my data secure on the platform?",
      answer:
        "Absolutely. All data is encrypted end-to-end and distributed across the network using secure protocols. Your models and datasets are protected by military-grade encryption, and you maintain complete ownership of your intellectual property.",
    },
    {
      question: "Can I join as both a provider and a developer?",
      answer:
        "Yes! Many of our users both contribute computational resources and develop AI models on our platform. This dual participation creates a vibrant ecosystem and allows you to fully experience both sides of our decentralized marketplace.",
    },
  ]

  return (
    <section
      id="faq"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center items-center bg-white py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <AboutBackground />

      <motion.div
        className="relative z-10 w-full max-w-4xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-block px-4 py-1 rounded-full bg-orange-100 text-orange-800 font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Common Questions
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about our decentralized AI platform
          </p>
        </motion.div>

        <div className="w-full space-y-4">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              className="overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <motion.div
                className="p-6 bg-gray-50 rounded-lg shadow-sm cursor-pointer border border-gray-100"
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                whileHover={{ backgroundColor: "#f3f4f6" }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-800">{item.question}</h3>
                  <motion.div animate={{ rotate: activeIndex === index ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div
                      key="answer"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.p
                        className="pt-4 text-gray-600"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {item.answer}
                      </motion.p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

function TestimonialSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0 })

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "AI Researcher",
      company: "Neural Labs",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
      quote:
        "This platform has revolutionized how we train our models. The distributed computing power has cut our training time by 70%.",
    },
    {
      name: "Michael Chen",
      role: "GPU Provider",
      company: "TechNode Solutions",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
      quote:
        "I've been able to monetize my idle GPU resources and earn passive income while contributing to cutting-edge AI development.",
    },
    {
      name: "Elena Rodriguez",
      role: "CTO",
      company: "FutureTech AI",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
      quote:
        "The security and reliability of this platform is unmatched. We've trained multiple production models without a single issue.",
    },
  ]

  return (
    <section
      id="testimonials"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center items-center bg-gray-50 py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <div className="absolute top-[-60px] right-[20%] w-72 h-72 bg-blue-300 opacity-30 blur-2xl rounded-full" />
      <div className="absolute bottom-[-60px] left-[10%] w-80 h-60 bg-purple-300 opacity-40 blur-2xl rounded-full" />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-block px-4 py-1 rounded-full bg-purple-100 text-purple-800 font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Success Stories
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of satisfied users who are transforming the AI landscape
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              whileHover={{
                y: -10,
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-blue-500">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-gray-600">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
              <div className="relative">
                <svg
                  className="absolute top-0 left-0 w-10 h-10 text-blue-100 -mt-3 -ml-3"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
                <p className="relative z-10 text-gray-700 italic">{testimonial.quote}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

/** CONTACT SECTION **/
function ContactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false, amount: 0 })

  const stats = [
    { number: "10K+", label: "GPUs Connected", icon: "💻" },
    { number: "5M+", label: "Tasks Completed", icon: "✅" },
    { number: "99.9%", label: "Uptime", icon: "⏱️" },
    { number: "150+", label: "Countries", icon: "🌎" },
  ]

  return (
    <section
      id="stats"
      ref={ref}
      className="relative min-h-screen flex flex-col justify-center items-center bg-white py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <ContactBackground />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="inline-block px-4 py-1 rounded-full bg-red-100 text-red-800 font-medium text-sm mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Global Impact
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">Powering the Future of AI</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Join thousands of contributors shaping AI's future</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl mb-16">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, margin: "0px 0px -100px 0px" }}
              transition={{ delay: index * 0.1, type: "spring" }}
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.2 }}
                >
                  {stat.icon}
                </motion.div>
                <motion.div
                  className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent z-10"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                  }}
                >
                  <CountUp value={stat.number} />
                </motion.div>
                <p className="text-xl text-gray-600 mt-2">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-10 text-white text-center shadow-xl"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-3xl font-bold mb-4">Ready to Join the Revolution?</h3>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Start contributing your GPU resources or training your AI models on our decentralized platform today.
          </p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-md text-lg font-bold shadow-md hover:bg-gray-100 transition-all duration-300"
              >
                Get Started Now
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/contact"
                className="inline-flex items-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-md text-lg font-bold hover:bg-white/10 transition-all duration-300"
              >
                Contact Sales
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

// CountUp animation component
function CountUp({ value }) {
  const [displayValue, setDisplayValue] = useState("0")
  const ref = useRef(null)
  const isInView = useInView(ref, { once: false })

  useEffect(() => {
    if (!isInView) return

    let startValue = 0
    const endValue = Number.parseInt(value.replace(/[^0-9]/g, ""))
    const suffix = value.replace(/[0-9]/g, "")
    const duration = 2000
    const counter = setInterval(() => {
      startValue += Math.ceil(endValue / 20)
      if (startValue > endValue) {
        clearInterval(counter)
        setDisplayValue(`${endValue}${suffix}`)
      } else {
        setDisplayValue(`${startValue}${suffix}`)
      }
    }, duration / 20)

    return () => clearInterval(counter)
  }, [isInView, value])

  return <span ref={ref}>{displayValue}</span>
}

/** MAIN LANDING PAGE **/
function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  return (
    <div className="relative bg-gray-200 flex flex-col space-y-6 max-w-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
      <AboutSection />
      <ContactSection />

      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: scrollY > 300 ? 1 : 0,
          scale: scrollY > 300 ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </motion.button>
      </motion.div>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Decentralized AI Platform</h3>
            <p className="text-gray-400">
              Empowering the future of AI through decentralized computing and blockchain technology.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/features" className="text-gray-400 hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-400 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-400 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </a>
            </div>
            <p className="mt-4 text-gray-400">Subscribe to our newsletter for updates</p>
            <div className="mt-2 flex">
              <input type="email" placeholder="Your email" className="px-4 py-2 rounded-l-md text-gray-900 w-full" />
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-md transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          &copy; {new Date().getFullYear()} Decentralized AI Platform. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

export default LandingPage;