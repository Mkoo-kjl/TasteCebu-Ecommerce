import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiArrowRight, FiStar, FiAward, FiHeart, FiTruck, FiShield,
  FiPackage, FiClock, FiCheckCircle, FiUsers, FiShoppingBag,
  FiMapPin, FiZap, FiGift, FiCoffee, FiDroplet
} from 'react-icons/fi';
import api from '../utils/api';

/* ── Animated counter hook ── */
function useCounter(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return [count, ref];
}

/* ── Dot pattern canvas ── */
function DotPattern({ className = '', style = {} }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const gap = 28;
      const cols = Math.ceil(w / gap) + 1;
      const rows = Math.ceil(h / gap) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * gap;
          const y = r * gap;
          const dist = Math.sqrt((x - w / 2) ** 2 + (y - h / 2) ** 2);
          const wave = Math.sin(dist * 0.008 - time * 0.02) * 0.5 + 0.5;
          const radius = 1.2 + wave * 1.8;
          const alpha = 0.06 + wave * 0.12;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 32, 42, ${alpha})`;
          ctx.fill();
        }
      }
      time++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`dot-canvas ${className}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  );
}

/* ── Category data ── */
const categories = [
  { icon: <FiCoffee />, name: 'Dried Goods', desc: 'Mangoes, fish & more', color: '#F4A300' },
  { icon: <FiGift />, name: 'Pasalubong', desc: 'Gift-ready treats', color: '#C8202A' },
  { icon: <FiDroplet />, name: 'Sauces & Oils', desc: 'Authentic flavors', color: '#2D6A4F' },
  { icon: <FiPackage />, name: 'Snacks', desc: 'Local favorites', color: '#E67E00' },
  { icon: <FiShoppingBag />, name: 'Lechon', desc: 'Cebu\'s pride', color: '#B71E1E' },
  { icon: <FiHeart />, name: 'Sweets', desc: 'Otap, rosquillos...', color: '#9B59B6' },
];

/* ── Testimonials ── */
const testimonials = [
  { name: 'Maria Santos', role: 'Regular Customer', text: 'The quality is unmatched! Every order arrives fresh and perfectly packed. My family loves the dried mangoes.', stars: 5 },
  { name: 'James Reyes', role: 'Food Blogger', text: 'TasteCebu has become my go-to for authentic Cebuano delicacies. The variety and quality keep me coming back.', stars: 5 },
  { name: 'Ana Cruz', role: 'OFW in Dubai', text: 'Living abroad, this platform is my lifeline to home. Nothing beats the taste of real Cebuano lechon sauce.', stars: 5 },
];

export default function Landing() {
  const { user } = useAuth();
  const [hasApplication, setHasApplication] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    if (user && user.role === 'user') {
      api.get('/seller/application-status')
        .then(res => {
          if (res.data.application && (res.data.application.status === 'pending' || res.data.application.status === 'approved')) {
            setHasApplication(true);
          }
        })
        .catch(() => { });
    }
  }, [user]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showSellerCTA = !user || (user.role === 'user' && !hasApplication);

  const [ordersCount, ordersRef] = useCounter(2500);
  const [sellersCount, sellersRef] = useCounter(50);
  const [productsCount, productsRef] = useCounter(300);
  const [ratingsCount, ratingsRef] = useCounter(4.9, 2000, true);

  return (
    <div className="landing-page" id="landing-page">

      {/* ═══════ HERO ═══════ */}
      <section className="lp-hero" id="hero-section">
        <DotPattern className="hero-dots" />
        <div className="lp-hero-orbs">
          <div className="lp-orb lp-orb-1"></div>
          <div className="lp-orb lp-orb-2"></div>
          <div className="lp-orb lp-orb-3"></div>
        </div>

        <div className="lp-hero-inner">
          <div className="lp-hero-badge stagger-1">
            <span className="lp-live-dot"></span>
            LIVE — New arrivals dropping daily
          </div>

          <h1 className="lp-hero-title stagger-2">
            Authentic Cebuano<br />
            <span className="lp-title-accent">Delicacies</span> Delivered
            <span className="lp-title-dot">.</span>
          </h1>

          <p className="lp-hero-sub stagger-3">
            From Cebu's finest kitchens to your doorstep. Handcrafted by local artisans,
            curated for quality, and delivered with love.
          </p>

          <div className="lp-hero-ctas stagger-4">
            <Link to="/products" className="btn btn-primary btn-lg lp-btn-glow">
              Browse Products <FiArrowRight className="btn-icon-right" />
            </Link>
            <Link to="/register" className="btn btn-outline btn-lg lp-btn-outline">
              Create Account
            </Link>
          </div>

          <div className="lp-hero-trust stagger-5">
            <div className="lp-trust-item">
              <FiTruck size={16} /> Free shipping over ₱500
            </div>
            <div className="lp-trust-divider"></div>
            <div className="lp-trust-item">
              <FiShield size={16} /> Secure checkout
            </div>
            <div className="lp-trust-divider"></div>
            <div className="lp-trust-item">
              <FiClock size={16} /> Fast delivery
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ MARQUEE ═══════ */}
      <div className="lp-marquee" id="marquee-section">
        <div className="lp-marquee-track">
          {[...Array(2)].map((_, i) => (
            <div className="lp-marquee-content" key={i}>
              <span>AUTHENTIC CEBUANO</span> <span className="lp-marquee-dot"></span>
              <span>HANDCRAFTED</span> <span className="lp-marquee-dot"></span>
              <span>LOCALLY SOURCED</span> <span className="lp-marquee-dot"></span>
              <span>PREMIUM QUALITY</span> <span className="lp-marquee-dot"></span>
              <span>FARM TO TABLE</span> <span className="lp-marquee-dot"></span>
              <span>TRADITION MEETS TASTE</span> <span className="lp-marquee-dot"></span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════ VALUE PROPOSITIONS ═══════ */}
      <section className="lp-values" id="values-section">
        <div className="lp-values-grid">
          {[
            { icon: <FiAward />, title: 'Curated Quality', desc: 'Every seller is verified. Every product is authentic. We maintain the highest standards so you don\'t have to worry.' },
            { icon: <FiTruck />, title: 'Fast & Fresh Delivery', desc: 'Temperature-controlled packaging ensures your delicacies arrive as fresh as the day they were made.' },
            { icon: <FiHeart />, title: 'Support Local Makers', desc: 'Every purchase directly supports Cebuano families and helps preserve our rich culinary heritage.' },
            { icon: <FiShield />, title: 'Secure Shopping', desc: 'Shop with confidence. Your payments are protected and your satisfaction is our guarantee.' },
          ].map((item, idx) => (
            <div className="lp-value-card" key={idx} style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="lp-value-icon" style={{ '--accent': idx % 2 === 0 ? '#F4A300' : '#C8202A' }}>
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ CATEGORIES ═══════ */}
      <section className="lp-categories" id="categories-section">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">SHOP BY CATEGORY</span>
          <h2>Explore <span className="lp-title-accent">Cebuano</span> Favorites</h2>
          <p>Browse through our curated collection of authentic local delicacies</p>
        </div>

        <div className="lp-categories-grid">
          {categories.map((cat, idx) => (
            <Link to="/products" className="lp-category-card" key={idx} style={{ '--cat-color': cat.color }}>
              <div className="lp-cat-icon">{cat.icon}</div>
              <h4>{cat.name}</h4>
              <span className="lp-cat-desc">{cat.desc}</span>
              <FiArrowRight className="lp-cat-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="lp-how" id="how-it-works">
        <DotPattern className="how-dots" style={{ opacity: 0.5 }} />
        <div className="lp-how-inner">
          <div className="lp-section-header">
            <span className="lp-section-eyebrow">HOW IT WORKS</span>
            <h2>Three Steps to <span className="lp-title-accent">Deliciousness</span></h2>
          </div>

          <div className="lp-steps">
            {[
              { num: '01', icon: <FiUsers />, title: 'Create Your Account', desc: 'Sign up in seconds and unlock access to Cebu\'s finest marketplace.' },
              { num: '02', icon: <FiShoppingBag />, title: 'Browse & Order', desc: 'Explore curated products from verified local artisans and add to cart.' },
              { num: '03', icon: <FiPackage />, title: 'Fresh Delivery', desc: 'Sit back while we deliver authentic Cebuano flavors straight to you.' },
            ].map((step, idx) => (
              <div className="lp-step" key={idx}>
                <div className="lp-step-num">{step.num}</div>
                <div className="lp-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {idx < 2 && <div className="lp-step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <section className="lp-stats" id="stats-section">
        <div className="lp-stats-grid">
          <div className="lp-stat" ref={ordersRef}>
            <span className="lp-stat-number">{ordersCount.toLocaleString()}+</span>
            <span className="lp-stat-label">Orders Completed</span>
          </div>
          <div className="lp-stat" ref={sellersRef}>
            <span className="lp-stat-number">{sellersCount}+</span>
            <span className="lp-stat-label">Local Sellers</span>
          </div>
          <div className="lp-stat" ref={productsRef}>
            <span className="lp-stat-number">{productsCount}+</span>
            <span className="lp-stat-label">Unique Products</span>
          </div>
          <div className="lp-stat" ref={ratingsRef}>
            <span className="lp-stat-number">
              <FiStar className="lp-stat-star" /> {ratingsCount}
            </span>
            <span className="lp-stat-label">Average Rating</span>
          </div>
        </div>
      </section>

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="lp-testimonials" id="testimonials-section">
        <div className="lp-section-header">
          <span className="lp-section-eyebrow">WHAT PEOPLE SAY</span>
          <h2>Loved by <span className="lp-title-accent">Thousands</span></h2>
        </div>

        <div className="lp-testimonials-carousel">
          {testimonials.map((t, idx) => (
            <div
              className={`lp-testimonial-card ${idx === activeTestimonial ? 'active' : ''}`}
              key={idx}
            >
              <div className="lp-testimonial-stars">
                {[...Array(t.stars)].map((_, i) => <FiStar key={i} />)}
              </div>
              <blockquote>"{t.text}"</blockquote>
              <div className="lp-testimonial-author">
                <div className="lp-author-avatar">{t.name.charAt(0)}</div>
                <div>
                  <strong>{t.name}</strong>
                  <span>{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lp-testimonial-dots">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              className={`lp-dot-btn ${idx === activeTestimonial ? 'active' : ''}`}
              onClick={() => setActiveTestimonial(idx)}
              aria-label={`View testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ═══════ SELLER CTA ═══════ */}
      {showSellerCTA && (
        <section className="lp-seller-cta" id="seller-cta">
          <DotPattern className="cta-dots" style={{ opacity: 0.35 }} />
          <div className="lp-seller-inner">
            <div className="lp-seller-badge">
              <FiZap /> BECOME A SELLER
            </div>
            <h2>Share Your Craft<br />With the <span className="lp-title-accent">World</span></h2>
            <p>
              Join our growing community of Cebuano artisan makers.
              We provide the platform, you provide the passion.
            </p>
            <div className="lp-seller-perks">
              <div className="lp-perk"><FiCheckCircle /> Free to get started</div>
              <div className="lp-perk"><FiCheckCircle /> Reach thousands of buyers</div>
              <div className="lp-perk"><FiCheckCircle /> Seller dashboard & analytics</div>
            </div>
            {user ? (
              <Link to="/seller/apply" className="btn btn-primary btn-lg lp-btn-glow">
                Apply as Seller <FiArrowRight className="btn-icon-right" />
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary btn-lg lp-btn-glow">
                Start Selling <FiArrowRight className="btn-icon-right" />
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="lp-final-cta" id="final-cta">
        <div className="lp-final-inner">
          <h2>Ready to taste <span className="lp-title-accent">Cebu</span>?</h2>
          <p>Join thousands of happy customers enjoying authentic Cebuano flavors.</p>
          <Link to="/register" className="btn btn-primary btn-lg lp-btn-glow">
            Get Started — It's Free <FiArrowRight className="btn-icon-right" />
          </Link>
        </div>
      </section>
    </div>
  );
}
