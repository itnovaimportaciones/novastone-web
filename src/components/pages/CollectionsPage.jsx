import React from 'react';

const COLLECTIONS = [
  {
    id: '20mm',
    title: '20mm',
    image: '/collections/Collection%2020mm.png',
    filter: '20mm',
    description:
      'Mayor espesor pensado para aplicaciones de alta exigencia, aportando solidez, presencia y durabilidad.'
  },
  {
    id: '12mm',
    title: '12mm',
    image: '/collections/Collection%2012mm.png',
    filter: '12mm',
    description:
      'Espesor versatil ideal para revestimientos, mobiliario y aplicaciones donde se busca ligereza y resistencia.'
  },
  {
    id: 'full-body',
    title: 'Full Body',
    image: '/collections/Collection%20Full%20Body.png',
    filter: 'full-body',
    description:
      'Vetas pasantes en todo el espesor de la placa, como en la piedra natural.'
  },
  {
    id: 'espejada',
    title: 'Espejada',
    image: '/collections/Collection%20Espejada.png',
    filter: 'espejada',
    description:
      'Superficie con acabado Natural u Organico que reproduce el relieve de las vetas naturales, logrando un efecto visual y tactil unico.'
  },
  {
    id: 'luxury',
    title: 'Luxury',
    image: '/collections/Collection%20Luxury.png',
    filter: 'luxury',
    description:
      'Superficies de estética exclusiva con diseños refinados y acabados sofisticados de alto impacto visual.'
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
