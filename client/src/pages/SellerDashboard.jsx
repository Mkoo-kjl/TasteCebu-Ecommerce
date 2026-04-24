import { useState, useEffect } from 'react';
import api from '../utils/api';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiPackage, FiDollarSign, FiBox } from 'react-icons/fi';

const CATEGORIES = ['Dried Fruits', 'Meat & Lechon', 'Pastries & Bread', 'Snacks', 'Beverages', 'Condiments', 'Seafood', 'Sweets', 'General'];

const emptyProduct = { name: '', description: '', price: '', stock: '', image: '', category: 'General' };

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ ...emptyProduct });
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.products);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({ ...emptyProduct });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description,
      price: product.price, stock: product.stock,
      image: product.image || '', category: product.category || 'General',
    });
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, image: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.price || !form.stock) {
      return toast.error('Name, description, price, and stock are required');
    }
    setSaving(true);
    try {
      if (editingProduct) {
        await api.put(`/seller/products/${editingProduct.id}`, { ...form, price: Number(form.price), stock: Number(form.stock) });
        toast.success('Product updated!');
      } else {
        await api.post('/seller/products', { ...form, price: Number(form.price), stock: Number(form.stock) });
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

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="seller-dashboard" id="seller-dashboard">
      <div className="page-header">
        <div>
          <h1>Seller Dashboard</h1>
          <p>Manage your products</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} id="add-product-btn">
          <FiPlus size={16} /> Add Product
        </button>
      </div>

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
              {products.map(p => (
                <tr key={p.id}>
                  <td><div className="table-img">{p.image ? <img src={p.image} alt={p.name} /> : '🍽️'}</div></td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

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
            <label>Product Image</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {form.image && <img src={form.image} alt="Preview" className="image-preview" />}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
            {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
