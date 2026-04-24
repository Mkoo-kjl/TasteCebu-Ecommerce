import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiHelpCircle } from 'react-icons/fi';

const SECURITY_QUESTIONS = [
  'What is the name of your favorite city?',
  'What was the name of your first pet?',
  'What is your mother\'s maiden name?',
  'What was your childhood nickname?',
  'What is your favorite food?',
];

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', security_question: SECURITY_QUESTIONS[0], security_answer: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.security_answer.trim()) e.security_answer = 'Security answer is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await register({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, security_question: form.security_question,
        security_answer: form.security_answer,
      });
      toast.success(data.message);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-icon">🍽️</span>
          <h1>Create Account</h1>
          <p>Join TasteCebu and start shopping</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form" id="register-form">
          <div className="form-row">
            <div className={`form-group ${errors.name ? 'error' : ''}`}>
              <label htmlFor="name"><FiUser size={14} /> Full Name</label>
              <input id="name" type="text" placeholder="Juan Dela Cruz" value={form.name}
                onChange={(e) => update('name', e.target.value)} />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>
            <div className={`form-group ${errors.email ? 'error' : ''}`}>
              <label htmlFor="reg-email"><FiMail size={14} /> Email</label>
              <input id="reg-email" type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => update('email', e.target.value)} />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className={`form-group ${errors.password ? 'error' : ''}`}>
              <label htmlFor="reg-password"><FiLock size={14} /> Password</label>
              <div className="input-with-icon">
                <input id="reg-password" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
                  onChange={(e) => update('password', e.target.value)} />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>
            <div className={`form-group ${errors.confirmPassword ? 'error' : ''}`}>
              <label htmlFor="confirm-password"><FiLock size={14} /> Confirm Password</label>
              <input id="confirm-password" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)} />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>
          <div className={`form-group`}>
            <label htmlFor="phone"><FiPhone size={14} /> Phone (optional)</label>
            <input id="phone" type="text" placeholder="09171234567" value={form.phone}
              onChange={(e) => update('phone', e.target.value)} />
          </div>
          <div className={`form-group`}>
            <label htmlFor="security-question"><FiHelpCircle size={14} /> Security Question</label>
            <select id="security-question" value={form.security_question}
              onChange={(e) => update('security_question', e.target.value)}>
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          </div>
          <div className={`form-group ${errors.security_answer ? 'error' : ''}`}>
            <label htmlFor="security-answer">Security Answer</label>
            <input id="security-answer" type="text" placeholder="Your answer" value={form.security_answer}
              onChange={(e) => update('security_answer', e.target.value)} />
            {errors.security_answer && <span className="form-error">{errors.security_answer}</span>}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} id="register-submit-btn">
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
