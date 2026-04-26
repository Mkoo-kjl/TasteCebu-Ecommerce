import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiCheckSquare, FiSquare } from 'react-icons/fi';

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

export default function Cart() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.data.items);
      setTotal(res.data.total);
      // Select all items by default on first load
      setSelectedIds(prev => {
        if (prev.size === 0 && res.data.items.length > 0) {
          return new Set(res.data.items.map(i => i.id));
        }
        // Keep existing selections, remove any that no longer exist
        const validIds = new Set(res.data.items.map(i => i.id));
        const updated = new Set([...prev].filter(id => validIds.has(id)));
        return updated;
      });
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
      setSelectedIds(prev => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });
      fetchCart();
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const toggleItem = (id) => {
    setSelectedIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  // Calculate selected items totals
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const selectedCount = selectedItems.length;

  const placeOrder = async () => {
    if (!address.trim()) return toast.error('Please enter a shipping address');
    if (selectedCount === 0) return toast.error('Please select at least one item to checkout');
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        shipping_address: address,
        cart_item_ids: [...selectedIds],
      });
      toast.success(res.data.message);
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

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
            {/* Select All Header */}
            <div className="cart-select-all" id="cart-select-all">
              <label className="cart-checkbox-label" onClick={toggleAll}>
                <span className={`cart-checkbox ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}`}>
                  {allSelected ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                </span>
                <span className="cart-select-text">
                  {allSelected ? 'Deselect All' : 'Select All'} ({selectedIds.size}/{items.length})
                </span>
              </label>
            </div>

            {items.map(item => {
              const itemImage = getFirstImage(item.image);
              const isSelected = selectedIds.has(item.id);
              return (
                <div className={`cart-item ${isSelected ? 'cart-item-selected' : ''}`} key={item.id} id={`cart-item-${item.id}`}>
                  {/* Checkbox */}
                  <label className="cart-item-checkbox" onClick={() => toggleItem(item.id)}>
                    <span className={`cart-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected ? <FiCheckSquare size={20} /> : <FiSquare size={20} />}
                    </span>
                  </label>

                  <div className="cart-item-image">
                    {itemImage ? <img src={itemImage} alt={item.name} /> : <div className="product-placeholder-sm">🍽️</div>}
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
              );
            })}
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            {selectedCount === 0 ? (
              <div className="cart-no-selection">
                <p>No items selected</p>
                <p className="text-muted">Select items to see order summary</p>
              </div>
            ) : (
              <>
                <div className="summary-row">
                  <span>Selected ({selectedCount} item{selectedCount !== 1 ? 's' : ''})</span>
                  <span>₱{selectedTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="free-shipping">Free</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₱{selectedTotal.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="form-group">
              <label htmlFor="shipping-address">Shipping Address</label>
              <textarea id="shipping-address" placeholder="Enter your full delivery address" value={address}
                onChange={(e) => setAddress(e.target.value)} rows={3}></textarea>
            </div>
            <button className="btn btn-primary btn-full" onClick={placeOrder}
              disabled={placing || selectedCount === 0} id="place-order-btn">
              <FiShoppingBag size={16} /> {placing ? 'Placing Order...' : selectedCount === 0 ? 'Select Items to Checkout' : `Checkout ${selectedCount} Item${selectedCount !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
