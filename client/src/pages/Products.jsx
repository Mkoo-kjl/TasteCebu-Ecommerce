import { useState, useEffect } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiFilter } from 'react-icons/fi';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();
      if (sort) params.sort = sort;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [selectedCategory, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="products-page" id="products-page">
      <div className="page-header">
        <h1>Our Products</h1>
        <p>Discover authentic Cebuano delicacies from our trusted sellers</p>
      </div>

      <div className="products-toolbar">
        <form onSubmit={handleSearch} className="search-bar" id="product-search">
          <FiSearch size={18} />
          <input type="text" placeholder="Search products..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        <div className="filter-controls">
          <div className="filter-group">
            <FiFilter size={14} />
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} id="category-filter">
              <option value="All">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} id="sort-filter">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h2>No products found</h2>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
