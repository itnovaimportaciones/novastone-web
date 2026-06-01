const hasGtag = () =>
  typeof window !== 'undefined' && typeof window.gtag === 'function';

const logGA = (label, payload = {}) => {
  if (typeof window === 'undefined') return;
  // Temporary debug to verify runtime firing in production.
  // Remove once events are validated in GA4 DebugView.
  console.log(`[GA4] ${label}`, payload);
};

const withPagePath = (params = {}) => {
  if (typeof window === 'undefined') return params;
  return {
    page_path: window.location.pathname + window.location.search,
    page_location: window.location.href,
    ...params,
  };
};

const _contactLastFired = {};

const _hasEventFiredInSession = (key) => {
  if (typeof window === 'undefined') return false;
  if (sessionStorage.getItem(key)) return true;
  sessionStorage.setItem(key, '1');
  return false;
};

export const trackPageView = () => {
  const gtagReady = hasGtag();
  const payload = withPagePath({ page_title: typeof document !== 'undefined' ? document.title : undefined });
  logGA('track:PageView:attempt', { gtagReady, params: payload });
  if (!gtagReady) return;
  window.gtag('event', 'page_view', payload);
  logGA('track:PageView:sent', { params: payload });
};

export const trackContact = (params = {}, { deduplicateBySession = false } = {}) => {
  const src = params.trigger_source || 'unknown';

  const now = Date.now();
  if (_contactLastFired[src] && now - _contactLastFired[src] < 1000) {
    logGA('track:Contact:skipped:debounce', { trigger_source: src });
    return;
  }
  _contactLastFired[src] = now;

  if (deduplicateBySession && _hasEventFiredInSession(`ga4_contact_${src}`)) {
    logGA('track:Contact:skipped:session-duplicate', { trigger_source: src });
    return;
  }

  const payload = withPagePath(params);
  const gtagReady = hasGtag();
  logGA('track:Contact:attempt', { gtagReady, params: payload });
  if (!gtagReady) return;
  window.gtag('event', 'Contact', payload);
  logGA('track:Contact:sent', { params: payload });
};

export const trackViewContent = (params = {}, { sessionDedupKey } = {}) => {
  if (sessionDedupKey && _hasEventFiredInSession(`ga4_${sessionDedupKey}`)) {
    logGA('track:ViewContent:skipped:session-duplicate', { sessionDedupKey });
    return;
  }
  const payload = withPagePath(params);
  const gtagReady = hasGtag();
  logGA('track:ViewContent:attempt', { gtagReady, params: payload });
  if (!gtagReady) return;
  window.gtag('event', 'ViewContent', payload);
  logGA('track:ViewContent:sent', { params: payload });
};

export const trackLead = (params = {}) => {
  const payload = withPagePath(params);
  const gtagReady = hasGtag();
  logGA('track:Lead:attempt', { gtagReady, params: payload });
  if (!gtagReady) return;
  window.gtag('event', 'Lead', payload);
  logGA('track:Lead:sent', { params: payload });
};

export const trackCustom = (eventName, params = {}, { sessionDedupKey } = {}) => {
  if (sessionDedupKey && _hasEventFiredInSession(`ga4_${sessionDedupKey}`)) {
    logGA(`trackCustom:${eventName}:skipped:session-duplicate`, { sessionDedupKey });
    return;
  }
  const payload = withPagePath(params);
  const gtagReady = hasGtag();
  logGA('trackCustom:attempt', {
    gtagReady,
    eventName,
    params: payload,
  });
  if (!gtagReady || !eventName) return;
  window.gtag('event', eventName, payload);
  logGA('trackCustom:sent', { eventName, params: payload });
};
