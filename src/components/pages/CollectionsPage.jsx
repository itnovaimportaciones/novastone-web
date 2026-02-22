import React from 'react';

const COLLECTIONS = [
  {
    id: '20mm',
    title: '20mm',
    image: '/collections/Collection%2020mm.png',
    filter: '20mm',
    description:
      'Disponible en espesores 12mm y 20mm, con opciones Full Body, Espejada y Luxury.'
  },
  {
    id: '12mm',
    title: '12mm',
    image: '/collections/Collection%2012mm.png',
    filter: '12mm',
    description:
      'Superficie que reproduce con fidelidad las vetas y texturas de la piedra natural, con un acabado visual y tactil unico.'
  },
  {
    id: 'full-body',
    title: 'Full Body',
    image: '/collections/Collection%20Full%20Body.png',
    filter: 'full-body',
    description:
      'Diseno con vetas pasantes que se aprecian en todo el espesor del cuerpo de la placa.'
  },
  {
    id: 'espejada',
    title: 'Espejada',
    image: '/collections/Collection%20Espejada.png',
    filter: 'espejada',
    description:
      'La piedra sinterizada espejada es una variante con acabado pulido de alto brillo que refleja la luz y logra un efecto elegante.'
  },
  {
    id: 'luxury',
    title: 'Luxury',
    image: '/collections/Collection%20Luxury.png',
    filter: 'luxury',
    description:
      'Duplica el efecto del esmaltado con relieve, aportando mayor profundidad, brillo y realismo en cada diseno.'
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
