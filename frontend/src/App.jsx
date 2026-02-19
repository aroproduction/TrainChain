import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import UserProtectWrapper from './wrapper/UserProtectedWrapper';
import DashboardLayout from './Layout/DashboardLayout';
import LandingPage from './pages/landingPage';
import Login from './pages/login';
import Home from './pages/Home';
import Contributor from './pages/contributor/Contributor';
import Requester from './pages/requester/Requester';
import About from './pages/About';
import Contact from './pages/Contact';
import TeamMembers from './pages/Team';
import Cursor_layout from './Layout/cursor';

const App = () => {
  return (
    <>
      <Cursor_layout />
      <Routes>
        {/* Public routes (keep Navbar) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/meet-team" element={<TeamMembers />} />

        {/* Authenticated routes with Sidebar layout */}
        <Route element={<UserProtectWrapper><DashboardLayout /></UserProtectWrapper>}>
          <Route path="/home" element={<Home />} />
          <Route path="/requester" element={<Requester />} />
          <Route path="/my-requests" element={<Navigate to="/requester?tab=my-jobs" replace />} />
          <Route path="/contributor" element={<Contributor />} />
        </Route>
      </Routes>
    </>
  )
}

export default App