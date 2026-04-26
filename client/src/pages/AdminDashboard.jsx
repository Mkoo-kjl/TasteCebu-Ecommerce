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
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);
  const [applications, setApplications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'analytics') {
          const res = await api.get('/admin/analytics');
          setAnalytics(res.data.analytics);
        } else if (activeTab === 'applications') {
          const res = await api.get('/admin/applications');
          setApplications(res.data.applications);
        } else if (activeTab === 'users') {
          const res = await api.get('/admin/users');
          setUsers(res.data.users);
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
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <FiCheckCircle size={14} /> Analytics
        </button>
        <button className={`tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>
          <FiFileText size={14} /> Applications
        </button>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <FiUsers size={14} /> Users
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
                      {app.status === 'approved' && (
                        <div className="app-actions">
                          <div className="btn-group">
                            <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Are you sure you want to terminate this seller?')) handleApplication(app.id, 'rejected'); }}>
                              <FiX size={14} /> Terminate
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

          {activeTab === 'analytics' && analytics && (
            <div className="admin-section">
              <div className="analytics-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '10px' }}>Total Shops</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{analytics.total_shops}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '10px' }}>Total Sellers</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{analytics.total_sellers}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <h3 style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '10px' }}>Total Users</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{analytics.total_users}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}