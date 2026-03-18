const hasFbq = () =>
  typeof window !== 'undefined' && typeof window.fbq === 'function';

const withPagePath = (params = {}) => {
  if (typeof window === 'undefined') return params;
  return {
    page_path: window.location.pathname,
    ...params,
  };
};

export const trackPageView = () => {
  if (!hasFbq()) return;
  window.fbq('track', 'PageView');
};

export const trackContact = (params = {}) => {
  if (!hasFbq()) return;
  window.fbq('track', 'Contact', withPagePath(params));
};

export const trackViewContent = (params = {}) => {
  if (!hasFbq()) return;
  window.fbq('track', 'ViewContent', withPagePath(params));
};

export const trackLead = (params = {}) => {
  if (!hasFbq()) return;
  window.fbq('track', 'Lead', withPagePath(params));
};

export const trackCustom = (eventName, params = {}) => {
  if (!hasFbq() || !eventName) return;
  window.fbq('trackCustom', eventName, withPagePath(params));
};

