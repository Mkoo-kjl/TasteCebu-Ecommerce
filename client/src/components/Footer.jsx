import { useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();

  // Hide footer completely on admin and seller dashboard pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller/dashboard')) {
    return null;
  }

  return (
    <footer className="footer" id="main-footer">
      <div className="footer-container" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div className="footer-brand" style={{ maxWidth: '100%' }}>
          <span className="brand-icon">🍽️</span>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '8px' }}>TasteCebu</span>
          <p className="footer-tagline">Authentic Cebuano delicacies delivered to your door.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TasteCebu. All rights reserved.</p>
      </div>
    </footer>
  );
}
