import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowRight, FiShoppingBag, FiTruck, FiShield } from 'react-icons/fi';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing-page" id="landing-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🇵🇭 Authentic Cebuano Flavors</div>
          <h1 className="hero-title">
            Discover the <span className="gradient-text">Taste of Cebu</span>
          </h1>
          <p className="hero-subtitle">
            From dried mangoes to lechon, explore the finest Cebuano delicacies crafted by local artisans and delivered fresh to your doorstep.
          </p>
          <div className="hero-actions">
            <Link to="/products" className="btn btn-primary btn-lg" id="hero-shop-btn">
              Shop Now <FiArrowRight />
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-outline btn-lg" id="hero-signup-btn">
                Create Account
              </Link>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card hero-card-1">🥭 Dried Mangoes</div>
          <div className="hero-card hero-card-2">🍖 Lechon Cebu</div>
          <div className="hero-card hero-card-3">🥜 Rosquillos</div>
          <div className="hero-card hero-card-4">🍪 Otap</div>
        </div>
      </section>

      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><FiShoppingBag size={28} /></div>
            <h3>Curated Selection</h3>
            <p>Hand-picked products from the best local sellers in Cebu.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiTruck size={28} /></div>
            <h3>Fast Delivery</h3>
            <p>Track your orders in real-time from purchase to your door.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiShield size={28} /></div>
            <h3>Secure Shopping</h3>
            <p>Your transactions and data are protected with encryption.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Become a Seller</h2>
          <p>Share your Cebuano products with the world. Join our marketplace and start selling today.</p>
          {user ? (
            <Link to="/seller/apply" className="btn btn-primary btn-lg">Apply Now</Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
          )}
        </div>
      </section>
    </div>
  );
}
