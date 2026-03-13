import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import CollectionsPage from './components/pages/CollectionsPage';
import ProductGallery from './components/pages/ProductGallery';
import InspirationCarousel from './components/pages/InspirationCarousel';
import HowToBuyPage from './components/pages/HowToBuyPage';
import AsociadosPage from './components/pages/AsociadosPage';
import { COLLECTIONS_COPY, COLLECTIONS_ORDER } from './content/collectionsCopy';
import './App.css';

const HERO_SLIDES = [
  '/hero/home_1.png',
  '/hero/Home_2.png',
  '/hero/Home_3.png',
  '/hero/Home_4.png'
];

const DRAWER_PANEL_DURATION_MS = 520;

const DEFAULT_PRODUCTS_URL = '/products.json';
const LOCAL_PRODUCTS_KEY = 'novastone-products';
const CONTACT_PHONE = '+54 9 11 2480-0421';
const INSTAGRAM_URL = 'https://www.instagram.com/novastone_ar/';
const CONTACT_EMAIL = 'nova.grupoarg@gmail.com';
const CONTACT_ADDRESS =
  'Dirección - El Hornero, Bajada Km 55,5 colectora panamericana, Monseñor D´andrea Y, B1629 Pilar, Provincia de Buenos Aires';
const WHATSAPP_MESSAGE = 'Hola, quiero conocer más sobre Novastone.';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [activeMenuHash, setActiveMenuHash] = useState('#novastone');
  const [tappedMobileHash, setTappedMobileHash] = useState('');
  const closeTimerRef = useRef(null);
  const openRafRef = useRef(null);
  const mobileTapTimerRef = useRef(null);
  const getActiveMenuHash = () => {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash.startsWith('#productos')) return '#productos';
    if (hash.startsWith('#colecciones')) return '#colecciones';
    if (hash.startsWith('#inspiracion')) return '#inspiracion';
    if (hash.startsWith('#como-comprar')) return '#como-comprar';
    if (hash.startsWith('#contacto')) return '#contacto';
    return '#novastone';
  };
  const handleHomeClick = (e) => {
    e.preventDefault();
    window.location.hash = '';
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };
  const handleNavClick = (hash) => (e) => {
    e.preventDefault();
    window.location.hash = hash;
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };
  const handleMobileNavClick = (hash) => (e) => {
    e.preventDefault();
    if (mobileTapTimerRef.current) {
      window.clearTimeout(mobileTapTimerRef.current);
      mobileTapTimerRef.current = null;
    }
    setTappedMobileHash(hash);
    mobileTapTimerRef.current = window.setTimeout(() => {
      window.location.hash = hash;
      window.scrollTo(0, 0);
      setIsMobileMenuOpen(false);
      setTappedMobileHash('');
      mobileTapTimerRef.current = null;
    }, 220);
  };
  const mobileWhatsAppUrl = `https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  useEffect(() => {
    const syncActiveHash = () => {
      setActiveMenuHash(getActiveMenuHash());
    };
    syncActiveHash();
    window.addEventListener('hashchange', syncActiveHash);
    return () => window.removeEventListener('hashchange', syncActiveHash);
  }, []);

  useEffect(() => {
    const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
    if (isMobileMenuOpen && isMobileViewport) {
      const scrollY = window.scrollY;
      document.body.dataset.lockScrollY = String(scrollY);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.classList.add('mobile-menu-open');
    } else {
      const lockScrollY = Number(document.body.dataset.lockScrollY || 0);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('mobile-menu-open');
      delete document.body.dataset.lockScrollY;
      if (lockScrollY > 0) {
        window.scrollTo(0, lockScrollY);
      }
    }
    return () => {
      const lockScrollY = Number(document.body.dataset.lockScrollY || 0);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.classList.remove('mobile-menu-open');
      delete document.body.dataset.lockScrollY;
      if (lockScrollY > 0) {
        window.scrollTo(0, lockScrollY);
      }
    };
  }, [isMobileMenuOpen]);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    if (openRafRef.current) {
      window.cancelAnimationFrame(openRafRef.current);
    }
    if (mobileTapTimerRef.current) {
      window.clearTimeout(mobileTapTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openRafRef.current) {
      window.cancelAnimationFrame(openRafRef.current);
      openRafRef.current = null;
    }

    if (isMobileMenuOpen) {
      setIsDrawerMounted(true);
      setIsDrawerVisible(false);
      openRafRef.current = window.requestAnimationFrame(() => {
        openRafRef.current = window.requestAnimationFrame(() => {
          setIsDrawerVisible(true);
          openRafRef.current = null;
        });
      });
      return undefined;
    }

    setIsDrawerVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      setIsDrawerMounted(false);
      closeTimerRef.current = null;
    }, DRAWER_PANEL_DURATION_MS);
    return undefined;
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <a href="#" onClick={handleHomeClick}>
              <img
                className="brand-logo"
                src="/LOGO%20SVG%20NOVASTONE.svg"
                alt="Novastone"
              />
            </a>
          </div>
          <nav className="nav-links">
            <a href="#novastone">Novastone</a>
            <a href="#productos" onClick={handleNavClick('#productos')}>
              Productos
            </a>
            <a href="#colecciones" onClick={handleNavClick('#colecciones')}>
              Colecciones
            </a>
            <a href="#inspiracion">Inspiración</a>
            <a href="#como-comprar" onClick={handleNavClick('#como-comprar')}>
              ¿Cómo Comprar?
            </a>
            <a href="#contacto" className="nav-cta">Contactar</a>
          </nav>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-label="Abrir menu"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            &#9776;
          </button>
        </div>
      </header>
      {isDrawerMounted && (
        <div className={`mobile-drawer ${isDrawerVisible ? 'is-open' : 'is-closing'}`}>
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label="Cerrar menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="mobile-drawer-panel" role="dialog" aria-modal="true">
            <div className="mobile-drawer-header">
              <a className="mobile-drawer-brand" href="#" onClick={handleHomeClick}>
                <img
                  className="mobile-drawer-brand-logo"
                  src="/LOGO%20SVG%20NOVASTONE.svg"
                  alt="Novastone"
                />
              </a>
              <button
                type="button"
                className="mobile-drawer-close"
                aria-label="Cerrar menu"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                &#10005;
              </button>
            </div>
            <p className="mobile-drawer-tagline">
              Superficies sinterizadas
              <br />
              para arquitectura
            </p>
            <div className="mobile-drawer-divider" aria-hidden="true" />
            <nav className="mobile-drawer-content">
              <div className="mobile-drawer-links mobile-drawer-links-primary">
                <a
                  href="#productos"
                  className={`mobile-drawer-link ${activeMenuHash === '#productos' ? 'is-active' : ''} ${tappedMobileHash === '#productos' ? 'is-tapped' : ''}`}
                  onClick={handleMobileNavClick('#productos')}
                >
                  <span className="mobile-drawer-link-bullet" aria-hidden="true">•</span>
                  <span>Productos</span>
                </a>
                <a
                  href="#colecciones"
                  className={`mobile-drawer-link ${activeMenuHash === '#colecciones' ? 'is-active' : ''} ${tappedMobileHash === '#colecciones' ? 'is-tapped' : ''}`}
                  onClick={handleMobileNavClick('#colecciones')}
                >
                  <span className="mobile-drawer-link-bullet" aria-hidden="true">•</span>
                  <span>Colecciones</span>
                </a>
                <a
                  href="#inspiracion"
                  className={`mobile-drawer-link ${activeMenuHash === '#inspiracion' ? 'is-active' : ''} ${tappedMobileHash === '#inspiracion' ? 'is-tapped' : ''}`}
                  onClick={handleMobileNavClick('#inspiracion')}
                >
                  <span className="mobile-drawer-link-bullet" aria-hidden="true">•</span>
                  <span>Inspiración</span>
                </a>
              </div>
              <div className="mobile-drawer-divider" aria-hidden="true" />
              <div className="mobile-drawer-links mobile-drawer-links-secondary">
                <a
                  href="#como-comprar"
                  className={`mobile-drawer-link ${activeMenuHash === '#como-comprar' ? 'is-active' : ''} ${tappedMobileHash === '#como-comprar' ? 'is-tapped' : ''}`}
                  onClick={handleMobileNavClick('#como-comprar')}
                >
                  <span className="mobile-drawer-link-bullet" aria-hidden="true">•</span>
                  <span>¿Cómo Comprar?</span>
                </a>
                <a
                  href="#contacto"
                  className={`mobile-drawer-link ${activeMenuHash === '#contacto' ? 'is-active' : ''} ${tappedMobileHash === '#contacto' ? 'is-tapped' : ''}`}
                  onClick={handleMobileNavClick('#contacto')}
                >
                  <span className="mobile-drawer-link-bullet" aria-hidden="true">•</span>
                  <span>Contactar</span>
                </a>
              </div>
              <div className="mobile-drawer-divider" aria-hidden="true" />
              <footer className="mobile-drawer-footer">
                <p>Showroom y distribución</p>
                <p>Argentina</p>
                <div className="mobile-drawer-footer-icons">
                  <a
                    href={INSTAGRAM_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.9 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a
                    href={mobileWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.8c0 2.1.6 4.2 1.6 6L0 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8a11.8 11.8 0 0 0-3.4-8.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2A9.9 9.9 0 0 1 12 2.1c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.8-9.9 9.8Zm5.4-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6.2-.1.3-.3.5-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.5-.9-2.1-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.2.2-1.4 0-.1-.2-.2-.5-.4Z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </footer>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

const WhatsAppFab = () => (
  <a
    className="whatsapp-fab"
    href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="WhatsApp"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .18 5.33.18 11.88c0 2.09.54 4.13 1.57 5.94L0 24l6.36-1.67a11.85 11.85 0 0 0 5.7 1.45h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.43-8.41ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.77.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.13 1.03 7 2.92a9.86 9.86 0 0 1 2.88 7.01c0 5.47-4.45 9.92-9.88 9.92Zm5.44-7.41c-.3-.15-1.77-.87-2.04-.96-.27-.1-.47-.15-.66.15-.2.3-.77.96-.95 1.16-.17.2-.35.23-.65.08-.3-.15-1.25-.46-2.38-1.48-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.2-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.07-.8.36-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.85 1.2 3.05.15.2 2.08 3.17 5.03 4.44.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.11.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.28-.2-.58-.35Z"
        fill="currentColor"
      />
    </svg>
  </a>
);

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
        <h1>La evolución natural del diseño</h1>
        <p className="hero-subtitle">
          Superficies que combinan resistencia extrema con una estética
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
  <section className="intro" id="colecciones-home">
    <div className="intro-inner" data-reveal>
      <p>
        Colecciones seleccionadas para el mercado argentino, con tonos neutros,
        vetas elegantes y acabados que se adaptan a cada proyecto.
      </p>
    </div>
  </section>
);

const SINTERED_COLLECTIONS = COLLECTIONS_ORDER.map((id) => ({ id, ...COLLECTIONS_COPY[id] }));

const SinteredSection = () => (
  <section className="sintered" id="novastone">
    <div className="sintered-grid" data-reveal>
      <div>
        <p className="section-label">Piedra sinterizada</p>
        <h2>Precisión, textura y durabilidad sin límites.</h2>
      </div>
      <div className="sintered-copy">
        <p>
          Superficies de gran formato con baja porosidad, alta resistencia al
          calor y a las manchas. Ideal para cocinas, baños, fachadas y pisos de
          alto tránsito.
        </p>
        <p>
          Disponible en espesores 12mm y 20mm, con opciones Full Body, Espejada
          y Luxury.
        </p>
      </div>
    </div>
    <div className="sintered-highlights" data-reveal>
      {SINTERED_COLLECTIONS.map((collection) => (
        <article key={collection.id}>
          <h3>{collection.title}</h3>
          <p>{collection.description}</p>
        </article>
      ))}
    </div>
  </section>
);

const ProductModal = ({ product, products = [], onClose, onSelect }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!product) return null;

  const images = product.images || [];
  const similarProducts = useMemo(() => {
    const otherProducts = products.filter((item) => item.id !== product.id);
    for (let i = otherProducts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherProducts[i], otherProducts[j]] = [otherProducts[j], otherProducts[i]];
    }
    return otherProducts.slice(0, 4);
  }, [products, product.id]);

  useEffect(() => {
    setIndex(0);
  }, [product.id]);

  const handlePrev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setIndex((prev) => (prev + 1) % images.length);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose} type="button">
          Cerrar
        </button>
        <div className="modal-section">
          <p className="modal-section-title">Novastone en Espacios</p>
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
        </div>
        <div className="modal-meta">
          <h3>{product.name}</h3>
          <p>{product.series}</p>
          <span>{product.finish}</span>
        </div>
        {similarProducts.length > 0 && (
          <div className="modal-section">
            <p className="modal-section-title">Productos similares</p>
            <div className="modal-similar-grid">
              {similarProducts.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="modal-similar-card"
                  onClick={() => onSelect?.(item)}
                >
                  <img src={item.images?.[0]} alt={item.name} />
                  <div>
                    <span>{item.name}</span>
                    <small>{item.series}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StonesSection = () => {
  const handleCategoryClick = (category) => {
    window.location.hash = `#productos?collection=${category}`;
  };

  return (
    <section className="stones" id="productos">
      <div className="category-tiles" data-reveal>
        <button
          className="category-tile"
          type="button"
          onClick={() => handleCategoryClick('20mm')}
        >
          <div 
          className="category-tile-image"
          style={{ backgroundImage: 'url(/4Home/20mm%20explorar%20productos.png)' }}
          >
            <div className="category-tile-overlay">
              <h3>20mm</h3>
              <p>Explorar productos</p>
            </div>
          </div>
        </button>
        <button
          className="category-tile"
          type="button"
          onClick={() => handleCategoryClick('12mm')}
        >
          <div 
          className="category-tile-image"
          style={{ backgroundImage: 'url(/4Home/12mm%20explorar%20productos.png)' }}
          >
            <div className="category-tile-overlay">
              <h3>12mm</h3>
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
      <p className="section-label">Inspiración</p>
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
        <h2>Visita nuestro showroom o solicita una cotización.</h2>
      </div>
      <div className="footer-actions">
        <a href={`mailto:${CONTACT_EMAIL}`} className="contact-link">
          <span className="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16v12H4z" />
              <path d="M4 6l8 6 8-6" />
            </svg>
          </span>
          {CONTACT_EMAIL}
        </a>
        <a
          href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
          target="_blank"
          rel="noreferrer"
          className="contact-link"
        >
          <span className="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="currentColor">
              <path d="M19.11 17.18c-.33-.17-1.96-.97-2.27-1.08-.31-.11-.54-.17-.77.17-.23.33-.88 1.08-1.08 1.3-.2.23-.4.26-.73.08-.33-.17-1.4-.52-2.66-1.65-.98-.88-1.64-1.97-1.83-2.3-.19-.33-.02-.5.15-.67.15-.15.33-.4.5-.6.17-.2.23-.33.35-.56.11-.23.06-.44-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.67-.57-.58-.77-.59h-.66c-.23 0-.6.09-.92.44-.31.35-1.2 1.17-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.43 3.72 5.89 5.21.82.35 1.46.56 1.96.72.82.26 1.57.22 2.17.13.66-.1 1.96-.8 2.24-1.57.28-.77.28-1.43.2-1.57-.09-.14-.31-.23-.64-.4zM16 3C8.83 3 3 8.83 3 16c0 2.3.6 4.55 1.74 6.54L3 29l6.63-1.7A12.94 12.94 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.5a10.46 10.46 0 0 1-5.33-1.46l-.38-.22-3.93 1.01 1.05-3.83-.25-.39A10.48 10.48 0 1 1 26.5 16 10.5 10.5 0 0 1 16 26.5z" />
            </svg>
          </span>
          {CONTACT_PHONE}
        </a>
        <span>{CONTACT_ADDRESS}</span>
        <button type="button">Solicitar cotización</button>
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
      setStatus('JSON inválido.');
    }
  };

  const handleReset = async () => {
    const fresh = await loadProducts();
    localStorage.removeItem(LOCAL_PRODUCTS_KEY);
    setProducts(fresh);
    setDraft(JSON.stringify(fresh, null, 2));
    setStatus('Restáurado desde products.json.');
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
            Restáurar
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
      } else if (hash.startsWith('#colecciones')) {
        setCurrentRoute('colecciones');
      } else if (hash.startsWith('#inspiracion')) {
        setCurrentRoute('inspiracion');
      } else if (hash.startsWith('#como-comprar')) {
        setCurrentRoute('como-comprar');
      } else if (hash.startsWith('#asociados')) {
        setCurrentRoute('asociados');
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

  // Toggle body background for productos/collections routes (avoid sand borders around black page)
  useEffect(() => {
    document.body.classList.toggle('productos-route', currentRoute === 'productos');
    document.body.classList.toggle('collections-route', currentRoute === 'colecciones');
    document.body.classList.toggle('inspiration-route', currentRoute === 'inspiracion');
    return () => {
      document.body.classList.remove('productos-route');
      document.body.classList.remove('collections-route');
      document.body.classList.remove('inspiration-route');
    };
  }, [currentRoute]);

  useRevealOnScroll([currentRoute]);

  useEffect(() => {
    const header = document.querySelector('.site-header');
    if (!header) return undefined;

    const handleScroll = () => {
      const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
      const scrollThreshold = isMobileViewport ? 24 : 10;
      header.classList.toggle('is-scrolled', window.scrollY > scrollThreshold);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentRoute]);

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
        <WhatsAppFab />
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
        <WhatsAppFab />
        <Analytics />
      </div>
    );
  }

  // Render inspiration carousel page
  if (currentRoute === 'inspiracion') {
    return (
      <div className="App">
        <Header />
        <main>
          <InspirationCarousel />
        </main>
        <Footer />
        <WhatsAppFab />
        <Analytics />
      </div>
    );
  }

  if (currentRoute === 'como-comprar') {
    return (
      <div className="App">
        <Header />
        <main>
          <HowToBuyPage />
        </main>
        <Footer />
        <WhatsAppFab />
        <Analytics />
      </div>
    );
  }

  if (currentRoute === 'asociados') {
    return (
      <div className="App">
        <Header />
        <main>
          <AsociadosPage />
        </main>
        <Footer />
        <WhatsAppFab />
        <Analytics />
      </div>
    );
  }

  if (currentRoute === 'colecciones') {
    return (
      <div className="App">
        <Header />
        <main>
          <CollectionsPage />
        </main>
        <Footer />
        <WhatsAppFab />
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
      </main>
      <Footer />
      <WhatsAppFab />
      <Analytics />
    </div>
  );
}

export default App;
