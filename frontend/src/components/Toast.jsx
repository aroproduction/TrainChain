import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useEffect } from "react";

const Toast = ({ id, type = "info", message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      gradient: "from-emerald-400 via-green-500 to-teal-600",
      bgGradient: "from-emerald-50/95 via-green-50/95 to-teal-50/95",
      iconColor: "text-green-600",
      textColor: "text-green-900",
      shadowColor: "shadow-green-500/50",
      glowColor: "rgba(16, 185, 129, 0.4)",
    },
    error: {
      icon: XCircle,
      gradient: "from-rose-400 via-red-500 to-pink-600",
      bgGradient: "from-rose-50/95 via-red-50/95 to-pink-50/95",
      iconColor: "text-red-600",
      textColor: "text-red-900",
      shadowColor: "shadow-red-500/50",
      glowColor: "rgba(239, 68, 68, 0.4)",
    },
    warning: {
      icon: AlertTriangle,
      gradient: "from-amber-400 via-orange-500 to-yellow-600",
      bgGradient: "from-amber-50/95 via-orange-50/95 to-yellow-50/95",
      iconColor: "text-orange-600",
      textColor: "text-orange-900",
      shadowColor: "shadow-orange-500/50",
      glowColor: "rgba(249, 115, 22, 0.4)",
    },
    info: {
      icon: Info,
      gradient: "from-blue-400 via-indigo-500 to-purple-600",
      bgGradient: "from-blue-50/95 via-indigo-50/95 to-purple-50/95",
      iconColor: "text-blue-600",
      textColor: "text-blue-900",
      shadowColor: "shadow-blue-500/50",
      glowColor: "rgba(59, 130, 246, 0.4)",
    },
  };

  const { icon: Icon, gradient, bgGradient, iconColor, textColor, shadowColor, glowColor } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.34, 1.56, 0.64, 1],
        scale: { type: "spring", stiffness: 300, damping: 20 }
      }}
      className="relative"
    >
      {/* Animated glow effect */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-r ${gradient} rounded-3xl blur-lg opacity-60`}
        animate={{ 
          scale: [1, 1.05, 1],
          opacity: [0.6, 0.8, 0.6]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ boxShadow: `0 0 30px ${glowColor}` }}
      />
      
      {/* Main toast card */}
      <div className={`relative bg-gradient-to-br ${bgGradient} backdrop-blur-xl border-2 border-white/50 rounded-3xl p-6 shadow-2xl ${shadowColor} min-w-[400px] max-w-[500px]`}>
        {/* Top gradient accent */}
        {/* <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient} rounded-t-3xl`} /> */}
        
        <div className="flex items-start gap-4">
          {/* Animated icon container */}
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ 
              duration: 0.6,
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1
            }}
            className={`relative p-3 bg-gradient-to-br ${gradient} rounded-2xl shadow-lg flex-shrink-0`}
          >
            <Icon size={24} className="text-white drop-shadow-lg" />
            
            {/* Icon pulse effect */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl`}
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          
          {/* Message */}
          <div className="flex-1 pt-1">
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className={`${textColor} font-semibold text-base leading-relaxed`}
            >
              {message}
            </motion.p>
          </div>
          
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onClose(id)}
            className={`${iconColor} hover:bg-white/30 p-2 rounded-xl transition-all duration-200 flex-shrink-0`}
          >
            <X size={20} />
          </motion.button>
        </div>
        
        {/* Progress bar */}
        {duration && (
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} rounded-b-3xl origin-left`}
          />
        )}
      </div>
    </motion.div>
  );
};

export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] pointer-events-none">
      <div className="flex flex-col gap-4 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} onClose={onClose} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Toast;
