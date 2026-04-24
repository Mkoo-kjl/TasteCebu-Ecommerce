import { Link } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';

export default function ProductCard({ product }) {
  return (
    <div className="product-card" id={`product-card-${product.id}`}>
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
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
