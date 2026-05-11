import { FiUser, FiPackage, FiSettings, FiLogOut, FiMessageSquare, FiHome, FiShoppingBag } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import brandIcon from '../assets/Pictures/tastecebuicon.jpg';

export default function CustomerSidebar({ activeTab }) {
  const { user, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();
  const isSeller = user?.role === 'seller';

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  const handleNavClick = (route) => {
    navigate(route);
    closeSidebar();
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: FiHome, route: isSeller ? '/seller/dashboard' : '/home' },
    ...(!isSeller ? [{ id: 'products', label: 'Products', icon: FiShoppingBag, route: '/products' }] : []),
    { id: 'profile', label: 'My Profile', icon: FiUser, route: '/profile' },
    ...(!isSeller ? [{ id: 'orders', label: 'My Orders', icon: FiPackage, route: '/orders' }] : []),
    { id: 'messages', label: 'Messages', icon: FiMessageSquare, route: '/messages' },
  ];

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
      <div className={`dashboard-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={brandIcon} alt="TasteCebu Logo" className="brand-logo-img" />
            <span className="brand-taste">TASTE</span>
            <span className="brand-cebu">CEBU</span>
          </div>
          <p className="sidebar-subtitle">Customer Portal</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.route)}
              >
                <Icon className="nav-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`sidebar-nav-item ${activeTab === 'settings' ? 'active' : ''}`} 
            onClick={() => handleNavClick('/settings')}
          >
            <FiSettings className="nav-icon" /> Settings
          </button>
          <button className="sidebar-nav-item text-danger" onClick={() => { handleLogout(); }}>
            <FiLogOut className="nav-icon" /> Logout
          </button>
        </div>
      </div>
    </>
  );
}
