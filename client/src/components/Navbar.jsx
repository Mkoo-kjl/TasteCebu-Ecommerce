import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiPackage, FiSettings, FiGrid, FiShield } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" id="nav-brand">
          <span className="brand-icon">🍽️</span>
          <span className="brand-text">TasteCebu</span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>Products</Link>

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
                    <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiUser size={14} /> Profile
                    </Link>
                    {user.role !== 'admin' && (
                      <Link to="/orders" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <FiPackage size={14} /> Orders
                      </Link>
                    )}
                    <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <FiSettings size={14} /> Settings
                    </Link>
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

          <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
