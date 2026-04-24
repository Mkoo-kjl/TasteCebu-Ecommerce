import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft } from 'react-icons/fi';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

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

  return (
    <div className="product-detail-page" id="product-detail-page">
      <button className="back-btn" onClick={() => navigate('/products')}>
        <FiArrowLeft size={18} /> Back to Products
      </button>

      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
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

          {product.stock > 0 && (
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
        </div>
      </div>
    </div>
  );
}
