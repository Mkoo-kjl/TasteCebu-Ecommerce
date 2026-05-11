import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CustomerSidebar from '../components/CustomerSidebar';
import { FiPackage, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    unreadMessages: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, messagesRes] = await Promise.all([
          api.get('/orders'),
          api.get('/messages/conversations')
        ]);
        
        const orders = ordersRes.data.orders || [];
        const active = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
        
        const convos = messagesRes.data.conversations || [];
        const unread = convos.reduce((sum, c) => sum + (c.unread_count || 0), 0);

        setStats({
          totalOrders: orders.length,
          activeOrders: active,
          unreadMessages: unread
        });
        
        setRecentOrders(orders.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="dashboard-layout">
      <CustomerSidebar activeTab="home" />
      <div className="dashboard-main">
        <div className="user-home-page" id="user-home-page">
          <div className="page-header">
            <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
            <p>Here's a quick overview of your account.</p>
          </div>

          <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
            <div className="stat-card card">
              <div className="stat-icon" style={{ background: 'rgba(244,163,0,0.1)', color: '#F4A300' }}>
                <FiPackage size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.activeOrders}</h3>
                <p>Active Orders</p>
              </div>
            </div>
            <div className="stat-card card">
              <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
                <FiTrendingUp size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className="stat-card card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                <FiMessageSquare size={24} />
              </div>
              <div className="stat-info">
                <h3>{stats.unreadMessages}</h3>
                <p>Unread Messages</p>
              </div>
            </div>
          </div>

          <div className="dashboard-recent-section mt-4">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Recent Orders</h2>
              <button className="btn btn-outline" onClick={() => navigate('/orders')}>View All</button>
            </div>
            {recentOrders.length === 0 ? (
              <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FiPackage size={48} style={{ opacity: 0.3, marginBottom: '16px', margin: '0 auto' }} />
                <p style={{ color: 'var(--text-secondary)' }}>You have no recent orders.</p>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Start Shopping</Link>
              </div>
            ) : (
              <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recentOrders.map(order => (
                  <div key={order.id} className="order-card card" style={{ padding: '20px' }}>
                    <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <span className="order-id" style={{ fontWeight: '600', marginRight: '8px' }}>#{String(order.id).slice(0,8)}</span>
                        <span className="order-date" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-badge status-${order.status}`}>{order.status}</span>
                    </div>
                    <div className="order-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span className="order-total" style={{ fontWeight: '700' }}>Total: ₱{parseFloat(order.total_amount).toFixed(2)}</span>
                      <button className="btn btn-outline" onClick={() => navigate('/orders')}>Track</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
