import React, { useEffect, useMemo, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import ProductGallery from './components/pages/ProductGallery';
import './App.css';

const HERO_SLIDES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg'
];

const DEFAULT_PRODUCTS_URL = '/products.json';
const LOCAL_PRODUCTS_KEY = 'novastone-products';

const loadProducts = async () => {
  const res = await fetch(DEFAULT_PRODUCTS_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to load products.json');
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  return data.products || [];
};

const useRevealOnScroll = (deps = []) => {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    if (elements.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, deps);
};

const Header = () => {
  const handleHomeClick = (e) => {
    e.preventDefault();
    window.location.hash = '';
    window.scrollTo(0, 0);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <a href="#" onClick={handleHomeClick}>
            Novastone
          </a>
        </div>
        <nav className="nav-links">
          <a href="#productos">Productos</a>
          <a href="#colecciones">Colecciones</a>
          <a href="#aplicaciones">Aplicaciones</a>
          <a href="#inspiracion">Inspiracion</a>
          <a href="#contacto" className="nav-cta">Contactar</a>
        </nav>
      </div>
    </header>
  );
};

const HeroSection = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-slider" aria-hidden="true">
        {HERO_SLIDES.map((src, index) => (
          <div
            key={src}
            className={`hero-slide ${index === active ? 'is-active' : ''}`}
          >
            <img src={src} alt="" />
          </div>
        ))}
      </div>
      <div className="hero-content" data-reveal>
        <p className="hero-eyebrow">Novastone · Piedra Sinterizada</p>
        <h1>La evolucion natural del diseno</h1>
        <p className="hero-subtitle">
          Superficies que combinan resistencia extrema con una estetica
          contemporanea para proyectos residenciales y comerciales.
        </p>
      </div>
      <div className="hero-slider-indicator" role="tablist">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            className={index === active ? 'active' : ''}
            onClick={() => setActive(index)}
            aria-label={`Ver slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

const IntroSection = () => (
  <section className="intro" id="colecciones">
    <div className="intro-inner" data-reveal>
      <p>
        Colecciones seleccionadas para el mercado argentino, con tonos neutros,
        vetas elegantes y acabados que se adaptan a cada proyecto.
      </p>
    </div>
  </section>
);

const SinteredSection = () => (
  <section className="sintered" id="aplicaciones">
    <div className="sintered-grid" data-reveal>
      <div>
        <p className="section-label">Piedra sinterizada</p>
        <h2>Precision, textura y durabilidad sin limites.</h2>
      </div>
      <div className="sintered-copy">
        <p>
          Superficies de gran formato con baja porosidad, alta resistencia al
          calor y a las manchas. Ideal para cocinas, banos, fachadas y pisos de
          alto transito.
        </p>
        <p>
          Disponible en espesores 12mm y 20mm, con opciones Full Body, Espejada
          y Luxury.
        </p>
      </div>
    </div>
  </section>
);

const ProductModal = ({ product, onClose }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!product) return null;

  const images = product.images || [];
  const handlePrev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} type="button">
          Cerrar
        </button>
        <div className="modal-gallery">
          <button type="button" onClick={handlePrev} className="modal-nav">
            Prev
          </button>
          <div className="modal-image">
            <img src={images[index]} alt={product.name} />
          </div>
          <button type="button" onClick={handleNext} className="modal-nav">
            Next
          </button>
        </div>
        <div className="modal-meta">
          <h3>{product.name}</h3>
          <p>{product.series}</p>
          <span>{product.finish}</span>
        </div>
      </div>
    </div>
  );
};

const StonesSection = () => {
  const handleCategoryClick = (category) => {
    window.location.hash = `#productos?filter=${category}`;
  };

  return (
    <section className="stones" id="productos">
      <div className="section-heading" data-reveal>
        <p className="section-label">Piedras</p>
        <h2>Explora la galeria de superficies Novastone.</h2>
      </div>
      <div className="category-tiles" data-reveal>
        <button
          className="category-tile"
          type="button"
          onClick={() => handleCategoryClick('12mm')}
        >
          <div className="category-tile-image">
            <div className="category-tile-overlay">
              <h3>12mm</h3>
              <p>Explorar productos</p>
            </div>
          </div>
        </button>
        <button
          className="category-tile"
          type="button"
          onClick={() => handleCategoryClick('20mm')}
        >
          <div className="category-tile-image">
            <div className="category-tile-overlay">
              <h3>20mm</h3>
              <p>Explorar productos</p>
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};

const InspirationSection = () => (
  <section className="inspiration" id="inspiracion">
    <div className="section-heading" data-reveal>
      <p className="section-label">Inspiracion</p>
      <h2>Espacios que elevan la experiencia cotidiana.</h2>
    </div>
    <div className="inspiration-grid" data-reveal>
      <article>
        <img src="/inspiration/inspiration-1.png" alt="Cocina con superficies claras" />
        <p>Cocinas y islas centrales con vetas sutiles.</p>
      </article>
      <article>
        <img src="/inspiration/inspiration-2.jpg" alt="Revestimiento con textura" />
        <p>Revestimientos continuos para interior y exterior.</p>
      </article>
      <article>
        <img src="/inspiration/inspiration-3.png" alt="Ambiente residencial elegante" />
        <p>Ambientes residenciales con paleta neutra.</p>
      </article>
    </div>
  </section>
);

const Footer = () => (
  <footer className="site-footer" id="contacto">
    <div className="footer-inner" data-reveal>
      <div>
        <p className="section-label">Contacto</p>
        <h2>Visita nuestro showroom o solicita una cotizacion.</h2>
      </div>
      <div className="footer-actions">
        <a href="mailto:info@novastone.com">info@novastone.com</a>
        <span>Buenos Aires, Argentina</span>
        <button type="button">Solicitar cotizacion</button>
      </div>
    </div>
  </footer>
);

const AdminPanel = ({ products, setProducts }) => {
  const [isAuthed, setIsAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [draft, setDraft] = useState(JSON.stringify(products, null, 2));
  const [status, setStatus] = useState('');

  const handleLogin = (event) => {
    event.preventDefault();
    if (email === 'manuelzeolite@gmail.com' && password === 'Mono2026') {
      setIsAuthed(true);
      setStatus('');
    } else {
      setStatus('Credenciales incorrectas.');
    }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(draft);
      if (!Array.isArray(parsed)) {
        setStatus('El JSON debe ser un array de productos.');
        return;
      }
      localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(parsed));
      setProducts(parsed);
      setStatus('Productos guardados en este navegador.');
    } catch (error) {
      setStatus('JSON invalido.');
    }
  };

  const handleReset = async () => {
    const fresh = await loadProducts();
    localStorage.removeItem(LOCAL_PRODUCTS_KEY);
    setProducts(fresh);
    setDraft(JSON.stringify(fresh, null, 2));
    setStatus('Restaurado desde products.json.');
  };

  const downloadJson = () => {
    const blob = new Blob([draft], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setDraft(JSON.stringify(products, null, 2));
  }, [products]);

  if (!isAuthed) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin} className="admin-card">
          <h1>Admin Novastone</h1>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {status && <p className="admin-status">{status}</p>}
          <button type="submit">Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h1>Panel de productos</h1>
          <p>
            Edita el JSON y guarda. Para publicar, reemplaza el archivo
            products.json en la carpeta public.
          </p>
        </div>
        <div className="admin-actions">
          <button type="button" onClick={handleReset}>
            Restaurar
          </button>
          <button type="button" onClick={downloadJson}>
            Descargar JSON
          </button>
          <button type="button" onClick={handleSave}>
            Guardar cambios
          </button>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
      />
      {status && <p className="admin-status">{status}</p>}
    </div>
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [currentRoute, setCurrentRoute] = useState('home');
  
  const isAdminRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin'
    );
  }, []);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#productos')) {
        setCurrentRoute('productos');
      } else {
        setCurrentRoute('home');
      }
    };

    // Check initial hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Toggle body background for productos route (avoid sand borders around black page)
  useEffect(() => {
    document.body.classList.toggle('productos-route', currentRoute === 'productos');
    return () => document.body.classList.remove('productos-route');
  }, [currentRoute]);

  useRevealOnScroll([currentRoute]);

  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (!header) return undefined;

    const handleScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const local = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        setProducts(parsed);
        return;
      } catch (error) {
        localStorage.removeItem(LOCAL_PRODUCTS_KEY);
      }
    }

    loadProducts()
      .then((data) => setProducts(data))
      .catch(() => setError('No pudimos cargar los productos.'));
  }, []);

  if (isAdminRoute) {
    return (
      <div className="admin-wrapper">
        <AdminPanel products={products} setProducts={setProducts} />
      </div>
    );
  }

  // Render product gallery page
  if (currentRoute === 'productos') {
    return (
      <div className="App">
        <Header />
        <main>
          <ProductGallery />
        </main>
        <Footer />
        <Analytics />
      </div>
    );
  }

  // Render homepage
  return (
    <div className="App">
      <Header />
      <main>
        <HeroSection />
        <IntroSection />
        <SinteredSection />
        {error ? (
          <section className="error" data-reveal>
            {error}
          </section>
        ) : (
          <StonesSection />
        )}
        <InspirationSection />
      </main>
      <Footer />
      <Analytics />
    </div>
  );
}

export default App;
