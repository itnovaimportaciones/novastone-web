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
  const { intro, specs } = parseProductDescription(product.description || '');
  const finish = specs['Terminación Superficial'] || '';
  const applications = splitList(specs['Aplicaciones']);
  const interiorExterior = splitList(specs['Interior / Exterior']);
  const colors = specs['Colores'] || '';
  const hasFullBody = (product.detailImages || []).some((image) =>
    /full body/i.test(image)
  );

  return {
    ...product,
    descriptionIntro: intro,
    specs,
    finish,
    colorGroup: deriveColorGroup(colors),
    applications,
    interiorExterior,
    thickness: product.category || '',
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
