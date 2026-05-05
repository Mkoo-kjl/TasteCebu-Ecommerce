import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiFileText, FiCheck, FiX, FiClock, FiDollarSign, FiUserPlus, FiActivity, FiAlertTriangle, FiSlash, FiShoppingBag } from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

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

  const pendingApplicants = applications.filter(a => a.status === 'pending').length;

  return (
    <div className="admin-dashboard" id="admin-dashboard">
      <div className="page-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Manage the TasteCebu platform</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <FiActivity size={14} /> Analytics
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
          {activeTab === 'analytics' && analytics && (
            <div className="admin-section">
              <div className="admin-analytics-grid">
                {/* Subscription Revenue */}
                <div className="admin-kpi-card kpi-revenue">
                  <div className="kpi-icon-wrap kpi-icon-green">
                    <FiDollarSign size={24} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Subscription Revenue</span>
                    <span className="kpi-value">₱{Number(analytics.total_revenue || 0).toLocaleString()}</span>
                    <span className="kpi-sub">From seller subscriptions</span>
                  </div>
                </div>

                {/* Seller Applicants */}
                <div className="admin-kpi-card kpi-applicants">
                  <div className="kpi-icon-wrap kpi-icon-blue">
                    <FiUserPlus size={24} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Seller Applicants</span>
                    <span className="kpi-value">{analytics.total_applicants || 0}</span>
                    <span className="kpi-sub">Total applications received</span>
                  </div>
                </div>

                {/* Terminated Accounts */}
                <div className="admin-kpi-card kpi-terminated">
                  <div className="kpi-icon-wrap kpi-icon-red">
                    <FiSlash size={24} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Terminated Accounts</span>
                    <span className="kpi-value">{analytics.terminated_count || 0}</span>
                    <span className="kpi-sub">Sellers who terminated plans</span>
                  </div>
                </div>

                {/* Total Sellers */}
                <div className="admin-kpi-card kpi-sellers">
                  <div className="kpi-icon-wrap kpi-icon-cyan">
                    <FiShoppingBag size={24} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Total Sellers</span>
                    <span className="kpi-value">{analytics.total_sellers || 0}</span>
                    <span className="kpi-sub">Active sellers on platform</span>
                  </div>
                </div>

                {/* Total Users */}
                <div className="admin-kpi-card kpi-users">
                  <div className="kpi-icon-wrap kpi-icon-amber">
                    <FiUsers size={24} />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Total Users</span>
                    <span className="kpi-value">{analytics.total_users || 0}</span>
                    <span className="kpi-sub">Registered on the platform</span>
                  </div>
                </div>
              </div>

              {/* User Growth Trend Chart */}
              <div className="admin-chart-row-grid">
                <div className="admin-chart-card card">
                  <h3>User Growth (Last 30 Days)</h3>
                  <div className="admin-chart-wrap">
                    <Line
                      data={{
                        labels: (analytics.users_by_date || []).map(d => new Date(d.date).toLocaleDateString()),
                        datasets: [
                          {
                            label: 'New Users',
                            data: (analytics.users_by_date || []).map(d => d.count),
                            borderColor: '#c2630a',
                            backgroundColor: 'rgba(194, 99, 10, 0.08)',
                            fill: true,
                            tension: 0.3,
                            pointBackgroundColor: '#c2630a',
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: { mode: 'index', intersect: false },
                        scales: {
                          y: { type: 'linear', display: true, position: 'left' }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="admin-chart-card card">
                  <h3>Monthly Revenue (Platform)</h3>
                  <div className="admin-chart-wrap">
                    <Bar
                      data={{
                        labels: (analytics.monthly_revenue || []).map(r => r.month),
                        datasets: [
                          {
                            label: 'Revenue (₱)',
                            data: (analytics.monthly_revenue || []).map(r => r.revenue),
                            backgroundColor: '#1a8a4a',
                            borderRadius: 6,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: { 
                            type: 'linear', 
                            display: true, 
                            position: 'left',
                            ticks: {
                              callback: (value) => '₱' + value
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Charts Grid */}
              <div className="admin-charts-grid">
                <div className="admin-chart-card card">
                  <h3>Seller Applications Trend</h3>
                  <div className="admin-chart-wrap-sm">
                    <Line
                      data={{
                        labels: (analytics.applicants_by_date || []).map(d => new Date(d.date).toLocaleDateString()),
                        datasets: [{
                          label: 'New Applicants',
                          data: (analytics.applicants_by_date || []).map(d => d.count),
                          borderColor: '#2563eb',
                          backgroundColor: 'rgba(37, 99, 235, 0.08)',
                          fill: true,
                          tension: 0.3,
                          pointBackgroundColor: '#2563eb',
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                    />
                  </div>
                </div>

                <div className="admin-chart-card card">
                  <h3>Application Status</h3>
                  <div className="admin-chart-wrap-sm">
                    {(() => {
                      const statusColorMap = {
                        pending: '#b07d04',
                        approved: '#1a8a4a',
                        rejected: '#c42b2b',
                        terminated: '#7c3aed',
                      };
                      const statusData = (analytics.applications_by_status || [])
                        .filter(s => ['pending', 'approved', 'rejected', 'terminated'].includes(s.status));
                      return (
                        <Doughnut
                          data={{
                            labels: statusData.map(s => s.status.charAt(0).toUpperCase() + s.status.slice(1)),
                            datasets: [{
                              data: statusData.map(s => s.count),
                              backgroundColor: statusData.map(s => statusColorMap[s.status] || '#888'),
                            }]
                          }}
                          options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="admin-chart-card card">
                  <h3>Seller Subscriptions</h3>
                  <div className="admin-chart-wrap-sm">
                    <Bar
                      data={{
                        labels: (analytics.subscriptions_by_plan || []).map(s => s.subscription_plan),
                        datasets: [{
                          label: 'Active Shops',
                          data: (analytics.subscriptions_by_plan || []).map(s => s.count),
                          backgroundColor: '#c2630a',
                          borderRadius: 6,
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
                          {app.status === 'pending' ? <FiClock /> : app.status === 'approved' ? <FiCheck /> : app.status === 'terminated' ? <FiSlash /> : <FiX />}
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
                            <button className="btn btn-danger btn-sm" onClick={() => { if(confirm('Are you sure you want to terminate this seller? This will remove them from active applicants.')) handleApplication(app.id, 'terminated'); }}>
                              <FiSlash size={14} /> Terminate
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
        </>
      )}
    </div>
  );
}