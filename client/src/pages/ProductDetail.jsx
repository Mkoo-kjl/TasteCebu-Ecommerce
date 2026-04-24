import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiChevronLeft, FiChevronRight, FiInfo } from 'react-icons/fi';

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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

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

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!product) return null;

  const images = parseImages(product);
  const canAddToCart = !user || user.role === 'user';

  return (
    <div className="product-detail-page" id="product-detail-page">
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
          <p className="product-seller">Sold by <strong>{product.seller_name}</strong></p>
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
    </div>
  );
}
