/**
 * Utility function to open WhatsApp with a predefined message
 * @param {string} phoneNumber - The phone number in international format (e.g., +5491122977747)
 * @param {string} message - The message to send
 */
const PUBLIC_SITE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_SITE_URL) ||
  'https://novastone.app';

export const buildWhatsAppUrl = (
  phoneNumber = '+5491122977747',
  message = 'Hola, quiero saber más sobre Tecno!'
) => {
  const normalizedPhone = String(phoneNumber).replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
};

export const buildProductWhatsAppMessage = (productName, productUrl) =>
  `Me interesa ${productName}${productUrl ? `\nLink del producto: ${productUrl}` : ''}`;

export const buildCanonicalProductUrl = (productSlug) => {
  if (typeof window === 'undefined') return '';

  const currentUrl = new URL(window.location.href);
  const publicBaseUrl = new URL(PUBLIC_SITE_URL);
  const productoParam = currentUrl.searchParams.get('producto');
  const canonicalSlug = productoParam || productSlug;

  if (!canonicalSlug) {
    return `${publicBaseUrl.origin}/productos`;
  }

  return `${publicBaseUrl.origin}/productos?producto=${encodeURIComponent(canonicalSlug)}`;
};

export const openWhatsApp = (
  phoneNumber = '+5491122977747',
  message = 'Hola, quiero saber más sobre Tecno!'
) => {
  const whatsappUrl = buildWhatsAppUrl(phoneNumber, message);

  window.open(whatsappUrl, '_blank');
};
