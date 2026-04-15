import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import img from '../assets/Cebu-Food-Delicacies.jpg';
import icon from '../assets/icon.png';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    console.log('Register:', { name, email, password });
    setError('');
  };

  return (
    <div className="h-screen flex">

      {/* LEFT IMAGE */}
      <div className="hidden md:flex w-1/2 h-full">
        <img
          src={img}
          alt="Cebu Food"
          className="object-cover w-full h-full"
        />
      </div>

      {/* RIGHT FORM */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 px-6">

        <div className="w-full max-w-md">

          {/* 🔙 BACK BUTTON */}
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition right-10 top-10 absolute"
          >
            Back to Home
          </button>

          {/* TITLE */}
          <div className="mb-8 text-left">
            <img src={icon} alt="Logo" className="w-10 h-10 mb-3" />
            <h1 className="text-2xl font-extrabold text-gray-800">
              Create Account
            </h1>
          </div>

          <div className="flex flex-col gap-5">

            {/* NAME */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* EMAIL */}
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

            {/* PASSWORD */}
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

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>

            {/* ERROR */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* BUTTON */}
            <button
              onClick={handleSubmit}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full transition"
            >
              Sign Up →
            </button>
          </div>

          {/* FOOTER */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              className="text-orange-500 font-semibold hover:underline cursor-pointer"
            >
              Sign In
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}