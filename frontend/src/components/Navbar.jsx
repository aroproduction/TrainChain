import React, { useContext, useState } from 'react';
import { Menu } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import logo from '../assets/TrainChain_logo.png';

function Navbar() {

    const { scrollY } = useScroll();
    const height = useTransform(scrollY, [0, 100], [80, 60]); // Shrinks from 80px to 60px
    const opacity = useTransform(scrollY, [0, 100], [1, 0.7]);
    const bgColor = useTransform(scrollY, [0, 100], ["#ffffff", "#f3f4f6"]);
    const { userAddress, clearAddress } = useContext(UserContext);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    function logoutHandler() {
        clearAddress();
        navigate('/');
    };


    return (
        <motion.nav
            style={{ height, opacity, backgroundColor: bgColor }}
            className="fixed top-0 left-0 max-w-screen w-full shadow-md z-50 flex items-center px-4 py-4 justify-between"
        >
            {/* <div className="text-gray-900 font-bold text-2xl">TrainChain</div> */}
            <Link to="/home" className="flex items-center space-x-2">
                <img src={logo} alt="TrainChain Logo" className='h-12 w-30' />
            </Link>
            <div className="hidden md:flex space-x-6">
                <Link to="/home" className="text-gray-600 hover:bg-gray-800 hover:text-white transition-colors duration-700 py-2 px-3 rounded-xl">Home</Link>
                <a href="#about" className="text-gray-600 hover:bg-gray-800 hover:text-white transition-colors duration-700 py-2 px-3 rounded-xl">About</a>
                <a href="#contact" className="text-gray-600 hover:bg-gray-800 hover:text-white transition-colors duration-700 py-2 px-3 rounded-xl">Contact</a>
            </div>
            {!userAddress && <Link to="/home" className="hidden md:block px-6 py-2 bg-blue-500 text-white rounded-md font-semibold shadow-md hover:bg-blue-600">Login</Link>}
            {userAddress && <button onClick={logoutHandler} className="hidden md:block px-6 py-2 bg-red-500 text-white rounded-md font-semibold shadow-md hover:bg-red-600">Logout</button>}
            <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
                <Menu size={28} />
            </button>
            {isOpen && (
                <div className="absolute top-16 right-6 bg-white shadow-lg rounded-md flex flex-col w-48 p-4 space-y-4 md:hidden">
                    {!userAddress && <Link to="/login" className="px-6 py-2 bg-blue-500 text-white rounded-md font-semibold shadow-md hover:bg-blue-600 w-full">Login</Link>}
                    <Link to="/home" className="px-6 py-2 text-gray-600 hover:text-gray-900">Home</Link>
                    <a href="#about" className="px-6 py-2 text-gray-600 hover:text-gray-900">About</a>
                    <a href="#contact" className="px-6 py-2 text-gray-600 hover:text-gray-900">Contact</a>
                    {userAddress && <button onClick={logoutHandler} className="px-6 py-2 bg-red-500 text-white rounded-md font-semibold shadow-md hover:bg-red-600 w-full">Logout</button>}
                </div>
            )}
        </motion.nav>
    );
}

export default Navbar;