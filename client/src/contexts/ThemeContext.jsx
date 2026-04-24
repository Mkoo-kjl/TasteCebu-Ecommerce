import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('tastecebu_theme') || 'light');
  const { user } = useAuth();

  // Load theme from API when user logs in
  useEffect(() => {
    if (user) {
      api.get('/users/settings')
        .then(res => {
          const serverTheme = res.data.settings.theme;
          setTheme(serverTheme);
          localStorage.setItem('tastecebu_theme', serverTheme);
        })
        .catch(() => {});
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tastecebu_theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (user) {
      try {
        await api.put('/users/settings', { theme: newTheme });
      } catch {}
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
