import React, { useEffect, useMemo, useState } from 'react';

const fallbackPool = [
  '/hero/home_1.png',
  '/hero/Home_2.png',
  '/hero/Home_3.png',
  '/hero/Home_4.png',
];

const slugifyMoodboardKey = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const imageExists = async (src) => {
  try {
    const response = await fetch(src, { method: 'GET', cache: 'no-store' });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return contentType.toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
};

const firstExisting = async (candidates = []) => {
  for (const src of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await imageExists(src);
    if (ok) return src;
  }
  return null;
};

const loadImageMeta = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || 0;
      const height = img.naturalHeight || 0;
      if (width <= 0 || height <= 0) {
        resolve(null);
        return;
      }
      resolve({
        src,
        width,
        height,
        ratio: width / height,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

const classifyRatio = (ratio) => {
  if (ratio < 0.9) return 'portrait';
  if (ratio > 1.15) return 'landscape';
  return 'square';
};

const resolveFinishLabel = (product) => {
  if (!product) return '';

  if (Array.isArray(product.surfaceFinishes) && product.surfaceFinishes.length > 0) {
    return product.surfaceFinishes.join(' / ');
  }

  const finishText = String(product.finish || '').trim();
  if (!finishText) return '';

  const patterns = [
    { label: 'VETA PASANTE', regex: /veta\s+pasante/i },
    { label: 'ACABADO NATURAL', regex: /acabado\s+natural/i },
    { label: 'NATURAL', regex: /\bnatural\b/i },
    { label: 'SATIN', regex: /\bsatin(?:ado)?\b/i },
    { label: 'PULIDO', regex: /\bpulido\b/i },
    { label: 'MATE', regex: /\bmate\b/i },
  ];

  const matches = patterns
    .filter((item) => item.regex.test(finishText))
    .map((item) => item.label);

  if (matches.length > 0) {
    return [...new Set(matches)].join(' / ');
  }

  // Hard cap as last fallback so long paragraphs never appear in the hero.
  return finishText.split(/[.!?]/)[0].split(/\s+/).slice(0, 4).join(' ');
};

const LAYOUT_CONFIGS = {
  balanced_mix: [
    { slot: 'a', targetRatio: 1.75 },
    { slot: 'b', targetRatio: 1.2 },
    { slot: 'c', targetRatio: 1.0 },
    { slot: 'd', targetRatio: 1.0 },
    { slot: 'e', targetRatio: 1.35 },
  ],
  vertical_bias: [
    { slot: 'a', targetRatio: 0.78 },
    { slot: 'b', targetRatio: 0.84 },
    { slot: 'c', targetRatio: 0.92 },
    { slot: 'd', targetRatio: 1.25 },
    { slot: 'e', targetRatio: 1.35 },
  ],
  landscape_bias: [
    { slot: 'a', targetRatio: 2.0 },
    { slot: 'b', targetRatio: 1.8 },
    { slot: 'c', targetRatio: 1.45 },
    { slot: 'd', targetRatio: 1.2 },
    { slot: 'e', targetRatio: 1.7 },
  ],
  square_bias: [
    { slot: 'a', targetRatio: 1.0 },
    { slot: 'b', targetRatio: 1.0 },
    { slot: 'c', targetRatio: 1.0 },
    { slot: 'd', targetRatio: 1.0 },
    { slot: 'e', targetRatio: 1.15 },
  ],
};
const SLOT_COUNT = 5;

const fitScore = (ratio, targetRatio) => Math.abs(Math.log(ratio / targetRatio));

const chooseLayoutKey = (items = []) => {
  const counters = items.reduce(
    (acc, item) => {
      const kind = classifyRatio(item.ratio);
      acc[kind] += 1;
      return acc;
    },
    { portrait: 0, landscape: 0, square: 0 }
  );

  if (
    counters.portrait >= 3 &&
    counters.portrait > counters.landscape &&
    counters.portrait > counters.square
  ) {
    return 'vertical_bias';
  }

  if (
    counters.landscape >= 3 &&
    counters.landscape > counters.portrait &&
    counters.landscape > counters.square
  ) {
    return 'landscape_bias';
  }

  if (
    counters.square >= 3 &&
    counters.square >= counters.portrait &&
    counters.square >= counters.landscape
  ) {
    return 'square_bias';
  }

  return 'balanced_mix';
};

const buildMoodboardImages = (product) => {
  if (!product) return [];

  const inspiration = Array.isArray(product.inspirationImages)
    ? product.inspirationImages.filter(Boolean)
    : [];

  if (inspiration.length > 0) {
    return inspiration.slice(0, 12);
  }

  const sources = [product.thumbnailImage, ...(product.detailImages || [])]
    .filter(Boolean)
    .concat(fallbackPool);

  const output = [];
  for (let i = 0; i < 12; i += 1) {
    output.push(sources[i % sources.length]);
  }

  return output;
};

const resolveMoodboardAssets = async (product) => {
  const key = slugifyMoodboardKey(product?.name || '');
  if (!key) return null;

  const base = `/moodboard/${key}`;
  const exts = ['jpg', 'jpeg', 'png', 'webp'];

  const moodboardImages = [];
  for (let i = 1; i <= 6; i += 1) {
    const candidates = exts.map((ext) => `${base}/${key}_moodboard_${i}.${ext}`);
    // eslint-disable-next-line no-await-in-loop
    const found = await firstExisting(candidates);
    if (found) moodboardImages.push(found);
  }

  if (moodboardImages.length === 0) return null;
  return { moodboardImages };
};

const TextureMoodboardPanel = ({ product }) => {
  const fallbackImages = useMemo(() => buildMoodboardImages(product), [product]);
  const [resolvedAssets, setResolvedAssets] = useState(null);
  const [layoutImages, setLayoutImages] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [activeSlot, setActiveSlot] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let active = true;
    setResolvedAssets(null);
    setHoveredSlot(null);

    if (!product?.name) return undefined;

    resolveMoodboardAssets(product).then((assets) => {
      if (!active) return;
      setResolvedAssets(assets);
    });

    return () => {
      active = false;
    };
  }, [product?.id, product?.name]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const syncMobile = () => setIsMobile(media.matches);
    syncMobile();
    media.addEventListener('change', syncMobile);
    return () => media.removeEventListener('change', syncMobile);
  }, []);

  const resolvedMoodboardImages = resolvedAssets?.moodboardImages || [];
  const hasResolvedMoodboard = resolvedMoodboardImages.length > 0;

  useEffect(() => {
    let active = true;
    setLayoutImages(null);

    const buildLayout = async () => {
      const realSources = hasResolvedMoodboard
        ? resolvedMoodboardImages.filter(Boolean)
        : [];
      const fallbackSources = (fallbackImages.length > 0 ? fallbackImages : fallbackPool).filter(
        Boolean
      );

      const uniqueReal = [...new Set(realSources)];
      const uniqueFallback = [...new Set(fallbackSources)];
      const realLoaded = (
        await Promise.all(uniqueReal.map((src) => loadImageMeta(src)))
      ).filter(Boolean);
      const fallbackLoaded = (
        await Promise.all(uniqueFallback.map((src) => loadImageMeta(src)))
      ).filter(Boolean);

      const primaryPool = realLoaded.length > 0 ? realLoaded : fallbackLoaded;
      if (!active || primaryPool.length === 0) return;

      const remaining = [...primaryPool];

      if (remaining.length < SLOT_COUNT) {
        fallbackLoaded.forEach((item) => {
          if (remaining.length >= SLOT_COUNT) return;
          if (!remaining.some((entry) => entry.src === item.src)) {
            remaining.push(item);
          }
        });
      }

      const layoutKey = chooseLayoutKey(remaining);
      const slotConfig = LAYOUT_CONFIGS[layoutKey] || LAYOUT_CONFIGS.balanced_mix;

      const assigned = slotConfig.map((slot) => {
        if (remaining.length === 0) return null;
        let bestIndex = 0;
        let bestScore = Number.POSITIVE_INFINITY;

        remaining.forEach((item, index) => {
          const score = fitScore(item.ratio, slot.targetRatio);
          if (score < bestScore) {
            bestScore = score;
            bestIndex = index;
          }
        });

        const [picked] = remaining.splice(bestIndex, 1);
        return {
          slot: slot.slot,
          ...picked,
          ratioClass: classifyRatio(picked.ratio),
        };
      }).filter(Boolean);

      setLayoutImages({
        layoutKey,
        slots: assigned,
      });
    };

    buildLayout();

    return () => {
      active = false;
    };
  }, [hasResolvedMoodboard, resolvedMoodboardImages, fallbackImages]);

  const heroImage =
    product?.thumbnailImage ||
    product?.detailImages?.[0] ||
    fallbackImages[0] ||
    '/placeholder.jpg';
  const finishLabel = useMemo(() => resolveFinishLabel(product), [product]);
  const slotImages = layoutImages?.slots || [];
  const layoutKey = layoutImages?.layoutKey || 'balanced_mix';
  const effectiveSlot = isMobile ? activeSlot : hoveredSlot;

  useEffect(() => {
    if (slotImages.length === 0) {
      setActiveSlot(null);
      return;
    }

    setActiveSlot((current) =>
      current && slotImages.some((item) => item.slot === current)
        ? current
        : slotImages[0].slot
    );
  }, [slotImages]);

  const mosaicTrackStyle = useMemo(() => {
    if (isMobile) {
      const baseCols = [1, 1];
      const baseRows = [1, 1, 1];
      const slotCoverageMobile = {
        a: { cols: [0], rows: [0] },
        b: { cols: [1], rows: [0] },
        c: { cols: [0], rows: [1] },
        d: { cols: [1], rows: [1] },
        e: { cols: [0, 1], rows: [2] },
      };

      if (!effectiveSlot) {
        return {
          '--mc1': `${baseCols[0]}fr`,
          '--mc2': `${baseCols[1]}fr`,
          '--mr1': `${baseRows[0]}fr`,
          '--mr2': `${baseRows[1]}fr`,
          '--mr3': `${baseRows[2]}fr`,
        };
      }

      const coverage = slotCoverageMobile[effectiveSlot];
      if (!coverage) {
        return {
          '--mc1': `${baseCols[0]}fr`,
          '--mc2': `${baseCols[1]}fr`,
          '--mr1': `${baseRows[0]}fr`,
          '--mr2': `${baseRows[1]}fr`,
          '--mr3': `${baseRows[2]}fr`,
        };
      }

      const cols = baseCols.map((value, idx) =>
        coverage.cols.includes(idx) ? value + 0.32 : Math.max(0.66, value - 0.16)
      );
      const rows = baseRows.map((value, idx) =>
        coverage.rows.includes(idx) ? value + 0.32 : Math.max(0.66, value - 0.16)
      );

      return {
        '--mc1': `${cols[0]}fr`,
        '--mc2': `${cols[1]}fr`,
        '--mr1': `${rows[0]}fr`,
        '--mr2': `${rows[1]}fr`,
        '--mr3': `${rows[2]}fr`,
      };
    }

    const baseCols = [1, 1, 1, 1];
    const baseRows = [1, 0.74];
    if (!effectiveSlot) {
      return {
        '--c1': `${baseCols[0]}fr`,
        '--c2': `${baseCols[1]}fr`,
        '--c3': `${baseCols[2]}fr`,
        '--c4': `${baseCols[3]}fr`,
        '--r1': `${baseRows[0]}fr`,
        '--r2': `${baseRows[1]}fr`,
      };
    }

    const slotCoverageByLayout = {
      balanced_mix: {
        a: { cols: [0, 1], rows: [0] },
        b: { cols: [2], rows: [0] },
        c: { cols: [3], rows: [0] },
        d: { cols: [0, 1], rows: [1] },
        e: { cols: [2, 3], rows: [1] },
      },
      vertical_bias: {
        a: { cols: [0], rows: [0, 1] },
        b: { cols: [1], rows: [0, 1] },
        c: { cols: [2], rows: [0, 1] },
        d: { cols: [3], rows: [0] },
        e: { cols: [3], rows: [1] },
      },
      landscape_bias: {
        a: { cols: [0, 1], rows: [0] },
        b: { cols: [2, 3], rows: [0] },
        c: { cols: [0], rows: [1] },
        d: { cols: [1], rows: [1] },
        e: { cols: [2, 3], rows: [1] },
      },
      square_bias: {
        a: { cols: [0], rows: [0, 1] },
        b: { cols: [1], rows: [0, 1] },
        c: { cols: [2], rows: [0] },
        d: { cols: [3], rows: [0] },
        e: { cols: [2, 3], rows: [1] },
      },
    };

    const layoutCoverage =
      slotCoverageByLayout[layoutKey] || slotCoverageByLayout.balanced_mix;
    const coverage = layoutCoverage[effectiveSlot];
    if (!coverage) {
      return {
        '--c1': `${baseCols[0]}fr`,
        '--c2': `${baseCols[1]}fr`,
        '--c3': `${baseCols[2]}fr`,
        '--c4': `${baseCols[3]}fr`,
        '--r1': `${baseRows[0]}fr`,
        '--r2': `${baseRows[1]}fr`,
      };
    }

    const cols = baseCols.map((value, idx) =>
      coverage.cols.includes(idx) ? value + 0.45 : Math.max(0.62, value - 0.22)
    );
    const rows = baseRows.map((value, idx) =>
      coverage.rows.includes(idx) ? value + 0.28 : Math.max(0.5, value - 0.18)
    );

    return {
      '--c1': `${cols[0]}fr`,
      '--c2': `${cols[1]}fr`,
      '--c3': `${cols[2]}fr`,
      '--c4': `${cols[3]}fr`,
      '--r1': `${rows[0]}fr`,
      '--r2': `${rows[1]}fr`,
    };
  }, [effectiveSlot, isMobile, layoutKey]);

  if (!product) {
    return (
      <div className="texture-moodboard-empty">
        Seleccioná una textura para visualizar su moodboard.
      </div>
    );
  }

  return (
    <section className="texture-moodboard-panel" aria-live="polite">
      <div className={`texture-moodboard-stage layout-${layoutKey}`}>
        <article className="texture-moodboard-feature">
          <img
            src={heroImage}
            alt={`${product.name} textura principal`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = '/placeholder.jpg';
            }}
          />
          <div className="texture-moodboard-overlay">
            <p className="texture-moodboard-label">Textura activa</p>
            <h2>{product.name}</h2>
            {finishLabel ? <span>{finishLabel}</span> : null}
          </div>
        </article>

        <div className="texture-moodboard-divider" aria-hidden="true">
          <span>Moodboard Inspiración</span>
        </div>

        <div
          className={`texture-moodboard-mosaic layout-${layoutKey} ${effectiveSlot ? 'is-hovering' : ''}`}
          style={mosaicTrackStyle}
        >
          {slotImages.map((item, index) => (
            <article
              key={`${product.id}-${item.src}-${index + 1}`}
              className={`texture-moodboard-card slot-${item.slot} ratio-${item.ratioClass}`}
              onMouseEnter={() => setHoveredSlot(item.slot)}
              onMouseLeave={() => setHoveredSlot(null)}
              onClick={() => {
                if (isMobile) setActiveSlot(item.slot);
              }}
            >
              <img
                src={item.src}
                alt={`${product.name} inspiración ${index + 1}`}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = '/placeholder.jpg';
                }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TextureMoodboardPanel;
