import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="brand-icon">🍽️</span>
          <span>TasteCebu</span>
          <p className="footer-tagline">Authentic Cebuano delicacies delivered to your door.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/products">All Products</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/profile">Profile</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/settings">Settings</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} TasteCebu. All rights reserved.</p>
      </div>
    </footer>
  );
}
