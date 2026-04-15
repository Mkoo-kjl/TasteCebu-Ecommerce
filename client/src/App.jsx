import React from 'react';
import bgImage from './assets/background.jpg'; // 👈 change to your actual filename

export default function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,  // 👈 uses the imported image
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* rest of your code stays exactly the same */}
      <div className="min-h-screen bg-opacity-50">
        <header className="bg-transparent bg-opacity-10 backdrop-blur-sm shadow">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-white">TasteCebu</h1>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
            tasteCebu
            </h2>
            <p className="text-xl text-gray-200 mb-8">
              Rediscover the rich heritage of Cebuano flavors curated for the modern plate
            </p>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg">
              Shop Now
            </button>
          </div>
        </main>

        <footer className="bg-transparent bg-opacity-40 text-white mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center position-relative ">
            <p>&copy; 2024 TasteCebu. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}