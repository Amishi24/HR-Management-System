// src/App.jsx
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeftRight, HeartPulse, Menu } from 'lucide-react';
import { mockEmployees, mockTransfers } from './data/mockDb';

// --- MINIMAL COLLAPSIBLE SIDEBAR ---
function Sidebar() {
  const location = useLocation();
  // 1. Add state to track if sidebar is minimized
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} strokeWidth={1.5} /> },
    { name: 'Directory', path: '/employees', icon: <Users size={18} strokeWidth={1.5} /> },
    { name: 'Transfers', path: '/transfers', icon: <ArrowLeftRight size={18} strokeWidth={1.5} /> },
    { name: 'Medical', path: '/medical', icon: <HeartPulse size={18} strokeWidth={1.5} /> },
  ];

  return (
    // 2. Dynamic width classes: w-20 when collapsed, w-64 when open, with smooth transition
    <div className={`bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
      
      {/* 3. Header & Toggle Button Area */}
      <div className={`flex items-center mt-6 mb-8 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
        {!isCollapsed && (
          <div>
            <h1 className="text-sm font-semibold tracking-widest text-gray-900 uppercase">HR Admin</h1>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
      </div>
      
      {/* 4. Navigation Links */}
      <nav className="flex flex-col px-3 gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              title={isCollapsed ? item.name : ""} // Adds a native browser tooltip when collapsed
              className={`flex items-center rounded-md text-sm transition-all duration-200 ${
                isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'
              } ${
                isActive 
                  ? 'bg-gray-50 text-black font-medium' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className={`${isActive ? 'text-black' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              {/* Only show the text label if the sidebar is NOT collapsed */}
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// --- MINIMAL DASHBOARD ---
function Dashboard() {
  return (
    <div className="max-w-5xl">
      <h2 className="text-xl font-medium text-gray-900 mb-8">System Overview</h2>
      
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Active Employees</p>
          <p className="text-3xl font-light text-gray-900">{mockEmployees.length}</p>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Pending Transfers</p>
          <p className="text-3xl font-light text-gray-900">{mockTransfers.length}</p>
        </div>
        
        <div className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Medical Requests</p>
            <p className="text-3xl font-light text-gray-900">1</p>
          </div>
          <span className="flex h-2 w-2 rounded-full bg-red-400 mt-1"></span>
        </div>
      </div>
    </div>
  );
}

// --- PLACEHOLDER ---
function Placeholder({ title }) {
  return (
    <div className="py-12 px-6 text-center border border-dashed border-gray-200 rounded-lg mt-8 max-w-3xl bg-white">
      <h2 className="text-lg font-medium text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500">Component pending construction.</p>
    </div>
  );
}

// --- MAIN LAYOUT ---
export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-[#FAFAFA] font-sans">
        <Sidebar />
        <main className="flex-1 p-10 transition-all duration-300 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Placeholder title="Employee Directory" />} />
            <Route path="/transfers" element={<Placeholder title="Transfer Board" />} />
            <Route path="/medical" element={<Placeholder title="Medical Approvals" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}