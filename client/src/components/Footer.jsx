import { Link, useLocation } from 'react-router-dom';
import brandIcon from '../assets/pictures/tastecebuicon.jpg';

export default function Footer() {
  const location = useLocation();

  // Hide footer completely on admin and seller dashboard pages
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/seller/dashboard')) {
    return null;
  }

  return (
    <footer className="footer" id="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-gold-rule"></div>
          <Link to="/" className="navbar-brand" style={{ marginBottom: '16px' }}>
            <img src={brandIcon} alt="TasteCebu Logo" className="brand-logo-img" />
            <span className="brand-taste" style={{ color: '#ffffff' }}>TASTE</span>
            <span className="brand-cebu">CEBU</span>
          </Link>
          <p className="footer-tagline">Authentic Cebuano delicacies, handcrafted with passion and delivered to your door.</p>
          <div className="footer-social">
            {/* Facebook */}
            <a href="#" className="footer-social-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            {/* Instagram */}
            <a href="#" className="footer-social-link" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* TikTok */}
            <a href="#" className="footer-social-link" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
          </div>
        </div>
          <div className="footer-col">
            <h4>· Shop</h4>
            <Link to="/products">All Products</Link>
            <Link to="/products">Categories</Link>
            <Link to="/products">New Arrivals</Link>
          </div>
          <div className="footer-col">
            <h4>· Support</h4>
            <Link to="/">Contact Us</Link>
            <Link to="/">FAQ</Link>
            <Link to="/">Shipping Info</Link>
          </div>
          <div className="footer-col">
            <h4>· Company</h4>
            <Link to="/">About Us</Link>
            <Link to="/seller/apply">Become a Seller</Link>
            <Link to="/">Terms of Service</Link>
          </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TasteCebu. All rights reserved. <span className="footer-love">Made with ❤️ in Cebu</span></p>
      </div>
    </footer>
  );
}
