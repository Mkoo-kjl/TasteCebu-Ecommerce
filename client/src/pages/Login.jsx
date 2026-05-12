import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import brandIcon from '../assets/Pictures/tastecebuicon.jpg';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(data.message);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'seller') navigate('/seller/dashboard');
      else navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src={brandIcon} alt="TasteCebu Logo" className="auth-brand-icon" />
          <h1>Welcome Back</h1>
          <p>Sign in to your TasteCebu account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form" id="login-form">
          <div className={`form-group ${errors.email ? 'error' : ''}`}>
            <label htmlFor="email"><FiMail size={14} /> Email</label>
            <input id="email" type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className={`form-group ${errors.password ? 'error' : ''}`}>
            <label htmlFor="password"><FiLock size={14} /> Password</label>
            <div className="input-with-icon">
              <input id="password" type={showPass ? 'text' : 'password'} placeholder="Enter password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="login-submit-btn">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
