/**
 * Las cinco texturas nuevas de septiembre 2026.
 *
 * Todos los datos salen de public/products-data.json (los cinco productos ya
 * existían). Acá sólo se fijan el orden editorial, el corte de línea del
 * título y su tamaño, que son decisiones de diseño y no viven en el dataset.
 *
 * `tituloVw` sale de medir cada referencia de public/4Home/home_mobile/:
 * la altura de caja del título dividida por el ancho del mockup. Cada
 * textura tiene su propia proporción, no hay un tamaño único.
 *
 * Las rutas de imagen son las mismas que usa el catálogo PDF.
 *
 * `ratioTextura` es ancho/alto de la foto. Se usa como aspect-ratio para
 * reservar el alto antes de que la imagen cargue: sin eso el ScrollTrigger
 * medía la escena en 0 y el pin quedaba mal hasta refrescar.
 */

export const NUEVAS_TEXTURAS = [
  {
    slug: 'marfilo',
    ratioTextura: 0.4984,
    nombre: 'MARFILO',
    tituloLineas: ['MARFILO'],
    tituloVw: 19.5,
    textura: '/products/28Marfilo/Marfilo.jpg',
    renders: [
      '/products/28Marfilo/Marfilo RENDER.jpg',
      '/products/28Marfilo/Marfilo RENDER 2.jpg'
    ],
    espesor: '12 mm',
    formato: '3,2 X 1,6 mts',
    terminacion: 'Natural',
    descripcion:
      'Crema cálido recorrido por una red densa de vetas doradas finas.'
  },
  {
    slug: 'new-taj-mahal',
    ratioTextura: 0.5,
    nombre: 'NEW TAJ MAHAL',
    tituloLineas: ['NEW', 'TAJ MAHAL'],
    tituloVw: 16.2,
    // La que estaba en public/ era un recorte de 1009x1413 (ratio 0.71),
    // fuera de la convención vertical de las otras cuatro. Esta sale del
    // master de 2500x5000 y queda en 1200x2400, como Cristallo Blanc.
    textura: '/products/13NEW TAJ MAHAL/NEW TAJ MAHAL textura.jpg',
    // Los dos renders verticales del catálogo. Estaban sólo en
    // product-info/, en una carpeta escrita "MAJAL" en vez de "MAHAL",
    // por eso products-data.json tenía uno solo.
    renders: [
      '/products/13NEW TAJ MAHAL/NEW TAJ MAHAL RENDER.jpg',
      '/products/13NEW TAJ MAHAL/NEW TAJ MAHAL RENDER 2.jpg'
    ],
    espesor: '12 mm',
    formato: '3,2 X 1,6 mts',
    terminacion: 'Natural',
    descripcion:
      'De apariencia similar a cuarcitas claras y refinadas, presenta un fondo blanco cálido con un entramado suave de nubes minerales y vetas finas en tonos beige y gris muy sutiles. Su textura aporta profundidad y un movimiento delicado, manteniendo una estética luminosa y serena.'
  },
  {
    slug: 'cristallo-blanc',
    ratioTextura: 0.5,
    nombre: 'CRISTALLO BLANC',
    tituloLineas: ['CRISTALLO', 'BLANC'],
    tituloVw: 16.7,
    textura: '/products/27Cristallo Blanc/Cristallo Blanc.jpg',
    renders: [
      '/products/27Cristallo Blanc/Cristallo Blanc RENDER.jpg',
      '/products/27Cristallo Blanc/Cristallo Blanc RENDER 2.jpg'
    ],
    espesor: '12 mm',
    formato: '3,2 X 1,6 mts',
    terminacion: 'Natural',
    descripcion:
      'Blanco cálido con nubosidad suave y vetas finas en tonos óxido.'
  },
  {
    slug: 'calacatta-ambra',
    ratioTextura: 0.5,
    nombre: 'CALACATTA AMBRA',
    tituloLineas: ['CALACATTA', 'AMBRA'],
    tituloVw: 16.7,
    textura: '/products/29Calacatta Ambra/Calacatta Ambra.jpg',
    renders: [
      '/products/29Calacatta Ambra/Calacatta Ambra RENDER.jpg',
      '/products/29Calacatta Ambra/Calacatta Ambra RENDER 2.jpg'
    ],
    espesor: '12 mm',
    formato: '3,2 X 1,6 mts',
    terminacion: 'Mate',
    descripcion:
      'Blanco luminoso atravesado por vetas doradas de gran recorrido.'
  },
  {
    slug: 'autumn-maple',
    ratioTextura: 0.327,
    nombre: 'AUTUMN MAPLE',
    tituloLineas: ['AUTUMN', 'MAPLE'],
    tituloVw: 21,
    textura: '/products/7AUTUMN MAPLE/AUTUMN MAPLE.jpg',
    // Los tres renders nuevos, los mismos que usa /productos.
    renders: [
      '/products/7AUTUMN MAPLE/AUTUMN MAPLE RENDER catalogo.jpg',
      '/products/7AUTUMN MAPLE/AUTUMN MAPLE RENDER catalogo 2.jpg',
      '/products/7AUTUMN MAPLE/AUTUMN MAPLE RENDER catalogo 3.jpg'
    ],
    espesor: '12 mm',
    formato: '3,2 X 1,6 mts',
    terminacion: 'Natural',
    descripcion:
      'Inspirado en mármoles mediterráneos cálidos, combina un fondo beige suave con vetas amplias en tonos dorados, miel y ámbar. Sus trazos orgánicos y contrastados evocan una estética natural, otoñal y vibrante.'
  }
];

export const texturaPorSlug = (slug) =>
  NUEVAS_TEXTURAS.find((t) => t.slug === slug) || null;

/** Las otras cuatro, en el mismo orden editorial. */
export const otrasTexturas = (slug) =>
  NUEVAS_TEXTURAS.filter((t) => t.slug !== slug);

export const RUTA_TEXTURA = (slug) => `/texturas/${slug}`;
