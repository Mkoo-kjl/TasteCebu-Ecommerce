import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import img from '../assets/cebutaste.png';
import icon from '../assets/icon.png';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (res.ok) {
                // Save user data for the Homepage to display "Hello, User!"
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // REDIRECT TO HOMEPAGE.JSX ROUTE
                // Ensure your App.js has: <Route path="/home" element={<Homepage />} />
                navigate('/Home'); 
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Cannot connect to server. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex overflow-hidden bg-white font-sans">
            
            {/* ── LEFT SIDE: HERO IMAGE ── */}
            <div className="hidden md:block relative flex-[1.2]">
                <img src={img} alt="Cebu Food" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-linear-to-r from-orange-600/40 to-transparent" />
                <div className="absolute bottom-10 left-10 flex items-center gap-3 p-3 px-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <img src={icon} alt="icon" className="w-8 h-8 rounded-full bg-white p-1" />
                    <span className="text-xl font-extrabold text-white tracking-tight">
                        Taste<span className="text-orange-200">Cebu</span>
                    </span>
                </div>
            </div>

            {/* ── RIGHT SIDE: LOGIN FORM ── */}
            <div className="relative flex-1 flex items-center justify-center bg-[#fffaf5] px-6 md:px-12">
                
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/5 rounded-full" />
                <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-orange-500/5 rounded-full" />

                <div className="w-full max-w-md z-10">
                    
                    {/* BACK BUTTON (KEPT AS REQUESTED) */}
                    <button 
                        onClick={() => navigate('/')} 
                        className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-400 text-white font-bold text-sm transition-all duration-200 hover:bg-orange-600 hover:text-white hover:shadow-md active:scale-95 z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        Back to Home
                    </button>

                    {/* Header */}
                    <div className="mb-10">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/10 mb-6">
                            <img src={icon} alt="Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                        <p className="text-gray-500 mt-2 text-lg">Savor the flavors of Cebu again.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-sm font-bold text-gray-700">Password</label>
                                <span className="text-xs font-bold text-orange-600 hover:underline cursor-pointer">Forgot?</span>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-3.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-red-500 text-sm font-medium text-center animate-pulse">{error}</p>
                        )}

                        {/* SIGN IN BUTTON (THIS TRIGGERS handleSubmit AND REDIRECTS) */}
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 py-4 rounded-xl bg-linear-to-r from-orange-600 to-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-600 font-medium">
                        New to TasteCebu?{' '}
                        <span onClick={() => navigate('/register')} className="text-orange-600 font-bold hover:underline cursor-pointer">
                            Create an Account
                        </span>
                    </p>

                    <div className="absolute bottom-4 left-0 w-full text-center text-gray-400 text-xs">
                        © {new Date().getFullYear()} Made with ❤️ Team Spartan
                    </div>
                </div>
            </div>
        </div>
    );
}