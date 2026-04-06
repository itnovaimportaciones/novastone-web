const hasFbq = () =>
  typeof window !== 'undefined' && typeof window.fbq === 'function';

const logPixel = (label, payload = {}) => {
  if (typeof window === 'undefined') return;
  // Temporary debug to verify runtime firing in production.
  // Remove once events are validated in Meta Test Events.
  console.log(`[MetaPixel] ${label}`, payload);
};

const withPagePath = (params = {}) => {
  if (typeof window === 'undefined') return params;
  return {
    page_path: window.location.pathname + window.location.search,
    ...params,
  };
};

// Module-level debounce map: tracks last fire time per trigger_source
const _contactLastFired = {};

const _hasContactFiredInSession = (triggerSource) => {
  if (typeof window === 'undefined') return false;
  const key = `pixel_contact_${triggerSource}`;
  if (sessionStorage.getItem(key)) return true;
  sessionStorage.setItem(key, '1');
  return false;
};

export const trackPageView = () => {
  const fbqReady = hasFbq();
  logPixel('track:PageView:attempt', { fbqReady });
  if (!fbqReady) return;
  window.fbq('track', 'PageView');
  logPixel('track:PageView:sent');
};

export const trackContact = (params = {}, { deduplicateBySession = false } = {}) => {
  const src = params.trigger_source || 'unknown';

  // Debounce: skip if same trigger_source fired within the last 1000ms
  const now = Date.now();
  if (_contactLastFired[src] && now - _contactLastFired[src] < 1000) {
    logPixel('track:Contact:skipped:debounce', { trigger_source: src });
    return;
  }
  _contactLastFired[src] = now;

  // Session deduplication: skip if already fired from this trigger_source this session
  if (deduplicateBySession && _hasContactFiredInSession(src)) {
    logPixel('track:Contact:skipped:session-duplicate', { trigger_source: src });
    return;
  }

  const payload = withPagePath(params);
  const fbqReady = hasFbq();
  logPixel('track:Contact:attempt', { fbqReady, params: payload });
  if (!fbqReady) return;
  window.fbq('track', 'Contact', payload);
  logPixel('track:Contact:sent', { params: payload });
};

export const trackViewContent = (params = {}) => {
  const payload = withPagePath(params);
  const fbqReady = hasFbq();
  logPixel('track:ViewContent:attempt', { fbqReady, params: payload });
  if (!fbqReady) return;
  window.fbq('track', 'ViewContent', payload);
  logPixel('track:ViewContent:sent', { params: payload });
};

export const trackLead = (params = {}) => {
  const payload = withPagePath(params);
  const fbqReady = hasFbq();
  logPixel('track:Lead:attempt', { fbqReady, params: payload });
  if (!fbqReady) return;
  window.fbq('track', 'Lead', payload);
  logPixel('track:Lead:sent', { params: payload });
};

export const trackCustom = (eventName, params = {}) => {
  const payload = withPagePath(params);
  const fbqReady = hasFbq();
  logPixel('trackCustom:attempt', {
    fbqReady,
    eventName,
    params: payload,
  });
  if (!fbqReady || !eventName) return;
  window.fbq('trackCustom', eventName, payload);
  logPixel('trackCustom:sent', { eventName, params: payload });
};
