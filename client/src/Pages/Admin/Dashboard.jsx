import React from 'react';
import { useNavigate } from 'react-router-dom';
import img from '../../assets/icon.png';

const Dashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900">
            {/* ── SIDEBAR ── */}
            <aside className="w-72 bg-[#0f172a] text-white flex flex-col shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-3">
                        <div className="p-1 bg-white rounded-full shadow-lg shadow-orange-500/20">
                            {/* THE LOGO STYLE FROM APP.JS */}
                            <img 
                                src={img} 
                                alt="Cebu Taste" 
                                style={{ width: 42, height: 42, borderRadius: '50%', background: '#fff', objectFit: 'cover' }} 
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight leading-none">
                                Taste<span className="text-orange-500">Cebu</span>
                            </h2>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Management</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <p className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
                    
                    {[
                        { name: 'Dashboard', icon: '📊', active: true },
                        { name: 'Products', icon: '🍱', active: false },
                        { name: 'Orders', icon: '📦', active: false },
                        { name: 'Categories', icon: '📂', active: false },
                        { name: 'Customers', icon: '👥', active: false },
                    ].map((item) => (
                        <button 
                            key={item.name}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                item.active 
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            <span className="text-lg">{item.icon}</span> {item.name}
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-bold text-sm"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-10 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dashboard</h1>
                        <p className="text-xl font-black text-slate-800">Analytics Overview</p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-slate-400 hover:text-orange-500 transition-colors">
                            <span className="text-xl">🔔</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        
                        <div className="h-10 w-px bg-slate-200"></div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900">{user?.first_name || 'Administrator'}</p>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-tight">Super Admin</p>
                            </div>
                            <div className="w-11 h-11 bg-linear-to-tr from-orange-500 to-orange-400 text-white rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-orange-500/20 transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                                {user?.first_name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 space-y-10">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: 'Total Revenue', value: '₱ 0.00', color: 'bg-blue-500', icon: '💰' },
                            { label: 'Active Orders', value: '0', color: 'bg-orange-500', icon: '🛍️' },
                            { label: 'Total Customers', value: '0', color: 'bg-emerald-500', icon: '✨' },
                        ].map((stat) => (
                            <div key={stat.label} className="group bg-white p-8 rounded-4xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden">
                                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-[0.03] rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform`}></div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{stat.value}</h3>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all text-2xl">
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center gap-2">
                                    <span className="text-emerald-500 font-bold text-xs">↑ 0%</span>
                                    <span className="text-slate-300 text-xs font-medium">vs last month</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Work Area */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-12 min-h-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-orange-500/20 to-transparent"></div>
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-4xl mb-6 grayscale opacity-50">
                            🏗️
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">Welcome to the Command Center</h2>
                        <p className="text-slate-400 max-w-md mt-3 leading-relaxed">
                            Everything is set up and ready to go. Use the sidebar to manage your inventory, track deliveries, and view customer growth.
                        </p>
                        <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-slate-900/10">
                            Quick Start Guide
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;