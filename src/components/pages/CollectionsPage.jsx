import React from 'react';

const COLLECTIONS = [
  {
    id: '20mm',
    title: '20mm',
    image: '/collections/Collection%2020mm.png',
    filter: '20mm'
  },
  {
    id: '12mm',
    title: '12mm',
    image: '/collections/Collection%2012mm.png',
    filter: '12mm'
  },
  {
    id: 'full-body',
    title: 'Full Body',
    image: '/collections/Collection%20Full%20Body.png',
    filter: 'full-body'
  },
  {
    id: 'espejada',
    title: 'Espejada',
    image: '/collections/Collection%20Espejada.png',
    filter: 'espejada'
  },
  {
    id: 'luxury',
    title: 'Luxury',
    image: '/collections/Collection%20Luxury.png',
    filter: 'luxury'
  }
];

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
            window.location.hash = `#productos?filter=${collection.filter}`;
          }}
        >
          <div className="collections-image">
            <img src={collection.image} alt={collection.title} />
            <div className="collections-meta">
              <h3>{collection.title}</h3>
              <span>Ver productos</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default CollectionsPage;
