import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import img from '../assets/Cebu-Food-Delicacies.jpg';
import icon from '../assets/icon.png';

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        console.log('Login attempt:', { email, password });
        setError('');
    };

    return (
        <div className="h-screen flex">

            {/* LEFT SIDE - IMAGE */}
            <div className="hidden md:flex w-1/2 h-full">
                <img
                    src={img}
                    alt="Cebu Food"
                    className="object-cover w-full h-full"
                />
            </div>

            {/* RIGHT SIDE - LOGIN */}
            <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-8">

                <div className="w-full max-w-md">

                    {/* 🔙 BACK BUTTON */}
                    <button
                        onClick={() => navigate('/')}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition right-10 top-10 absolute"
                    >
                        Back to Home
                    </button>

                    {/* Title */}
                    <div className="mb-8 text-left">
                        <img
                            src={icon}
                            alt="Logo"
                            className="w-10 h-10 mb-3"
                        />
                        <h1 className="text-2xl font-extrabold text-gray-800">
                            Welcome Back
                        </h1>
                    </div>

                    <div className="flex flex-col gap-5">

                        {/* Email */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        )}

                        {/* Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full transition"
                        >
                            Sign In →
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        New to tasteCebu?{' '}
                        <span
                            onClick={() => navigate('/Register')}
                            className="text-orange-500 font-semibold hover:underline cursor-pointer"
                        >
                            Create an Account
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
}   