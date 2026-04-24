import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiHelpCircle } from 'react-icons/fi';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=security question, 3=done
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Email is required');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setUserId(res.data.user_id);
      setQuestion(res.data.security_question);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error finding account');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return toast.error('Security answer is required');
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        user_id: userId, security_answer: answer, new_password: newPassword,
      });
      toast.success(res.data.message);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" id="forgot-password-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔑</span>
          <h1>Reset Password</h1>
          <p>{step === 1 ? 'Enter your email to get started' : step === 2 ? 'Answer your security question' : 'Password reset successful!'}</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="auth-form" id="forgot-email-form">
            <div className="form-group">
              <label htmlFor="fp-email"><FiMail size={14} /> Email Address</label>
              <input id="fp-email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Searching...' : 'Continue'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetSubmit} className="auth-form" id="forgot-reset-form">
            <div className="form-group">
              <label><FiHelpCircle size={14} /> Security Question</label>
              <p className="security-question-text">{question}</p>
            </div>
            <div className="form-group">
              <label htmlFor="fp-answer">Your Answer</label>
              <input id="fp-answer" type="text" placeholder="Enter your answer" value={answer}
                onChange={(e) => setAnswer(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="fp-new-pass"><FiLock size={14} /> New Password</label>
              <div className="input-with-icon">
                <input id="fp-new-pass" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)} />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirm-pass">Confirm New Password</label>
              <input id="fp-confirm-pass" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="auth-success">
            <div className="success-icon">✅</div>
            <p>Your password has been reset successfully.</p>
            <Link to="/login" className="btn btn-primary btn-full">Go to Login</Link>
          </div>
        )}

        <p className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
