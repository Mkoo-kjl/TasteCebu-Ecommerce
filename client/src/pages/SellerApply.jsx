import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSend, FiBriefcase, FiMapPin, FiPhone, FiFileText, FiClock, FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';

const TERMS_AND_CONDITIONS = `TASTECEBU SELLER TERMS AND CONDITIONS

Last Updated: April 2026

By applying to become a seller on TasteCebu, you agree to the following Terms and Conditions:

1. SELLER ELIGIBILITY
You must be a legitimate business operating within Cebu, Philippines. You must provide accurate business information during registration. Misrepresentation of your business may result in immediate account termination.

2. PRODUCT LISTINGS
All products listed must be authentic, food-safe, and comply with local food safety regulations. You are responsible for the accuracy of product descriptions, pricing, and images. Misleading or false product information is strictly prohibited.

3. ORDER FULFILLMENT
Sellers must process and ship orders within the timeframe specified. Sellers must maintain adequate inventory to fulfill orders. Repeated failure to fulfill orders may result in account suspension.

4. QUALITY STANDARDS
All products must meet TasteCebu's quality standards. Sellers must maintain proper food handling, storage, and packaging practices. Products must be properly labeled with ingredients and allergen information where applicable.

5. PRICING & FEES
TasteCebu may charge a commission on each sale. Pricing must be fair and consistent. Price manipulation or deceptive pricing practices are prohibited.

6. CUSTOMER SERVICE
Sellers must respond to customer inquiries in a timely manner. Sellers must handle returns and refunds according to TasteCebu's refund policy. Sellers must maintain professional communication with customers.

7. INTELLECTUAL PROPERTY
Sellers must only list products they have the right to sell. Sellers must not infringe on any trademarks, copyrights, or other intellectual property rights.

8. ACCOUNT TERMINATION
TasteCebu reserves the right to suspend or terminate seller accounts for violations of these terms. Sellers may request account closure at any time.

9. LIABILITY
Sellers are responsible for the quality and safety of their products. TasteCebu is not liable for any damages arising from seller products. Sellers must maintain appropriate business insurance.

10. MODIFICATIONS
TasteCebu reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.

By checking the box below, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.`;

export default function SellerApply() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState({ business_name: '', business_description: '', business_address: '', business_phone: '' });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subscriptionPaid, setSubscriptionPaid] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');

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
    if (!agreedToTerms) {
      return toast.error('You must agree to the Terms and Conditions');
    }
    setSubmitting(true);
    try {
      const res = await api.post('/seller/apply', { ...form, agreed_to_terms: true, subscription_plan: selectedPlan });
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

  if (!subscriptionPaid) {
    return (
      <div className="seller-apply-page" id="seller-apply-page">
        <div className="page-header">
          <h1>Seller Subscriptions</h1>
          <p>Choose a plan that fits your business to start selling.</p>
        </div>
        
        <div className="subscription-plans" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Basic Plan */}
          <div 
            className={`subscription-card card plan-card ${selectedPlan === 'basic' ? 'selected' : ''}`} 
            style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.3s', border: selectedPlan === 'basic' ? '2px solid #64748b' : '2px solid transparent', boxShadow: selectedPlan === 'basic' ? '0 0 0 4px rgba(100, 116, 139, 0.2), 0 15px 30px rgba(0,0,0,0.1)' : '', transform: selectedPlan === 'basic' ? 'translateY(-8px)' : 'none' }}
            onClick={() => setSelectedPlan('basic')}
          >
            <div style={{ marginBottom: '20px', transition: 'transform 0.3s', transform: selectedPlan === 'basic' ? 'scale(1.1)' : 'scale(1)' }}>
              <FiCheckCircle size={40} color={selectedPlan === 'basic' ? '#64748b' : '#cbd5e1'} />
            </div>
            <h2>Basic Plan</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#64748b', margin: '20px 0' }}>
              ₱199 <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ month</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 30px auto', textAlign: 'left', flex: 1, display: 'inline-block' }}>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Up to 50 Products</li>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Standard Dashboard</li>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Standard Support</li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div 
            className={`subscription-card card plan-card ${selectedPlan === 'pro' ? 'selected' : ''}`} 
            style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', transition: 'all 0.3s', border: selectedPlan === 'pro' ? '2px solid #3b82f6' : '2px solid transparent', boxShadow: selectedPlan === 'pro' ? '0 0 0 4px rgba(59, 130, 246, 0.2), 0 20px 40px rgba(59, 130, 246, 0.15)' : '0 8px 25px rgba(0,0,0,0.08)', transform: selectedPlan === 'pro' ? 'scale(1.05) translateY(-8px)' : 'scale(1.05)', background: selectedPlan === 'pro' ? 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)' : '#ffffff', zIndex: 2 }}
            onClick={() => setSelectedPlan('pro')}
          >
            <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', padding: '6px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)' }}>Most Popular</div>
            <div style={{ marginBottom: '20px', transition: 'transform 0.3s', transform: selectedPlan === 'pro' ? 'scale(1.15)' : 'scale(1)', marginTop: '10px' }}>
              <FiCheckCircle size={54} color={selectedPlan === 'pro' ? '#3b82f6' : '#cbd5e1'} />
            </div>
            <h2 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Pro Plan</h2>
            <div style={{ fontSize: '3.2rem', fontWeight: '900', color: '#3b82f6', margin: '15px 0' }}>
              ₱499 <span style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: '500' }}>/ month</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 30px auto', textAlign: 'left', flex: 1, display: 'inline-block', color: '#334155' }}>
              <li style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '1.05rem' }}><FiCheck color="#10b981" size={20} /> Unlimited Products</li>
              <li style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '1.05rem' }}><FiCheck color="#10b981" size={20} /> Advanced Analytics</li>
              <li style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '1.05rem' }}><FiCheck color="#10b981" size={20} /> Priority Support</li>
              <li style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', fontSize: '1.05rem' }}><FiCheck color="#10b981" size={20} /> Featured Placement</li>
            </ul>
          </div>

          {/* Enterprise Plan */}
          <div 
            className={`subscription-card card plan-card ${selectedPlan === 'enterprise' ? 'selected' : ''}`} 
            style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.3s', border: selectedPlan === 'enterprise' ? '2px solid #f59e0b' : '2px solid transparent', boxShadow: selectedPlan === 'enterprise' ? '0 0 0 4px rgba(245, 158, 11, 0.2), 0 15px 30px rgba(0,0,0,0.1)' : '', transform: selectedPlan === 'enterprise' ? 'translateY(-8px)' : 'none' }}
            onClick={() => setSelectedPlan('enterprise')}
          >
            <div style={{ marginBottom: '20px', transition: 'transform 0.3s', transform: selectedPlan === 'enterprise' ? 'scale(1.1)' : 'scale(1)' }}>
              <FiCheckCircle size={40} color={selectedPlan === 'enterprise' ? '#f59e0b' : '#cbd5e1'} />
            </div>
            <h2>Enterprise Plan</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b', margin: '20px 0' }}>
              ₱999 <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ month</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 auto 30px auto', textAlign: 'left', flex: 1, display: 'inline-block' }}>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Unlimited Everything</li>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Custom Shop Design</li>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Dedicated Account Manager</li>
              <li style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}><FiCheck color="#10b981" /> Top Tier Visibility</li>
            </ul>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', paddingBottom: '40px' }}>
          <button 
            className="btn btn-primary btn-lg" 
            style={{ padding: '16px 40px', fontSize: '1.2rem', minWidth: '300px', boxShadow: '0 8px 25px rgba(232, 130, 12, 0.4)' }}
            onClick={() => { toast.success(`Payment for ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan successful!`); setSubscriptionPaid(true); }}
          >
            Pay ₱{selectedPlan === 'basic' ? '199' : selectedPlan === 'pro' ? '499' : '999'} & Continue
          </button>
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

        {/* Terms and Conditions */}
        <div className="terms-section" id="terms-section">
          <label className="form-label"><FiFileText size={14} /> Terms and Conditions</label>
          <div className="terms-content">
            <pre className="terms-text">{TERMS_AND_CONDITIONS}</pre>
          </div>
          <label className="terms-checkbox" id="terms-checkbox-label">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              id="agree-terms-checkbox"
            />
            <span className="checkmark"></span>
            <span className="terms-label-text">
              I have read and agree to the <strong>Terms and Conditions</strong>
            </span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting || !agreedToTerms} id="submit-seller-app-btn">
          <FiSend size={16} /> {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
