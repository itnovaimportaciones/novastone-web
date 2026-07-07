/**
 * Browser-friendly function to load product data from JSON
 * This will be used in the React app
 */
const SPEC_LABELS = [
  'Aplicaciones',
  'Colores',
  'Interior / Exterior',
  'Tipo de Material',
  'Terminación Superficial'
];

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const THICKNESS_OVERRIDES = {
  brazilianite: '12MM',
  'new taj mahal': '12MM'
};

const PRODUCT_OVERRIDES = {
  brazilianite: {
    category: '12mm',
    description:
      'Inspirado en cuarcitas claras de brillo mineral, presenta un fondo beige grisáceo con un entramado suave y cristalino que genera profundidad y un movimiento delicado. Su textura transmite naturalidad, luz y un aspecto elegante y sereno. Ficha Técnica: Aplicaciones: Mesadas de Baño, Mesadas de Cocina, Pisos y Revestimientos Colores: Beige grisáceo con textura cristalina suave Interior / Exterior: Exterior, Interior Tipo de Material: Ultracompacto Terminación Superficial: Satin'
  },
  'new taj mahal': {
    category: '12mm',
    description:
      'De apariencia similar a cuarcitas claras y refinadas, presenta un fondo blanco cálido con un entramado suave de nubes minerales y vetas finas en tonos beige y gris muy sutiles. Su textura aporta profundidad y un movimiento delicado, manteniendo una estética luminosa y serena. Ficha Técnica: Aplicaciones: Mesadas de Baño, Mesadas de Cocina, Pisos y Revestimientos Colores: Blanco cálido con vetas suaves beige y grises Interior / Exterior: Exterior, Interior Tipo de Material: Ultracompacto Terminación Superficial: Acabado Natural'
  }
};

const SURFACE_BADGES = [
  { key: 'MATE', patterns: [/\bmate\b/i] },
  { key: 'PULIDO', patterns: [/\bpulido\b/i] },
  { key: 'SATIN', patterns: [/\bsatin(?:ado)?\b/i] },
  { key: 'NATURAL', patterns: [/\bnatural\b/i] },
  { key: 'VETA PASANTE', patterns: [/veta\s+pasante/i] }
];

const getThicknessOverride = (name = '') => {
  const key = normalizeText(name).toLowerCase();
  return THICKNESS_OVERRIDES[key] || '';
};

const getProductOverride = (name = '') => {
  const key = normalizeText(name).toLowerCase();
  return PRODUCT_OVERRIDES[key] || null;
};

const parseSurfaceFinishes = (sourceText = '') => {
  const text = normalizeText(sourceText);
  const found = [];

  for (const item of SURFACE_BADGES) {
    if (item.patterns.some((pattern) => pattern.test(text))) {
      found.push(item.key);
    }
  }

  return [...new Set(found)];
};

const extractSpecs = (text = '') => {
  const normalized = normalizeText(text);
  const specs = {};

  SPEC_LABELS.forEach((label, index) => {
    const start = normalized.indexOf(`${label}:`);
    if (start === -1) return;
    const nextLabel = SPEC_LABELS.slice(index + 1).find((next) =>
      normalized.includes(`${next}:`)
    );
    const end = nextLabel ? normalized.indexOf(`${nextLabel}:`) : normalized.length;
    const rawValue = normalized.slice(start + label.length + 1, end);
    specs[label] = normalizeText(rawValue);
  });

  return specs;
};

export const parseProductDescription = (description = '') => {
  const [introRaw, fichaRaw] = description.split('Ficha Técnica:');
  const intro = normalizeText(introRaw);
  const specs = extractSpecs(fichaRaw || '');
  return { intro, specs };
};

const splitList = (value = '') =>
  value
    .split(',')
    .map((item) => normalizeText(item))
    .filter(Boolean);

const deriveColorGroup = (value = '') => {
  const color = value.toLowerCase();
  if (color.includes('blanc')) return 'Blancos';
  if (color.includes('gris') || color.includes('gray')) return 'Grises';
  if (color.includes('negro') || color.includes('black')) return 'Negros';
  if (
    color.includes('beige') ||
    color.includes('arena') ||
    color.includes('tierra') ||
    color.includes('marr') ||
    color.includes('ocre')
  ) {
    return 'Tierra';
  }
  return 'Colores';
};

const enrichProduct = (product) => {
  const override = getProductOverride(product.name);
  const resolvedDescription = product.description || override?.description || '';
  const resolvedCategory = product.category || override?.category || '';
  const { intro, specs } = parseProductDescription(resolvedDescription);
  const finish = specs['Terminación Superficial'] || '';
  const applications = splitList(specs['Aplicaciones']);
  const interiorExterior = splitList(specs['Interior / Exterior']);
  const colors = specs['Colores'] || '';
  const hasFullBody = (product.detailImages || []).some((image) =>
    /full body/i.test(image)
  );
  const surfaceFinishes = parseSurfaceFinishes(finish);

  return {
    ...product,
    description: resolvedDescription,
    descriptionIntro: intro,
    specs,
    finish,
    colorGroup: deriveColorGroup(colors),
    applications,
    interiorExterior,
    category: resolvedCategory,
    thickness: resolvedCategory || getThicknessOverride(product.name),
    surfaceFinishes,
    collection: hasFullBody ? 'full-body' : product.collection
  };
};

export async function loadProductData() {
  try {
    const response = await fetch('/products-data.json');
    if (!response.ok) {
      throw new Error('Failed to load products data');
    }
    const data = await response.json();
    const products = Array.isArray(data) ? data : data.products || [];
    return products.map(enrichProduct);
  } catch (error) {
    console.error('Error loading product data:', error);
    return [];
  }
}

/**
 * Filter products by category (12mm, 20mm, or all)
 */
export function filterProductsByCategory(products, category) {
  if (!category || category === 'all') {
    return products;
  }
  return products.filter(product => product.category === category);
}

export function filterProductsByFilters(products, filters = {}) {
  return products.filter((product) => {
    if (filters.collection && filters.collection !== 'all') {
      const collection = filters.collection.toLowerCase();
      if (collection === '12mm' || collection === '20mm') {
        if (product.thickness?.toLowerCase() !== collection) return false;
      } else if (product.collection?.toLowerCase() !== collection) {
        return false;
      }
    }

    if (filters.color && filters.color !== 'all') {
      if (product.colorGroup !== filters.color) return false;
    }

    if (filters.thickness && filters.thickness !== 'all') {
      if (product.thickness?.toLowerCase() !== filters.thickness.toLowerCase()) {
        return false;
      }
    }

    if (filters.finish && filters.finish !== 'all') {
      const finish = product.finish?.toLowerCase() || '';
      if (!finish.includes(filters.finish.toLowerCase())) return false;
    }

    if (filters.application && filters.application !== 'all') {
      const application = filters.application.toLowerCase();
      if (application === 'interior' || application === 'exterior') {
        const interiorExterior = product.interiorExterior.map((item) => item.toLowerCase());
        if (!interiorExterior.some((item) => item.includes(application))) return false;
      } else {
        const apps = product.applications.map((item) => item.toLowerCase());
        if (!apps.some((item) => item.includes(application))) return false;
      }
    }

    return true;
  });
}
