import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { texturaPorSlug, otrasTexturas, RUTA_TEXTURA } from '../../content/nuevasTexturas';

const CONTACTO_TEL = '5491124800421';

/* index.css declara scroll-behavior: smooth, así que un scrollTo normal
   anima y el pin se mide a mitad de camino. Forzamos el salto seco. */
const alTope = () => {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo(0, 0);
  }
};

/* El pin no se puede medir con la imagen sin cargar. */
const esperarImagen = (img) =>
  new Promise((listo) => {
    if (!img || img.complete) return listo();
    let hecho = false;
    const fin = () => {
      if (hecho) return;
      hecho = true;
      img.removeEventListener('load', fin);
      img.removeEventListener('error', fin);
      listo();
    };
    img.addEventListener('load', fin);
    img.addEventListener('error', fin);
    window.setTimeout(fin, 2500);   // si nunca carga, seguimos igual
  });

/* Las placas están guardadas en vertical, pero una placa de 3,2 x 1,6 es
   horizontal. Se rota 90° en canvas, igual que hace el sidecart: sin esto
   la caja recortaba una franja del medio y se veía como un zoom. */
const rotarSiEsVertical = (src) =>
  new Promise((listo) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (!w || !h || w >= h) return listo(src);
      const c = document.createElement('canvas');
      c.width = h;
      c.height = w;
      const ctx = c.getContext('2d');
      if (!ctx) return listo(src);
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -w / 2, -h / 2);
      listo(c.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => listo(src);
    img.src = src;
  });

/* El sidecart resuelve la placa en alta como /products/hd/{slug}.jpg y cae
   a la textura si no existe. Se usa el mismo criterio para no duplicar
   assets ni lógica. */
const slugHd = (nombre = '') =>
  nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const menosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Página de una textura: /texturas/[slug]
 *
 * El título entra con scroll retenido (pin de ScrollTrigger): arranca abajo
 * al 60% del tamaño final y crece hasta su posición definitiva, recién ahí
 * se libera el scroll.
 *
 * Tres salidas de emergencia, todas obligatorias:
 *   1. timeout de 3s sin progreso -> libera y deja el título final
 *   2. prefers-reduced-motion    -> sin pin ni animación
 *   3. GSAP ausente o con error  -> estado final estático
 * En ningún caso la página puede quedar con el scroll trabado.
 */
const TexturaPage = ({ slug }) => {
  const textura = texturaPorSlug(slug);
  const escenaRef = useRef(null);
  const tituloRef = useRef(null);
  const fotoRef = useRef(null);
  const limpiarRef = useRef(null);
  const [placaSrc, setPlacaSrc] = useState('');
  const [zoomAbierto, setZoomAbierto] = useState(false);
  const [lupa, setLupa] = useState(null);
  const zoomImgRef = useRef(null);

  // 1) El routing es manual con pushState y el navegador conserva el scroll
  //    anterior. useLayoutEffect corre antes del paint y antes del efecto
  //    que crea el ScrollTrigger, así el pin se mide desde el tope.
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    alTope();
  }, [slug]);

  // ── animación del título ────────────────────────────────────────────
  useEffect(() => {
    if (!textura) return undefined;
    const escena = escenaRef.current;
    const titulo = tituloRef.current;
    if (!escena || !titulo) return undefined;

    alTope();

    // Estado final: lo que se ve si algo falla o si hay reduced-motion.
    const dejarFinal = () => {
      titulo.style.transform = 'none';
      titulo.style.opacity = '1';
    };

    if (menosMovimiento()) {
      dejarFinal();
      return undefined;
    }

    let vivo = true;
    let disparador = null;
    let temporizador = null;
    let huboProgreso = false;
    let alCargarTodo = null;

    const soltar = () => {
      if (disparador) {
        try { disparador.kill(); } catch { /* ya estaba muerto */ }
        disparador = null;
      }
      dejarFinal();
    };

    (async () => {
      try {
        const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
          import('gsap'),
          import('gsap/ScrollTrigger')
        ]);
        if (!vivo) return;
        gsap.registerPlugin(ScrollTrigger);
        // El import es async: reconfirmamos el tope antes de medir el pin.
        // clearScrollMemory borra la posición que ScrollTrigger recuerda.
        if (typeof ScrollTrigger.clearScrollMemory === 'function') {
          ScrollTrigger.clearScrollMemory('manual');
        }
        await esperarImagen(fotoRef.current);
        if (!vivo) return;
        alTope();

        gsap.set(titulo, { scale: 0.6, yPercent: 60, opacity: 0 });

        const tl = gsap.timeline();
        tl.to(titulo, { opacity: 1, duration: 0.25, ease: 'none' }, 0)
          .to(titulo, { scale: 1, yPercent: 0, duration: 1, ease: 'none' }, 0);

        disparador = ScrollTrigger.create({
          animation: tl,
          trigger: escena,
          start: 'top top',
          end: '+=70%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (self.progress > 0.02) huboProgreso = true;
          }
        });

        // Los renders son lazy: al cargar cambian el alto y el final del
        // pin queda corrido. Recalculamos cuando termina de asentarse.
        ScrollTrigger.refresh();
        alCargarTodo = () => ScrollTrigger.refresh();
        window.addEventListener('load', alCargarTodo);

        // Salida 1: si a los 3s sigue pineado sin progreso, se libera.
        temporizador = window.setTimeout(() => {
          if (!vivo) return;
          const atascado = disparador && disparador.isActive && !huboProgreso;
          if (atascado) soltar();
        }, 3000);
      } catch {
        // Salida 3: sin GSAP, estado final estático.
        if (vivo) dejarFinal();
      }
    })();

    limpiarRef.current = () => {
      vivo = false;
      if (temporizador) window.clearTimeout(temporizador);
      if (alCargarTodo) window.removeEventListener('load', alCargarTodo);
      if (disparador) {
        try { disparador.kill(); } catch { /* noop */ }
      }
    };
    return () => limpiarRef.current && limpiarRef.current();
  }, [textura, slug]);

  // ── fade escalonado de los textos ───────────────────────────────────
  useEffect(() => {
    if (!textura) return undefined;
    const nodos = Array.from(document.querySelectorAll('.tex-anim'));
    if (!nodos.length) return undefined;
    if (menosMovimiento()) {
      nodos.forEach((n) => n.classList.add('is-visible'));
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          const i = nodos.indexOf(e.target);
          e.target.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        });
      },
      { threshold: 0.15 }
    );
    nodos.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [textura, slug]);

  // Placa en alta si existe, y siempre en horizontal.
  useEffect(() => {
    if (!textura) return undefined;
    let vivo = true;
    setPlacaSrc('');
    const hd = `/products/hd/${slugHd(textura.nombre)}.jpg`;
    const probar = new Image();
    probar.onload = () => vivo && rotarSiEsVertical(hd).then((r) => vivo && setPlacaSrc(r));
    probar.onerror = () =>
      vivo && rotarSiEsVertical(encodeURI(textura.textura)).then((r) => vivo && setPlacaSrc(r));
    probar.src = hd;
    return () => { vivo = false; };
  }, [textura, slug]);

  // Escape cierra el zoom.
  useEffect(() => {
    if (!zoomAbierto) return undefined;
    const alTeclear = (e) => e.key === 'Escape' && setZoomAbierto(false);
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [zoomAbierto]);

  const LUPA = 266;
  const ACERCAMIENTO = 2.4;

  const moverLupa = (e) => {
    const img = zoomImgRef.current;
    if (!img) return;
    const r = img.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (px < 0 || px > 1 || py < 0 || py > 1) return setLupa(null);
    const bw = r.width * ACERCAMIENTO;
    const bh = r.height * ACERCAMIENTO;
    setLupa({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      bx: -(px * bw - LUPA / 2),
      by: -(py * bh - LUPA / 2),
      bw,
      bh
    });
  };

  useEffect(() => {
    document.body.classList.add('textura-route');
    return () => document.body.classList.remove('textura-route');
  }, []);

  if (!textura) {
    return (
      <div className="textura-page">
        <p className="textura-vacia">No encontramos esa textura.</p>
      </div>
    );
  }

  const irA = (destino) => (e) => {
    e.preventDefault();
    window.history.pushState({}, '', destino);
    window.dispatchEvent(new PopStateEvent('popstate'));
    alTope();
  };

  const mensaje = encodeURIComponent(
    `Hola, quiero consultar disponibilidad de ${textura.nombre}.`
  );

  return (
    <div className="textura-page">
      {/* 2 + 3 — textura con el título superpuesto */}
      <section className="tex-escena" ref={escenaRef}>
        <div className="tex-foto">
          <img
            ref={fotoRef}
            src={encodeURI(textura.textura)}
            alt={`Textura ${textura.nombre}`}
            /* Reserva el alto antes de cargar: sin esto la escena mide 0
               cuando se crea el pin y la página queda a medias. */
            style={{ aspectRatio: String(textura.ratioTextura) }}
            decoding="async"
          />
        </div>
        <h1
          className="tex-titulo"
          ref={tituloRef}
          style={{ fontSize: `${textura.tituloVw}vw` }}
        >
          {textura.tituloLineas.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </h1>
      </section>

      {/* 4 — ficha técnica */}
      <dl className="tex-ficha tex-anim">
        <div>
          <dt>Espesor</dt>
          <dd>{textura.espesor}</dd>
        </div>
        <div>
          <dt>Formato</dt>
          <dd>{textura.formato}</dd>
        </div>
        <div>
          <dt>Terminación</dt>
          <dd>{textura.terminacion}</dd>
        </div>
      </dl>

      {/* 5 — renders */}
      <div className="tex-renders">
        {textura.renders.map((r, i) => (
          <img key={r} src={encodeURI(r)} alt={`${textura.nombre} en ambiente ${i + 1}`} loading="lazy" decoding="async" />
        ))}
      </div>

      {/* 6 · 7 · 8 */}
      <div className="tex-cierre">
        <h2 className="tex-nombre tex-anim">{textura.nombre}</h2>
        <p className="tex-desc tex-anim">{textura.descripcion}</p>
        <a
          className="tex-cta tex-anim"
          href={`https://wa.me/${CONTACTO_TEL}?text=${mensaje}`}
          target="_blank"
          rel="noreferrer"
        >
          Consultar disponibilidad
        </a>
      </div>

      {/* Placa en horizontal, sólo desktop. Va entre el CTA y la banda. */}
      <figure className="tex-placa">
        <figcaption>Placa {textura.formato}</figcaption>
        <button
          type="button"
          className="tex-placa-marco"
          onClick={() => setZoomAbierto(true)}
          aria-label={`Ampliar la placa de ${textura.nombre}`}
        >
          {placaSrc && <img src={placaSrc} alt="" loading="lazy" decoding="async" />}
        </button>
      </figure>

      {zoomAbierto && (
        <div className="tex-zoom" role="dialog" aria-modal="true">
          <button
            type="button"
            className="tex-zoom-fondo"
            aria-label="Cerrar"
            onClick={() => setZoomAbierto(false)}
          />
          <div
            className="tex-zoom-marco"
            onMouseMove={moverLupa}
            onMouseLeave={() => setLupa(null)}
          >
            <img ref={zoomImgRef} src={placaSrc} alt={`Placa ${textura.nombre}`} />
            {lupa && (
              <span
                className="tex-zoom-lupa"
                style={{
                  left: `${lupa.x}px`,
                  top: `${lupa.y}px`,
                  backgroundImage: `url("${placaSrc}")`,
                  backgroundSize: `${lupa.bw}px ${lupa.bh}px`,
                  backgroundPosition: `${lupa.bx}px ${lupa.by}px`
                }}
              />
            )}
          </div>
          <button
            type="button"
            className="tex-zoom-cerrar"
            aria-label="Cerrar"
            onClick={() => setZoomAbierto(false)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <line x1="2" y1="2" x2="18" y2="18" />
              <line x1="18" y1="2" x2="2" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* 9 — banda oscura */}
      <div className="tex-banda">
        <span className="tex-banda-vertical" aria-hidden="true">Novastone</span>
        <h2>
          <span>Explorar más</span>
          <span>Texturas</span>
        </h2>
      </div>

      {/* 10 — las otras cuatro */}
      <div className="tex-otras">
        {otrasTexturas(textura.slug).map((o) => (
          <a
            key={o.slug}
            className="tex-otra"
            href={RUTA_TEXTURA(o.slug)}
            style={{ backgroundImage: `url("${encodeURI(o.textura)}")` }}
            onClick={irA(RUTA_TEXTURA(o.slug))}
          >
            <span>{o.nombre}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TexturaPage;
