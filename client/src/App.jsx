import React from 'react';

export default function App() {
  return (
    // Changed bg-image to bg-white
    <div className="min-h-screen bg-white">
      {/* Removed the outer opacity div since we no longer need to 
         "see through" to a background image 
      */}
      <div className="min-h-screen">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <h1 className="text-2xl font-bold text-orange-600">TasteCebu</h1>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
                Login
              </button>
            </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
              Welcome to TasteCebu
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Discover authentic flavors of Cebu, delivered to your door
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
              Shop Now
            </button>
          </div>
        </main>

        <footer className="fixed bottom-0 left-0 w-full bg-gray-50 border-t border-gray-200 text-gray-500 py-4">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p>&copy; 2024 TasteCebu. All rights reserved.</p>
            </div>
          </footer>
      </div>
    </div>
  );
}