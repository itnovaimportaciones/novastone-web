import React, { useState, useEffect } from 'react';
import { loadProductData, filterProductsByFilters } from '../../utils/productParser';
import { matchesCollection, normalizeCollectionKey } from '../../content/collectionProductMap';
import ProductSidecart from '../ProductSidecart';
import { trackViewContent } from '../../lib/metaPixel';

const toSlug = (name) =>
  name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const ProductGallery = () => {
  const [products, setProducts] = useState([]);
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [filters, setFilters] = useState({
    color: 'all',
    thickness: 'all',
    finish: 'all',
    application: 'all'
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSidecartOpen, setIsSidecartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const hashQueryIndex = hash.indexOf('?');
      const hashQuery = hashQueryIndex >= 0 ? hash.slice(hashQueryIndex + 1) : '';
      const hashParams = new URLSearchParams(hashQuery);
      const searchParams = new URLSearchParams(window.location.search);
      const rawCollection =
        hashParams.get('collection') ||
        hashParams.get('filter') ||
        searchParams.get('collection') ||
        'all';
      setCollectionFilter(normalizeCollectionKey(rawCollection));
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if ((collectionFilter === '12mm' || collectionFilter === '20mm') && filters.thickness === 'all') {
      setFilters((prev) => ({ ...prev, thickness: collectionFilter }));
    }
  }, [collectionFilter, filters.thickness]);

  useEffect(() => {
    // Load products
    loadProductData()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading products:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const productoSlug = params.get('producto');
    if (!productoSlug) return;
    const product = products.find(p => toSlug(p.name) === productoSlug);
    if (product) {
      setSelectedProduct(product);
      setIsSidecartOpen(true);
    }
  }, [products]);

  useEffect(() => {
    // Update hash query when collection filter changes
    const newHash =
      collectionFilter === 'all'
        ? '#productos'
        : `#productos?collection=${collectionFilter}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [collectionFilter]);

  const productsByCollection = products.filter((product) =>
    matchesCollection(product.name, collectionFilter)
  );

  const filteredProducts = filterProductsByFilters(productsByCollection, {
    ...filters,
    collection: 'all'
  });

  const handleProductClick = (product) => {
    trackViewContent({
      content_name: product?.name || 'Producto',
      content_type: 'product',
      content_ids: [product?.productCode || product?.code || product?.id || product?.name || 'unknown'],
      trigger_source: 'ProductGallery.handleProductClick',
    });
    setSelectedProduct(product);
    setIsSidecartOpen(true);
    const slug = toSlug(product.name);
    window.history.replaceState(null, '', `/productos?producto=${slug}`);
  };

  const handleCloseSidecart = () => {
    setIsSidecartOpen(false);
    setSelectedProduct(null);
    window.history.replaceState(null, '', `/productos${window.location.hash}`);
  };

  if (loading) {
    return (
      <div className="product-gallery-loading">
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="product-gallery-page">
      <div className="product-gallery-header">
        <h1>Galería de Superficies</h1>
        {collectionFilter !== 'all' && (
          <button
            type="button"
            className="product-clear-filter"
            onClick={() => setCollectionFilter('all')}
          >
            Limpiar filtro
          </button>
        )}
        <div className="product-gallery-filters">
          <div className="filter-group">
            <span>Color</span>
            <select
              className="filter-select"
              value={filters.color}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, color: event.target.value }))
              }
            >
              {['all', 'Blancos', 'Grises', 'Negros', 'Tierra', 'Colores'].map(
                (value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'Todos' : value}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="filter-group">
            <span>Espesor</span>
            <select
              className="filter-select"
              value={filters.thickness}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, thickness: event.target.value }))
              }
            >
              {['all', '12mm', '20mm'].map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'Todos' : value}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span>Acabado</span>
            <select
              className="filter-select"
              value={filters.finish}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, finish: event.target.value }))
              }
            >
              {['all', 'Pulido', 'Mate', 'Natural', 'Satinado'].map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'Todos' : value}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span>Aplicación</span>
            <select
              className="filter-select"
              value={filters.application}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, application: event.target.value }))
              }
            >
              {['all', 'Interior', 'Exterior', 'Mesadas', 'Pisos'].map((value) => (
                <option key={value} value={value}>
                  {value === 'all' ? 'Todos' : value}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="product-gallery-grid">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            className="product-gallery-card"
            type="button"
            onClick={() => handleProductClick(product)}
          >
            <div className="product-gallery-image">
              {product.thumbnailImage ? (
                <img
                  src={product.thumbnailImage}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
              ) : (
                <div className="product-gallery-placeholder">Sin imagen</div>
              )}
              <div className="product-gallery-hover">
                <div className="product-gallery-hover-inner">
                  <h3>{product.name}</h3>
                  {(product.category || product.surfaceFinishes?.length > 0) && (
                    <div className="product-badges">
                      {product.category && (
                        <span className="product-badge">{product.category}</span>
                      )}
                      {product.surfaceFinishes.map((finish) => (
                        <span
                          key={`${product.id}-${finish}`}
                          className="product-badge"
                        >
                          {finish}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="product-gallery-empty">
          <p>No se encontraron productos con el filtro seleccionado.</p>
        </div>
      )}

      <ProductSidecart
        product={selectedProduct}
        products={products}
        isOpen={isSidecartOpen}
        onClose={handleCloseSidecart}
        onSelect={handleProductClick}
      />
    </div>
  );
};

export default ProductGallery;
