import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiPackage, FiSettings, FiGrid, FiShield, FiMessageSquare } from 'react-icons/fi';
import api from '../utils/api';
import brandIcon from '../assets/pictures/tastecebuicon.jpg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/messages/unread-count');
      setUnreadCount(res.data.unread_count || 0);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    const doFetch = async () => {
      await fetchUnread();
    };
    doFetch();
    const interval = setInterval(doFetch, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isLanding = location.pathname === '/';
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  if (isLanding) {
    return (
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="landing-navbar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? 'var(--nav-bg)' : 'transparent', borderBottom: scrolled ? '1px solid rgba(244,163,0,0.35)' : 'none', backdropFilter: scrolled ? 'blur(16px)' : 'none', boxShadow: scrolled ? '0 2px 24px rgba(28,17,8,0.1)' : 'none', transition: 'all 0.4s ease' }}>
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <img src={brandIcon} alt="TasteCebu Logo" className="brand-logo-img" />
            <span className="brand-taste">TASTE</span>
            <span className="brand-cebu">CEBU</span>
          </Link>

          <div className="navbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>
            
            {!user ? (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost" style={{ border: 'none', background: 'transparent' }}>Log in</Link>
                <Link to="/register" className="btn btn-primary">Sign up</Link>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to={user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller/dashboard' : '/home'} 
                  className="btn btn-primary"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <div className="top-banner" id="top-banner">
        <div className="top-banner-content">
          <span>🚚 Free Shipping on orders over ₱500</span>
        </div>
      </div>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} id="main-navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand" id="nav-brand">
            <img src={brandIcon} alt="TasteCebu Logo" className="brand-logo-img" />
            <span className="brand-taste">TASTE</span>
            <span className="brand-cebu">CEBU</span>
          </Link>

          {!isAuthPage && (
            <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
              {!user && (
                <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Products</Link>
              )}

              {user && user.role === 'seller' && (
                <Link to="/seller/dashboard" className={`nav-link ${isActive('/seller/dashboard') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <FiGrid size={14} /> Seller
                </Link>
              )}
              {user && user.role === 'admin' && (
                <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                  <FiShield size={14} /> Admin
                </Link>
              )}
            </div>
          )}

          <div className="navbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} id="theme-toggle-btn">
              {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
            </button>

            {user ? (
              <>
                {user.role === 'user' && (
                  <Link to="/cart" className="cart-btn" id="nav-cart-btn">
                    <FiShoppingCart size={18} />
                  </Link>
                )}

                {user.role !== 'admin' && (
                  <Link to="/messages" className="cart-btn nav-messages-btn" id="nav-messages-btn" title="Messages">
                    <FiMessageSquare size={18} />
                    {unreadCount > 0 && (
                      <span className="nav-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                    )}
                  </Link>
                )}

                <div className="user-menu" id="user-menu-dropdown">
                  <button className="user-avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="avatar-img" />
                    ) : (
                      <FiUser size={18} />
                    )}
                  </button>
                  {dropdownOpen && (
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <span className="dropdown-name">{user.name}</span>
                        <span className="dropdown-role">{user.role}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      {user.role !== 'admin' && user.role !== 'seller' && (
                        <Link to="/home" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiGrid size={14} /> Dashboard
                        </Link>
                      )}
                      {user.role !== 'admin' && (
                        <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiUser size={14} /> Profile
                        </Link>                   
                      )}
                      {user.role !== 'admin' && user.role !== 'seller' && (
                        <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiPackage size={14} /> Orders
                        </Link>
                      )}
                      {user.role !== 'admin' && (
                        <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiSettings size={14} /> Settings
                        </Link>
                      )}
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        <FiLogOut size={14} /> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-ghost" id="nav-login-btn">Login</Link>
                <Link to="/register" className="btn btn-primary" id="nav-signup-btn">Sign Up</Link>
              </div>
            )}

            {!isAuthPage && (
              <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
