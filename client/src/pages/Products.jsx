import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import { FiSearch, FiFilter, FiGrid, FiList, FiChevronRight } from 'react-icons/fi';

const CATEGORY_ICONS = {
  'Dried Fruits': '🥭',
  'Meat & Lechon': '🍖',
  'Pastries & Bread': '🥐',
  'Snacks': '🍿',
  'Beverages': '☕',
  'Condiments': '🫙',
  'Seafood': '🦐',
  'Sweets': '🍬',
  'General': '🛒',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('sections'); // 'sections' or 'grid'
  const sectionRefs = useRef({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (sort) params.sort = sort;
      const res = await api.get('/products', { params });
      setProducts(res.data.products);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const cat = product.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  // Get sorted category keys
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    if (a === 'General') return 1;
    if (b === 'General') return -1;
    return a.localeCompare(b);
  });

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const scrollToCategory = (cat) => {
    setSelectedCategory(cat);
    if (cat !== 'All' && viewMode === 'sections' && sectionRefs.current[cat]) {
      sectionRefs.current[cat].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const displayCategories = selectedCategory === 'All' ? sortedCategories : [selectedCategory];

  return (
    <div className="dashboard-main-standalone" id="products-page">
      {/* Hero Header */}
      <div className="products-hero" id="products-hero">
        <div className="products-hero-content">
          <span className="products-hero-eyebrow">EXPLORE OUR COLLECTION</span>
          <h1>Cebuano <span className="text-accent">Delicacies</span></h1>
          <p>Discover authentic flavors from our trusted local sellers — curated for quality, delivered with love.</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="products-toolbar" id="products-toolbar">
        <form onSubmit={handleSearch} className="products-search-bar">
          <FiSearch size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="product-search-input"
          />
        </form>

        <div className="products-filter-controls">
          <div className="filter-group">
            <FiFilter size={16} />
            <select value={sort} onChange={(e) => setSort(e.target.value)} id="sort-select">
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'sections' ? 'active' : ''}`}
              onClick={() => setViewMode('sections')}
              title="Category sections view"
            >
              <FiList size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <FiGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-pills-container" id="category-pills">
        <button
          className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => scrollToCategory('All')}
        >
          <span className="category-pill-icon">🏪</span>
          All Products
          <span className="category-pill-count">{products.length}</span>
        </button>
        {(categories.length > 0 ? categories : sortedCategories).map(cat => {
          const count = groupedProducts[cat]?.length || 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => scrollToCategory(cat)}
            >
              <span className="category-pill-icon">{CATEGORY_ICONS[cat] || '📦'}</span>
              {cat}
              <span className="category-pill-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="loading-screen"><div className="spinner"></div></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <h2>No products found</h2>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      ) : viewMode === 'sections' ? (
        /* Category Sections View */
        <div className="products-sections" id="products-sections">
          {displayCategories.map(cat => {
            const catProducts = groupedProducts[cat];
            if (!catProducts || catProducts.length === 0) return null;
            return (
              <section
                key={cat}
                className="product-category-section"
                ref={el => sectionRefs.current[cat] = el}
                id={`section-${cat.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <div className="category-section-header">
                  <div className="category-section-title">
                    <span className="category-section-icon">{CATEGORY_ICONS[cat] || '📦'}</span>
                    <div>
                      <h2>{cat}</h2>
                      <span className="category-section-count">{catProducts.length} {catProducts.length === 1 ? 'product' : 'products'}</span>
                    </div>
                  </div>
                  {selectedCategory === 'All' && catProducts.length > 4 && (
                    <button className="category-view-all" onClick={() => scrollToCategory(cat)}>
                      View All <FiChevronRight size={16} />
                    </button>
                  )}
                </div>
                <div className="products-grid">
                  {catProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="products-grid" id="products-grid">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
