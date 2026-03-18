import React, { useEffect, useMemo, useState } from 'react';
import { loadProductData } from '../../utils/productParser';
import TextureMoodboardPanel from '../explore/TextureMoodboardPanel';
import TextureRail from '../explore/TextureRail';
import { trackCustom } from '../../lib/metaPixel';

const slugifyTexture = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const getTextureQuery = () => {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('texture') || '';
};

const ExploreTexturesMoodboardPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  const trackInspirationChange = (product, triggerSource) => {
    if (!product?.name) return;
    trackCustom('ViewInspiration', {
      texture_name: product.name,
      trigger_source: triggerSource,
    });
  };

  useEffect(() => {
    let mounted = true;

    loadProductData()
      .then((data) => {
        if (!mounted) return;
        setProducts(data);
        if (data.length > 0) {
          const requestedTexture = slugifyTexture(getTextureQuery());
          const matched = requestedTexture
            ? data.find((item) => slugifyTexture(item.name) === requestedTexture)
            : null;
          const initialProduct = matched || data[0];
          setSelectedId(initialProduct.id);
          trackInspirationChange(initialProduct, 'ExploreTexturesMoodboardPage.initialSelection');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const syncFromQuery = () => {
      const requestedTexture = slugifyTexture(getTextureQuery());
      if (!requestedTexture) return;
      const matched = products.find(
        (item) => slugifyTexture(item.name) === requestedTexture
      );
      if (matched) {
        setSelectedId(matched.id);
        trackInspirationChange(matched, 'ExploreTexturesMoodboardPage.queryParamChange');
      }
    };

    syncFromQuery();
    window.addEventListener('popstate', syncFromQuery);
    return () => window.removeEventListener('popstate', syncFromQuery);
  }, [products]);

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedId) || null,
    [products, selectedId]
  );

  const handleSelectTexture = (productId) => {
    if (!productId || productId === selectedId) return;
    const nextProduct = products.find((item) => item.id === productId);
    setSelectedId(productId);
    trackInspirationChange(nextProduct, 'ExploreTexturesMoodboardPage.selectorClick');
  };

  return (
    <section className="explore-moodboard-page">
      <div className="explore-moodboard-intro explore-intro">
        <p className="explore-intro-eyebrow">Inspiración curada con IA</p>
        <h1 className="explore-intro-title">INSPIRACIÓN</h1>
        <p className="explore-intro-copy">
          Una selección de referencias visuales para descubrir cómo combinar materiales,
          colores y terminaciones en espacios contemporáneos.
        </p>
        <p className="explore-intro-note">
          Las imágenes de inspiración utilizadas en esta sección no pertenecen a Novastone
          y se presentan únicamente como referencia visual de tendencias y combinaciones de
          diseño.
        </p>
      </div>

      {loading ? (
        <div className="explore-textures-loading">Cargando texturas...</div>
      ) : (
        <>
          <div className="texture-moodboard-fullwidth">
            <TextureMoodboardPanel product={selectedProduct} />
          </div>
          <div className="texture-rail-fullwidth">
            <TextureRail
              products={products}
              selectedId={selectedId}
              onSelect={handleSelectTexture}
            />
          </div>
        </>
      )}
    </section>
  );
};

export default ExploreTexturesMoodboardPage;
