import React, { useEffect, useMemo, useState } from 'react';

const buildImages = (product) => {
  if (!product) return [];

  const sources = [product.thumbnailImage, ...(product.detailImages || [])].filter(Boolean);
  const unique = [];

  sources.forEach((src) => {
    if (!unique.includes(src)) {
      unique.push(src);
    }
  });

  return unique;
};

const TextureDetailPanel = ({ product }) => {
  const images = useMemo(() => buildImages(product), [product]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [product?.id]);

  if (!product) {
    return (
      <aside className="texture-detail-panel is-empty">
        <p>Seleccioná una textura para ver sus renders.</p>
      </aside>
    );
  }

  const activeImage = images[activeIndex] || '/placeholder.jpg';

  return (
    <aside className="texture-detail-panel">
      <header className="texture-detail-header">
        <p className="texture-detail-eyebrow">Superficie seleccionada</p>
        <h2>{product.name}</h2>
      </header>

      <div className="texture-detail-main-image">
        <img
          src={activeImage}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src = '/placeholder.jpg';
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="texture-detail-thumbs" aria-label="Renders del producto">
          {images.map((image, index) => (
            <button
              key={`${product.id}-${image}`}
              type="button"
              className={`texture-detail-thumb ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveIndex(index)}
            >
              <img
                src={image}
                alt={`${product.name} render ${index + 1}`}
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = '/placeholder.jpg';
                }}
              />
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};

export default TextureDetailPanel;
