import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AnimatePresence } from 'framer-motion';

/** BACKGROUND DECORATION COMPONENTS **/
function HeroBackground() {
  return (
    <>
      <div className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-pink-300 opacity-50 blur-3xl rounded-full" />
      <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-blue-300 opacity-50 blur-3xl rounded-full" />
      <div className="absolute top-[40%] right-[-80px] w-64 h-64 bg-yellow-300 opacity-40 blur-2xl rounded-full" />
    </>
  );
}

function FeaturesBackground() {
  return (
    <>
      <div className="absolute top-[-60px] left-[20%] w-72 h-72 bg-green-300 opacity-50 blur-2xl rounded-full" />
      <div className="absolute bottom-[-60px] right-[10%] w-80 h-60 bg-purple-300 opacity-60 blur-2xl rounded-full" />
    </>
  );
}

function AboutBackground() {
  return (
    <>
      <div className="absolute top-[30%] left-[-70px] w-64 h-64 bg-orange-400 opacity-65 blur-2xl rounded-full animate-spin" />
    </>
  );
}

function ContactBackground() {
  return (
    <>
      <div className="absolute bottom-0 right-[-40px] w-80 h-80 bg-red-500 opacity-50 blur-3xl rounded-full animate-pulse" />
    </>
  );
}

function AnimatedText() {
  // The constant prefix that will always be visible.
  const prefix = "Empower "
  // Suffixes for the three sentences; only these parts will animate.
  const suffixes = [
    "AI Shape the Future",
    "GPUs Fuel the Revolution",
    "Next-Gen AI Training"
  ]

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [displayedSuffix, setDisplayedSuffix] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Set a fast typing/deleting speed
  const typingSpeed = 30 // in ms
  const pauseTime = 1000  // pause time in ms when the suffix is fully typed/deleted

  useEffect(() => {
    const currentSuffix = suffixes[currentSentenceIndex]
    let timeout;

    if (!isDeleting && displayedSuffix === currentSuffix) {
      // When the current suffix is fully typed, wait before starting deletion.
      timeout = setTimeout(() => setIsDeleting(true), pauseTime)
    } else if (isDeleting && displayedSuffix === '') {
      // When deletion is complete, wait before switching to the next suffix.
      timeout = setTimeout(() => {
        setIsDeleting(false)
        setCurrentSentenceIndex((prev) => (prev + 1) % suffixes.length)
      }, pauseTime)
    } else {
      // Continue typing or deleting one character at a time.
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
      {prefix}<br />
      <span className={`transition-all duration-300`}>
        {displayedSuffix}
      </span>
    </h1>
  )
}

/** HERO SECTION **/
function HeroSection() {
  return (
    <section
      id="hero"
      className={`relative h-screen flex flex-col justify-center items-center bg-white overflow-hidden shadow-lg rounded-lg py-6 px-3 gap-7`}
    >
      <HeroBackground />
      <div className="relative z-10 text-center px-4">
        {/* Animated text header with a constant prefix */}
        <AnimatedText />
        <p className={`mb-10 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto`}>
          Train AI models through decentralized computation and blockchain technology.
        </p>
        <Link
          to="/home"
          className={`mt-3 px-8 py-4 bg-blue-600 hover:bg-blue-800 rounded-md text-white text-lg font-mono font-bold shadow-md `}
        >
          Get Started
        </Link>
      </div>
    </section>
  )
}

/** FEATURES SECTION **/
function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative min-h-screen flex flex-col justify-center items-center bg-gray-50 py-20 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <FeaturesBackground />
      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl font-bold text-center text-gray-900 mb-12"
      >
        Features
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['Secure Transactions', 'Decentralized Network', 'AI Model Training', 'IPFS for Data Storage', 'Token-Based Incentives', 'Intuitive User Interface'].map(
          (feature, index) => (
            <motion.div
              key={index}
              className="p-8 bg-white rounded-lg shadow-md"
              whileHover={{ scale: 1.05 }}
            >
              <h3 className="text-2xl font-semibold mb-3 text-gray-800">
                {feature}
              </h3>
            </motion.div>
          )
        )}
      </div>
    </section>
  )
}

function AboutSection() {
  const [activeIndex, setActiveIndex] = useState(null);
  const faqItems = [
    {
      question: "How does decentralized AI training work?",
      answer: "Our platform connects GPU providers with AI developers through blockchain technology, enabling secure and efficient distributed model training."
    },
    {
      question: "What hardware requirements are needed?",
      answer: "You need at least an NVIDIA RTX 2080 GPU, 16GB RAM, and a stable internet connection. Linux-based systems are recommended for best performance."
    },
    {
      question: "How are payments processed?",
      answer: "We use smart contracts to automatically distribute payments in cryptocurrency based on computational resources provided and tasks completed."
    }
  ];

  return (
    <section
      id="faq"
      className="relative min-h-screen flex flex-col justify-center items-center bg-white py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <div className="absolute top-[30%] left-[-70px] w-64 h-64 bg-purple-300 opacity-65 blur-2xl rounded-full animate-spin" />

      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl font-bold text-gray-900 mb-12 text-center"
      >
        Frequently Asked Questions
      </motion.h2>

      <div className="w-full max-w-3xl space-y-4">
        {faqItems.map((item, index) => (
          <motion.div
            key={index}
            className="cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <div
              className="p-6 bg-gray-50 rounded-lg shadow-sm"
              onClick={() => setActiveIndex(activeIndex === index ? null : index)}
            >
              <h3 className="text-xl font-semibold text-gray-800">
                {item.question}
              </h3>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.p
                    key="answer" // Add key for proper animation
                    initial={{ opacity: 0, maxHeight: 0 }}
                    animate={{ opacity: 1, maxHeight: 1000 }}
                    exit={{ opacity: 0, maxHeight: 0 }}
                    className="pt-4 text-gray-600 overflow-hidden"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {item.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/** CONTACT SECTION **/
function ContactSection() {
  const stats = [
    { number: "10K+", label: "GPUs Connected", icon: "💻" },
    { number: "5M+", label: "Tasks Completed", icon: "✅" },
    { number: "99.9%", label: "Uptime", icon: "⏱️" }
  ];

  return (
    <section
      id="stats"
      className="relative min-h-screen flex flex-col justify-center items-center bg-white py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
    >
      <div className="absolute top-[-50px] right-[-50px] w-96 h-96 bg-white opacity-40 blur-3xl rounded-full animate-float" />
      <div className="absolute bottom-[-50px] left-[-50px] w-96 h-96 bg-white opacity-40 blur-3xl rounded-full animate-float-delayed" />
      <ContactBackground />

      <motion.h2
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-4xl font-bold text-gray-900 mb-12 text-center"
      >
        Powering the Future of AI
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            className="p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -100px 0px" }}
            transition={{ delay: index * 0.2, type: "spring" }}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div
                className="text-5xl mb-4"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
              >
                {stat.icon}
              </motion.div>
              <motion.div
                className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent z-10"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {stat.number}
              </motion.div>
              <p className="text-xl text-gray-600 mt-2">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <p className="text-xl text-gray-600 mb-4">
          Join thousands of contributors shaping AI's future
        </p>
      </motion.div>
    </section>
  );
}

/** MAIN LANDING PAGE **/
function LandingPage() {
  return (
    <div className="relative bg-gray-200 flex flex-col space-y-6 max-w-screen overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <ContactSection />
      <footer className="bg-white border-t border-gray-200 text-gray-600 py-4 text-center">
        &copy; {new Date().getFullYear()} Decentralized AI Platform. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;


// import React, { useState, useEffect, useRef } from 'react';
// import gsap from 'gsap';
// import { motion } from 'framer-motion';
// import { Link } from 'react-router-dom';
// import Navbar from '../components/Navbar';
// import { AnimatePresence } from 'framer-motion';

// // Common background components and sections remain the same
// // ... (Keep all background components and section components identical to your original code)

// /** BACKGROUND DECORATION COMPONENTS **/
// function HeroBackground() {
//   return (
//     <>
//       <div className="absolute top-[-50px] left-[-50px] w-80 h-80 bg-pink-300 opacity-50 blur-3xl rounded-full" />
//       <div className="absolute bottom-[-50px] right-[-50px] w-96 h-96 bg-blue-300 opacity-50 blur-3xl rounded-full" />
//       <div className="absolute top-[40%] right-[-80px] w-64 h-64 bg-yellow-300 opacity-40 blur-2xl rounded-full" />
//     </>
//   )
// }

// function FeaturesBackground() {
//   return (
//     <>
//       <div className="absolute top-[-60px] left-[20%] w-72 h-72 bg-green-300 opacity-50 blur-[120px] rounded-full" />
//       <div className="absolute bottom-[-60px] right-[10%] w-80 h-60 bg-purple-300 opacity-60 blur-[120px] rounded-full" />
//     </>
//   )
// }

// function AboutBackground() {
//   return (
//     <>
//       <div className="absolute top-[30%] left-[-70px] w-64 h-64 bg-orange-400 opacity-65 blur-2xl rounded-full animate-spin" />
//     </>
//   )
// }

// function ContactBackground() {
//   return (
//     <>
//       <div className="absolute bottom-0 right-[-40px] w-80 h-80 bg-red-500 opacity-50 blur-3xl rounded-full animate-pulse" />
//     </>
//   )
// }

// function AnimatedText() {
//   // The constant prefix that will always be visible.
//   const prefix = "Empower "
//   // Suffixes for the three sentences; only these parts will animate.
//   const suffixes = [
//     "AI Shape the Future",
//     "GPUs Fuel the Revolution",
//     "Next-Gen AI Training"
//   ]

//   const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
//   const [displayedSuffix, setDisplayedSuffix] = useState('')
//   const [isDeleting, setIsDeleting] = useState(false)

//   // Set a fast typing/deleting speed
//   const typingSpeed = 30 // in ms
//   const pauseTime = 1000  // pause time in ms when the suffix is fully typed/deleted

//   useEffect(() => {
//     const currentSuffix = suffixes[currentSentenceIndex]
//     let timeout;

//     if (!isDeleting && displayedSuffix === currentSuffix) {
//       // When the current suffix is fully typed, wait before starting deletion.
//       timeout = setTimeout(() => setIsDeleting(true), pauseTime)
//     } else if (isDeleting && displayedSuffix === '') {
//       // When deletion is complete, wait before switching to the next suffix.
//       timeout = setTimeout(() => {
//         setIsDeleting(false)
//         setCurrentSentenceIndex((prev) => (prev + 1) % suffixes.length)
//       }, pauseTime)
//     } else {
//       // Continue typing or deleting one character at a time.
//       timeout = setTimeout(() => {
//         const updatedSuffix = isDeleting
//           ? currentSuffix.substring(0, displayedSuffix.length - 1)
//           : currentSuffix.substring(0, displayedSuffix.length + 1)
//         setDisplayedSuffix(updatedSuffix)
//       }, typingSpeed)
//     }

//     return () => clearTimeout(timeout)
//   }, [displayedSuffix, isDeleting, currentSentenceIndex, suffixes])

//   return (
//     <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-5 md:mb-10 min-h-[180px] lg:min-h-[160px]">
//       {prefix}<br />
//       <span className={`transition-all duration-300`}>
//         {displayedSuffix}
//       </span>
//     </h1>
//   )
// }

// /** HERO SECTION **/
// function HeroSection() {
//   return (
//     <section
//       id="hero"
//       className={`relative h-screen flex flex-col justify-center items-center bg-white overflow-hidden shadow-lg rounded-lg py-6 px-3 gap-7`}
//     >
//       <HeroBackground />
//       <div className="relative z-10 text-center px-4">
//         {/* Animated text header with a constant prefix */}
//         <AnimatedText />
//         <p className={`mb-10 text-lg md:text-xl text-gray-700 max-w-3xl mx-auto`}>
//           Train AI models through decentralized computation and blockchain technology.
//         </p>
//         <Link
//           to="/home"
//           className={`mt-3 px-8 py-4 bg-blue-600 hover:bg-blue-800 rounded-md text-white text-lg font-mono font-bold shadow-md `}
//         >
//           Get Started
//         </Link>
//       </div>
//     </section>
//   )
// }

// /** FEATURES SECTION **/
// function FeaturesSection() {
//   return (
//     <section
//       id="features"
//       className="relative min-h-screen flex flex-col justify-center items-center bg-gray-50 py-20 overflow-hidden shadow-lg rounded-lg p-6"
//     >
//       <FeaturesBackground />
//       <motion.h2
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1 }}
//         className="text-4xl font-bold text-center text-gray-900 mb-12"
//       >
//         Features
//       </motion.h2>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//         {['Secure Transactions', 'Decentralized Network', 'AI Model Training', 'IPFS for Data Storage', 'Token-Based Incentives', 'Intuitive User Interface'].map(
//           (feature, index) => (
//             <motion.div
//               key={index}
//               className="p-8 bg-white rounded-lg shadow-md"
//               whileHover={{ scale: 1.05 }}
//             >
//               <h3 className="text-2xl font-semibold mb-3 text-gray-800">
//                 {feature}
//               </h3>
//             </motion.div>
//           )
//         )}
//       </div>
//     </section>
//   )
// }

// function AboutSection() {
//   const [activeIndex, setActiveIndex] = useState(null);
//   const faqItems = [
//     {
//       question: "How does decentralized AI training work?",
//       answer: "Our platform connects GPU providers with AI developers through blockchain technology, enabling secure and efficient distributed model training."
//     },
//     {
//       question: "What hardware requirements are needed?",
//       answer: "You need at least an NVIDIA RTX 2080 GPU, 16GB RAM, and a stable internet connection. Linux-based systems are recommended for best performance."
//     },
//     {
//       question: "How are payments processed?",
//       answer: "We use smart contracts to automatically distribute payments in cryptocurrency based on computational resources provided and tasks completed."
//     }
//   ];

//   return (
//     <section
//       id="faq"
//       className="relative min-h-screen flex flex-col justify-center items-center bg-white py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
//     >
//       <div className="absolute top-[30%] left-[-70px] w-64 h-64 bg-purple-300 opacity-65 blur-2xl rounded-full animate-spin" />

//       <motion.h2
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1 }}
//         className="text-4xl font-bold text-gray-900 mb-12 text-center"
//       >
//         Frequently Asked Questions
//       </motion.h2>

//       <div className="w-full max-w-3xl space-y-4">
//         {faqItems.map((item, index) => (
//           <motion.div
//             key={index}
//             className="cursor-pointer"
//             whileHover={{ scale: 1.02 }}
//           >
//             <div
//               className="p-6 bg-gray-50 rounded-lg shadow-sm"
//               onClick={() => setActiveIndex(activeIndex === index ? null : index)}
//             >
//               <h3 className="text-xl font-semibold text-gray-800">
//                 {item.question}
//               </h3>

//               <AnimatePresence>
//                 {activeIndex === index && (
//                   <motion.p
//                     key="answer" // Add key for proper animation
//                     initial={{ opacity: 0, maxHeight: 0 }}
//                     animate={{ opacity: 1, maxHeight: 1000 }}
//                     exit={{ opacity: 0, maxHeight: 0 }}
//                     className="pt-4 text-gray-600 overflow-hidden"
//                     transition={{ duration: 0.3, ease: "easeInOut" }}
//                   >
//                     {item.answer}
//                   </motion.p>
//                 )}
//               </AnimatePresence>
//             </div>
//           </motion.div>
//         ))}
//       </div>
//     </section>
//   )
// }

// /** CONTACT SECTION **/
// function ContactSection() {
//   return (
//     <section
//       id="contact"
//       className="relative min-h-screen flex flex-col justify-center items-center bg-gray-50 py-20 px-4 overflow-hidden shadow-lg rounded-lg p-6"
//     >
//       <ContactBackground />
//       <motion.h2
//         initial={{ opacity: 0, y: -30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1 }}
//         className="text-4xl font-bold text-gray-900 mb-8"
//       >
//         Get in Touch
//       </motion.h2>
//     </section>
//   )
// }

// // Device detection hook
// const useDeviceDetect = () => {
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => {
//       const isMobileDevice = window.innerWidth <= 1024 ||
//         (navigator.userAgent.match(/Android/i) ||
//           navigator.userAgent.match(/webOS/i) ||
//           navigator.userAgent.match(/iPhone/i) ||
//           navigator.userAgent.match(/iPad/i) ||
//           navigator.userAgent.match(/iPod/i) ||
//           navigator.userAgent.match(/BlackBerry/i) ||
//           navigator.userAgent.match(/Windows Phone/i));
//       setIsMobile(!!isMobileDevice);
//     };

//     checkMobile();
//     window.addEventListener('resize', checkMobile);
//     return () => window.removeEventListener('resize', checkMobile);
//   }, []);

//   return { isMobile };
// };

// // Main component selector
// const MainContent = ({ isMobile }) => {
//   return isMobile ? <MobileVersion /> : <DesktopVersion />;
// };

// // Mobile version components
// const MobileVersion = () => {
//   return (
//     <div className="relative bg-gray-200 flex flex-col space-y-6 max-w-screen overflow-x-hidden">
//       <Navbar />
//       <HeroSection />
//       <FeaturesSection />
//       <AboutSection />
//       <ContactSection />

//       <footer className="bg-white border-t border-gray-200 text-gray-600 py-4 text-center">
//         &copy; {new Date().getFullYear()} Decentralized AI Platform. All rights reserved.
//       </footer>
//     </div>
//   );
// };

// // Desktop version components (your fullpage implementation)
// /**
//   * FULLPAGE SECTION WRAPPER
//   * Each section is positioned so that its top is just below the navbar.
// */
// function FullpageSectionWrapper({ children }) {
//   return (
//     <section className="fp-section fixed top-16 left-0 w-full h-[calc(100vh-64px)] will-change-transform">
//       <div className="outer h-full w-full overflow-hidden will-change-transform">
//         <div className="inner h-full w-full overflow-hidden will-change-transform">
//           {children}
//         </div>
//       </div>
//     </section>
//   )
// }

// const tlDefaults = {
//   ease: 'slow.inOut',
//   duration: 1.2,
// }

// function DesktopVersion() {
//   const wrapper = useRef(null)
//   const pagination = useRef(null)
//   const listening = useRef(false)
//   const direction = useRef('down')
//   const currentSlide = useRef(0)
//   const nextSlide = useRef(0)

//   useEffect(() => {
//     const sections = wrapper.current.querySelectorAll('.fp-section')
//     const outerWrappers = gsap.utils.toArray('.outer')
//     const innerWrappers = gsap.utils.toArray('.inner')

//     // Set initial state
//     gsap.set(outerWrappers, { yPercent: 100 })
//     gsap.set(innerWrappers, { yPercent: -100 })
//     gsap.set(sections[0], { autoAlpha: 1, zIndex: 1 })
//     gsap.to(outerWrappers[0], { yPercent: 0, duration: 0 })
//     gsap.to(innerWrappers[0], { yPercent: 0, duration: 0 })

//     function slideIn() {
//       listening.current = true
//       const tl = gsap.timeline({
//         defaults: tlDefaults,
//         onComplete: () => {
//           listening.current = false
//           currentSlide.current = nextSlide.current
//         }
//       })

//       tl.to(outerWrappers[currentSlide.current], { yPercent: -100 })
//         .to(innerWrappers[currentSlide.current], { yPercent: 100 }, 0)
//         .to(outerWrappers[nextSlide.current], { yPercent: 0 }, 0)
//         .to(innerWrappers[nextSlide.current], { yPercent: 0 }, 0)
//       if (pagination.current) {
//         tl.to(pagination.current, {
//           width: `${((nextSlide.current + 1) / sections.length) * 100}%`,
//         }, 0)
//       }
//     }

//     function slideOut() {
//       listening.current = true
//       const tl = gsap.timeline({
//         defaults: tlDefaults,
//         onComplete: () => {
//           listening.current = false
//           currentSlide.current = nextSlide.current
//         }
//       })

//       tl.to(outerWrappers[currentSlide.current], { yPercent: 100 })
//         .to(innerWrappers[currentSlide.current], { yPercent: -100 }, 0)
//         .to(outerWrappers[nextSlide.current], { yPercent: 0 }, 0)
//         .to(innerWrappers[nextSlide.current], { yPercent: 0 }, 0)
//       if (pagination.current) {
//         tl.to(pagination.current, {
//           width: `${((nextSlide.current + 1) / sections.length) * 100}%`,
//         }, 0)
//       }
//     }

//     function handleWheel(e) {
//       if (listening.current) return
//       direction.current = e.deltaY > 0 ? 'down' : 'up'

//       // Prevent navigation beyond boundaries
//       if (direction.current === 'down' && currentSlide.current === sections.length - 1) return
//       if (direction.current === 'up' && currentSlide.current === 0) return

//       nextSlide.current = direction.current === 'down'
//         ? currentSlide.current + 1
//         : currentSlide.current - 1

//       direction.current === 'down' ? slideIn() : slideOut()
//     }

//     function handleKeydown(e) {
//       if (listening.current) return
//       if (e.code === 'ArrowDown' && currentSlide.current < sections.length - 1) {
//         nextSlide.current = currentSlide.current + 1
//         slideIn()
//       }
//       if (e.code === 'ArrowUp' && currentSlide.current > 0) {
//         nextSlide.current = currentSlide.current - 1
//         slideOut()
//       }
//     }

//     window.addEventListener('wheel', handleWheel)
//     window.addEventListener('keydown', handleKeydown)

//     return () => {
//       window.removeEventListener('wheel', handleWheel)
//       window.removeEventListener('keydown', handleKeydown)
//     }
//   }, [])

//   return (
//     <div className="relative bg-gray-200 max-w-screen overflow-x-hidden">
//       <Navbar />
//       {/* Progress Bar */}
//       {/* <div className="fixed top-16 z-50 w-full">
//         <div className="h-1 bg-gray-300/50 rounded-full shadow-sm">
//           <div
//             ref={pagination}
//             className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full
//                      transition-all duration-300 ease-out"
//             style={{ width: '0%' }}
//           />
//         </div>
//       </div> */}
//       {/* Fullpage slider container positioned just below the Navbar */}
//       <div className="fullpage-scroll relative h-[calc(100vh-64px)]" ref={wrapper}>
//         <FullpageSectionWrapper>
//           <HeroSection />
//         </FullpageSectionWrapper>
//         <FullpageSectionWrapper>
//           <FeaturesSection />
//         </FullpageSectionWrapper>
//         <FullpageSectionWrapper>
//           <AboutSection />
//         </FullpageSectionWrapper>
//         <FullpageSectionWrapper>
//           <ContactSection />
//         </FullpageSectionWrapper>


//       </div>
//       <footer className="bg-white border-t border-gray-200 text-gray-600 py-4 text-center">
//         &copy; {new Date().getFullYear()} Decentralized AI Platform. All rights reserved.
//       </footer>
//     </div>
//   )
// }
// // const DesktopVersion = () => {
// //   // ... (Keep all your existing FullpageLandingPage code exactly as written)
// //   // Rename FullpageLandingPage to DesktopVersion and maintain all code
// // };

// // Final combined component
// const LandingPage = () => {
//   const { isMobile } = useDeviceDetect();

//   return (
//     <MainContent isMobile={isMobile} />
//   );
// };

// export default LandingPage;