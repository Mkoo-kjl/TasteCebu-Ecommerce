import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiCamera, FiSave } from 'react-icons/fi';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [avatar, setAvatar] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg'].includes(file.type)) return toast.error('Only PNG and JPEG allowed');
  if (file.size > 50 * 1024 * 1024) return toast.error('Image must be under 50MB');

  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const MAX = 256; // profile pic — 256px is plenty
    const scale = Math.min(MAX / img.width, MAX / img.height, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    setAvatar(canvas.toDataURL('image/jpeg', 0.8)); // ~15–30KB base64
    URL.revokeObjectURL(url);
  };
  img.src = url;
};

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    setSaving(true);
    try {
      const res = await api.put('/users/profile', { ...form, avatar });
      toast.success(res.data.message);
      await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.current_password) return toast.error('Current password is required');
    if (passwordForm.new_password.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords do not match');
    setChangingPass(true);
    try {
      const res = await api.put('/users/password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success(res.data.message);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="profile-page" id="profile-page">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information</p>
      </div>

      <div className="profile-tabs">
        <button className={`tab ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => setActiveSection('profile')}>
          <FiUser size={14} /> Profile Info
        </button>
        <button className={`tab ${activeSection === 'password' ? 'active' : ''}`} onClick={() => setActiveSection('password')}>
          <FiLock size={14} /> Change Password
        </button>
      </div>

      {activeSection === 'profile' && (
        <form onSubmit={handleSaveProfile} className="profile-form card" id="profile-form">
          <div className="avatar-section">
            <div className="avatar-preview">
              {avatar ? <img src={avatar} alt="Avatar" /> : <FiUser size={40} />}
              <label className="avatar-upload" htmlFor="avatar-input">
                <FiCamera size={16} />
                <input type="file" id="avatar-input" accept="image/png, image/jpeg" onChange={handleAvatarChange} hidden />
              </label>
            </div>
            <div>
              <h3>{user?.name}</h3>
              <span className="role-badge">{user?.role}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile-name"><FiUser size={14} /> Full Name</label>
              <input id="profile-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label htmlFor="profile-email"><FiMail size={14} /> Email</label>
              <input id="profile-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="profile-phone"><FiPhone size={14} /> Phone</label>
              <input id="profile-phone" type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="profile-address"><FiMapPin size={14} /> Delivery Address</label>
            <textarea id="profile-address" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter your full delivery address"></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving} id="save-profile-btn">
            <FiSave size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      )}

      {activeSection === 'password' && (
        <form onSubmit={handleChangePassword} className="profile-form card" id="password-form">
          <div className="form-group">
            <label htmlFor="current-pass">Current Password</label>
            <input id="current-pass" type="password" value={passwordForm.current_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="new-pass">New Password</label>
            <input id="new-pass" type="password" placeholder="Min 6 characters" value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-new-pass">Confirm New Password</label>
            <input id="confirm-new-pass" type="password" value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={changingPass} id="change-pass-btn">
            <FiLock size={16} /> {changingPass ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  );
}
