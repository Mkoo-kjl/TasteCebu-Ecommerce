import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { FiPackage, FiClock, FiTruck, FiCheckCircle, FiXCircle, FiStar, FiFileText } from 'react-icons/fi';


const STATUS_CONFIG = {
  pending: { icon: <FiClock />, color: '#f59e0b', label: 'Pending' },
  processing: { icon: <FiPackage />, color: '#3b82f6', label: 'Processing' },
  shipped: { icon: <FiTruck />, color: '#8b5cf6', label: 'Shipped' },
  delivered: { icon: <FiCheckCircle />, color: '#10b981', label: 'Delivered' },
  cancelled: { icon: <FiXCircle />, color: '#ef4444', label: 'Cancelled' },
};

const TABS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// Helper to parse first image from product_image field
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, orderId: null });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await api.get('/orders', { params });
      setOrders(res.data.orders);
    } catch (err) {
      console.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const cancelOrder = async (id) => {
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  };

  return (
    <div className="dashboard-main-standalone" id="orders-page">
        <div className="orders-page" id="orders-page">
          <div className="page-header">
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h2>No orders found</h2>
          <p>{activeTab === 'all' ? "You haven't placed any orders yet." : `No ${activeTab} orders.`}</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div className="order-card" key={order.id} id={`order-${order.id}`}>
                <div className="order-header">
                  <div>
                    <span className="order-id">Order #{order.id}</span>
                    <span className="order-date">{new Date(order.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <span className="status-badge" style={{ background: config.color + '20', color: config.color }}>
                    {config.icon} {config.label}
                  </span>
                </div>

                <div className="order-items">
                  {order.items && order.items.map(item => {
                    const itemImage = getFirstImage(item.product_image);
                    return (
                      <div className="order-item" key={item.id}>
                        <div className="order-item-image">
                          {itemImage ? <img src={itemImage} alt={item.product_name} /> : <div className="product-placeholder-sm">🍽️</div>}
                        </div>
                        <div className="order-item-info">
                          <span className="order-item-name">{item.product_name}</span>
                          <span className="order-item-meta">₱{Number(item.product_price).toFixed(2)} × {item.quantity}</span>
                        </div>
                        <span className="order-item-total">₱{(item.product_price * item.quantity).toFixed(2)}</span>
                        {order.status === 'delivered' && item.product_id && (
                          <Link to={`/products/${item.product_id}#reviews-section`} className="btn btn-sm btn-review" id={`review-btn-${item.id}`}>
                            <FiStar size={13} /> Review
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="order-footer">
                  <div className="order-address">
                    <strong>Ship to:</strong> {order.shipping_address}
                  </div>
                  <div className="order-total-row">
                    <span className="order-total">Total: ₱{Number(order.total_amount).toFixed(2)}</span>
                    {order.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => setCancelConfirm({ open: true, orderId: order.id })}>Cancel Order</button>
                    )}
                    {order.status === 'delivered' && (
                      <Link to={`/orders/${order.id}/receipt`} className="btn btn-sm btn-receipt" id={`receipt-btn-${order.id}`}>
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

      {/* Cancel Order Confirm */}
      <ConfirmModal
        isOpen={cancelConfirm.open}
        onClose={() => setCancelConfirm({ open: false, orderId: null })}
        onConfirm={() => {
          cancelOrder(cancelConfirm.orderId);
          setCancelConfirm({ open: false, orderId: null });
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmText="Cancel Order"
        variant="danger"
      />
        </div>
      </div>
  );
}
