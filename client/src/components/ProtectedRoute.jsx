import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to the user's own dashboard instead of landing page
    const dashboardMap = {
      seller: '/seller/dashboard',
      admin: '/admin',
      user: '/home',
    };
    return <Navigate to={dashboardMap[user.role] || '/'} replace />;
  }

  return children;
}
