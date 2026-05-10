import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiStar, FiMapPin, FiPhone, FiPackage, FiShoppingBag, FiMessageSquare, FiAward, FiCalendar } from 'react-icons/fi';

function StarRating({ rating, size = 16 }) {
  return (
    <span className="star-rating-inline">
      {[1, 2, 3, 4, 5].map(s => (
        <FiStar key={s} size={size} className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'} />
      ))}
    </span>
  );
}

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const res = await api.get(`/products/seller/${id}`);
        setSeller(res.data.seller);
        setProducts(res.data.products);
      } catch {
        toast.error('Seller not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [id]);

  const handleMessageSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/messages/conversations', { seller_id: Number(id) });
      navigate(`/messages?conversation=${res.data.conversation_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start conversation');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!seller) return null;

  const business = seller.business;
  const stats = seller.stats;

  return (
    <div className="seller-profile-page" id="seller-profile-page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FiArrowLeft size={18} /> Back
      </button>

      {/* Hero Section */}
      <div className="seller-profile-hero">
        <div className="seller-profile-hero-bg"></div>
        <div className="seller-profile-hero-content">
          <div className="seller-profile-avatar-wrap">
            {seller.avatar ? (
              <img src={seller.avatar} alt={seller.name} className="seller-profile-avatar" />
            ) : (
              <div className="seller-profile-avatar-placeholder">
                {(business?.business_name || seller.name)?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="seller-profile-hero-info">
            <h1>{business?.business_name || seller.name}</h1>
            <p className="seller-profile-owner">by {seller.name}</p>
            {stats.avg_rating > 0 && (
              <div className="seller-profile-rating">
                <StarRating rating={stats.avg_rating} size={18} />
                <span className="seller-profile-rating-value">{stats.avg_rating}</span>
                <span className="seller-profile-rating-count">({stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}
            {business && (
              <p className="seller-profile-since">
                <FiCalendar size={13} /> Shop since {new Date(business.shop_since).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
          <div className="seller-profile-hero-actions">
            {user && user.role === 'user' && Number(id) !== user.id && (
              <button className="btn btn-primary" onClick={handleMessageSeller} id="message-seller-btn">
                <FiMessageSquare size={16} /> Message Seller
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="seller-profile-stats">
        <div className="sp-stat-card">
          <FiPackage size={22} />
          <div>
            <span className="sp-stat-number">{stats.total_products}</span>
            <span className="sp-stat-label">Products</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <FiShoppingBag size={22} />
          <div>
            <span className="sp-stat-number">{stats.total_sold}</span>
            <span className="sp-stat-label">Items Sold</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <FiStar size={22} />
          <div>
            <span className="sp-stat-number">{stats.avg_rating > 0 ? stats.avg_rating : '—'}</span>
            <span className="sp-stat-label">Rating</span>
          </div>
        </div>
        <div className="sp-stat-card">
          <FiAward size={22} />
          <div>
            <span className="sp-stat-number">{stats.total_reviews}</span>
            <span className="sp-stat-label">Reviews</span>
          </div>
        </div>
      </div>

      {/* Business Info */}
      {business && (
        <div className="seller-profile-info card">
          <h2>About This Shop</h2>
          <p className="seller-profile-description">{business.business_description}</p>
          <div className="seller-profile-details">
            <div className="sp-detail-item">
              <FiMapPin size={16} />
              <span>{business.business_address}</span>
            </div>
            <div className="sp-detail-item">
              <FiPhone size={16} />
              <span>{business.business_phone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="seller-profile-products">
        <h2>Products ({products.length})</h2>
        {products.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No products yet</h3>
            <p>This seller hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
