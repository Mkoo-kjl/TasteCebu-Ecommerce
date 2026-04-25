import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiFileText, FiPackage, FiCheck, FiX, FiClock, FiTruck, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { icon: <FiClock />, color: '#f59e0b', label: 'Pending' },
  processing: { icon: <FiPackage />, color: '#3b82f6', label: 'Processing' },
  shipped: { icon: <FiTruck />, color: '#8b5cf6', label: 'Shipped' },
  delivered: { icon: <FiCheckCircle />, color: '#10b981', label: 'Delivered' },
  cancelled: { icon: <FiXCircle />, color: '#ef4444', label: 'Cancelled' },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'applications') {
          const res = await api.get('/admin/applications');
          setApplications(res.data.applications);
        } else if (activeTab === 'users') {
          const res = await api.get('/admin/users');
          setUsers(res.data.users);
        } else if (activeTab === 'orders') {
          const res = await api.get('/admin/orders');
          setOrders(res.data.orders);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [activeTab]);

  const handleApplication = async (id, status) => {
    try {
      await api.put(`/admin/applications/${id}`, { status, admin_notes: adminNotes });
      toast.success(`Application ${status}`);
      setAdminNotes('');
      const res = await api.get('/admin/applications');
      setApplications(res.data.applications);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="admin-dashboard" id="admin-dashboard">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage the TasteCebu platform</p>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          <FiFileText size={14} /> Applications
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <FiUsers size={14} /> Users
        </button>
        <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <FiPackage size={14} /> Orders
        </button>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : (
        <>
          {activeTab === 'applications' && (
            <div className="admin-section">
              {applications.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">📋</span><h2>No applications</h2></div>
              ) : (
                <div className="applications-list">
                  {applications.map(app => (
                    <div className="application-card card" key={app.id} id={`app-${app.id}`}>
                      <div className="app-header">
                        <div>
                          <h3>{app.business_name}</h3>
                          <p className="app-meta">by {app.user_name} ({app.user_email})</p>
                        </div>
                        <span className={`status-badge status-${app.status}`}>
                          {app.status === 'pending' ? <FiClock /> : app.status === 'approved' ? <FiCheck /> : <FiX />}
                          {app.status}
                        </span>
                      </div>
                      <p className="app-desc">{app.business_description}</p>
                      <div className="app-details">
                        <span>📍 {app.business_address}</span>
                        <span>📞 {app.business_phone}</span>
                        <span>📅 {new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                      {app.admin_notes && <p className="admin-notes"><strong>Notes:</strong> {app.admin_notes}</p>}
                      {app.status === 'pending' && (
                        <div className="app-actions">
                          <div className="form-group">
                            <input type="text" placeholder="Admin notes (optional)" value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)} />
                          </div>
                          <div className="btn-group">
                            <button className="btn btn-success btn-sm" onClick={() => handleApplication(app.id, 'approved')}>
                              <FiCheck size={14} /> Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleApplication(app.id, 'rejected')}>
                              <FiX size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="products-table-wrapper">
                <table className="data-table" id="admin-users-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th></tr></thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td>{u.phone || '—'}</td>
                        <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                        <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="admin-section">
              <div className="admin-orders-notice">
                <FiPackage size={16} />
                <span>Orders are managed by their respective sellers. This is a read-only overview.</span>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state"><span className="empty-icon">📦</span><h2>No orders</h2></div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => {
                    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    return (
                      <div className="order-card" key={order.id} id={`admin-order-${order.id}`}>
                        <div className="order-header">
                          <div>
                            <span className="order-id">{order.business_names && order.business_names.length > 0 ? order.business_names.join(', ') : `Order #${order.id}`}</span>
                            <span className="order-meta">by {order.user_name} • {new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className="status-badge" style={{ background: config.color + '20', color: config.color }}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        <div className="order-items">
                          {order.items?.map(item => (
                            <div className="order-item" key={item.id}>
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>₱{(item.product_price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="order-footer">
                          <span>📍 {order.shipping_address}</span>
                          <span className="order-total">Total: ₱{Number(order.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}