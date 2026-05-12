import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { 
  TbLayoutDashboard, 
  TbPaperBag, 
  TbUserCircle, 
  TbPackage, 
  TbMessageCircle, 
  TbSettings, 
  TbLogout,
  TbMenu2,
  TbX
} from 'react-icons/tb';
import brandIcon from '../assets/Pictures/tastecebuicon.jpg';

export default function CustomerSidebar({ activeTab }) {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useSidebar();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  const handleNavClick = (route) => {
    navigate(route);
    if (window.innerWidth <= 768) {
      closeSidebar();
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: TbLayoutDashboard, route: '/home' },
    { id: 'products', label: 'Products', icon: TbPaperBag, route: '/products' },
    { id: 'profile', label: 'My Profile', icon: TbUserCircle, route: '/profile' },
    { id: 'orders', label: 'My Orders', icon: TbPackage, route: '/orders' },
    { id: 'messages', label: 'Messages', icon: TbMessageCircle, route: '/messages' },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: TbSettings, route: '/settings' },
  ];

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${(isExpanded || sidebarOpen) ? 'active' : ''}`} 
        onClick={() => { setIsExpanded(false); closeSidebar(); }} 
      />

      <aside className={`dashboard-sidebar ${(isExpanded || sidebarOpen) ? 'expanded' : ''}`}>
        <div className="sidebar-header" onClick={toggleExpand}>
          {!(isExpanded || sidebarOpen) ? (
            <div className="sidebar-brand-collapsed">
              <img src={brandIcon} alt="L" className="brand-logo-img" />
            </div>
          ) : (
            <div className="sidebar-brand-expanded">
              <img src={brandIcon} alt="TasteCebu" className="brand-logo-img" />
              <span>Taste Cebu</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.route)}
                title={item.label}
              >
                <div className="nav-icon"><Icon /></div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.route)}
                title={item.label}
              >
                <div className="nav-icon"><Icon /></div>
                <span>{item.label}</span>
              </button>
            );
          })}
          <button 
            className="sidebar-nav-item" 
            onClick={handleLogout}
            title="Logout"
          >
            <div className="nav-icon"><TbLogout /></div>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
