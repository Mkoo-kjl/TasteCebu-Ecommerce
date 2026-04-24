import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSend, FiBriefcase, FiMapPin, FiPhone, FiFileText, FiClock, FiCheck, FiX } from 'react-icons/fi';

export default function SellerApply() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState({ business_name: '', business_description: '', business_address: '', business_phone: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'seller') { navigate('/seller/dashboard'); return; }
    const fetchStatus = async () => {
      try {
        const res = await api.get('/seller/application-status');
        setApplication(res.data.application);
        // If just got approved, refresh user role
        if (res.data.application?.status === 'approved') {
          await refreshUser();
          navigate('/seller/dashboard');
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchStatus();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.business_description.trim() || !form.business_address.trim() || !form.business_phone.trim()) {
      return toast.error('All fields are required');
    }
    setSubmitting(true);
    try {
      const res = await api.post('/seller/apply', form);
      toast.success(res.data.message);
      const statusRes = await api.get('/seller/application-status');
      setApplication(statusRes.data.application);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  // Show status if application exists
  if (application) {
    const statusConfig = {
      pending: { icon: <FiClock size={40} />, color: '#f59e0b', title: 'Application Pending', desc: 'Your seller application is being reviewed by our admin team.' },
      rejected: { icon: <FiX size={40} />, color: '#ef4444', title: 'Application Rejected', desc: application.admin_notes || 'Your application was not approved. You may submit a new application.' },
    };
    const config = statusConfig[application.status];
    if (!config) return null;

    return (
      <div className="seller-apply-page" id="seller-apply-page">
        <div className="status-card card" style={{ borderColor: config.color }}>
          <div className="status-icon" style={{ color: config.color }}>{config.icon}</div>
          <h2>{config.title}</h2>
          <p>{config.desc}</p>
          <p className="status-meta">Submitted: {new Date(application.created_at).toLocaleDateString()}</p>
          {application.status === 'rejected' && (
            <button className="btn btn-primary" onClick={() => setApplication(null)}>Submit New Application</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="seller-apply-page" id="seller-apply-page">
      <div className="page-header">
        <h1>Become a Seller</h1>
        <p>Fill out the form below to apply for a seller account</p>
      </div>

      <form onSubmit={handleSubmit} className="card seller-form" id="seller-apply-form">
        <div className="form-group">
          <label htmlFor="biz-name"><FiBriefcase size={14} /> Business Name</label>
          <input id="biz-name" type="text" placeholder="Your business name" value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="biz-desc"><FiFileText size={14} /> Business Description</label>
          <textarea id="biz-desc" rows={4} placeholder="Describe your products and business"
            value={form.business_description} onChange={(e) => setForm({ ...form, business_description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="biz-address"><FiMapPin size={14} /> Business Address</label>
            <input id="biz-address" type="text" placeholder="Full business address" value={form.business_address}
              onChange={(e) => setForm({ ...form, business_address: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="biz-phone"><FiPhone size={14} /> Business Phone</label>
            <input id="biz-phone" type="text" placeholder="09171234567" value={form.business_phone}
              onChange={(e) => setForm({ ...form, business_phone: e.target.value })} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting} id="submit-seller-app-btn">
          <FiSend size={16} /> {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
