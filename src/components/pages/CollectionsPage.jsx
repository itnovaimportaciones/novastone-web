import React from 'react';
import { COLLECTIONS_COPY, COLLECTIONS_ORDER } from '../../content/collectionsCopy';

const COLLECTIONS = [
  {
    id: '20mm',
    image: '/collections/Collection%2020mm.png',
    imageMobile: '/collections/Collection%2020mm%20mobile.jpg',
    filter: '20mm'
  },
  {
    id: '12mm',
    image: '/collections/Collection%2012mm.png',
    imageMobile: '/collections/Collection%2012mm%20mobile.jpg',
    filter: '12mm'
  },
  {
    id: 'full-body',
    image: '/collections/Collection%20Full%20Body.png',
    filter: 'fullbody'
  },
  {
    id: 'espejada',
    image: '/collections/Collection%20Espejada.png',
    filter: 'espejada'
  },
  {
    id: 'luxury',
    image: '/collections/Collection%20Luxury.png',
    filter: 'luxury'
  }
].map((collection) => ({
  ...collection,
  ...COLLECTIONS_COPY[collection.id]
})).sort((a, b) => COLLECTIONS_ORDER.indexOf(a.id) - COLLECTIONS_ORDER.indexOf(b.id));

const CollectionsPage = () => (
  <div className="collections-page">
    <div className="collections-header">
      <h1>Colecciones</h1>
      <p>Explora las categorias principales de Novastone.</p>
    </div>
    <div className="collections-grid">
      {COLLECTIONS.map((collection) => (
        <button
          key={collection.id}
          type="button"
          className="collections-card"
          onClick={() => {
            window.location.hash = `#productos?collection=${collection.filter}`;
          }}
        >
          <div className="collections-image">
            <picture>
              {/* Verticales, sólo mobile. 768px es el breakpoint donde
                  .collections-image pasa a 50vh / 320px. */}
              {collection.imageMobile && (
                <source media="(max-width: 768px)" srcSet={collection.imageMobile} />
              )}
              <img src={collection.image} alt={collection.title} />
            </picture>
            <div className="collections-meta">
              <h3>{collection.title}</h3>
              <span>Ver productos</span>
            </div>
            <div className="collections-hover" aria-hidden="true">
              <div className="collections-hover-content">
                <h4>{collection.title}</h4>
                <p>{collection.description}</p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default CollectionsPage;
