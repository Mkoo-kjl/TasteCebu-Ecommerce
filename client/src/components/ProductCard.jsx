import { Link } from 'react-router-dom';
import { FiStar, FiHeart } from 'react-icons/fi';

// Helper to get the first image from JSON array or legacy string
function getFirstImage(imageField) {
  if (!imageField) return null;
  try {
    const parsed = JSON.parse(imageField);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    return imageField;
  } catch {
    return imageField;
  }
}

function StarRating({ rating, size = 12 }) {
  return (
    <span className="star-rating-inline">
      {[1, 2, 3, 4, 5].map(s => (
        <FiStar
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'}
        />
      ))}
    </span>
  );
}

export default function ProductCard({ product }) {
  const image = getFirstImage(product.image);
  const reviewCount = product.review_count || 0;
  const avgRating = product.avg_rating ? Number(product.avg_rating).toFixed(1) : '0.0';

  return (
    <div className="product-card" id={`product-card-${product.id}`}>
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card-image">
          {image ? (
            <img src={image} alt={product.name} />
          ) : (
            <div className="product-placeholder">🍽️</div>
          )}
          <span className="product-category-badge">{product.category}</span>
        </div>
        <div className="product-card-info">
          <h3 className="product-card-name">{product.name}</h3>
          <p className="product-card-seller">by <Link to={`/seller/${product.seller_id}`} className="seller-name-link" onClick={(e) => e.stopPropagation()}>
            {product.seller_name}
          </Link></p>
          <div className="product-card-separator"></div>
          <div className="product-card-reviews">
            <StarRating rating={Number(avgRating)} />
            <span className="review-score">{avgRating}</span>
            <span className="review-count">({reviewCount})</span>
          </div>
          <div className="product-card-bottom">
            <span className="product-card-price"><span className="price-currency">₱</span>{Number(product.price).toFixed(2)}</span>
            <span className={`product-card-stock ${product.stock <= 5 ? 'low' : ''}`}>
              {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
