import React, { useEffect, useState } from 'react';
import icon from './assets/icon.png';
import img from './assets/background.png';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

import Login from './Pages/Login';
import Register from './Pages/Register';
import Home from './Pages/User/Home';
import Dashboard from './Pages/Admin/Dashboard';

// ── PROTECTED ROUTE COMPONENT ──
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const CATEGORIES = ['All', '🥭 Dried Fruits', '🍪 Biscuits', '🥜 Nuts & Snacks', '🍫 Sweets', '🐟 Dried Fish'];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const imgIcon = new Image();
    imgIcon.src = icon;
    
    imgIcon.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 64;
      canvas.width = size;
      canvas.height = size;

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(imgIcon, 0, 0, size, size);

      const link = document.querySelector("link[rel='icon']") || document.createElement('link');
      link.rel = 'icon';
      link.href = canvas.toDataURL('image/png');
      
      if (!document.head.contains(link)) {
        document.head.appendChild(link);
      }
    }; 
  }, []);

  // FIXED: Updated list to include '/admin/dashboard' so the main layout is hidden there too
  const currentPath = location.pathname.toLowerCase();
  const hideLayout = ['/login', '/register', '/home', '/dashboard', '/admin/dashboard'].includes(currentPath);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── NAVBAR ── */}
      {!hideLayout && (
        <header style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 48px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={icon} alt="Logo" style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', objectFit: 'cover' }} />
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              Taste<span style={{ color: '#ffe0b2' }}>Cebu</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/login')} style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', fontWeight: 600, padding: '9px 22px', borderRadius: 8, cursor: 'pointer', fontSize: 14, backdropFilter: 'blur(4px)' }}>Login</button>
            <button onClick={() => navigate('/Register')} style={{ background: '#fff', border: 'none', color: '#e65100', fontWeight: 700, padding: '9px 22px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Sign Up</button>
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #e65100 0%, #f57c00 40%, #ff9800 70%, #ffb74d 100%)' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
                
                {/* Decorative circles */}
                {[
                  { width: 320, height: 320, top: -80, right: -40 },
                  { width: 200, height: 200, bottom: 80, right: 200 },
                  { width: 120, height: 120, top: '40%', left: '42%' },
                  { width: 60,  height: 60,  top: '20%', left: '55%' },
                ].map((s, i) => (
                  <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.07)', width: s.width, height: s.height, top: s.top, right: s.right, bottom: s.bottom, left: s.left, pointerEvents: 'none' }} />
                ))}

                <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'block' }} viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
                </svg>

                <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
                  <div style={{ flex: 1.1, padding: '120px 48px 100px 48px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: 100, padding: '6px 14px', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
                      Straight from Cebu, PH
                    </div>
                    <h1 style={{ fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1.5px', margin: '0 0 20px' }}>Authentic Flavors, <span style={{ color: '#fff3e0', display: 'block' }}>Delivered Fresh.</span></h1>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 420, margin: '0 0 36px' }}>From dried mangoes to peanut kisses — savor the best pasalubong Cebu has to offer, right at your doorstep.</p>
                    
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
                      <button onClick={() => navigate('/login')} style={{ background: '#fff', color: '#e65100', fontWeight: 800, fontSize: 16, padding: '14px 32px', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>🛒 Shop Now</button>
                      <button onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#fff', fontWeight: 600, fontSize: 16, padding: '14px 28px', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 10, cursor: 'pointer' }}>Explore Products</button>
                    </div>
                  </div>

                  <div style={{ flex: 0.9, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: 460, height: 500 }}>
                      <div style={{ position: 'absolute', top: 30, left: 20, width: 400, height: 460, borderRadius: 24, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
                        <img src={img} alt="Cebu products" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      
                      {/* Floating cards */}
                      <div style={{ position: 'absolute', bottom: 60, left: -20, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', gap: 10, animation: 'floatUpDown 3s ease-in-out infinite' }}>
                        <span style={{ fontSize: 22 }}>📦</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>Free delivery</div>
                          <div style={{ fontSize: 11, color: '#888' }}>On orders ₱500+</div>
                        </div>
                      </div>

                      <div style={{ position: 'absolute', top: 70, right: -10, background: '#fff', borderRadius: 14, padding: '12px 16px', boxShadow: '0 8px 28px rgba(0,0,0,0.14)', display: 'flex', alignItems: 'center', gap: 10, animation: 'floatUpDown 3s ease-in-out infinite 1.5s' }}>
                        <span style={{ fontSize: 22 }}>⭐</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>Top Rated</div>
                          <div style={{ fontSize: 11, color: '#888' }}>Dried Mangoes</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* CATEGORY STRIP */}
              <div style={{ background: '#fff3e0', padding: '16px 48px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '2px solid #ffe0b2', overflowX: 'auto', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#e65100', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap', marginRight: 4 }}>Browse:</span>
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? '#e65100' : '#fff', border: `1.5px solid ${activeCategory === cat ? '#e65100' : '#ffcc80'}`, borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: activeCategory === cat ? '#fff' : '#bf360c', cursor: 'pointer', whiteSpace: 'nowrap' }}>{cat}</button>
                ))}
              </div>

              {/* FEATURE CARDS */}
              <section style={{ padding: '64px 48px', display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { icon: '🌿', title: '100% Authentic', desc: 'Sourced directly from trusted Cebuano producers' },
                  { icon: '🚚', title: 'Fast Delivery', desc: 'Nationwide shipping within 3–5 business days' },
                  { icon: '🎁', title: 'Gift-Ready', desc: 'Perfect pasalubong packs for every occasion' },
                  { icon: '🔒', title: 'Secure Checkout', desc: 'Safe payment with GCash, card & more' },
                ].map((f) => (
                  <div key={f.title} style={{ background: '#fff', border: '1.5px solid #ffe0b2', borderRadius: 16, padding: '28px 24px', textAlign: 'center', maxWidth: 200, flex: '1 1 160px' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#bf360c', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: '#888', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </section>
            </main>
          } 
        />

        <Route path="/login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Home" element={<Home />} /> 
        {/* FIXED: Changed path from "/Dashboard" to "/admin/dashboard" to match your URL and added ProtectedRoute wrap */}
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>

      {!hideLayout && (
        <footer style={{ background: '#fff3e0', borderTop: '1.5px solid #ffe0b2', textAlign: 'center', padding: '18px', fontSize: 13, color: '#bf360c', fontWeight: 500 }}>
          © {new Date().getFullYear()} Made with ❤️ Team Spartan
        </footer>
      )}

      <style>{`
        @keyframes floatUpDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}