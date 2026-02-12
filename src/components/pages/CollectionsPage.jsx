import React from 'react';

const COLLECTIONS = [
  {
    id: '20mm',
    title: '20mm',
    image: '/products/16ROYAL GREY/ROYAL GREY.jpg',
    filter: '20mm'
  },
  {
    id: '12mm',
    title: '12mm',
    image: '/products/21PURE WHITE/PURE WHITE.png',
    filter: '12mm'
  },
  {
    id: 'full-body',
    title: 'Full Body',
    image: '/products/19Nero Portoro/Nero Portoro Full Body.jpg',
    filter: 'full-body'
  },
  {
    id: 'espejada',
    title: 'Espejada',
    image: '/products/11BVLGARI BLACK/BVLGARI BLACK RENDER.jpg',
    filter: 'espejada'
  },
  {
    id: 'luxury',
    title: 'Luxury',
    image: '/products/20Laurent/Laurent Render 2.jpg',
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
          </div>
          <div className="collections-meta">
            <h3>{collection.title}</h3>
            <span>Ver productos</span>
          </div>
        </button>
      ))}
    </div>
  </div>
);

export default CollectionsPage;
