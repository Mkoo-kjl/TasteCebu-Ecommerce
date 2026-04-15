import React, { useEffect } from 'react';
import icon from './assets/icon.png';
import img from './assets/background.png';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import Login from './Pages/Login';
import Register from './Pages/Register';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const link =
      document.querySelector("link[rel='icon']") ||
      document.createElement('link');

    link.rel = 'icon';
    link.href = icon;

    if (!document.head.contains(link)) {
      document.head.appendChild(link);
    }
  }, []);

  const hideLayout =
    location.pathname === '/login' || location.pathname === '/Register';

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* 🔥 HEADER */}
      {!hideLayout && (
        <header className="bg-white border-b border-gray-100 shadow-sm z-10">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <img src={icon} alt="TasteCebu icon" className="w-8 h-8" />
              <h1 className="text-2xl font-bold text-orange-600">
                TasteCebu
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Login
              </button>

              <button
                onClick={() => navigate('/Register')}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition"
              >
                Sign Up
              </button>
            </div>
          </nav>
        </header>
      )}

      {/* 🔥 ROUTES */}
      <Routes>

        {/* HOME */}
        <Route
          path="/"
          element={
            <main className="flex-1 flex flex-col md:flex-row">

              {/* LEFT IMAGE */}
              <div
                className="flex-1 bg-cover bg-center min-h-75 md:min-h-full"
                style={{ backgroundImage: `url(${img})` }}
              />

              {/* RIGHT CONTENT */}
              <div className="flex-1 flex flex-col justify-center items-center md:items-start px-8 md:px-16 py-12">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 text-center md:text-left">
                  Welcome to TasteCebu
                </h2>

                <p className="text-xl text-gray-600 mb-8 text-center md:text-left">
                  Discover authentic flavors of Cebu, delivered to your door.
                </p>

                <button
                  onClick={() => navigate('/login')}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-10 rounded-lg transition shadow-lg"
                >
                  Shop Now
                </button>
              </div>
            </main>
          }
        />

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* SIGNUP */}
        <Route path="/Register" element={<Register />} />

      </Routes>

      {/* 🔥 FOOTER */}
      {!hideLayout && (
        <footer className="bg-gray-50 border-t border-gray-200 text-gray-500 py-4">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>
              &copy; {new Date().getFullYear()} Made with ❤️ Team Spartan
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}