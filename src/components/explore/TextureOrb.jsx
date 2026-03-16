import React, { useEffect, useMemo, useRef, useState } from 'react';

const getPreviewImage = (product) =>
  product.thumbnailImage || product.detailImages?.[0] || '/placeholder.jpg';

const SIZE_PATTERN = [1.28, 1.14, 1.02, 0.92, 0.84];

const canPlaceNode = (x, y, r, placed, maxRadius, gap) => {
  const centerDistance = Math.hypot(x, y);
  if (centerDistance > maxRadius - r) return false;

  for (const node of placed) {
    const dx = x - node.x;
    const dy = y - node.y;
    const minDistance = node.r + r + gap;
    if (Math.hypot(dx, dy) < minDistance) {
      return false;
    }
  }

  return true;
};

const buildPackedLayout = (products, width, height) => {
  const minSide = Math.min(width, height);
  const maxRadius = minSide * 0.47;
  const baseSize = Math.max(78, Math.min(112, minSide * 0.165));
  const minSize = Math.max(56, baseSize * 0.72);
  const maxSize = Math.max(88, baseSize * 1.28);
  const gap = 2.4;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const packed = [];

  products.forEach((product, index) => {
    const size = Math.max(
      minSize,
      Math.min(maxSize, baseSize * SIZE_PATTERN[index % SIZE_PATTERN.length])
    );
    const initialRadius = size / 2;
    const targetRadius =
      products.length > 1
        ? (maxRadius - initialRadius) * Math.pow(index / (products.length - 1), 0.88)
        : 0;

    let radius = initialRadius;
    let placedNode = null;

    for (let shrink = 0; shrink < 4 && !placedNode; shrink += 1) {
      const maxReach = Math.max(0, maxRadius - radius);

      for (let ring = 0; ring < 70 && !placedNode; ring += 1) {
        const ringDelta = ring * 2.1;
        const radialCandidates = [
          targetRadius + ringDelta,
          targetRadius - ringDelta,
        ];

        for (const radialCandidate of radialCandidates) {
          const radial = Math.max(0, Math.min(maxReach, radialCandidate));

          for (let spin = 0; spin < 20; spin += 1) {
            const theta = angleWrap(index * goldenAngle + spin * 0.34 + ring * 0.09);
            const x = Math.cos(theta) * radial;
            const y = Math.sin(theta) * radial;

            if (canPlaceNode(x, y, radius, packed, maxRadius, gap)) {
              placedNode = {
                id: product.id,
                x,
                y,
                size: radius * 2,
                r: radius,
              };
              break;
            }
          }

          if (placedNode) break;
        }
      }

      if (!placedNode) {
        radius *= 0.93;
      }
    }

    if (placedNode) {
      packed.push(placedNode);
    }
  });

  return packed;
};

function angleWrap(value) {
  let angle = value;
  const tau = Math.PI * 2;
  while (angle > tau) angle -= tau;
  while (angle < 0) angle += tau;
  return angle;
}

const pickVisibleProducts = (products, selectedProductId, limit) => {
  if (products.length <= limit) return products;

  const visible = products.slice(0, limit);
  if (!selectedProductId) return visible;

  const selected = products.find((item) => item.id === selectedProductId);
  if (!selected) return visible;

  if (visible.some((item) => item.id === selectedProductId)) return visible;

  return [...visible.slice(0, Math.max(0, limit - 1)), selected];
};

const TextureOrb = ({ products, selectedProductId, onSelect }) => {
  const orbRef = useRef(null);
  const [cursorPoint, setCursorPoint] = useState(null);
  const [isInteractiveDesktop, setIsInteractiveDesktop] = useState(false);
  const [orbSize, setOrbSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)');
    const sync = () => setIsInteractiveDesktop(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!orbRef.current || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect?.width || 0;
      const height = entry.contentRect?.height || 0;
      setOrbSize({ width, height });
    });
    observer.observe(orbRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleLimit = orbSize.width < 640 ? 10 : orbSize.width < 900 ? 12 : 14;

  const visibleProducts = useMemo(
    () => pickVisibleProducts(products, selectedProductId, visibleLimit),
    [products, selectedProductId, visibleLimit]
  );

  const layoutPoints = useMemo(() => {
    const width = orbSize.width || 760;
    const height = orbSize.height || 760;
    return buildPackedLayout(visibleProducts, width, height);
  }, [visibleProducts, orbSize.width, orbSize.height]);

  const interactionStyles = useMemo(() => {
    if (!orbRef.current) return {};

    const rect = orbRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const falloff = Math.min(rect.width, rect.height) * 0.38;

    return layoutPoints.reduce((acc, point) => {
      const itemX = cx + point.x;
      const itemY = cy + point.y;
      const isSelected = point.id === selectedProductId;
      const selectedBoost = isSelected ? 0.08 : 0;

      let hoverBoost = 0;
      let offsetX = 0;
      let offsetY = 0;

      if (isInteractiveDesktop && cursorPoint) {
        const distance = Math.hypot(cursorPoint.x - itemX, cursorPoint.y - itemY);
        hoverBoost = Math.max(0, 1 - distance / falloff);

        if (distance > 0) {
          const nx = (itemX - cursorPoint.x) / distance;
          const ny = (itemY - cursorPoint.y) / distance;
          const repel = hoverBoost * 3;
          offsetX = nx * repel;
          offsetY = ny * repel;
        }
      }

      const scale = 1 + selectedBoost + hoverBoost * 0.2;

      acc[point.id] = {
        '--item-x': `${(point.x + offsetX).toFixed(2)}px`,
        '--item-y': `${(point.y + offsetY).toFixed(2)}px`,
        '--item-size': `${point.size.toFixed(2)}px`,
        '--item-scale': scale.toFixed(3),
        zIndex: String(10 + Math.round(scale * 12)),
      };

      return acc;
    }, {});
  }, [layoutPoints, selectedProductId, isInteractiveDesktop, cursorPoint]);

  const handlePointerMove = (event) => {
    if (!isInteractiveDesktop || !orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    setCursorPoint({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const handlePointerLeave = () => {
    setCursorPoint(null);
  };

  return (
    <div
      ref={orbRef}
      className="texture-orb"
      role="listbox"
      aria-label="Texturas disponibles"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <div className="texture-orb-core" aria-hidden="true" />
      {visibleProducts.map((product) => {
        const isActive = product.id === selectedProductId;

        return (
          <button
            key={product.id}
            type="button"
            role="option"
            aria-selected={isActive}
            className={`texture-orb-item ${isActive ? 'is-active' : ''}`}
            style={interactionStyles[product.id] || {}}
            onClick={() => onSelect(product.id)}
            title={product.name}
          >
            <img
              src={getPreviewImage(product)}
              alt={product.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = '/placeholder.jpg';
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default TextureOrb;
