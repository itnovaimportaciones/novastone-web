const normalizeProductName = (value = '') =>
  String(value).replace(/\s+/g, ' ').trim().toLowerCase();

export const COLLECTION_PRODUCT_MAP = {
  '20mm': [
    'PURE BLACK',
    'PURE WHITE',
    'BVLGARI BLACK'
  ],
  '12mm': [
    'ATYs GREY',
    'AUTUMN MAPLE',
    'BEIGE STONE',
    'BLANCO CRYSTAL',
    'BRAZILIANITE',
    'CALACATTA ROMA',
    'CARMEN',
    'CHANEL',
    'FENDI WHITE',
    'LIMESTONE',
    'NATA',
    'NEW TAJ MAHAL',
    'PANDORA',
    'PORTLAND',
    'ROYAL GREY',
    'SPANISH GREY',
    'WHITE TRAVERTINE',
    'YELLOW TRAVERTINE',
    'LAURENT',
    'LOUISKIN',
    'NERO PORTORO'
  ],
  'full-body': [
    'BVLGARI BLACK',
    'LAURENT',
    'LOUISKIN',
    'NERO PORTORO'
  ],
  espejada: [
    'AUTUMN MAPLE',
    'BLANCO CRYSTAL',
    'CALACATTA ROMA',
    'CARMEN',
    'NEW TAJ MAHAL',
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
