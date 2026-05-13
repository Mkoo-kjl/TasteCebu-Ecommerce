import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import SellerApply from './pages/SellerApply';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Receipt from './pages/Receipt';
import Settings from './pages/Settings';
import SellerProfile from './pages/SellerProfile';
import Messages from './pages/Messages';
import UserDashboard from './pages/UserDashboard';
import CustomerSidebar from './components/CustomerSidebar';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Dashboard mode applies to all authenticated pages
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';
  const isDashboardPage = user && !isAuthPage && !isLandingPage;

  // Derive active tab for sidebar
  const getActiveTab = () => {
    const path = location.pathname;
    const tabParam = searchParams.get('tab');

    if (path === '/home') return 'home';
    if (path === '/seller/dashboard') return tabParam || 'analytics';
    if (path === '/admin') return tabParam || 'analytics';
    
    if (path.startsWith('/products')) return 'products';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/settings')) return 'settings';
    return '';
  };

  return (
    <div className={`app-wrapper ${isDashboardPage ? 'has-sidebar' : ''}`}>
      <Toaster position="top-right" toastOptions={{
        duration: 3000,
        style: { borderRadius: '12px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' },
      }} />
      <Navbar />
      {isDashboardPage ? (
        <div className="dashboard-layout">
          <CustomerSidebar activeTab={getActiveTab()} />
          <main className="main-content dashboard-mode">
            <Routes>
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/seller/:id" element={<SellerProfile />} />
              <Route path="/messages" element={<ProtectedRoute roles={['user', 'seller', 'admin']}><Messages /></ProtectedRoute>} />
              <Route path="/cart" element={<ProtectedRoute roles={['user']}><Cart /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute roles={['user']}><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id/receipt" element={<ProtectedRoute roles={['user', 'seller']}><Receipt /></ProtectedRoute>} />
              <Route path="/home" element={<ProtectedRoute roles={['user']}><UserDashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute roles={['user', 'seller', 'admin']}><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute roles={['user', 'seller', 'admin']}><Settings /></ProtectedRoute>} />
              <Route path="/seller/apply" element={<ProtectedRoute><SellerApply /></ProtectedRoute>} />
              <Route path="/seller/dashboard" element={<ProtectedRoute roles={['seller', 'admin']}><SellerDashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            </Routes>
          </main>
        </div>
      ) : (
        <>
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/seller/:id" element={<SellerProfile />} />
            </Routes>
          </main>
          {!isAuthPage && <Footer />}
        </>
      )}
    </div>
  );
}

export default App;
