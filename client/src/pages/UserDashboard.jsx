import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

import { 
  TbPackage, 
  TbMessageCircle, 
  TbHistory, 
  TbShoppingBag, 
  TbUserCircle, 
  TbSettings,
  TbArrowRight
} from 'react-icons/tb';

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
          api.get('/messages/unread-count')
        ]);
        
        const orders = ordersRes.data.orders || [];
        const active = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;
        const unread = messagesRes.data.unread_count || 0;

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

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div className="dashboard-main-standalone">
      <header className="page-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Welcome back, {firstName}! 👋</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Here's a quick overview of your account</p>
        </div>
      </header>

      <section className="analytics-grid">
        <div className="stat-card card">
          <div className="stat-icon-badge" style={{ background: 'rgba(232, 93, 44, 0.1)', color: '#E85D2C' }}>
            <TbPackage />
          </div>
          <div className="stat-info">
            <h3>{stats.activeOrders}</h3>
            <p>Active Orders</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-badge" style={{ background: 'rgba(192, 57, 43, 0.1)', color: '#C0392B' }}>
            <TbHistory />
          </div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-badge" style={{ background: 'rgba(28, 16, 9, 0.1)', color: '#1C1009' }}>
            <TbMessageCircle />
          </div>
          <div className="stat-info">
            <h3>{stats.unreadMessages}</h3>
            <p>Unread Messages</p>
          </div>
        </div>
      </section>

      <section className="recent-orders-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Recent Orders</h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/orders')}>View All</button>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="empty-state-container">
            <TbPackage className="empty-state-icon" />
            <h3 style={{ marginBottom: '8px' }}>No orders yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Looks like you haven't placed any orders yet.</p>
            <Link to="/products" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentOrders.map(order => (
              <div key={order.id} className="order-row card" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div className="order-id" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>#{String(order.id).slice(0,8)}</div>
                  <div className="order-date" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date(order.created_at).toLocaleDateString()}</div>
                  <span className={`status-badge status-${order.status}`}>{order.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700' }}>₱{parseFloat(order.total_amount).toFixed(2)}</span>
                  <TbArrowRight style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="quick-links-grid">
        <Link to="/products" className="quick-link-card">
          <div className="quick-link-content">
            <div className="quick-link-icon"><TbShoppingBag /></div>
            <div className="quick-link-text">
              <h4>Browse Products</h4>
              <p>Discover local Cebuano flavors</p>
            </div>
          </div>
          <TbArrowRight />
        </Link>
        <Link to="/messages" className="quick-link-card">
          <div className="quick-link-content">
            <div className="quick-link-icon"><TbMessageCircle /></div>
            <div className="quick-link-text">
              <h4>Messages</h4>
              <p>Chat with sellers about orders</p>
            </div>
          </div>
          <TbArrowRight />
        </Link>
        <Link to="/profile" className="quick-link-card">
          <div className="quick-link-content">
            <div className="quick-link-icon"><TbUserCircle /></div>
            <div className="quick-link-text">
              <h4>My Profile</h4>
              <p>Manage your account info</p>
            </div>
          </div>
          <TbArrowRight />
        </Link>
        <Link to="/settings" className="quick-link-card">
          <div className="quick-link-content">
            <div className="quick-link-icon"><TbSettings /></div>
            <div className="quick-link-text">
              <h4>Settings</h4>
              <p>Notification and security</p>
            </div>
          </div>
          <TbArrowRight />
        </Link>
      </section>
    </div>
  );
}
