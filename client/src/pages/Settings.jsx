import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { FiSun, FiMoon, FiBell, FiBellOff, FiSave } from 'react-icons/fi';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/users/settings');
        setNotifications(!!res.data.settings.notifications_enabled);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  const handleNotificationsToggle = async () => {
    const newVal = !notifications;
    setNotifications(newVal);
    try {
      await api.put('/users/settings', { notifications_enabled: newVal });
      toast.success(`Notifications ${newVal ? 'enabled' : 'disabled'}`);
    } catch (err) {
      setNotifications(!newVal);
      toast.error('Failed to update settings');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="settings-page" id="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Customize your TasteCebu experience</p>
      </div>

      <div className="settings-list">
        <div className="setting-card card" id="theme-setting">
          <div className="setting-info">
            <div className="setting-icon">{theme === 'light' ? <FiSun size={24} /> : <FiMoon size={24} />}</div>
            <div>
              <h3>Appearance</h3>
              <p>Switch between light and dark mode</p>
            </div>
          </div>
          <div className="setting-control">
            <span className="setting-label">{theme === 'light' ? 'Light' : 'Dark'} Mode</span>
            <button className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`} onClick={toggleTheme} id="theme-toggle-setting">
              <span className="toggle-knob"></span>
            </button>
          </div>
        </div>

        <div className="setting-card card" id="notification-setting">
          <div className="setting-info">
            <div className="setting-icon">{notifications ? <FiBell size={24} /> : <FiBellOff size={24} />}</div>
            <div>
              <h3>Notifications</h3>
              <p>Receive updates about your orders and promotions</p>
            </div>
          </div>
          <div className="setting-control">
            <span className="setting-label">{notifications ? 'Enabled' : 'Disabled'}</span>
            <button className={`toggle-switch ${notifications ? 'active' : ''}`} onClick={handleNotificationsToggle} id="notifications-toggle">
              <span className="toggle-knob"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
