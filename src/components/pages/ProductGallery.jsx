import React, { useState, useEffect } from 'react';
import { loadProductData, filterProductsByFilters } from '../../utils/productParser';
import ProductSidecart from '../ProductSidecart';

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
      const match = hash.match(/[?&]filter=([^&]+)/);
      const urlFilter = match ? match[1] : 'all';
      setCollectionFilter(urlFilter);
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
    // Update URL when collection filter changes
    const newHash =
      collectionFilter === 'all'
        ? '#productos'
        : `#productos?filter=${collectionFilter}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [collectionFilter]);

  const filteredProducts = filterProductsByFilters(products, {
    ...filters,
    collection: collectionFilter
  });

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setIsSidecartOpen(true);
  };

  const handleCloseSidecart = () => {
    setIsSidecartOpen(false);
    setSelectedProduct(null);
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
