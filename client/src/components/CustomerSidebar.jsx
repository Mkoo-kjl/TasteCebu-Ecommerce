import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TbLayoutDashboard, 
  TbPaperBag, 
  TbUserCircle, 
  TbPackage, 
  TbMessageCircle, 
  TbSettings, 
  TbLogout,
  TbUsers,
  TbFileText,
  TbBuildingStore,
  TbChartBar,
  TbX
} from 'react-icons/tb';


export default function CustomerSidebar({ activeTab }) {
  const { user, logout } = useAuth();
  const { mobileSidebarOpen, closeMobileSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    closeMobileSidebar();
  };

  const handleNavClick = (route) => {
    navigate(route);
    closeMobileSidebar();
  };

  const getMenuItems = () => {
    const role = user?.role || 'user';
    
    if (role === 'admin') {
      return [
        { id: 'analytics', label: 'Analytics', icon: TbChartBar, route: '/admin?tab=analytics' },
        { id: 'applications', label: 'Applications', icon: TbFileText, route: '/admin?tab=applications' },
        { id: 'users', label: 'Users', icon: TbUsers, route: '/admin?tab=users' },
        { id: 'products', label: 'Platform Products', icon: TbPackage, route: '/admin?tab=products' },
      ];
    }

    if (role === 'seller') {
      return [
        { id: 'home', label: 'Dashboard', icon: TbLayoutDashboard, route: '/seller/dashboard?tab=analytics' },
        { id: 'products', label: 'My Products', icon: TbBuildingStore, route: '/seller/dashboard?tab=products' },
        { id: 'orders', label: 'Shop Orders', icon: TbPackage, route: '/seller/dashboard?tab=orders' },
        { id: 'messages', label: 'Messages', icon: TbMessageCircle, route: '/messages' },
        { id: 'profile', label: 'Profile', icon: TbUserCircle, route: '/profile' },
      ];
    }

    // Default Customer items
    return [
      { id: 'home', label: 'Dashboard', icon: TbLayoutDashboard, route: '/home' },
      { id: 'products', label: 'Browse Products', icon: TbPaperBag, route: '/products' },
      { id: 'profile', label: 'My Profile', icon: TbUserCircle, route: '/profile' },
      { id: 'orders', label: 'My Orders', icon: TbPackage, route: '/orders' },
      { id: 'messages', label: 'Messages', icon: TbMessageCircle, route: '/messages' },
    ];
  };

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: TbSettings, route: '/settings' },
  ];

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay - only visible on small screens */}
      <div 
        className={`sidebar-overlay ${mobileSidebarOpen ? 'active' : ''}`} 
        onClick={closeMobileSidebar} 
      />

      <aside className={`dashboard-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        {/* Mobile close button */}
        <button className="sidebar-mobile-close" onClick={closeMobileSidebar} aria-label="Close sidebar">
          <TbX size={20} />
        </button>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
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
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
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
