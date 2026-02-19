import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  Briefcase,
  Database,
  CreditCard,
  Search,
  Download,
  DollarSign,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Award,
  Monitor,
} from 'lucide-react';
import { UserContext } from '../context/UserContext';
import logo from '../assets/TrainChain_logo.png';

// Sidebar nav items per route context
const homeSidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/home', tab: null },
  { label: 'Wallet', icon: Wallet, path: '/home', tab: 'wallet' },
];

const requesterSidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/home', tab: null },
  { label: 'Create Job', icon: PlusCircle, path: '/requester', tab: 'create-job' },
  { label: 'My Jobs', icon: Briefcase, path: '/requester', tab: 'my-jobs' },
  { label: 'Datasets', icon: Database, path: '/requester', tab: 'datasets' },
  { label: 'Payments', icon: CreditCard, path: '/requester', tab: 'payments' },
  { label: 'Wallet', icon: Wallet, path: '/requester', tab: 'wallet' },
];

const contributorSidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/home', tab: null },
  { label: 'Available Jobs', icon: Search, path: '/contributor', tab: 'available-jobs' },
  { label: 'My Contributions', icon: Layers, path: '/contributor', tab: 'my-contributions' },
  { label: 'Earnings', icon: DollarSign, path: '/contributor', tab: 'earnings' },
  { label: 'Wallet', icon: Wallet, path: '/contributor', tab: 'wallet' },
  { label: 'Download Training App', icon: Download, path: '/contributor', tab: 'download-app', highlighted: true },
];

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearAddress } = useContext(UserContext);

  // Responsive: open by default on lg+, closed on small
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  // Listen for resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location.pathname, location.search]);

  const toggleSidebar = useCallback(() => setIsOpen(prev => !prev), []);

  const handleLogout = () => {
    clearAddress();
    navigate('/');
  };

  // Determine which sidebar items to show based on current route
  const getSidebarItems = () => {
    if (location.pathname.startsWith('/requester') || location.pathname.startsWith('/my-requests')) {
      return requesterSidebarItems;
    }
    if (location.pathname.startsWith('/contributor')) {
      return contributorSidebarItems;
    }
    return homeSidebarItems;
  };

  const sidebarItems = getSidebarItems();
  const currentTab = searchParams.get('tab');

  // Check if an item is active
  const isActive = (item) => {
    // Dashboard item (goes to /home with no tab)
    if (item.path === '/home' && item.tab === null) {
      return location.pathname === '/home' && !currentTab;
    }
    // Items with tabs
    if (item.tab) {
      return location.pathname === item.path && currentTab === item.tab;
    }
    return location.pathname === item.path;
  };

  // Build link href
  const getItemHref = (item) => {
    if (item.tab) {
      return `${item.path}?tab=${item.tab}`;
    }
    return item.path;
  };

  // Sidebar animation variants
  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  };

  // Backdrop for mobile
  const backdropVariants = {
    open: { opacity: 1, transition: { duration: 0.3 } },
    closed: { opacity: 0, transition: { duration: 0.3 } },
  };

  // Stagger children
  const containerVariants = {
    open: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
    closed: {},
  };

  const itemVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    },
    closed: {
      opacity: 0,
      x: -20,
    },
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-[60] lg:hidden p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle sidebar"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={22} className="text-gray-700" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Menu size={22} className="text-gray-700" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Mobile backdrop overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45]"
            variants={backdropVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="fixed top-0 left-0 h-full z-[50] w-[260px] bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 shadow-2xl flex flex-col sidebar-container"
        variants={sidebarVariants}
        initial={isOpen ? 'open' : 'closed'}
        animate={isOpen ? 'open' : 'closed'}
      >
        {/* Logo section */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-800/80">
          <Link to="/home" className="flex items-center gap-2 group">
            <img
              src={logo}
              alt="TrainChain Logo"
              className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        </div>

        {/* Navigation items */}
        <motion.nav
          className="flex-1 px-3 py-4 overflow-y-auto sidebar-scrollbar"
          variants={containerVariants}
          initial="closed"
          animate={isOpen ? 'open' : 'closed'}
        >
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const highlighted = item.highlighted;

              return (
                <motion.div key={item.label} variants={itemVariants}>
                  <Link
                    to={getItemHref(item)}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200 relative overflow-hidden
                      ${active
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                        : highlighted
                          ? 'sidebar-download-btn text-emerald-300 hover:text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"
                        layoutId="activeIndicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    {/* Highlighted glow effect for download button */}
                    {highlighted && !active && (
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30" />
                    )}

                    <Icon
                      size={18}
                      className={`flex-shrink-0 relative z-10 transition-transform duration-200 group-hover:scale-110 ${
                        active ? 'text-white' : highlighted && !active ? 'text-emerald-400' : ''
                      }`}
                    />
                    <span className="relative z-10 truncate">{item.label}</span>

                    {/* Highlighted badge for download */}
                    {highlighted && !active && (
                      <span className="relative z-10 ml-auto px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 rounded-md border border-emerald-500/40">
                        New
                      </span>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.nav>

        {/* Bottom section - Logout */}
        <div className="px-3 py-4 border-t border-gray-800/80">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut
              size={18}
              className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span>Logout</span>
          </motion.button>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2">
          <motion.button
            onClick={toggleSidebar}
            className="p-1.5 rounded-full bg-gray-800 border border-gray-700 shadow-lg hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Collapse sidebar"
          >
            <motion.div
              animate={{ rotate: isOpen ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={14} className="text-gray-400" />
            </motion.div>
          </motion.button>
        </div>
      </motion.aside>

      {/* Spacer to push content when sidebar is open on desktop */}
      <div
        className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${
          isOpen ? 'w-[260px]' : 'w-0'
        }`}
      />
    </>
  );
}

export default Sidebar;
