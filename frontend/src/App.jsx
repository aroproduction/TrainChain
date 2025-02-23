import React from 'react'
import { Routes, Route } from 'react-router-dom';
// import { AnimatePresence } from "framer-motion";
import UserProtectWrapper from './wrapper/UserProtectedWrapper';
import LandingPage from './pages/landingPage';
import Login from './pages/login';
import Home from './pages/Home';
import Contributor from './pages/Contributor';
import Requester from './pages/Requester';
import MyRequests from './pages/MyRequests';

const App = () => {
  return (
    // <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<UserProtectWrapper><Home /></UserProtectWrapper>} />
        <Route path="/requester" element={<UserProtectWrapper><Requester /></UserProtectWrapper>} />
        <Route path="/my-requests" element={<UserProtectWrapper><MyRequests /></UserProtectWrapper>} />
        <Route path="/contributor" element={<UserProtectWrapper><Contributor /></UserProtectWrapper>} />
      </Routes>
    // </AnimatePresence>
  )
}

export default App