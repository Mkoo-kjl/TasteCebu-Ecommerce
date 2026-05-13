import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiChevronLeft, FiChevronRight, FiInfo, FiStar, FiImage, FiSend, FiX } from 'react-icons/fi';

const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper to parse images from product (handles JSON array or legacy single string)
function parseImages(product) {
  if (!product) return [];
  const raw = product.image;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [raw];
  } catch {
    return [raw];
  }
}

function StarRating({ rating, size = 16, interactive = false, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <span className="star-rating-inline">
      {[1, 2, 3, 4, 5].map(s => (
        <FiStar
          key={s}
          size={size}
          className={s <= (interactive ? (hovered || rating) : Math.round(rating)) ? 'star-filled' : 'star-empty'}
          style={interactive ? { cursor: 'pointer' } : {}}
          onMouseEnter={interactive ? () => setHovered(s) : undefined}
          onMouseLeave={interactive ? () => setHovered(0) : undefined}
          onClick={interactive ? () => onChange(s) : undefined}
        />
      ))}
    </span>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, avgRating: 0 });
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '', review_image: null });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Seller rating state
  const [sellerRating, setSellerRating] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data.reviews);
      setReviewStats({ totalReviews: res.data.totalReviews, avgRating: res.data.avgRating });
    } catch { console.error('Fetch reviews error'); }
  }, [id]);

  const checkCanReview = useCallback(async () => {
    try {
      const res = await api.get(`/reviews/can-review/${id}`);
      setCanReview(res.data.canReview);
    } catch { console.error('Check can review error'); }
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);

        // Fetch seller rating
        if (res.data.product.seller_id) {
          try {
            const ratingRes = await api.get(`/reviews/seller/${res.data.product.seller_id}/rating`);
            setSellerRating(ratingRes.data);
          } catch { /* ignore */ }
        }
      } catch {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    const init = async () => {
      await fetchProduct();
      await fetchReviews();
    };
    init();
  }, [id, navigate, fetchReviews]);

  useEffect(() => {
    const check = async () => {
      if (user && product) {
        await checkCanReview();
      }
    };
    check();
  }, [user, product, checkCanReview]);

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    setAdding(true);
    try {
      await api.post('/cart', { product_id: product.id, quantity });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleReviewImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      return toast.error('Only PNG and JPEG images are allowed.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return toast.error('Image must be under 50MB');
    }
    const reader = new FileReader();
    reader.onloadend = () => setReviewForm(prev => ({ ...prev, review_image: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return toast.error('Please select a rating');

    setSubmittingReview(true);
    try {
      await api.post(`/reviews/product/${id}`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        review_image: reviewForm.review_image,
      });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 0, comment: '', review_image: null });
      fetchReviews();
      checkCanReview();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!product) return null;

  const images = parseImages(product);
  const canAddToCart = !user || user.role === 'user';

  return (
    <div className="dashboard-main-standalone" id="product-detail-page">
      <div className="product-detail-page">
      <button className="back-btn" onClick={() => navigate('/products')}>
        <FiArrowLeft size={18} /> Back to Products
      </button>

      <div className="product-detail-grid">
        <div className="product-detail-image">
          {images.length > 0 ? (
            <div className="image-gallery">
              <div className="gallery-main">
                {images.length > 1 && (
                  <button className="gallery-nav prev" onClick={() => setActiveImageIndex((activeImageIndex - 1 + images.length) % images.length)}>
                    <FiChevronLeft size={20} />
                  </button>
                )}
                <img src={images[activeImageIndex]} alt={product.name} className="gallery-main-img" />
                {images.length > 1 && (
                  <button className="gallery-nav next" onClick={() => setActiveImageIndex((activeImageIndex + 1) % images.length)}>
                    <FiChevronRight size={20} />
                  </button>
                )}
              </div>
              {images.length > 1 && (
                <div className="gallery-thumbnails">
                  {images.map((img, idx) => (
                    <button key={idx} className={`gallery-thumb ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}>
                      <img src={img} alt={`${product.name} ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              )}
              <span className="image-counter">{activeImageIndex + 1} / {images.length}</span>
            </div>
          ) : (
            <div className="product-placeholder-lg">🍽️</div>
          )}
        </div>

        <div className="product-detail-info">
          <span className="product-category-badge">{product.category}</span>
          <h1>{product.name}</h1>
          <div className="product-seller-row">
            <p className="product-seller">Sold by <Link to={`/seller/${product.seller_id}`} className="seller-name-link"><strong>{product.seller_name}</strong></Link></p>
            {sellerRating && sellerRating.totalReviews > 0 && (
              <span className="seller-rating-badge">
                <StarRating rating={sellerRating.avgRating} size={13} />
                <span>{sellerRating.avgRating} ({sellerRating.totalReviews} seller reviews)</span>
              </span>
            )}
          </div>
          <p className="product-price-lg">₱{Number(product.price).toFixed(2)}</p>
          <p className="product-description">{product.description}</p>

          <div className="product-stock-info">
            <span className={`stock-badge ${product.stock <= 5 ? 'low' : 'available'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {product.stock > 0 && canAddToCart && (
            <div className="add-to-cart-section">
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                  <FiMinus size={16} />
                </button>
                <span className="quantity-display">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>
                  <FiPlus size={16} />
                </button>
              </div>
              <button className="btn btn-primary btn-lg add-cart-btn" onClick={handleAddToCart} disabled={adding} id="add-to-cart-btn">
                <FiShoppingCart size={18} /> {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {user && user.role !== 'user' && (
            <div className="role-notice">
              <FiInfo size={16} />
              <span>{user.role === 'seller' ? 'Sellers cannot purchase products.' : 'Admins cannot purchase products.'} Only customers can add items to cart.</span>
            </div>
          )}
        </div>
      </div>

      {/* ========== REVIEWS SECTION ========== */}
      <div className="reviews-section" id="reviews-section">
        <div className="reviews-header">
          <div className="reviews-summary">
            <h2>Customer Reviews</h2>
            <div className="reviews-aggregate">
              <span className="reviews-avg-large">{reviewStats.avgRating > 0 ? reviewStats.avgRating : '—'}</span>
              <div className="reviews-avg-detail">
                <StarRating rating={reviewStats.avgRating} size={18} />
                <span className="reviews-total-count">{reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}</span>
              </div>
            </div>
          </div>
          {canReview && !showReviewForm && (
            <button className="btn btn-primary" onClick={() => setShowReviewForm(true)} id="write-review-btn">
              <FiStar size={16} /> Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="review-form card" id="review-form">
            <div className="review-form-header">
              <h3>Write Your Review</h3>
              <button type="button" className="btn-icon" onClick={() => setShowReviewForm(false)}><FiX size={18} /></button>
            </div>



            <div className="form-group">
              <label>Rating</label>
              <div className="rating-picker">
                <StarRating rating={reviewForm.rating} size={28} interactive onChange={(r) => setReviewForm(prev => ({ ...prev, rating: r }))} />
                <span className="rating-label">{reviewForm.rating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewForm.rating] : 'Select rating'}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Comment</label>
              <textarea rows={3} placeholder="Share your experience with this product..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} />
            </div>

            <div className="form-group">
              <label>Photo <span className="label-hint">(optional, PNG/JPEG only)</span></label>
              {reviewForm.review_image ? (
                <div className="review-image-preview">
                  <img src={reviewForm.review_image} alt="Review" />
                  <button type="button" className="remove-image-btn" onClick={() => setReviewForm(prev => ({ ...prev, review_image: null }))}>
                    <FiX size={12} />
                  </button>
                </div>
              ) : (
                <label className="image-upload-btn">
                  <FiImage size={18} />
                  <span>Attach Photo</span>
                  <input type="file" accept="image/png, image/jpeg" onChange={handleReviewImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <button type="submit" className="btn btn-primary" disabled={submittingReview} id="submit-review-btn">
              <FiSend size={16} /> {submittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="empty-state reviews-empty">
            <span className="empty-icon">💬</span>
            <h3>No reviews yet</h3>
            <p>Be the first to review this product!</p>
          </div>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div className="review-card" key={review.id} id={`review-${review.id}`}>
                <div className="review-card-header">
                  <div className="review-author">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt={review.reviewer_name} className="review-avatar" />
                    ) : (
                      <div className="review-avatar-placeholder">
                        {review.reviewer_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <span className="review-author-name">{review.reviewer_name}</span>
                      <span className="review-date">{new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                {review.comment && <p className="review-comment">{review.comment}</p>}
                {review.review_image && (
                  <div className="review-photo">
                    <img src={review.review_image} alt="Review" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
