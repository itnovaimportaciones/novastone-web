import React from 'react';
import { trackCustom } from '../../lib/metaPixel';

const TextureRail = ({ products, selectedId, onSelect }) => {
  return (
    <section className="texture-rail" aria-label="Tira de texturas">
      <div className="texture-rail-track">
        {products.map((product) => {
          const isActive = product.id === selectedId;
          const preview = product.thumbnailImage || product.detailImages?.[0] || '/placeholder.jpg';

          return (
            <button
              key={product.id}
              type="button"
              className={`texture-rail-item ${isActive ? 'is-active' : ''}`}
              onClick={() => {
                trackCustom('TextureInteraction', {
                  interaction_type: 'selector_click',
                  texture_name: product.name || null,
                  trigger_source: 'TextureRail.selectorClick',
                });
                onSelect(product.id);
              }}
              title={product.name}
            >
              <div className="texture-rail-item-media">
                <img
                  src={preview}
                  alt={product.name}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = '/placeholder.jpg';
                  }}
                />
                <span>{product.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default TextureRail;
