import { FiActivity, FiFileText, FiUsers, FiLogOut, FiPackage } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import brandIcon from '../assets/Pictures/tastecebuicon.jpg';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  const handleNavClick = (item) => {
    if (item.action) item.action();
    else setActiveTab(item.id);
    closeSidebar();
  };

  const navItems = [
    { id: 'analytics', label: 'Analytics', icon: FiActivity },
    { id: 'applications', label: 'Applications', icon: FiFileText },
    { id: 'users', label: 'Users', icon: FiUsers },
    { id: 'products', label: 'Products', icon: FiPackage },
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
          <p className="sidebar-subtitle">Admin Portal</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
              >
                <Icon className="nav-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item text-danger" onClick={handleLogout}>
            <FiLogOut className="nav-icon" /> Logout
          </button>
        </div>
      </div>
    </>
  );
}
