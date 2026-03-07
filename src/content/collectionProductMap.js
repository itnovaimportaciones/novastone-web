const normalizeProductName = (value = '') =>
  String(value).replace(/\s+/g, ' ').trim().toLowerCase();

export const COLLECTION_PRODUCT_MAP = {
  '20mm': [
    'PURE BLACK',
    'PURE WHITE',
    'BVLGARI BLACK',
    'LAURENT',
    'LOUISKIN',
    'NERO PORTORO'
  ],
  '12mm': [
    'ATYs GREY',
    'AUTUMN MAPLE',
    'BEIGE STONE',
    'BRAZILIANITE',
    'CALACATTA ROMA',
    'CARMEN',
    'CHANEL',
    'FENDI WHITE',
    'LIMESTONE',
    'NATA',
    'NEW TAJ MAJAL',
    'PANDORA',
    'PORTLAND',
    'ROYAL GREY',
    'SPANISH GREY',
    'WHITE TRAVERTINE',
    'YELLOW TRAVERTINE'
  ],
  'full-body': [
    'BVLGARI BLACK',
    'LAURENT',
    'LOUISKIN',
    'NERO PORTORO'
  ],
  espejada: [
    'AUTUMN MAPLE',
    'CALACATTA ROMA',
    'CARMEN',
    'NEW TAJ MAJAL',
    'WHITE TRAVERTINE'
  ],
  luxury: [
    'CHANEL',
    'FENDI WHITE',
    'NATA',
    'PANDORA'
  ]
};

const COLLECTION_ALIASES = {
  fullbody: 'full-body',
  'full-body': 'full-body'
};

export const normalizeCollectionKey = (value = 'all') => {
  const key = String(value).trim().toLowerCase();
  if (!key) return 'all';
  return COLLECTION_ALIASES[key] || key;
};

export const matchesCollection = (productName = '', collectionKey = 'all') => {
  const normalizedCollection = normalizeCollectionKey(collectionKey);
  if (normalizedCollection === 'all') return true;
  const names = COLLECTION_PRODUCT_MAP[normalizedCollection] || [];
  const allowedNames = new Set(names.map(normalizeProductName));
  return allowedNames.has(normalizeProductName(productName));
};
