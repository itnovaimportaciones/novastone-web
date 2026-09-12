import React, { useEffect, useRef, useState } from 'react';
import { NUEVAS_TEXTURAS, RUTA_TEXTURA } from '../../content/nuevasTexturas';
import { trackCustom } from '../../lib/metaPixel';
import * as ga4 from '../../lib/googleAnalytics';

/**
 * Sección "NUEVAS TEXTURAS" del home.
 *
 * Acordeón de a una: abrir una cierra la que estaba abierta. La fila abierta
 * muestra "Explorar" y una cruz para cerrar.
 *
 * La animación acá es deliberadamente más sobria que en las páginas de
 * textura: sólo un fade al entrar en viewport.
 */

/** Cruz de cerrar: dos trazos finos, sin círculo ni caja. El área táctil
 *  son 44×44 aunque el aspa se vea de 20. */
const CruzCerrar = ({ onClick }) => (
  <button type="button" className="nt-cerrar" onClick={onClick} aria-label="Cerrar">
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <line x1="2" y1="2" x2="18" y2="18" />
      <line x1="18" y1="2" x2="2" y2="18" />
    </svg>
  </button>
);

const NuevasTexturasSection = () => {
  const [abierta, setAbierta] = useState(null);
  const seccionRef = useRef(null);

  // Fade suave al entrar en viewport, nada más.
  useEffect(() => {
    const el = seccionRef.current;
    if (!el) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const irATextura = (textura) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Antes del pushState: después de navegar, este componente se desmonta.
    trackCustom('ExplorarTextura', { texture_name: textura.nombreCanonico });
    ga4.trackCustom('ExplorarTextura', { texture_name: textura.nombreCanonico });
    window.history.pushState({}, '', RUTA_TEXTURA(textura.slug));
    window.dispatchEvent(new PopStateEvent('popstate'));
    // index.css tiene scroll-behavior: smooth; acá hace falta el salto seco.
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  return (
    <section className="nuevas-texturas" ref={seccionRef} id="nuevas-texturas">
      <header className="nt-encabezado">
        <span className="nt-vertical" aria-hidden="true">Novastone 2026</span>
        <h2 className="nt-titulo">
          <span>Nuevas</span>
          <span>Texturas</span>
        </h2>
        <p className="nt-bajada">
          <span>Cinco piedras nuevas disponibles</span>
          <span>en 12mm.</span>
        </p>
      </header>

      <div className="nt-filas">
        {NUEVAS_TEXTURAS.map((t) => {
          const estaAbierta = abierta === t.slug;
          return (
            <article
              key={t.slug}
              className={`nt-fila ${estaAbierta ? 'is-abierta' : ''}`}
              style={{ backgroundImage: `url("${encodeURI(t.textura)}")` }}
            >
              <button
                type="button"
                className="nt-fila-boton"
                aria-expanded={estaAbierta}
                /* El botón es un toggle: sin este guard, cerrar una fila
                   mandaría otro ExpandTextura. Sólo interesa la apertura. */
                onClick={() => {
                  if (!estaAbierta) {
                    trackCustom('ExpandTextura', { texture_name: t.nombreCanonico });
                    ga4.trackCustom('ExpandTextura', { texture_name: t.nombreCanonico });
                  }
                  setAbierta(estaAbierta ? null : t.slug);
                }}
              >
                <span className="nt-nombre">{t.nombre}</span>
                <a
                  className="nt-explorar"
                  href={RUTA_TEXTURA(t.slug)}
                  tabIndex={estaAbierta ? 0 : -1}
                  onClick={irATextura(t)}
                >
                  {/* Una letra por span: en desktop cada una sube detrás de
                      una máscara, escalonada. En mobile se ignora y sigue el
                      tipeo por ancho. */}
                  {'Explorar'.split('').map((letra, i) => (
                    <span key={`${t.slug}-${i}`} style={{ '--i': i }}>
                      {letra}
                    </span>
                  ))}
                </a>
              </button>
              {estaAbierta && <CruzCerrar onClick={() => setAbierta(null)} />}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default NuevasTexturasSection;
