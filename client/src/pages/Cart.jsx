import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQuantity = async (id, quantity) => {
    try {
      await api.put(`/cart/${id}`, { quantity });
      fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      toast.success('Item removed');
      fetchCart();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const placeOrder = async () => {
    if (!address.trim()) return toast.error('Please enter a shipping address');
    setPlacing(true);
    try {
      const res = await api.post('/orders', { shipping_address: address });
      toast.success(res.data.message);
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="cart-page" id="cart-page">
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <p>{items.length} item{items.length !== 1 ? 's' : ''} in your cart</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Browse our products and add some delicious items!</p>
          <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map(item => (
              <div className="cart-item" key={item.id} id={`cart-item-${item.id}`}>
                <div className="cart-item-image">
                  {item.image ? <img src={item.image} alt={item.name} /> : <div className="product-placeholder-sm">🍽️</div>}
                </div>
                <div className="cart-item-info">
                  <Link to={`/products/${item.product_id}`} className="cart-item-name">{item.name}</Link>
                  <p className="cart-item-seller">by {item.seller_name}</p>
                  <p className="cart-item-price">₱{Number(item.price).toFixed(2)}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><FiMinus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.stock}><FiPlus size={14} /></button>
                  </div>
                  <span className="cart-item-subtotal">₱{(item.price * item.quantity).toFixed(2)}</span>
                  <button className="btn-icon danger" onClick={() => removeItem(item.id)}><FiTrash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({items.length} items)</span>
              <span>₱{Number(total).toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free-shipping">Free</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₱{Number(total).toFixed(2)}</span>
            </div>
            <div className="form-group">
              <label htmlFor="shipping-address">Shipping Address</label>
              <textarea id="shipping-address" placeholder="Enter your full delivery address" value={address}
                onChange={(e) => setAddress(e.target.value)} rows={3}></textarea>
            </div>
            <button className="btn btn-primary btn-full" onClick={placeOrder} disabled={placing} id="place-order-btn">
              <FiShoppingBag size={16} /> {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
