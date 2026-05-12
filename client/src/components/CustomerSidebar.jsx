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
} from 'react-icons/tb';
import brandIcon from '../assets/Pictures/tastecebuicon.jpg';

export default function CustomerSidebar({ activeTab }) {
  const { logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeSidebar();
  };

  const handleNavClick = (route) => {
    navigate(route);
    closeSidebar();
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
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar} 
      />

      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-expanded">
            <img src={brandIcon} alt="TasteCebu" className="brand-logo-img" />
            <span>Taste Cebu</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.route)}
              >
                <div className="nav-icon"><Icon /></div>
                <span className="nav-label">{item.label}</span>
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
              >
                <div className="nav-icon"><Icon /></div>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
          <button 
            className="sidebar-nav-item logout-nav-item" 
            onClick={handleLogout}
          >
            <div className="nav-icon"><TbLogout /></div>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
