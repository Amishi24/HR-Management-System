// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, ArrowLeftRight, HeartPulse, GraduationCap } from 'lucide-react';
import { mockEmployees, mockTransfers } from './data/mockDb';

// --- SIDEBAR COMPONENT ---
function Sidebar() {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Directory', path: '/employees', icon: <Users size={20} /> },
    { name: 'Transfer Board', path: '/transfers', icon: <ArrowLeftRight size={20} /> },
    { name: 'Medical Approvals', path: '/medical', icon: <HeartPulse size={20} /> },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold tracking-wider text-blue-400">HR ADMIN</h1>
        <p className="text-xs text-slate-400">Manpower Rotation Engine</p>
      </div>
      
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// --- DUMMY VIEWS (To be expanded later) ---
function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">System Overview</h2>
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 font-medium">Active Employees</p>
          <p className="text-3xl font-bold text-slate-800">{mockEmployees.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 font-medium">Pending Transfers</p>
          <p className="text-3xl font-bold text-blue-600">{mockTransfers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-slate-500 font-medium">Medical Requests</p>
          <p className="text-3xl font-bold text-red-500">1</p>
        </div>
      </div>
    </div>
  );
}

function Placeholder({ title }) {
  return <div className="p-8 text-center text-slate-500 mt-20 border-2 border-dashed border-slate-300 rounded-xl">
    <h2 className="text-xl font-bold mb-2">{title} Page</h2>
    <p>We will build this component next.</p>
  </div>;
}

// --- MAIN APP ROUTER ---
export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
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