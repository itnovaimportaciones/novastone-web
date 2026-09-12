import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import CollectionsPage from './components/pages/CollectionsPage';
import ProductGallery from './components/pages/ProductGallery';
import InspirationCarousel from './components/pages/InspirationCarousel';
import HowToBuyPage from './components/pages/HowToBuyPage';
import AsociadosPage from './components/pages/AsociadosPage';
import ExploreTexturesPage from './components/pages/ExploreTexturesPage';
import ExploreTexturesMoodboardPage from './components/pages/ExploreTexturesMoodboardPage';
import TestChat from './components/pages/TestChat';
import TexturaPage from './components/pages/TexturaPage';
import NuevasTexturasSection from './components/sections/NuevasTexturasSection';
import { COLLECTIONS_COPY } from './content/collectionsCopy';
import { trackContact, trackCustom, trackLead, trackPageView } from './lib/metaPixel';
import * as ga4 from './lib/googleAnalytics';
import './App.css';

const HERO_SLIDES_DESKTOP = [
  '/hero/home-1.jpg',
  '/hero/home-2.jpg'
];

// Verticales, sólo para mobile.
const HERO_SLIDES_MOBILE = [
  '/hero/mobile/home-mobile-1.jpg',
  '/hero/mobile/home-mobile-2.jpg'
];

const HERO_MOBILE_QUERY = '(max-width: 900px)';

// Respiración lenta, no carrusel: 9s en pantalla y 2s de cross-fade.
const HERO_DURACION_MS = 9000;
const HERO_MENOS_MOVIMIENTO = '(prefers-reduced-motion: reduce)';

const MENU_LINKS = [
  { label: '¿Qué es Novastone?', path: '/' },
  { label: 'Productos', path: '/productos' },
  { label: 'Colecciones', path: '/colecciones' },
  { label: 'Proyectos', path: '/proyectos' },
  { label: 'Inspiración', path: '/inspiracion' },
  { label: '¿Cómo Comprar?', path: '/como-comprar' }
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuPath, setActiveMenuPath] = useState('/');
  const headerRef = useRef(null);
  // Máquina de montaje del cajón, igual que en la versión pública: se monta,
  // se pinta, y recién ahí se marca visible para que la transición arranque.
  const [cajonMontado, setCajonMontado] = useState(false);
  const [cajonVisible, setCajonVisible] = useState(false);
  const [rutaTocada, setRutaTocada] = useState('');
  const cerrarTimerRef = useRef(null);
  const abrirRafRef = useRef(null);
  const tapTimerRef = useRef(null);

  const getActiveMenuPath = () => {
    const path = (window.location.pathname || '').toLowerCase();
    if (path === '/productos') return '/productos';
    if (path === '/colecciones') return '/colecciones';
    if (path === '/proyectos') return '/proyectos';
    if (path === '/inspiracion' || path === '/explorar-texturas-orb') return '/inspiracion';
    if (path === '/como-comprar') return '/como-comprar';
    return '/';
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    if (window.location.hash) {
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    }
    window.scrollTo(0, 0);
  };

  const handleNavClick = (path) => (e) => {
    e.preventDefault();
    setIsMenuOpen(false);
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  // "¿Qué es Novastone?" no va al tope del home: baja hasta el bloque
  // "Piedra sinterizada / Precisión, textura y durabilidad sin límites."
  const handleQueEsNovastone = (e) => {
    e.preventDefault();
    setIsMenuOpen(false);

    const bajarAlBloque = () => {
      const destino = document.getElementById('novastone');
      if (!destino) return;
      // scrollIntoView + scroll-margin-top: el navegador mide en el momento
      // del scroll, así que no se pasa si el layout todavía se está
      // acomodando (imágenes cargando, secciones apareciendo).
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Dos cosas pueden mover el layout justo después de cerrar el menú:
    //  - en mobile el cajón libera el scroll y restaura la posición previa
    //  - en desktop el hero pierde el padding-top del panel desplegado,
    //    y todo sube --alto-panel px
    // Por eso se espera a que el panel termine de replegarse antes de
    // medir; en mobile --alto-panel es 0 y el salto es inmediato.
    const panel = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--alto-panel')
    ) || 0;
    const demora = panel > 0 ? DRAWER_PANEL_DURATION_MS + 40 : 0;

    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    window.setTimeout(
      () => window.requestAnimationFrame(() => window.requestAnimationFrame(bajarAlBloque)),
      demora
    );
  };

  // El link se ilumina 220ms antes de navegar: es el feedback del original.
  const handleCajonNavClick = (path, handler) => (e) => {
    e.preventDefault();
    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    setRutaTocada(path);
    tapTimerRef.current = window.setTimeout(() => {
      setRutaTocada('');
      tapTimerRef.current = null;
      handler(e);
    }, 220);
  };

  const handleWhatsAppCajon = () => {
    const datos = {
      channel: 'whatsapp',
      origin: 'header',
      page_section: 'mobile-drawer',
      trigger_source: 'App.Header.mobileDrawer.whatsapp',
    };
    trackContact(datos);
    ga4.trackContact(datos);
  };

  useEffect(() => {
    const syncActiveHash = () => setActiveMenuPath(getActiveMenuPath());
    syncActiveHash();
    window.addEventListener('popstate', syncActiveHash);
    return () => window.removeEventListener('popstate', syncActiveHash);
  }, []);

  // El hero lee esta clase para bajar la foto cuando el panel se abre.
  useEffect(() => {
    document.body.classList.toggle('menu-abierto', isMenuOpen);
    return () => document.body.classList.remove('menu-abierto');
  }, [isMenuOpen]);

  // Montaje diferido para que la transición de entrada se vea.
  useEffect(() => {
    if (cerrarTimerRef.current) window.clearTimeout(cerrarTimerRef.current);
    if (abrirRafRef.current) window.cancelAnimationFrame(abrirRafRef.current);
    if (isMenuOpen) {
      setCajonMontado(true);
      setCajonVisible(false);
      abrirRafRef.current = window.requestAnimationFrame(() => {
        abrirRafRef.current = window.requestAnimationFrame(() => {
          setCajonVisible(true);
          abrirRafRef.current = null;
        });
      });
      return undefined;
    }
    setCajonVisible(false);
    cerrarTimerRef.current = window.setTimeout(() => {
      setCajonMontado(false);
      cerrarTimerRef.current = null;
    }, DRAWER_PANEL_DURATION_MS);
    return undefined;
  }, [isMenuOpen]);

  // Bloqueo de scroll del fondo mientras el cajón está abierto.
  useEffect(() => {
    const esMobile = window.matchMedia('(max-width: 900px)').matches;
    if (!isMenuOpen || !esMobile) return undefined;
    const y = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, y);
    };
  }, [isMenuOpen]);

  useEffect(() => () => {
    if (cerrarTimerRef.current) window.clearTimeout(cerrarTimerRef.current);
    if (abrirRafRef.current) window.cancelAnimationFrame(abrirRafRef.current);
    if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
  }, []);

  // Cerrar con Escape y con click afuera del header.
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    const alClickear = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) setIsMenuOpen(false);
    };
    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alClickear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alClickear);
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={`site-header ${isMenuOpen ? 'is-open' : ''}`}
    >
      <div className="header-inner">
        <button
          type="button"
          className="header-menu-toggle"
          aria-expanded={isMenuOpen}
          aria-controls="menu-desplegable"
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <span className="header-menu-icono" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="header-menu-texto">Menú</span>
        </button>

        <a className="header-marca" href="/" onClick={handleHomeClick}>
          <img
            className="header-marca-logo"
            src="/LOGO%20SVG%20NOVASTONE.svg"
            alt="Novastone"
          />
        </a>

        <div className="header-acciones">
          <a
            href="/como-comprar"
            className="header-contactar"
            onClick={handleNavClick('/como-comprar')}
          >
            Contactar
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="header-instagram"
            aria-label="Instagram"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.9 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
                fill="currentColor"
              />
            </svg>
          </a>
        </div>
      </div>

      <div className="header-desplegable" id="menu-desplegable">
        <nav className="header-desplegable-nav">
          {MENU_LINKS.map((link) => (
            <a
              key={link.path + link.label}
              href={link.path}
              className={`header-desplegable-link ${activeMenuPath === link.path ? 'is-active' : ''}`}
              tabIndex={isMenuOpen ? 0 : -1}
              onClick={link.path === '/' ? handleQueEsNovastone : handleNavClick(link.path)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Cajón mobile: mismo formato que la versión pública pero entrando
          desde la izquierda, con la paleta y las tipografías nuevas. */}
      {cajonMontado && (
        <div className={`cajon ${cajonVisible ? 'is-open' : 'is-closing'}`}>
          <button
            type="button"
            className="cajon-velo"
            aria-label="Cerrar menú"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="cajon-panel" role="dialog" aria-modal="true">
            <div className="cajon-cabecera">
              <a className="cajon-marca" href="/" onClick={handleHomeClick}>
                <img src="/LOGO%20SVG%20NOVASTONE.svg" alt="Novastone" />
              </a>
              <button
                type="button"
                className="cajon-cerrar"
                aria-label="Cerrar menú"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <line x1="2" y1="2" x2="18" y2="18" />
                  <line x1="18" y1="2" x2="2" y2="18" />
                </svg>
              </button>
            </div>

            <p className="cajon-bajada">
              Superficies sinterizadas
              <br />
              para arquitectura
            </p>

            <div className="cajon-linea" aria-hidden="true" />

            <nav className="cajon-nav">
              <div className="cajon-links">
                {MENU_LINKS.filter((l) => l.path !== '/como-comprar').map((l) => (
                  <a
                    key={l.path}
                    href={l.path}
                    className={`cajon-link ${activeMenuPath === l.path ? 'is-active' : ''} ${rutaTocada === l.path ? 'is-tocado' : ''}`}
                    onClick={handleCajonNavClick(
                      l.path,
                      l.path === '/' ? handleQueEsNovastone : handleNavClick(l.path)
                    )}
                  >
                    <span className="cajon-bullet" aria-hidden="true">•</span>
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>

              <div className="cajon-linea" aria-hidden="true" />

              <div className="cajon-links">
                {[
                  { label: '¿Cómo Comprar?', path: '/como-comprar' },
                  { label: 'Contactar', path: '/como-comprar' }
                ].map((l) => (
                  <a
                    key={l.label}
                    href={l.path}
                    className={`cajon-link ${rutaTocada === l.label ? 'is-tocado' : ''}`}
                    onClick={handleCajonNavClick(l.label, handleNavClick(l.path))}
                  >
                    <span className="cajon-bullet" aria-hidden="true">•</span>
                    <span>{l.label}</span>
                  </a>
                ))}
              </div>

              <div className="cajon-linea" aria-hidden="true" />

              <footer className="cajon-pie">
                <p>Showroom y distribución</p>
                <p>Argentina</p>
                <div className="cajon-iconos">
                  <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.9 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" fill="currentColor" />
                    </svg>
                  </a>
                  <a
                    href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    onClick={handleWhatsAppCajon}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0C5.4 0 .1 5.3.1 11.8c0 2.1.6 4.2 1.6 6L0 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4h.1c6.5 0 11.8-5.3 11.8-11.8a11.8 11.8 0 0 0-3.4-8.4ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2A9.9 9.9 0 0 1 12 2.1c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.4-4.4 9.8-9.9 9.8Zm5.4-7.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.5-2.3-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6.2-.1.3-.3.5-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.5-.9-2.1-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.2.2-1.4 0-.1-.2-.2-.5-.4Z" fill="currentColor" />
                    </svg>
                  </a>
                </div>
              </footer>
            </nav>
          </div>
        </div>
      )}

    </header>
  );
};

const WhatsAppFab = () => {
  const handleClick = () => {
    const path = window.location.pathname.toLowerCase();
    const origin = path === '/inspiracion' ? 'inspiracion' : 'footer';
    trackContact(
      {
        channel: 'whatsapp',
        origin,
        page_section: 'floating-button',
        trigger_source: 'App.WhatsAppFab.click',
      },
      { deduplicateBySession: true }
    );
    ga4.trackContact(
      {
        channel: 'whatsapp',
        origin,
        page_section: 'floating-button',
        trigger_source: 'App.WhatsAppFab.click',
      },
      { deduplicateBySession: true }
    );
  };

  return (
    <a
      className="whatsapp-fab"
      href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      onClick={handleClick}
    >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .18 5.33.18 11.88c0 2.09.54 4.13 1.57 5.94L0 24l6.36-1.67a11.85 11.85 0 0 0 5.7 1.45h.01c6.55 0 11.88-5.33 11.88-11.89 0-3.17-1.23-6.15-3.43-8.41ZM12.07 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.77.99 1-3.67-.23-.38a9.87 9.87 0 0 1-1.51-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.13 1.03 7 2.92a9.86 9.86 0 0 1 2.88 7.01c0 5.47-4.45 9.92-9.88 9.92Zm5.44-7.41c-.3-.15-1.77-.87-2.04-.96-.27-.1-.47-.15-.66.15-.2.3-.77.96-.95 1.16-.17.2-.35.23-.65.08-.3-.15-1.25-.46-2.38-1.48-.88-.79-1.47-1.77-1.64-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.2-.24-.58-.49-.5-.66-.5h-.57c-.2 0-.52.07-.8.36-.27.3-1.04 1.01-1.04 2.46 0 1.45 1.06 2.85 1.2 3.05.15.2 2.08 3.17 5.03 4.44.7.3 1.24.48 1.67.62.7.22 1.34.19 1.84.11.56-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.13-.28-.2-.58-.35Z"
        fill="currentColor"
      />
    </svg>
    </a>
  );
};

const HeroSection = () => {
  const [active, setActive] = useState(0);
  const [esMobile, setEsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(HERO_MOBILE_QUERY).matches
  );
  const [menosMovimiento, setMenosMovimiento] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(HERO_MENOS_MOVIMIENTO).matches
  );

  // Elegimos el set por viewport en vez de con <picture>: así el navegador
  // descarga sólo las que va a mostrar.
  useEffect(() => {
    const mq = window.matchMedia(HERO_MOBILE_QUERY);
    const sync = () => setEsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(HERO_MENOS_MOVIMIENTO);
    const sync = () => setMenosMovimiento(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const slides = esMobile ? HERO_SLIDES_MOBILE : HERO_SLIDES_DESKTOP;

  useEffect(() => {
    setActive((prev) => (prev < slides.length ? prev : 0));
  }, [slides.length]);

  // Con prefers-reduced-motion queda la primera imagen fija, sin autoplay.
  useEffect(() => {
    if (menosMovimiento) {
      setActive(0);
      return undefined;
    }
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, HERO_DURACION_MS);
    return () => clearInterval(timer);
  }, [slides.length, menosMovimiento]);

  return (
    <section className="hero">
      <div className="hero-media" aria-hidden="true">
        {slides.map((src, index) => (
          <div
            key={src}
            className={`hero-slide ${index === active ? 'is-active' : ''}`}
          >
            <img
              src={src}
              alt=""
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        ))}
      </div>
      <div className="hero-banda">
        <p className="hero-overline">Piedra sinterizada</p>
        <h1 className="hero-titulo">
          Superficies de gran formato para arquitectura y diseño.
        </h1>
        <p className="hero-bajada">
          Colecciones seleccionadas para el mercado argentino, con tonos
          neutros, vetas y acabados que se adaptan a cada proyecto
        </p>
      </div>
    </section>
  );
};

const HOME_SINTERED_COLLECTION_IDS = ['full-body', 'nature', 'lux'];
const SINTERED_COLLECTIONS = HOME_SINTERED_COLLECTION_IDS.map((id) => ({
  id,
  ...COLLECTIONS_COPY[id],
}));

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
          Disponible en espesores 12mm y 20mm, con opciones Full Body, Nature
          y Lux.
        </p>
      </div>
    </div>
    <div className="sintered-highlights" data-reveal>
      {SINTERED_COLLECTIONS.map((collection) => (
        <article
          key={collection.id}
          className={collection.id === 'nature' ? 'is-centered-highlight' : ''}
        >
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
    window.history.pushState({}, '', `/productos?collection=${category}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
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
          style={{
            '--tile-bg': 'url(/4Home/20mm%20explorar%20productos.jpg)',
            '--tile-bg-mobile': 'url(/4Home/20mm%20explorar%20productos%20mobile.jpg)'
          }}
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
          style={{
            '--tile-bg': 'url(/4Home/12mm%20explorar%20productos.jpg)',
            '--tile-bg-mobile': 'url(/4Home/12mm%20explorar%20productos%20mobile.jpg)'
          }}
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
          onClick={() => {
            trackContact({
              channel: 'whatsapp',
              origin: 'footer',
              page_section: 'footer-contact',
              trigger_source: 'App.Footer.footerContact.whatsapp',
            });
            ga4.trackContact({
              channel: 'whatsapp',
              origin: 'footer',
              page_section: 'footer-contact',
              trigger_source: 'App.Footer.footerContact.whatsapp',
            });
          }}
        >
          <span className="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="currentColor">
              <path d="M19.11 17.18c-.33-.17-1.96-.97-2.27-1.08-.31-.11-.54-.17-.77.17-.23.33-.88 1.08-1.08 1.3-.2.23-.4.26-.73.08-.33-.17-1.4-.52-2.66-1.65-.98-.88-1.64-1.97-1.83-2.3-.19-.33-.02-.5.15-.67.15-.15.33-.4.5-.6.17-.2.23-.33.35-.56.11-.23.06-.44-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.67-.57-.58-.77-.59h-.66c-.23 0-.6.09-.92.44-.31.35-1.2 1.17-1.2 2.86s1.23 3.32 1.4 3.55c.17.23 2.43 3.72 5.89 5.21.82.35 1.46.56 1.96.72.82.26 1.57.22 2.17.13.66-.1 1.96-.8 2.24-1.57.28-.77.28-1.43.2-1.57-.09-.14-.31-.23-.64-.4zM16 3C8.83 3 3 8.83 3 16c0 2.3.6 4.55 1.74 6.54L3 29l6.63-1.7A12.94 12.94 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3zm0 23.5a10.46 10.46 0 0 1-5.33-1.46l-.38-.22-3.93 1.01 1.05-3.83-.25-.39A10.48 10.48 0 1 1 26.5 16 10.5 10.5 0 0 1 16 26.5z" />
            </svg>
          </span>
          {CONTACT_PHONE}
        </a>
        <span>{CONTACT_ADDRESS}</span>
        <a
          href={`https://wa.me/${CONTACT_PHONE.replace(/\D/g, '')}?text=${encodeURIComponent('Hola! me interesa recibir una cotización de superficies Novastone')}`}
          target="_blank"
          rel="noreferrer"
          className="quote-cta"
          onClick={() => {
            trackContact({
              channel: 'whatsapp',
              origin: 'footer',
              page_section: 'footer-quote',
              trigger_source: 'App.Footer.footerQuote.whatsapp',
            });
            ga4.trackContact({
              channel: 'whatsapp',
              origin: 'footer',
              page_section: 'footer-quote',
              trigger_source: 'App.Footer.footerQuote.whatsapp',
            });
            trackLead({
              channel: 'whatsapp',
              origin: 'footer',
              trigger_source: 'App.Footer.footerQuote.whatsapp',
            });
            ga4.trackLead({
              channel: 'whatsapp',
              origin: 'footer',
              trigger_source: 'App.Footer.footerQuote.whatsapp',
            });
          }}
        >
          Solicitar cotización
        </a>
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
  const [texturaSlug, setTexturaSlug] = useState('');
  
  const isAdminRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.pathname.startsWith('/admin') ||
      window.location.hash === '#admin'
    );
  }, []);

  const isTestChatRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname === '/test-chat';
  }, []);

  // Handle hash/path routing
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const pathname = window.location.pathname;
      const normalizedPath = pathname.toLowerCase();
      let effectivePath = normalizedPath;

      const hashQueryIndex = hash.indexOf('?');
      const hashOnly = (hashQueryIndex >= 0 ? hash.slice(0, hashQueryIndex) : hash).toLowerCase();
      const hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : '';
      const legacyHashRoutes = {
        '#productos': '/productos',
        '#colecciones': '/colecciones',
        '#proyectos': '/proyectos',
        '#inspiracion': '/inspiracion',
        '#explorar-texturas': '/inspiracion',
        '#como-comprar': '/como-comprar',
      };

      if (legacyHashRoutes[hashOnly]) {
        const search = hashQuery ? `?${hashQuery}` : window.location.search || '';
        window.history.replaceState({}, '', `${legacyHashRoutes[hashOnly]}${search}`);
        effectivePath = legacyHashRoutes[hashOnly];
      }

      if (
        effectivePath === '/explorar-texturas' ||
        effectivePath === '/explorar-texturas-moodboard'
      ) {
        const search = window.location.search || '';
        window.history.replaceState({}, '', `/inspiracion${search}`);
        effectivePath = '/inspiracion';
      }

      if (effectivePath === '/productos') {
        setCurrentRoute('productos');
      } else if (effectivePath === '/colecciones') {
        setCurrentRoute('colecciones');
      } else if (effectivePath === '/proyectos') {
        setCurrentRoute('proyectos');
      } else if (
        effectivePath === '/inspiracion' ||
        effectivePath === '/explorar-texturas' ||
        effectivePath === '/explorar-texturas-moodboard'
      ) {
        setCurrentRoute('explorar-texturas');
      } else if (effectivePath.startsWith('/texturas/')) {
        setTexturaSlug(effectivePath.slice('/texturas/'.length).replace(/\/$/, ''));
        setCurrentRoute('textura');
      } else if (effectivePath === '/como-comprar') {
        setCurrentRoute('como-comprar');
      } else if (hash.startsWith('#asociados')) {
        setCurrentRoute('asociados');
      } else if (
        hash.startsWith('#explorar-texturas-orb') ||
        pathname === '/explorar-texturas-orb'
      ) {
        setCurrentRoute('explorar-texturas-orb');
      } else {
        setCurrentRoute('home');
      }
    };

    // Check initial route
    handleLocationChange();

    // Listen for location changes
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Toggle body background for productos/collections routes (avoid sand borders around black page)
  useEffect(() => {
    document.body.classList.toggle('productos-route', currentRoute === 'productos');
    document.body.classList.toggle('collections-route', currentRoute === 'colecciones');
    document.body.classList.toggle('inspiration-route', currentRoute === 'proyectos');
    document.body.classList.toggle('home-route', currentRoute === 'home');
    document.body.classList.toggle('inspiracion-route', currentRoute === 'explorar-texturas');
    return () => {
      document.body.classList.remove('productos-route');
      document.body.classList.remove('collections-route');
      document.body.classList.remove('inspiration-route');
      document.body.classList.remove('home-route');
      document.body.classList.remove('inspiracion-route');
    };
  }, [currentRoute]);

  useRevealOnScroll([currentRoute]);

  useEffect(() => {
    trackPageView();
    ga4.trackPageView();
    const pathname = window.location.pathname.toLowerCase();
    const keyPageMap = {
      '/productos': 'productos',
      '/inspiracion': 'inspiracion',
      '/como-comprar': 'como-comprar',
    };
    const pageName = keyPageMap[pathname];
    if (pageName) {
      trackCustom('KeyPageView', {
        page_name: pageName,
        trigger_source: 'App.routeChange',
      });
      ga4.trackCustom('KeyPageView', {
        page_name: pageName,
        trigger_source: 'App.routeChange',
      });
    }
    /* texturaSlug va en las dependencias porque las cinco texturas comparten
       currentRoute === 'textura': sin él, ir de una textura a otra (el bloque
       "Explorar más texturas") no volvía a disparar el PageView. Entrar desde
       afuera no duplica, porque currentRoute y texturaSlug cambian juntos. */
  }, [currentRoute, texturaSlug]);

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

  if (isTestChatRoute) {
    return <TestChat />;
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
  if (currentRoute === 'proyectos') {
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

  if (currentRoute === 'textura') {
    return (
      <div className="App">
        <Header />
        <main>
          <TexturaPage slug={texturaSlug} />
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

  if (currentRoute === 'explorar-texturas') {
    return (
      <div className="App">
        <Header />
        <main>
          <ExploreTexturesMoodboardPage />
        </main>
        <Footer />
        <WhatsAppFab />
        <Analytics />
      </div>
    );
  }

  if (currentRoute === 'explorar-texturas-orb') {
    return (
      <div className="App">
        <Header />
        <main>
          <ExploreTexturesPage />
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
        <NuevasTexturasSection />
        {error ? (
          <section className="error" data-reveal>
            {error}
          </section>
        ) : (
          <StonesSection />
        )}
        {/* Va último, justo antes del footer. "¿Qué es Novastone?" sigue
            bajando acá porque el salto busca el id, no la posición. */}
        <SinteredSection />
      </main>
      <Footer />
      <WhatsAppFab />
      <Analytics />
    </div>
  );
}

export default App;
