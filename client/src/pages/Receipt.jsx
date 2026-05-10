import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FiPrinter, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function Receipt() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await api.get(`/orders/${id}/receipt`);
        setReceipt(res.data.receipt);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  if (error) {
    return (
      <div className="receipt-page" id="receipt-page">
        <div className="empty-state">
          <span className="empty-icon">🧾</span>
          <h2>Receipt Unavailable</h2>
          <p>{error}</p>
          <Link to="/orders" className="btn btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  if (!receipt) return null;

  const orderDate = new Date(receipt.order_date);
  const deliveryDate = new Date(receipt.delivery_date);
  const receiptNumber = `TC-${String(receipt.order_id).padStart(6, '0')}`;

  return (
    <div className="receipt-page" id="receipt-page">
      {/* Action bar - hidden on print */}
      <div className="receipt-actions no-print">
        <Link to="/orders" className="btn btn-ghost">
          <FiArrowLeft size={16} /> Back to Orders
        </Link>
        <div className="receipt-actions-right">
          <button className="btn btn-primary" onClick={handlePrint} id="print-receipt-btn">
            <FiPrinter size={16} /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Receipt card */}
      <div className="receipt-card" id="receipt-card">
        {/* Receipt Header */}
        <div className="receipt-header">
          <div className="receipt-brand">
            <span className="receipt-logo">🍽️</span>
            <div>
              <h1 className="receipt-brand-name">TasteCebu</h1>
              <p className="receipt-brand-tagline">Authentic Cebuano Flavors</p>
            </div>
          </div>
          <div className="receipt-title-block">
            <h2 className="receipt-title">OFFICIAL RECEIPT</h2>
            <span className="receipt-number">{receiptNumber}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="receipt-status-bar">
          <div className="receipt-delivered-badge">
            <FiCheckCircle size={18} /> Delivered & Paid
          </div>
        </div>

        {/* Info Grid */}
        <div className="receipt-info-grid">
          <div className="receipt-info-block">
            <h4>Customer</h4>
            <p className="receipt-info-name">{receipt.customer.name}</p>
            <p>{receipt.customer.email}</p>
            {receipt.customer.phone && <p>{receipt.customer.phone}</p>}
          </div>
          <div className="receipt-info-block">
            <h4>Shipping Address</h4>
            <p>{receipt.shipping_address}</p>
          </div>
          <div className="receipt-info-block">
            <h4>Order Date</h4>
            <p>{orderDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="receipt-info-time">{orderDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="receipt-info-block">
            <h4>Delivery Date</h4>
            <p>{deliveryDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="receipt-info-time">{deliveryDate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Shop Info */}
        {receipt.shops && receipt.shops.length > 0 && (
          <div className="receipt-shops">
            <h4>Shop{receipt.shops.length > 1 ? 's' : ''}</h4>
            <div className="receipt-shops-list">
              {receipt.shops.map((shop, idx) => (
                <div key={idx} className="receipt-shop-item">
                  <span className="receipt-shop-name">{shop.business_name || shop.seller_name}</span>
                  {shop.business_address && <span className="receipt-shop-detail">📍 {shop.business_address}</span>}
                  {shop.business_phone && <span className="receipt-shop-detail">📞 {shop.business_phone}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="receipt-items-section">
          <table className="receipt-table">
            <thead>
              <tr>
                <th className="receipt-th-item">Item</th>
                <th className="receipt-th-qty">Qty</th>
                <th className="receipt-th-price">Unit Price</th>
                <th className="receipt-th-subtotal">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map(item => (
                <tr key={item.id}>
                  <td className="receipt-td-item">{item.product_name}</td>
                  <td className="receipt-td-qty">{item.quantity}</td>
                  <td className="receipt-td-price">₱{item.product_price.toFixed(2)}</td>
                  <td className="receipt-td-subtotal">₱{item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="receipt-totals">
          <div className="receipt-totals-row">
            <span>Subtotal</span>
            <span>₱{receipt.total_amount.toFixed(2)}</span>
          </div>
          <div className="receipt-totals-row">
            <span>Shipping</span>
            <span className="receipt-free">Free</span>
          </div>
          <div className="receipt-totals-divider"></div>
          <div className="receipt-totals-row receipt-grand-total">
            <span>Total Amount</span>
            <span>₱{receipt.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
          <p>Thank you for shopping with <strong>TasteCebu</strong>!</p>
          <p className="receipt-footer-note">This serves as your official digital receipt. For questions or concerns, please contact our support team.</p>
          <p className="receipt-footer-generated">Generated on {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
    </div>
  );
}
