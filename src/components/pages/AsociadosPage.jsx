import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseUrl } from '../../lib/supabaseClient';
import { loadProductData } from '../../utils/productParser';
import { extractTextureName } from '../../utils/extractTextureName';
import { extractSlabCode } from '../../utils/extractSlabCode';
import { resolveProductImageKey } from '../../utils/resolveProductImageKey';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAGIC_LINK_COOLDOWN_MS = 120 * 1000;
const MAGIC_LINK_COOLDOWN_KEY = 'asociados_magic_link_cooldown_until';
const DEV_ADMIN_KEY = 'dev_admin';
const DEV_ADMIN_EMAIL_KEY = 'dev_admin_email';
const DEV_ADMIN_DEFAULT_EMAIL = 'manuzeolite@gmail.com';
const DEV_ADMIN_PASSWORD = 'Nova1234';

const AsociadosPage = () => {
  const [email, setEmail] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authEmailRaw, setAuthEmailRaw] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [status, setStatus] = useState('idle');
  const [hasSession, setHasSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [stockStatus, setStockStatus] = useState('idle');
  const [stockError, setStockError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThickness, setSelectedThickness] = useState('all');
  const [activeReservation, setActiveReservation] = useState(null);
  const [reservationStatus, setReservationStatus] = useState('idle');
  const [reservationError, setReservationError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [emailWarning, setEmailWarning] = useState('');
  const [reloginNotice, setReloginNotice] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false);
  const [accessStatus, setAccessStatus] = useState('idle');
  const [accessError, setAccessError] = useState('');
  const [allowedAssociates, setAllowedAssociates] = useState([]);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminStatus, setAdminStatus] = useState('idle');
  const [adminError, setAdminError] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkCooldownUntil, setMagicLinkCooldownUntil] = useState(0);
  const [magicLinkRemaining, setMagicLinkRemaining] = useState(0);

  const rawStockItems = stockItems;
  const isDevMode = import.meta.env.DEV === true;
  const expectedProjectHost = 'xlyddqkksdafjhnsznlv.supabase.co';
  const isExpectedProject = useMemo(
    () => String(supabaseUrl || '').includes(expectedProjectHost),
    [expectedProjectHost]
  );
  const envMismatchMessage = isExpectedProject
    ? ''
    : 'Frontend esta apuntando a otro Supabase project (env incorrecta).';

  useEffect(() => {
    let isMounted = true;

    const syncSessionFromMagicLinkHash = async () => {
      const currentHash = window.location.hash || '';
      let tokenFragment = '';

      if (currentHash.startsWith('#access_token=')) {
        tokenFragment = currentHash.slice(1);
      } else {
        const nestedTokenIndex = currentHash.indexOf('#access_token=');
        if (nestedTokenIndex !== -1) {
          tokenFragment = currentHash.slice(nestedTokenIndex + 1);
        }
      }

      if (!tokenFragment) return;

      const params = new URLSearchParams(tokenFragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        window.history.replaceState({}, document.title, '/#asociados');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error('Magic link session sync failed', error);
      } else {
        await supabase.auth.getUser();
      }

      window.history.replaceState({}, document.title, '/#asociados');
    };

    const loadSession = async () => {
      await syncSessionFromMagicLinkHash();

      if (isDevMode && localStorage.getItem(DEV_ADMIN_KEY) === 'true') {
        const devEmail = normalizeEmail(localStorage.getItem(DEV_ADMIN_EMAIL_KEY) || DEV_ADMIN_DEFAULT_EMAIL);
        if (!isMounted) return;
        setIsDevAdmin(true);
        setAuthEmailRaw(devEmail);
        setAuthEmail(devEmail);
        setHasSession(true);
        setAuthReady(true);
        return;
      }
      setIsDevAdmin(false);
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        console.error(error);
      }
      const rawEmail = data?.user?.email || '';
      const currentEmail = normalizeEmail(rawEmail);
      setAuthEmailRaw(rawEmail);
      setAuthEmail(currentEmail);
      setHasSession(Boolean(currentEmail));
      setAuthReady(true);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadSession();
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [isDevMode]);

  const fetchAllowedAssociates = async () => {
    const { data, error } = await supabase
      .from('allowed_associates')
      .select('id, email, created_at')
      .order('email', { ascending: true });
    if (error) {
      console.error(error);
      setAdminError(error.message || 'No pudimos cargar los autorizados.');
      return;
    }
    setAllowedAssociates((data || []).map((item) => ({ ...item, email: normalizeEmail(item.email) })));
  };

  useEffect(() => {
    if (isDevAdmin) {
      setIsAdmin(true);
      setIsAllowed(true);
      setIsAuthorized(true);
      setAccessStatus('ready');
      setAccessError('');
      return;
    }
    if (!authReady) {
      setAccessStatus('loading');
      return;
    }
    if (!hasSession || !authEmail) {
      setIsAdmin(false);
      setIsAllowed(false);
      setIsAuthorized(false);
      setAccessStatus('idle');
      setAccessError('');
      setAllowedAssociates([]);
      return;
    }
    if (!isExpectedProject) {
      setIsAdmin(false);
      setIsAllowed(false);
      setIsAuthorized(false);
      setAccessStatus('error');
      setAccessError(envMismatchMessage);
      setAllowedAssociates([]);
      return;
    }

    let isMounted = true;

    const checkAccess = async () => {
      setAccessStatus('loading');
      setAccessError('');

      const [adminResult, allowedResult] = await Promise.all([
        supabase
          .from('admin_users')
          .select('email')
          .eq('email', authEmail)
          .maybeSingle(),
        supabase
          .from('allowed_associates')
          .select('id')
          .eq('email', authEmail)
          .maybeSingle()
      ]);

      if (!isMounted) return;

      if (adminResult.error) {
        console.error(adminResult.error);
        setAccessStatus('error');
        setAccessError(
          `Error consultando whitelist: ${adminResult.error.message || 'Error validando admin.'}`
        );
        return;
      }

      if (allowedResult.error) {
        console.error(allowedResult.error);
        setAccessStatus('error');
        setAccessError(
          `Error consultando whitelist: ${allowedResult.error.message || 'Error validando autorizacion.'}`
        );
        return;
      }

      const admin = Boolean(adminResult.data);
      const allowed = Boolean(allowedResult.data);
      setIsAdmin(admin);
      setIsAllowed(allowed);
      setIsAuthorized(admin || allowed);
      setAccessStatus('ready');

      if (admin) {
        await fetchAllowedAssociates();
      } else {
        setAllowedAssociates([]);
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [authReady, hasSession, authEmail, isExpectedProject, envMismatchMessage, isDevAdmin]);

  useEffect(() => {
    const reason = sessionStorage.getItem('asociados_relogin_reason') || '';
    const rememberedEmail = sessionStorage.getItem('asociados_relogin_email') || '';
    if (reason) {
      setReloginNotice(reason);
      sessionStorage.removeItem('asociados_relogin_reason');
    }
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      sessionStorage.removeItem('asociados_relogin_email');
    }
  }, []);

  useEffect(() => {
    const storedCooldown = Number(localStorage.getItem(MAGIC_LINK_COOLDOWN_KEY) || 0);
    if (!Number.isNaN(storedCooldown) && storedCooldown > Date.now()) {
      setMagicLinkCooldownUntil(storedCooldown);
    }
  }, []);

  useEffect(() => {
    if (!magicLinkCooldownUntil || magicLinkCooldownUntil <= Date.now()) {
      setMagicLinkRemaining(0);
      if (magicLinkCooldownUntil) {
        localStorage.removeItem(MAGIC_LINK_COOLDOWN_KEY);
        setMagicLinkCooldownUntil(0);
      }
      return;
    }

    const tick = () => {
      const remainingMs = Math.max(0, magicLinkCooldownUntil - Date.now());
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      setMagicLinkRemaining(remainingSeconds);
      if (remainingMs <= 0) {
        localStorage.removeItem(MAGIC_LINK_COOLDOWN_KEY);
        setMagicLinkCooldownUntil(0);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [magicLinkCooldownUntil]);

  useEffect(() => {
    loadProductData()
      .then((data) => setProducts(data))
      .catch(() => setProducts([]));
  }, []);

  const refetchInventory = useCallback(async () => {
    setStockStatus('loading');
    setStockError('');
    await supabase.rpc('expire_reservations');
    const { data, error } = await supabase
      .from('slabs_inventory')
      .select('id, model, thickness, stock, created_at')
      .order('model', { ascending: true });
    if (error) {
      console.error(error);
      setStockError(error.message || 'No pudimos cargar el stock.');
      setStockStatus('error');
      return;
    }
    setStockItems(data || []);
    setStockStatus('ready');
  }, []);

  const refreshSessionAndReservation = useCallback(async () => {
    const { data, error } = await supabase
      .from('slab_reservations')
      .select('id, model, thickness, product_code, expires_at, status')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error(error);
      return;
    }
    setActiveReservation(data || null);
  }, []);

  useEffect(() => {
    if (!hasSession || !isAuthorized || !isExpectedProject) return;
    refetchInventory();
  }, [hasSession, isAuthorized, isExpectedProject, refetchInventory]);

  useEffect(() => {
    if (!hasSession || !isAuthorized || !isExpectedProject) return;
    refreshSessionAndReservation();
  }, [hasSession, isAuthorized, isExpectedProject, refreshSessionAndReservation]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) {
      meta.setAttribute('content', 'noindex, nofollow');
      return;
    }
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex, nofollow';
    document.head.appendChild(tag);
  }, []);

  const requestMagicLink = async (targetEmail) => {
    if (!targetEmail) return;
    if (magicLinkLoading) return;
    if (magicLinkCooldownUntil > Date.now()) {
      setStatus('error');
      setErrorMessage(
        `Espera ${Math.ceil((magicLinkCooldownUntil - Date.now()) / 1000)}s antes de pedir otro enlace.`
      );
      return;
    }
    if (!isExpectedProject) {
      setErrorMessage(envMismatchMessage);
      setStatus('error');
      return;
    }
    setMagicLinkLoading(true);
    setStatus('loading');
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          emailRedirectTo: 'https://novastone.app/#asociados'
        }
      });
      if (error) {
        console.error(error);
        const rateLimitHit = String(error.message || '')
          .toUpperCase()
          .includes('EMAIL_RATE_LIMIT_EXCEEDED');
        if (rateLimitHit) {
          const until = Date.now() + MAGIC_LINK_COOLDOWN_MS;
          setMagicLinkCooldownUntil(until);
          localStorage.setItem(MAGIC_LINK_COOLDOWN_KEY, String(until));
          setErrorMessage(
            'Llegaste al limite de envios. Espera 120 segundos antes de reenviar el magic link.'
          );
        } else {
          setErrorMessage(error.message || 'Error desconocido');
        }
        setStatus('error');
        return;
      }
      const until = Date.now() + MAGIC_LINK_COOLDOWN_MS;
      setMagicLinkCooldownUntil(until);
      localStorage.setItem(MAGIC_LINK_COOLDOWN_KEY, String(until));
      setStatus('sent');
      setReloginNotice('');
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await requestMagicLink(email);
  };

  const handleLogout = async () => {
    if (isDevAdmin) {
      localStorage.removeItem(DEV_ADMIN_KEY);
      localStorage.removeItem(DEV_ADMIN_EMAIL_KEY);
      window.location.reload();
      return;
    }
    await supabase.auth.signOut();
    setAuthReady(false);
    setAuthEmailRaw('');
    setAuthEmail('');
    setHasSession(false);
    setStatus('idle');
    setAccessStatus('idle');
    setAccessError('');
    setIsAdmin(false);
    setIsAllowed(false);
    setIsAuthorized(false);
    setAllowedAssociates([]);
  };

  const handleDevAdminLogin = () => {
    if (!isDevMode) return;
    const password = window.prompt('Password DEV admin') || '';
    if (password !== DEV_ADMIN_PASSWORD) {
      setErrorMessage('Password incorrecta');
      setStatus('error');
      return;
    }
    localStorage.setItem(DEV_ADMIN_KEY, 'true');
    localStorage.setItem(DEV_ADMIN_EMAIL_KEY, DEV_ADMIN_DEFAULT_EMAIL);
    window.location.reload();
  };

  const missingImageLog = useMemo(() => new Set(), []);
  const NAME_OVERRIDES = {
    'ARTIC ICE WHITE': 'ARCTIC ICE WHITE'
  };

  const resolveThumbnail = (modelName) => {
    const stripParens = (value) => value.replace(/\([^)]*\)/g, ' ');
    const normalizeKey = (value) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    const baseFromModel = (value) => {
      const cleaned = stripParens(value).replace(/\s+/g, ' ').trim();
      const parts = cleaned.split(' ');
      const lastToken = parts[parts.length - 1] || '';
      const isCode = /^[a-z0-9]{6,}$/i.test(lastToken) && /\d/.test(lastToken);
      if (isCode) {
        return parts.slice(0, -1).join(' ').trim();
      }
      return cleaned;
    };

    const baseName = baseFromModel(modelName || '');
    const lookupName = NAME_OVERRIDES[baseName] ?? baseName;
    const targetKey = normalizeKey(lookupName);
    const match = products.find(
      (item) => normalizeKey(item.name || '') === targetKey
    );
    const resolved = match?.thumbnailImage || match?.detailImages?.[0];
    if (!resolved && !missingImageLog.has(modelName)) {
      missingImageLog.add(modelName);
      console.warn('IMAGE_MISS', { model: modelName, derivedBaseName: baseName });
    }
    return resolved || '/placeholder.jpg';
  };

  const resolvedStockItems = useMemo(
    () => {
      console.log('RECOMPUTE IMAGES');
      return (rawStockItems || []).map((item) => ({
        ...item,
        resolvedImage: resolveThumbnail(item.model)
      }));
    },
    [rawStockItems, products, missingImageLog]
  );

  const filteredStockItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const items = resolvedStockItems || [];
    const filterMatch = items.filter((item) => {
      const nameMatch = term
        ? String(item.model || '').toLowerCase().includes(term)
        : true;
      const thicknessValue = String(item.thickness || '').toLowerCase();
      const thicknessMatch =
        selectedThickness === 'all'
          ? true
          : thicknessValue.includes(selectedThickness);
      return nameMatch && thicknessMatch;
    });
    const is20 = (item) => String(item.thickness || '').toLowerCase().includes('20');
    const is12 = (item) => String(item.thickness || '').toLowerCase().includes('12');
    return [
      ...filterMatch.filter(is20),
      ...filterMatch.filter(is12),
      ...filterMatch.filter((item) => !is20(item) && !is12(item))
    ];
  }, [resolvedStockItems, searchTerm, selectedThickness]);

  const handleImgError = (event) => {
    const { currentTarget } = event;
    if (currentTarget.dataset.fallback === '1') return;
    if (currentTarget.src.endsWith('/placeholder.jpg')) {
      currentTarget.dataset.fallback = '1';
      return;
    }
    currentTarget.dataset.fallback = '1';
    currentTarget.src = '/placeholder.jpg';
  };

  const handleReserve = async (item) => {
    if (!isExpectedProject) {
      setReservationStatus('error');
      setReservationError(envMismatchMessage);
      return;
    }
    if (reservationStatus === 'loading') return;
    setReservationStatus('loading');
    setReservationError('');
    setEmailWarning('');
    const { data, error } = await supabase.rpc('reserve_inventory', {
      inventory_id: item.id
    });
    if (error) {
      console.error(error);
      setReservationError(error.message || 'No pudimos reservar.');
      setReservationStatus('error');
      return;
    }
    console.log('RPC RESPONSE', data);
    setReservationStatus('success');
    if (data) {
      setActiveReservation(data);
      setStockItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, stock: Math.max(0, (row.stock || 0) - 1) }
            : row
        )
      );
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const internalEmailSecret = import.meta.env.VITE_INTERNAL_EMAIL_SECRET;
      const payload = {
        email: session?.user?.email || authEmail,
        model: item.model,
        thickness: item.thickness,
        expires_at: data.expires_at,
        product_code: item.product_code || data?.product_code,
        reservation_id: data?.reservation_id || data?.id
      };
      console.log('EMAIL PAYLOAD', payload);
      console.log('ABOUT TO INVOKE', payload);
      console.log('SESSION DEBUG:', session);
      console.log('ACCESS TOKEN:', session?.access_token);
      if (!internalEmailSecret) {
        setEmailWarning('Falta VITE_INTERNAL_EMAIL_SECRET en el frontend.');
        return;
      }
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-reservation-email',
          {
            body: payload,
            headers: {
              'x-internal-secret': internalEmailSecret,
              apikey: anonKey,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('INVOKE RESULT:', { data: emailData, error: emailError });
        if (emailError) {
          throw emailError;
        }
      } catch (e) {
        console.error('INVOKE THROW', e);
        setEmailWarning(e?.message || String(e));
      }
    }
  };

  const handleCancelReservation = async () => {
    try {
      setCancelling(true);
      setReservationError('');

      const { data, error } = await supabase.rpc('cancel_my_reservations');
      if (error) throw error;

      await refreshSessionAndReservation();
      await refetchInventory();

      window.alert(`Reserva cancelada. Stock restockeado: ${data ?? 0}`);
    } catch (error) {
      console.error(error);
      window.alert(`No se pudo cancelar la reserva: ${error?.message ?? error}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleSendTestEmail = async () => {
    setEmailWarning('');
    if (!isExpectedProject) {
      setEmailWarning(envMismatchMessage);
      return;
    }
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const functionsBaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const internalEmailSecret = import.meta.env.VITE_INTERNAL_EMAIL_SECRET;
    if (!anon || !functionsBaseUrl) {
      setEmailWarning('Faltan variables de entorno de Supabase para test mail.');
      return;
    }
    if (!internalEmailSecret) {
      setEmailWarning('Falta VITE_INTERNAL_EMAIL_SECRET en el frontend.');
      return;
    }
    console.log('TEST SECRET CHECK', {
      hasSecret: Boolean(import.meta.env.VITE_TEST_SECRET)
    });

    const defaultInventoryId = (stockItems || []).find((row) => (row.stock || 0) > 0)?.id || '';
    const to = window.prompt('Email destino', authEmail || '')?.trim();
    if (!to) {
      setEmailWarning('Envio cancelado: falta email destino.');
      return;
    }
    const selectedInventoryId =
      window.prompt('inventory_id (opcional)', defaultInventoryId || '')?.trim() || '';
    const selectedItem =
      (stockItems || []).find((row) => String(row.id) === String(selectedInventoryId)) || null;

    const payloadTest = {
      type: 'test',
      to,
      inventory_id: selectedInventoryId || null,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reservation_id: `TEST-${Date.now()}`,
      model: selectedItem?.model || 'TEST',
      thickness: selectedItem?.thickness || '',
      product_code: selectedItem?.product_code || '',
      test_secret: import.meta.env.VITE_TEST_SECRET
    };
    if (!payloadTest.test_secret) {
      setEmailWarning('Falta VITE_TEST_SECRET en el frontend.');
      return;
    }
    console.log('TEST EMAIL PAYLOAD', {
      ...payloadTest,
      test_secret: payloadTest.test_secret ? '***' : ''
    });

    try {
      const res = await fetch(`${functionsBaseUrl}/functions/v1/send-reservation-email`, {
        method: 'POST',
        headers: {
          'x-internal-secret': internalEmailSecret,
          apikey: anon,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadTest)
      });
      if (!res.ok) {
        const bodyText = await res.text();
        console.error('TEST EMAIL ERROR', res.status, bodyText);
        setEmailWarning(`Error al enviar: status ${res.status} body ${bodyText}`);
        return;
      }
      const data = await res.json();
      setEmailWarning(`Email enviado: ${JSON.stringify(data)}`);
    } catch (error) {
      console.error('TEST EMAIL THROW', error);
      setEmailWarning(`Error al enviar: ${error?.message || String(error)}`);
    }
  };

  const handleAddAllowedEmail = async () => {
    if (!isAdmin) return;
    const normalized = normalizeEmail(adminEmailInput);
    if (!emailRegex.test(normalized)) {
      setAdminError('Email invalido.');
      return;
    }

    setAdminStatus('loading');
    setAdminError('');
    const { error } = await supabase
      .from('allowed_associates')
      .insert({ email: normalized });
    if (error) {
      console.error(error);
      setAdminStatus('error');
      setAdminError(error.message || 'No pudimos agregar el email.');
      return;
    }

    setAdminEmailInput('');
    setAdminStatus('success');
    await fetchAllowedAssociates();
    if (normalized === authEmail) {
      setIsAuthorized(true);
    }
  };

  const handleDeleteAllowedEmail = async (id) => {
    if (!isAdmin) return;
    setAdminStatus('loading');
    setAdminError('');
    const { error } = await supabase
      .from('allowed_associates')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(error);
      setAdminStatus('error');
      setAdminError(error.message || 'No pudimos eliminar el email.');
      return;
    }
    setAdminStatus('success');
    await fetchAllowedAssociates();
  };

  useEffect(() => {
    const ids = new Set();
    const duplicates = new Set();
    stockItems.forEach((item) => {
      if (ids.has(item.id)) {
        duplicates.add(item.id);
      }
      ids.add(item.id);
    });
    if (duplicates.size > 0) {
      console.warn('Duplicate inventory ids detected', Array.from(duplicates));
    }
  }, [stockItems]);

  const renderStockRow = (item) => (
    (() => {
      const displayName = extractTextureName(item.model);
      const code = extractSlabCode(item.model);

      return (
        <article key={item.id} className="asociados-stock-row">
          <div className="asociados-stock-thumb">
            <img
              src={`/products_flat/${resolveProductImageKey(item.model)}.jpg`}
              data-try="0"
              loading="lazy"
              decoding="async"
              alt={extractTextureName(item.model)}
              onError={(e) => {
                const key = resolveProductImageKey(item.model);
                const attempts = [
                  `/products_flat/${key}.jpg`,
                  `/products_flat/${key}.png`,
                  `/products_flat/${key}.webp`,
                  '/placeholder.jpg'
                ];

                const raw = e.currentTarget.getAttribute('data-try');
                const prev = Number.isFinite(Number(raw)) ? Number(raw) : 0;
                const nextIndex = Math.min(prev + 1, attempts.length - 1);
                e.currentTarget.setAttribute('data-try', String(nextIndex));
                e.currentTarget.src = attempts[nextIndex];
              }}
            />
          </div>
          <div className="asociados-stock-info">
            <div style={{ fontWeight: 600 }}>{displayName}</div>
            {code && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {code}
              </div>
            )}
        <div className="asociados-stock-tags">
          <span>{item.thickness}</span>
        </div>
          </div>
          <div className="asociados-stock-actions">
            <span>Disponible: {item.stock ?? '-'}</span>
            <button
              type="button"
              className="asociados-button"
              disabled={item.reserveDisabled}
              onClick={() => handleReserve(item)}
            >
              Reservar 24h
            </button>
          </div>
        </article>
      );
    })()
  );

  return (
    <section className="asociados-page">
      {!authReady ? (
        <div className="asociados-login">
          <div className="asociados-login-card">
            <h1>Cargando</h1>
            <p>Estamos validando tu sesion.</p>
          </div>
        </div>
      ) : !hasSession ? (
        <div className="asociados-login">
          <div className="asociados-login-card">
            <h1>Portal de Marmolerias Asociadas</h1>
            <p>Ingresa tu email para acceder al stock disponible</p>
            {envMismatchMessage && <p className="asociados-login-note">{envMismatchMessage}</p>}
            {reloginNotice && <p className="asociados-login-note">{reloginNotice}</p>}
            <form onSubmit={handleSubmit} className="asociados-login-form">
              <label htmlFor="asociados-email">
                Email
                <input
                  id="asociados-email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <button
                type="submit"
                className="asociados-button"
                disabled={
                  status === 'loading' ||
                  magicLinkLoading ||
                  magicLinkRemaining > 0 ||
                  !isExpectedProject
                }
              >
                {status === 'loading' || magicLinkLoading
                  ? 'Enviando...'
                  : magicLinkRemaining > 0
                    ? `Reintentar en ${magicLinkRemaining}s`
                    : 'Continuar'}
              </button>
              {reloginNotice && (
                <button
                  type="button"
                  className="asociados-button"
                  onClick={() => requestMagicLink(email)}
                  disabled={
                    status === 'loading' ||
                    magicLinkLoading ||
                    magicLinkRemaining > 0 ||
                    !email
                  }
                >
                  Volver a iniciar sesion
                </button>
              )}
              {isDevMode && (
                <button
                  type="button"
                  className="asociados-button"
                  onClick={handleDevAdminLogin}
                >
                  Entrar como admin (DEV)
                </button>
              )}
              {status === 'sent' && (
                <p className="asociados-login-note">
                  Revisá tu email para ingresar con el enlace magico.
                </p>
              )}
              {status === 'error' && (
                <p className="asociados-login-note">
                  {errorMessage || 'No pudimos enviar el enlace.'}
                </p>
              )}
            </form>
          </div>
        </div>
      ) : accessStatus === 'loading' ? (
        <div className="asociados-login">
          <div className="asociados-login-card">
            <h1>Verificando acceso</h1>
            <p>Estamos validando permisos para tu email.</p>
          </div>
        </div>
      ) : accessStatus === 'error' ? (
        <div className="asociados-login">
          <div className="asociados-login-card">
            <h1>Error de acceso</h1>
            <p>{accessError || 'No pudimos validar tu acceso en este momento.'}</p>
            <button type="button" className="asociados-button" onClick={handleLogout}>
              {isDevAdmin ? 'Salir (DEV)' : 'Cerrar sesion'}
            </button>
          </div>
        </div>
      ) : !isAuthorized ? (
        <div className="asociados-login">
          <div className="asociados-login-card">
            <h1>Acceso no autorizado</h1>
            <p>Este email no esta habilitado para ingresar.</p>
            {authEmail === 'manuzeolite@gmail.com' && (
              <p className="asociados-login-note">
                DEBUG raw: {authEmailRaw || '-'} | normalized: {authEmail || '-'} | isAdmin:{' '}
                {String(isAdmin)} | isAllowed: {String(isAllowed)} | error: {accessError || '-'}
              </p>
            )}
            <button type="button" className="asociados-button" onClick={handleLogout}>
              Cerrar sesion
            </button>
          </div>
        </div>
      ) : (
        <div className="asociados-stock">
          <div className="asociados-stock-header">
            <div className="asociados-stock-header-row">
              <div>
                <h1>Stock disponible</h1>
                <p>Listado actualizado para marmolerias asociadas.</p>
                {activeReservation && (
                  <div className="asociados-login-note">
                    <p>
                      Tu reserva activa: {activeReservation.model} hasta{' '}
                      {activeReservation.expires_at
                        ? new Date(activeReservation.expires_at).toLocaleString('es-AR')
                        : '-'}
                    </p>
                    <button
                      type="button"
                      className="asociados-button"
                      onClick={handleCancelReservation}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Cancelando...' : 'Cancelar reserva'}
                    </button>
                  </div>
                )}
                {reservationStatus === 'error' && (
                  <p className="asociados-login-note">{reservationError}</p>
                )}
                {emailWarning && (
                  <p className="asociados-login-note">{emailWarning}</p>
                )}
                {envMismatchMessage && (
                  <p className="asociados-login-note">{envMismatchMessage}</p>
                )}
                {authEmail === 'manuzeolite@gmail.com' && (
                  <p className="asociados-login-note">
                    DEBUG raw: {authEmailRaw || '-'} | normalized: {authEmail || '-'} | isAdmin:{' '}
                    {String(isAdmin)} | isAllowed: {String(isAllowed)} | error: {accessError || '-'}
                  </p>
                )}
              </div>
              <button type="button" className="asociados-button" onClick={handleLogout}>
                {isDevAdmin ? 'Salir (DEV)' : 'Cerrar sesion'}
              </button>
            </div>
            {isAuthorized && (
              <button
                type="button"
                className="asociados-button asociados-test-button"
                onClick={handleSendTestEmail}
                disabled={!isExpectedProject}
              >
                Enviar mail de prueba
              </button>
            )}
            {isAdmin && (
              <div className="asociados-admin-panel">
                <h2>Autorizar emails</h2>
                <div className="asociados-admin-form">
                  <input
                    type="email"
                    placeholder="email@cliente.com"
                    value={adminEmailInput}
                    onChange={(event) => setAdminEmailInput(event.target.value)}
                  />
                  <button
                    type="button"
                    className="asociados-button"
                    onClick={handleAddAllowedEmail}
                    disabled={adminStatus === 'loading'}
                  >
                    Agregar
                  </button>
                </div>
                {adminError && <p className="asociados-login-note">{adminError}</p>}
                <div className="asociados-admin-list">
                  {allowedAssociates.map((associate) => (
                    <div key={associate.id} className="asociados-admin-item">
                      <span>{associate.email}</span>
                      <button
                        type="button"
                        className="asociados-button"
                        onClick={() => handleDeleteAllowedEmail(associate.id)}
                        disabled={adminStatus === 'loading'}
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="asociados-stock-filters">
            <div className="asociados-search">
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Buscar superficie..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="asociados-filter-group">
              {[
                { label: 'Todos', value: 'all' },
                { label: '20mm', value: '20' },
                { label: '12mm', value: '12' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`asociados-filter-chip ${selectedThickness === option.value ? 'is-active' : ''}`}
                  onClick={() => setSelectedThickness(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="asociados-stock-list">
            {stockStatus === 'error' && (
              <p className="asociados-login-note">{stockError}</p>
            )}
            {stockStatus === 'ready' && filteredStockItems.length === 0 && (
              <p className="asociados-login-note">No se encontraron superficies.</p>
            )}
            {filteredStockItems.map((item) =>
              renderStockRow({
                ...item,
                reserveDisabled:
                  !isExpectedProject ||
                  reservationStatus === 'loading' ||
                  (item.stock || 0) <= 0 ||
                  Boolean(activeReservation)
              })
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default AsociadosPage;
