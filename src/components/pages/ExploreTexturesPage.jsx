import React, { useEffect, useMemo, useState } from 'react';
import { loadProductData } from '../../utils/productParser';
import TextureOrb from '../explore/TextureOrb';
import TextureDetailPanel from '../explore/TextureDetailPanel';

const ExploreTexturesPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    loadProductData()
      .then((data) => {
        if (!isMounted) return;
        const sorted = [...data].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'es', {
            sensitivity: 'base',
          })
        );
        setProducts(sorted);
        if (sorted.length > 0) {
          setSelectedProductId(sorted[0].id);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  return (
    <section className="explore-textures-page">
      <div className="explore-textures-intro" data-reveal>
        <p className="explore-textures-label">Experimento local</p>
        <h1>Explorar Texturas</h1>
        <p>
          Seleccioná una superficie para expandir su vista y explorar los renders
          disponibles del producto.
        </p>
        <div className="explore-moodboard-actions">
          <a href="/explorar-texturas-moodboard">Ver variante Moodboard + Rail</a>
        </div>
      </div>

      {loading ? (
        <div className="explore-textures-loading">Cargando texturas...</div>
      ) : (
        <div className="explore-textures-layout">
          <TextureOrb
            products={products}
            selectedProductId={selectedProductId}
            onSelect={setSelectedProductId}
          />
          <TextureDetailPanel product={selectedProduct} />
        </div>
      )}
    </section>
  );
};

export default ExploreTexturesPage;
