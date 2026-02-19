import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/* ── Background layers rendered inside main scroll area ── */

function RequesterBackground() {
  return (
    <div className="fixed inset-0 w-full h-full bg-white overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 opacity-50 rounded-full blur-[150px] splash" />
      <div className="absolute top-40 right-20 w-80 h-80 bg-purple-300 opacity-50 rounded-full blur-[150px] splash" />
      <div className="absolute bottom-20 left-40 w-96 h-96 bg-pink-300 opacity-50 rounded-full blur-[150px] splash" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-300 opacity-50 rounded-full blur-[150px] splash" />
      <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-yellow-300 opacity-50 rounded-full blur-[150px] splash" />
      <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-red-300 opacity-50 rounded-full blur-[150px] splash" />
    </div>
  );
}

function ContributorBackground() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)',
          backgroundSize: '35px 35px',
        }}
      />
      <div className="absolute -top-32 -left-16 w-96 h-96 bg-emerald-400 opacity-15 blur-[120px] rounded-full" />
      <div className="absolute bottom-10 -right-20 w-[500px] h-[500px] bg-green-400 opacity-15 blur-[120px] rounded-full" />
      <div className="absolute top-1/4 -left-10 w-80 h-80 bg-amber-600 opacity-15 blur-[120px] rounded-full" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-yellow-400 opacity-15 blur-[120px] rounded-full" />
    </div>
  );
}

function DashboardLayout() {
  const location = useLocation();

  const isRequester =
    location.pathname.startsWith('/requester') ||
    location.pathname.startsWith('/my-requests');
  const isContributor = location.pathname.startsWith('/contributor');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto dashboard-main relative">
        {/* Route-specific persistent background */}
        {isRequester && <RequesterBackground />}
        {isContributor && <ContributorBackground />}
        {!isRequester && !isContributor && (
          <div className="absolute inset-0 bg-gray-50 pointer-events-none" style={{ zIndex: 0 }} />
        )}
        {/* Page content above background */}
        <div className="relative" style={{ zIndex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
