import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';

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

export default function ProductCard({ product }) {
  const image = getFirstImage(product.image);
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
          <p className="product-card-seller">by {product.seller_name}</p>
          <div className="product-card-bottom">
            <span className="product-card-price">₱{Number(product.price).toFixed(2)}</span>
            <span className={`product-card-stock ${product.stock <= 5 ? 'low' : ''}`}>
              {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
