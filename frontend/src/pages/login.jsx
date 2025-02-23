import React, { useState, useContext } from 'react';
import Web3 from 'web3';
import { UserContext } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { saveAddress } = useContext(UserContext);
  const navigate = useNavigate();

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];
        saveAddress(userAddress);
        navigate('/home');
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-300"> 
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
        className="bg-gray-100 shadow-2xl rounded-2xl p-10 max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to Decentralized AI</h1>
        <p className="text-lg text-gray-700 mb-6">Connect your MetaMask wallet to get started.</p>
        <motion.button 
          onClick={connectWallet} 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold shadow-md transition-all duration-300"
          disabled={loading}
        >
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </motion.button>
        <p className="text-sm text-gray-500 mt-4">Ensure MetaMask is installed and unlocked.</p>
      </motion.div>
    </div>
  );
};

export default Login;
