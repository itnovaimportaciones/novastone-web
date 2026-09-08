/**
 * scripts/prerender.mjs
 *
 * Genera HTML estático por ruta para SEO.
 * Copia dist/index.html a dist/[ruta]/index.html actualizando
 * title, description y canonical para cada página.
 *
 * No requiere Chrome ni puppeteer — funciona en cualquier entorno.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const templatePath = path.join(distDir, 'index.html');

const ROUTES = [
  {
    path: '/productos',
    title: 'Productos | Novastone — Catálogo de Piedra Sinterizada',
    description:
      'Explorá el catálogo completo de superficies sinterizadas NOVASTONE. Más de 26 texturas en espesores 12mm y 20mm con acabados Full Body, Nature y Lux.',
    canonical: 'https://novastone.app/productos',
    ogTitle: 'Novastone | Catálogo de Productos',
    ogDescription: 'Más de 26 superficies sinterizadas premium en 12mm y 20mm.',
    ogUrl: 'https://novastone.app/productos',
  },
  {
    path: '/colecciones',
    title: 'Colecciones | Novastone — Full Body, Nature y Lux',
    description:
      'Colecciones NOVASTONE: Full Body, Nature y Lux. Superficies sinterizadas premium en 12mm y 20mm para proyectos residenciales y comerciales en Argentina.',
    canonical: 'https://novastone.app/colecciones',
    ogTitle: 'Novastone | Colecciones',
    ogDescription: 'Full Body, Nature y Lux — superficies sinterizadas premium.',
    ogUrl: 'https://novastone.app/colecciones',
  },
  {
    path: '/proyectos',
    title: 'Proyectos | Novastone — Inspiración en Piedra Sinterizada',
    description:
      'Proyectos de arquitectura y diseño con superficies NOVASTONE. Cocinas, baños, fachadas y espacios comerciales con piedra sinterizada premium.',
    canonical: 'https://novastone.app/proyectos',
    ogTitle: 'Novastone | Proyectos',
    ogDescription: 'Inspiración en espacios residenciales y comerciales con piedra sinterizada.',
    ogUrl: 'https://novastone.app/proyectos',
  },
  {
    path: '/inspiracion',
    title: 'Inspiración | Novastone — Explorador de Texturas y Moodboard',
    description:
      'Explorá texturas y combinaciones de superficies NOVASTONE con moodboards de inspiración curada. Descubrí cómo cada material transforma los espacios.',
    canonical: 'https://novastone.app/inspiracion',
    ogTitle: 'Novastone | Inspiración',
    ogDescription: 'Moodboards y explorador de texturas para proyectos de diseño.',
    ogUrl: 'https://novastone.app/inspiracion',
  },
  {
    path: '/como-comprar',
    title: '¿Cómo Comprar? | Novastone — Marmolerías y Proyectos',
    description:
      'Comprá NOVASTONE a través de marmolerías asociadas en Argentina. Te conectamos con el profesional adecuado para cotizar, fabricar e instalar tu proyecto.',
    canonical: 'https://novastone.app/como-comprar',
    ogTitle: 'Novastone | ¿Cómo Comprar?',
    ogDescription: 'Conectamos tu proyecto con marmolerías asociadas NOVASTONE en Argentina.',
    ogUrl: 'https://novastone.app/como-comprar',
  },
  {
    path: '/texturas/marfilo',
    title: 'Marfilo | Novastone — Piedra Sinterizada 12mm',
    description:
      'Crema cálido recorrido por una red densa de vetas doradas finas. Placa de 3,2 x 1,6 mts en 12mm.',
    canonical: 'https://novastone.app/texturas/marfilo',
    ogTitle: 'Novastone | Marfilo',
    ogDescription: 'Crema cálido recorrido por una red densa de vetas doradas finas.',
    ogUrl: 'https://novastone.app/texturas/marfilo',
  },
  {
    path: '/texturas/new-taj-mahal',
    title: 'New Taj Mahal | Novastone — Piedra Sinterizada 12mm',
    description:
      'Fondo blanco cálido con nubes minerales y vetas finas en tonos beige y gris. Placa de 3,2 x 1,6 mts en 12mm.',
    canonical: 'https://novastone.app/texturas/new-taj-mahal',
    ogTitle: 'Novastone | New Taj Mahal',
    ogDescription: 'Fondo blanco cálido con nubes minerales y vetas finas en tonos beige y gris.',
    ogUrl: 'https://novastone.app/texturas/new-taj-mahal',
  },
  {
    path: '/texturas/cristallo-blanc',
    title: 'Cristallo Blanc | Novastone — Piedra Sinterizada 12mm',
    description:
      'Blanco cálido con nubosidad suave y vetas finas en tonos óxido. Placa de 3,2 x 1,6 mts en 12mm.',
    canonical: 'https://novastone.app/texturas/cristallo-blanc',
    ogTitle: 'Novastone | Cristallo Blanc',
    ogDescription: 'Blanco cálido con nubosidad suave y vetas finas en tonos óxido.',
    ogUrl: 'https://novastone.app/texturas/cristallo-blanc',
  },
  {
    path: '/texturas/calacatta-ambra',
    title: 'Calacatta Ambra | Novastone — Piedra Sinterizada 12mm',
    description:
      'Blanco luminoso atravesado por vetas doradas de gran recorrido. Placa de 3,2 x 1,6 mts en 12mm.',
    canonical: 'https://novastone.app/texturas/calacatta-ambra',
    ogTitle: 'Novastone | Calacatta Ambra',
    ogDescription: 'Blanco luminoso atravesado por vetas doradas de gran recorrido.',
    ogUrl: 'https://novastone.app/texturas/calacatta-ambra',
  },
  {
    path: '/texturas/autumn-maple',
    title: 'Autumn Maple | Novastone — Piedra Sinterizada 12mm',
    description:
      'Fondo beige suave con vetas amplias en tonos dorados, miel y ámbar. Placa de 3,2 x 1,6 mts en 12mm.',
    canonical: 'https://novastone.app/texturas/autumn-maple',
    ogTitle: 'Novastone | Autumn Maple',
    ogDescription: 'Fondo beige suave con vetas amplias en tonos dorados, miel y ámbar.',
    ogUrl: 'https://novastone.app/texturas/autumn-maple',
  },
];

function patchHtml(html, route) {
  let out = html;

  // title
  out = out.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`
  );

  // meta description
  out = out.replace(
    /(<meta\s+name="description"\s+content=")[^"]*(")/,
    `$1${route.description}$2`
  );

  // canonical
  out = out.replace(
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    `$1${route.canonical}$2`
  );

  // og:title
  out = out.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${route.ogTitle}$2`
  );

  // og:description
  out = out.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*(")/,
    `$1${route.ogDescription}$2`
  );

  // og:url
  out = out.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${route.ogUrl}$2`
  );

  // twitter:title
  out = out.replace(
    /(<meta\s+property="twitter:title"\s+content=")[^"]*(")/,
    `$1${route.ogTitle}$2`
  );

  // twitter:description
  out = out.replace(
    /(<meta\s+property="twitter:description"\s+content=")[^"]*(")/,
    `$1${route.ogDescription}$2`
  );

  // twitter:url
  out = out.replace(
    /(<meta\s+property="twitter:url"\s+content=")[^"]*(")/,
    `$1${route.ogUrl}$2`
  );

  return out;
}

function run() {
  if (!fs.existsSync(templatePath)) {
    console.error('❌  dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, 'utf-8');
  console.log('🔧  Prerendering routes...\n');

  for (const route of ROUTES) {
    const routeDir = path.join(distDir, route.path);
    const outputPath = path.join(routeDir, 'index.html');

    fs.mkdirSync(routeDir, { recursive: true });
    const html = patchHtml(template, route);
    fs.writeFileSync(outputPath, html, 'utf-8');

    console.log(`  ✓  ${route.path}`);
    console.log(`     → ${outputPath.replace(distDir, 'dist')}`);
    console.log(`     title: ${route.title}\n`);
  }

  console.log(`✅  Done — ${ROUTES.length} routes pre-rendered.`);
}

run();
