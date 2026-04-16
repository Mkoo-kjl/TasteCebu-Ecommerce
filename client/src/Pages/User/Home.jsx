import React, { useState, useEffect } from 'react';

// ─── ICON & BRAND ───────────────────────────────────────────────
import icon from "../../assets/icon.png";

// ─── HERO IMAGES ────────────────────────────────────────────────
// CHANGED: Added an extra ../ to match the depth of the icon import
import heroBanner from "../../assets/dried-mangoes.png";
import heroTop    from "../../assets/bananaChips.png";
import heroBottom from "../../assets/otap.png";

// ─── CEBU'S FAVORITES ───────────────────────────────────────────
import driedMangoes from "../../assets/dried-mangoes.png";
import bananaChips  from "../../assets/bananaChips.png";
import otap   from "../../assets/otap.png";
import pastillas    from "../../assets/pastillas.png";

// ─── CEBUANO CLASSICS ───────────────────────────────────────────
import chicharon from "../../assets/chicharon.png";
import putocheese   from "../../assets/putocheese.png";
import piyaya  from "../../assets/piyaya.png";
import peanutkisses     from "../../assets/peanutkisses.png";

const Home = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    if (!user) {
      const savedUser = localStorage.getItem('user'); 
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/'; 
  };

  // ── DERIVE DISPLAY VALUES (FIXED FOR FIRST_NAME) ────────────────
  const firstName  = user?.first_name || 'Guest';
  const lastName   = user?.last_name  || '';
  const userName   = `${firstName} ${lastName}`.trim();
  const userEmail  = user?.email       || '';
  
  const userAvatar = user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=ea580c&color=fff&bold=true&size=128`;

  // ── Local UI state ──────────────────────────────────────────────
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeNav, setActiveNav]           = useState('Home');
  const [cartCount, setCartCount]           = useState(0);
  const [searchQuery, setSearchQuery]       = useState('');

  const categories = ['All Cravings', 'Sweet Delights', 'Savory'];
  const navItems   = ['Home', 'Orders', 'Products', 'Settings'];

  const popular = [
    { name: 'Premium Dried Mangoes', price: 'P250.00', img: driedMangoes },
    { name: 'Golden Banana Chips',   price: 'P120.00', img: bananaChips  },
    { name: 'Otap Cookies',           price: 'P80.00',  img: otap   },
    { name: 'Special Pastillas',     price: 'P100.00', img: pastillas    },
  ];

  const classics = [
    { name: 'Chicharon sa CarCar', price: 'P180.00', img: chicharon },
    { name: 'Puto Cheese',        price: 'P150.00', img: putocheese },
    { name: 'Piaya',             price: 'P90.00',  img: piyaya  },
    { name: 'Peanut Kisses',     price: 'P60.00',  img: peanutkisses },
  ];

  const handleAddToCart = () => setCartCount((prev) => prev + 1);

  const filterItems = (items) => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const styles = {
    wrapper: {
      display: 'flex',
      height: '100vh',
      fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      background: '#fff8f4',
    },
    dotBg: {
      position: 'absolute',
      inset: 0,
      backgroundImage: 'radial-gradient(circle, #f4a46a 1.2px, transparent 1.2px)',
      backgroundSize: '28px 28px',
      opacity: 0.45,
      zIndex: 0,
      pointerEvents: 'none',
    },
    gradientOverlay: {
      position: 'absolute',
      inset: 0,
      background:
        'radial-gradient(ellipse at top left, rgba(251,146,60,0.22) 0%, transparent 55%), ' +
        'radial-gradient(ellipse at bottom right, rgba(249,115,22,0.18) 0%, transparent 55%)',
      zIndex: 0,
      pointerEvents: 'none',
    },
    sidebar: {
      position: 'relative',
      zIndex: 1,
      width: 220,
      minWidth: 220,
      padding: '36px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 36,
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(249,115,22,0.1)',
    },
    userCard: {
      paddingLeft: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },
    sidebarAvatar: {
      width: 52,
      height: 52,
      borderRadius: '50%',
      border: '2.5px solid #fb923c',
      objectFit: 'cover',
      marginBottom: 8,
    },
    greetingName: {
      fontSize: 17, fontWeight: 800, margin: 0,
      color: '#1c1c1e', letterSpacing: '-0.3px',
    },
    greetingEmail: {
      fontSize: 10.5, color: '#b07850',
      margin: '2px 0 0', fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      maxWidth: 168,
    },
    greetingSub: {
      fontSize: 11.5, color: '#9a6b4b',
      margin: '5px 0 0', fontWeight: 600,
    },
    navList: {
      listStyle: 'none', padding: 0, margin: 0,
      display: 'flex', flexDirection: 'column', gap: 6,
    },
    navItem: (active) => ({
      padding: '11px 18px',
      borderRadius: 14,
      fontWeight: 700,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'all 0.18s',
      background: active ? 'linear-gradient(135deg, #f97316, #fb923c)' : 'transparent',
      color: active ? '#fff' : '#555',
      boxShadow: active ? '0 4px 14px rgba(249,115,22,0.35)' : 'none',
    }),
    logoutBtn: {
        marginTop: 'auto',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid rgba(234, 88, 12, 0.2)',
        background: 'transparent',
        color: '#ea580c',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: '0.2s'
    },
    rightContainer: {
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative', zIndex: 1,
    },
    header: {
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 36px',
      background: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(249,115,22,0.08)',
    },
    logo: { display: 'flex', alignItems: 'center', gap: 9 },
    logoText: {
      fontSize: 21, fontWeight: 900,
      letterSpacing: '-0.5px', color: '#ea580c',
    },
    logoTextAccent: { color: '#f59e0b' },
    topNav: {
      display: 'flex', gap: 28,
      fontSize: 13.5, fontWeight: 700, color: '#888',
    },
    topNavActive: { color: '#ea580c', cursor: 'pointer' },
    topNavItem:   { cursor: 'pointer' },
    headerRight:  { display: 'flex', alignItems: 'center', gap: 18 },
    searchBox: {
      position: 'relative', display: 'flex', alignItems: 'center',
    },
    searchInput: {
      padding: '8px 14px 8px 34px',
      borderRadius: 22,
      border: '1.5px solid rgba(249,115,22,0.25)',
      background: 'rgba(255,255,255,0.8)',
      outline: 'none', width: 185, fontSize: 13,
      color: '#333', fontFamily: 'inherit',
    },
    searchIcon: {
      position: 'absolute', left: 11, fontSize: 13, color: '#aaa',
    },
    cartBtn: {
      position: 'relative', fontSize: 20,
      cursor: 'pointer', lineHeight: 1,
    },
    cartBadge: {
      position: 'absolute', top: -5, right: -6,
      width: 15, height: 15, borderRadius: '50%',
      background: '#f97316', fontSize: 9, fontWeight: 800,
      color: '#fff', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    },
    headerUserWrapper: {
      display: 'flex', alignItems: 'center', gap: 8,
    },
    headerUserName: {
      fontSize: 13, fontWeight: 700, color: '#1c1c1e',
    },
    avatar: {
      width: 34, height: 34, borderRadius: '50%',
      border: '2.5px solid #fb923c',
      objectFit: 'cover',
    },
    main: {
      flex: 1, overflowY: 'auto',
      padding: '24px 36px 40px',
    },
    heroGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: 14, height: 300, marginBottom: 26,
    },
    heroMain: {
      backgroundImage: `url(${heroBanner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 28,
      boxShadow: '0 8px 30px rgba(249,115,22,0.18)',
      position: 'relative',
      overflow: 'hidden',
    },
    heroMainOverlay: {
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(234,88,12,0.55) 0%, transparent 60%)',
      borderRadius: 28,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end', padding: '24px 28px',
    },
    heroMainTitle: {
      color: '#fff', fontSize: 22, fontWeight: 900, margin: 0,
      textShadow: '0 2px 8px rgba(0,0,0,0.3)', letterSpacing: '-0.4px',
    },
    heroMainSub: {
      color: 'rgba(255,255,255,0.88)', fontSize: 12,
      margin: '5px 0 0', fontWeight: 600,
    },
    heroSideStack: {
      display: 'flex', flexDirection: 'column', gap: 14,
    },
    heroSideImg: (src) => ({
      flex: 1,
      backgroundImage: `url(${src})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      borderRadius: 22,
      boxShadow: '0 5px 20px rgba(249,115,22,0.12)',
    }),
    chips: { display: 'flex', gap: 12, marginBottom: 34 },
    chip: (active) => ({
      padding: '9px 22px', borderRadius: 20, border: 'none',
      cursor: 'pointer', fontWeight: 800, fontSize: 12.5,
      fontFamily: 'inherit', transition: 'all 0.18s',
      background: active
        ? 'linear-gradient(135deg, #f97316, #fb923c)'
        : 'rgba(255,255,255,0.75)',
      color: active ? '#fff' : '#777',
      boxShadow: active
        ? '0 4px 14px rgba(249,115,22,0.35)'
        : '0 2px 8px rgba(0,0,0,0.06)',
    }),
    sectionHeader: {
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'baseline', marginBottom: 18,
    },
    sectionTitle: {
      margin: 0, fontSize: 20, fontWeight: 900,
      color: '#1c1c1e', letterSpacing: '-0.4px',
    },
    sectionSub: { fontSize: 11.5, color: '#ea580c', fontWeight: 700 },
    productGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 18,
    },
    productCard: {
      background: 'rgba(255,255,255,0.82)',
      padding: 14, borderRadius: 22,
      boxShadow: '0 4px 18px rgba(0,0,0,0.07)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(249,115,22,0.08)',
      transition: 'transform 0.18s, box-shadow 0.18s',
    },
    productImg: {
      width: '100%', height: 160,
      objectFit: 'cover', borderRadius: 14, marginBottom: 12,
    },
    productName: {
      fontSize: 12.5, fontWeight: 700, color: '#333',
      margin: '0 0 8px', whiteSpace: 'nowrap',
      overflow: 'hidden', textOverflow: 'ellipsis',
    },
    productBottom: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    productPrice: { fontWeight: 900, color: '#ea580c', fontSize: 13.5 },
    addBtn: {
      background: 'linear-gradient(135deg, #f97316, #fb923c)',
      color: '#fff', border: 'none',
      padding: '6px 13px', borderRadius: 9,
      fontSize: 10, fontWeight: 800,
      cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: '0 3px 10px rgba(249,115,22,0.4)',
      transition: 'transform 0.12s',
    },
    emptyMsg: {
      gridColumn: '1 / -1',
      textAlign: 'center',
      color: '#bbb',
      fontSize: 13,
      padding: '32px 0',
    },
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.dotBg} />
      <div style={styles.gradientOverlay} />

      <aside style={styles.sidebar}>
        <div style={styles.userCard}>
          <img src={userAvatar} alt={firstName} style={styles.sidebarAvatar} />
          <h2 style={styles.greetingName}>Hello, {firstName}!</h2>
          <p style={styles.greetingEmail}>{userEmail}</p>
          <p style={styles.greetingSub}>Palit na og snacks dira!</p>
        </div>

        <nav>
          <ul style={styles.navList}>
            {navItems.map((item) => (
              <li
                key={item}
                style={styles.navItem(activeNav === item)}
                onClick={() => setActiveNav(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </nav>

        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </aside>

      <div style={styles.rightContainer}>
        <header style={styles.header}>
          <div style={styles.logo}>
            <img src={icon} alt="tasteCebu icon" style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'contain' }} />
            <span style={styles.logoText}>Taste<span style={styles.logoTextAccent}>Cebu</span></span>
          </div>

          <nav style={styles.topNav}>
            <span style={styles.topNavActive}>Shop</span>
            <span style={styles.topNavItem}>Categories</span>
            <span style={styles.topNavItem}>Best Sellers</span>
          </nav>

          <div style={styles.headerRight}>
            <div style={styles.searchBox}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={styles.cartBtn}>🛒{cartCount > 0 && <div style={styles.cartBadge}>{cartCount}</div>}</div>
            <div style={styles.headerUserWrapper}>
              <span style={styles.headerUserName}>{firstName}</span>
              <img src={userAvatar} style={styles.avatar} alt={firstName} />
            </div>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.heroGrid}>
            <div style={styles.heroMain}>
              <div style={styles.heroMainOverlay}>
                <p style={styles.heroMainTitle}>Taste the Best of Cebu</p>
                <p style={styles.heroMainSub}>Fresh, authentic, & delivered to your door</p>
              </div>
            </div>
            <div style={styles.heroSideStack}>
              <div style={styles.heroSideImg(heroTop)} />
              <div style={styles.heroSideImg(heroBottom)} />
            </div>
          </div>

          <div style={styles.chips}>
            {categories.map((cat, i) => (
              <button key={cat} style={styles.chip(activeCategory === i)} onClick={() => setActiveCategory(i)}>{cat}</button>
            ))}
          </div>

          <section style={{ marginBottom: 46 }}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Cebu's Favorites</h3>
              <span style={styles.sectionSub}>See what people are craving!</span>
            </div>
            <div style={styles.productGrid}>
              {filterItems(popular).length === 0 ? <p style={styles.emptyMsg}>No products match your search.</p> : filterItems(popular).map((item, idx) => (
                <div key={idx} style={styles.productCard}>
                  <img src={item.img} style={styles.productImg} alt={item.name} />
                  <p style={styles.productName}>{item.name}</p>
                  <div style={styles.productBottom}>
                    <span style={styles.productPrice}>{item.price}</span>
                    <button style={styles.addBtn} onClick={handleAddToCart}>Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Cebuano Classics</h3>
              <span style={styles.sectionSub}>You can never go wrong with these classics!</span>
            </div>
            <div style={styles.productGrid}>
              {filterItems(classics).length === 0 ? <p style={styles.emptyMsg}>No products match your search.</p> : filterItems(classics).map((item, idx) => (
                <div key={idx} style={styles.productCard}>
                  <img src={item.img} style={styles.productImg} alt={item.name} />
                  <p style={styles.productName}>{item.name}</p>
                  <div style={styles.productBottom}>
                    <span style={styles.productPrice}>{item.price}</span>
                    <button style={styles.addBtn} onClick={handleAddToCart}>Add to Cart</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;