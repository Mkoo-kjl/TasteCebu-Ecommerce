import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiBox, FiShoppingBag, FiX, FiImage,
  FiClock, FiTruck, FiCheckCircle, FiXCircle, FiBarChart2, FiStar, FiTrendingUp, FiShoppingCart, FiFileText, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

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
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('products');
  const [sellerPlan, setSellerPlan] = useState('basic');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradePlanSelected, setUpgradePlanSelected] = useState('pro');
  const [upgrading, setUpgrading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/seller/analytics/export');
      const data = res.data;
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Revenue (₱)', data.summary.totalRevenue],
        ['Total Units Sold', data.summary.totalUnitsSold],
        ['Delivered Orders', data.summary.totalOrders],
        ['Total Reviews', data.summary.totalReviews],
        ['Average Rating', data.summary.avgRating],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

      // Product Performance sheet
      if (data.productStats.length > 0) {
        const prodHeaders = ['Product', 'Category', 'Price (₱)', 'Stock', 'Units Sold', 'Revenue (₱)', 'Avg Rating', 'Reviews'];
        const prodRows = data.productStats.map(p => [p.name, p.category, p.price, p.stock, p.units_sold, p.revenue, p.avg_rating, p.review_count]);
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]), 'Product Performance');
      }

      // Order Status sheet
      if (data.statusBreakdown.length > 0) {
        const statusRows = [['Status', 'Count'], ...data.statusBreakdown.map(s => [s.status, s.count])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusRows), 'Order Status');
      }

      // Monthly Revenue sheet
      if (data.monthlyRevenue.length > 0) {
        const revRows = [['Month', 'Revenue (₱)'], ...data.monthlyRevenue.map(r => [r.month, r.revenue])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revRows), 'Monthly Revenue');
      }

      // Top Selling Products (matches the Doughnut chart - top 5)
      if (data.productStats.length > 0) {
        const topProducts = [...data.productStats].sort((a, b) => b.units_sold - a.units_sold).slice(0, 5);
        const topRows = [['Product', 'Units Sold', 'Revenue (₱)'], ...topProducts.map(p => [p.name, p.units_sold, p.revenue])];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topRows), 'Top Selling Products');
      }

      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `TasteCebu_Seller_Analytics_${date}.xlsx`);
      toast.success('Analytics exported successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

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
    if (sellerPlan === 'basic') return;
    setLoading(true);
    try {
      const res = await api.get('/seller/analytics');
      setAnalytics(res.data);
    } catch (err) { 
      if (err.response?.status === 403) setAnalytics({ restricted: true });
      else console.error(err); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/seller/application-status');
        if (res.data.application) setSellerPlan(res.data.application.subscription_plan);
      } catch (err) {}
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    else if (activeTab === 'orders') fetchOrders();
    else if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, orderFilter, sellerPlan]);

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
      return toast.error(`${file.name}: Only PNG and JPEG allowed.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      return toast.error(`${file.name} exceeds 50MB limit`);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800; // 800px max for product images
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      setForm(prev => ({ ...prev, images: [...prev.images, compressed] }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

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

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate your seller subscription? This will close your shop and deactivate your products.')) return;
    try {
      await api.post('/seller/terminate');
      toast.success('Subscription terminated successfully.');
      await refreshUser();
      navigate('/');
    } catch (err) {
      toast.error('Termination failed.');
    }
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.put('/seller/upgrade', { plan: upgradePlanSelected });
      toast.success(`Successfully upgraded to ${upgradePlanSelected.charAt(0).toUpperCase() + upgradePlanSelected.slice(1)} plan!`);
      setSellerPlan(upgradePlanSelected);
      setUpgradeModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed.');
    } finally {
      setUpgrading(false);
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className="badge" style={{ background: '#3b82f6', color: '#fff', padding: '5px 10px', borderRadius: '12px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
            {sellerPlan} Plan
          </span>
          {activeTab === 'products' && (
            <button 
              className="btn btn-primary" 
              onClick={openCreateModal} 
              id="add-product-btn"
              disabled={sellerPlan === 'basic' && products.length >= 50}
              title={sellerPlan === 'basic' && products.length >= 50 ? "Basic plan limit reached (50 products)" : ""}
            >
              <FiPlus size={16} /> Add Product
            </button>
          )}
          <button className="btn btn-danger" onClick={handleTerminate}>
            <FiX size={16} /> Terminate
          </button>
        </div>
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
                      <div className="order-total-row">
                        <span className="order-total">Your Total: ₱{Number(order.seller_total).toFixed(2)}</span>
                        {order.status === 'delivered' && (
                          <Link to={`/orders/${order.id}/receipt`} className="btn btn-sm btn-receipt" id={`seller-receipt-btn-${order.id}`}>
                            <FiFileText size={13} /> View Receipt
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ANALYTICS TAB */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          {sellerPlan === 'basic' ? (
            <div className="empty-state">
              <span className="empty-icon">🔒</span>
              <h2>Analytics Restricted</h2>
              <p>Analytics are not available on the Basic plan.</p>
              <button className="btn btn-primary" onClick={() => setUpgradeModalOpen(true)}>Upgrade Subscription</button>
            </div>
          ) : analytics && !analytics.restricted ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button className="btn btn-export" onClick={handleExportExcel} disabled={exporting} id="seller-export-btn">
                  <FiDownload size={15} /> {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
              </div>
              <div className="dashboard-stats analytics-stats">
                <div className="stat-card stat-revenue">
                  <FiDollarSign size={24} />
                  <div>
                    <span className="stat-number">₱{analytics.summary?.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    <span className="stat-label">Total Revenue</span>
                  </div>
                </div>
                <div className="stat-card stat-orders">
                  <FiShoppingCart size={24} />
                  <div>
                    <span className="stat-number">{analytics.summary?.totalOrders}</span>
                    <span className="stat-label">Delivered Orders</span>
                  </div>
                </div>
                <div className="stat-card stat-sold">
                  <FiTrendingUp size={24} />
                  <div>
                    <span className="stat-number">{analytics.summary?.totalUnitsSold}</span>
                    <span className="stat-label">Units Sold</span>
                  </div>
                </div>
                <div className="stat-card stat-rating">
                  <FiStar size={24} />
                  <div>
                    <span className="stat-number">{analytics.summary?.avgRating > 0 ? analytics.summary?.avgRating : '—'}</span>
                    <span className="stat-label">Avg Rating ({analytics.summary?.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

          {/* Charts Row */}
          <div className="admin-chart-row-grid">
            <div className="admin-chart-card card">
              <h3>Monthly Revenue</h3>
              <div className="admin-chart-wrap">
                {(!analytics.monthlyRevenue || analytics.monthlyRevenue.length === 0) ? (
                  <p className="text-muted" style={{textAlign: 'center', marginTop: '40px'}}>No revenue data yet.</p>
                ) : (
                  <Bar
                    data={{
                      labels: analytics.monthlyRevenue.map(r => r.month),
                      datasets: [{
                        label: 'Revenue (₱)',
                        data: analytics.monthlyRevenue.map(r => Number(r.revenue)),
                        backgroundColor: '#10b981',
                        borderRadius: 6,
                      }]
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false,
                      scales: { y: { type: 'linear', display: true, position: 'left', ticks: { callback: (value) => '₱' + value } } }
                    }}
                  />
                )}
              </div>
            </div>

            <div className="admin-chart-card card">
              <h3>Top Selling Products</h3>
              <div className="admin-chart-wrap-sm">
                {(() => {
                  const topProducts = [...(analytics.productStats || [])].sort((a, b) => b.units_sold - a.units_sold).slice(0, 5);
                  if (topProducts.length === 0) return <p className="text-muted" style={{textAlign: 'center', marginTop: '40px'}}>No sales data yet.</p>;
                  return (
                    <Doughnut
                      data={{
                        labels: topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
                        datasets: [{
                          data: topProducts.map(p => p.units_sold),
                          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'],
                        }]
                      }}
                      options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }}
                    />
                  );
                })()}
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
          </>
          ) : null}
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

      {/* UPGRADE MODAL */}
      <Modal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} title="Upgrade Subscription">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px' }}>
          <p>Choose a higher tier plan to unlock more features.</p>
          
          <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
            <div 
              onClick={() => setUpgradePlanSelected('pro')}
              style={{ padding: '20px', border: upgradePlanSelected === 'pro' ? '2px solid #3b82f6' : '2px solid var(--glass-border)', borderRadius: '12px', cursor: 'pointer', background: upgradePlanSelected === 'pro' ? 'rgba(59, 130, 246, 0.05)' : 'var(--card-bg)', position: 'relative' }}
            >
              <div style={{ position: 'absolute', top: '-10px', right: '15px', background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>POPULAR</div>
              <h3 style={{ margin: 0, color: '#3b82f6' }}>Pro Plan</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0 10px 0' }}>₱499 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ month</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                <li>✓ Unlimited Products</li>
                <li>✓ Advanced Analytics</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>

            <div 
              onClick={() => setUpgradePlanSelected('enterprise')}
              style={{ padding: '20px', border: upgradePlanSelected === 'enterprise' ? '2px solid #f59e0b' : '2px solid var(--glass-border)', borderRadius: '12px', cursor: 'pointer', background: upgradePlanSelected === 'enterprise' ? 'rgba(245, 158, 11, 0.05)' : 'var(--card-bg)' }}
            >
              <h3 style={{ margin: 0, color: '#f59e0b' }}>Enterprise Plan</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0 10px 0' }}>₱999 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ month</span></div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                <li>✓ Unlimited Everything</li>
                <li>✓ Custom Shop Design</li>
                <li>✓ Dedicated Account Manager</li>
              </ul>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-full" 
            style={{ marginTop: '10px', padding: '15px' }} 
            onClick={handleUpgrade}
            disabled={upgrading}
          >
            {upgrading ? 'Upgrading...' : `Pay ₱${upgradePlanSelected === 'pro' ? '499' : '999'} & Upgrade`}
          </button>
        </div>
      </Modal>

    </div>
  );
}
