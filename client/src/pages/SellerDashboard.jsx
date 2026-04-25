import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiBox, FiShoppingBag, FiX, FiImage,
  FiClock, FiTruck, FiCheckCircle, FiXCircle, FiBarChart2, FiStar, FiTrendingUp, FiShoppingCart } from 'react-icons/fi';

const CATEGORIES = ['Dried Fruits', 'Meat & Lechon', 'Pastries & Bread', 'Snacks', 'Beverages', 'Condiments', 'Seafood', 'Sweets', 'General'];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const STATUS_CONFIG = {
  pending: { icon: <FiClock />, color: '#f59e0b', label: 'Pending' },
  processing: { icon: <FiPackage />, color: '#3b82f6', label: 'Processing' },
  shipped: { icon: <FiTruck />, color: '#8b5cf6', label: 'Shipped' },
  delivered: { icon: <FiCheckCircle />, color: '#10b981', label: 'Delivered' },
  cancelled: { icon: <FiXCircle />, color: '#ef4444', label: 'Cancelled' },
};

const emptyProduct = { name: '', description: '', price: '', stock: '', images: [], category: 'General' };

// Helper to parse images from product
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

// Helper to get first image
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

function StarDisplay({ rating, size = 14 }) {
  return (
    <span className="star-rating-inline">
      {[1, 2, 3, 4, 5].map(s => (
        <FiStar key={s} size={size} className={s <= Math.round(rating) ? 'star-filled' : 'star-empty'} />
      ))}
    </span>
  );
}

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = orderFilter !== 'all' ? { status: orderFilter } : {};
      const res = await api.get('/seller/orders', { params });
      setOrders(res.data.orders);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/analytics');
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, orderFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ ...emptyProduct, images: [] });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description,
      price: product.price, stock: product.stock,
      images: parseImages(product), category: product.category || 'General',
    });
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 10) {
      return toast.error('Maximum 10 images allowed');
    }
    files.forEach(file => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a valid format. Only PNG and JPEG allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} exceeds 50MB limit`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const removeImage = (index) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price || !form.stock) {
      return toast.error('Name, description, price, and stock are required');
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.images,
        category: form.category,
      };
      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct.id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/seller/products', payload);
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product? This action cannot be undone.')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/seller/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="seller-dashboard" id="seller-dashboard">
      <div className="page-header">
        <div>
          <h1>Seller Dashboard</h1>
          <p>Manage your products and orders</p>
        </div>
        {activeTab === 'products' && (
          <button className="btn btn-primary" onClick={openCreateModal} id="add-product-btn">
            <FiPlus size={16} /> Add Product
          </button>
        )}
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <FiPackage size={14} /> Products
        </button>
        <button className={`tab ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
          <FiShoppingBag size={14} /> Orders
        </button>
        <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
          <FiBarChart2 size={14} /> Analytics
        </button>
      </div>

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <FiPackage size={24} />
              <div><span className="stat-number">{products.length}</span><span className="stat-label">Total Products</span></div>
            </div>
            <div className="stat-card">
              <FiBox size={24} />
              <div><span className="stat-number">{products.filter(p => p.is_active).length}</span><span className="stat-label">Active</span></div>
            </div>
            <div className="stat-card">
              <FiDollarSign size={24} />
              <div><span className="stat-number">{products.filter(p => p.stock <= 5 && p.stock > 0).length}</span><span className="stat-label">Low Stock</span></div>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h2>No products yet</h2>
              <p>Create your first product to start selling!</p>
              <button className="btn btn-primary" onClick={openCreateModal}>Add Product</button>
            </div>
          ) : (
            <div className="products-table-wrapper">
              <table className="data-table" id="seller-products-table">
                <thead>
                  <tr>
                    <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const firstImg = getFirstImage(p.image);
                    return (
                      <tr key={p.id}>
                        <td><div className="table-img">{firstImg ? <img src={firstImg} alt={p.name} /> : '🍽️'}</div></td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category}</td>
                        <td>₱{Number(p.price).toFixed(2)}</td>
                        <td><span className={p.stock <= 5 ? 'text-warning' : ''}>{p.stock}</span></td>
                        <td><span className={`status-dot ${p.is_active ? 'active' : 'inactive'}`}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-icon" onClick={() => openEditModal(p)} title="Edit"><FiEdit2 size={14} /></button>
                            <button className="btn-icon danger" onClick={() => handleDelete(p.id)} title="Delete"><FiTrash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="admin-section">
          <div className="tabs sub-tabs">
            {['all', ...ORDER_STATUSES].map(s => (
              <button key={s} className={`tab ${orderFilter === s ? 'active' : ''}`}
                onClick={() => setOrderFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📦</span>
              <h2>No orders found</h2>
              <p>{orderFilter === 'all' ? 'No customer orders yet.' : `No ${orderFilter} orders.`}</p>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map(order => {
                const config = STATUS_CONFIG[order.status];
                return (
                  <div className="order-card" key={order.id} id={`seller-order-${order.id}`}>
                    <div className="order-header">
                      <div>
                        <span className="order-id">Order #{order.id}</span>
                        <span className="order-meta">by {order.customer_name} ({order.customer_email}) • {new Date(order.created_at).toLocaleDateString()}</span>
                      </div>
                      <select value={order.status}
                        onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                        className={`status-select status-${order.status}`}>
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="order-items">
                      {order.items?.map(item => (
                        <div className="order-item" key={item.id}>
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>₱{(item.product_price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <span>📍 {order.shipping_address}</span>
                      <span className="order-total">Your Total: ₱{Number(order.seller_total).toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && analytics && (
        <div className="analytics-section">
          <div className="dashboard-stats analytics-stats">
            <div className="stat-card stat-revenue">
              <FiDollarSign size={24} />
              <div>
                <span className="stat-number">₱{analytics.summary.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                <span className="stat-label">Total Revenue</span>
              </div>
            </div>
            <div className="stat-card stat-orders">
              <FiShoppingCart size={24} />
              <div>
                <span className="stat-number">{analytics.summary.totalOrders}</span>
                <span className="stat-label">Delivered Orders</span>
              </div>
            </div>
            <div className="stat-card stat-sold">
              <FiTrendingUp size={24} />
              <div>
                <span className="stat-number">{analytics.summary.totalUnitsSold}</span>
                <span className="stat-label">Units Sold</span>
              </div>
            </div>
            <div className="stat-card stat-rating">
              <FiStar size={24} />
              <div>
                <span className="stat-number">{analytics.summary.avgRating > 0 ? analytics.summary.avgRating : '—'}</span>
                <span className="stat-label">Avg Rating ({analytics.summary.totalReviews} reviews)</span>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          {analytics.statusBreakdown && analytics.statusBreakdown.length > 0 && (
            <div className="analytics-status-breakdown card">
              <h3>Order Status Breakdown</h3>
              <div className="status-pills">
                {analytics.statusBreakdown.map(s => {
                  const cfg = STATUS_CONFIG[s.status] || {};
                  return (
                    <div className="status-pill" key={s.status} style={{ borderColor: cfg.color }}>
                      <span className="status-pill-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
                      <span className="status-pill-count">{s.count}</span>
                      <span className="status-pill-label">{cfg.label || s.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Per-Product Performance */}
          <div className="analytics-products card">
            <h3>Product Performance</h3>
            {analytics.productStats.length === 0 ? (
              <p className="text-muted">No product data yet.</p>
            ) : (
              <div className="products-table-wrapper">
                <table className="data-table" id="analytics-products-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Avg Rating</th>
                      <th>Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.productStats.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="analytics-product-name">
                            {(() => {
                              const img = getFirstImage(p.image);
                              return img ? <img src={img} alt={p.name} className="analytics-thumb" /> : <span className="analytics-thumb-placeholder">🍽️</span>;
                            })()}
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>{Number(p.units_sold)}</td>
                        <td>₱{Number(p.revenue).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        <td>
                          {Number(p.avg_rating) > 0 ? (
                            <span className="analytics-rating">
                              <StarDisplay rating={Number(p.avg_rating)} size={12} />
                              <span>{Number(p.avg_rating).toFixed(1)}</span>
                            </span>
                          ) : '—'}
                        </td>
                        <td>{Number(p.review_count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSubmit} className="modal-form" id="product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" placeholder="e.g., Dried Mangoes" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} placeholder="Describe your product" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (₱)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input type="number" min="0" placeholder="0" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Product Images <span className="label-hint">(up to 10, PNG/JPEG only, max 50MB each)</span></label>
            <div className="multi-image-upload">
              {form.images.length > 0 && (
                <div className="image-previews-grid">
                  {form.images.map((img, idx) => (
                    <div className="image-preview-item" key={idx}>
                      <img src={img} alt={`Preview ${idx + 1}`} />
                      <button type="button" className="remove-image-btn" onClick={() => removeImage(idx)} title="Remove image">
                        <FiX size={12} />
                      </button>
                      {idx === 0 && <span className="primary-badge">Main</span>}
                    </div>
                  ))}
                </div>
              )}
              {form.images.length < 10 && (
                <label className="image-upload-btn">
                  <FiImage size={18} />
                  <span>Add Images ({form.images.length}/10)</span>
                  <input type="file" accept="image/png, image/jpeg" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
