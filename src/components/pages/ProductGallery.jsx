import React, { useState, useEffect } from 'react';
import { loadProductData, filterProductsByCategory } from '../../utils/productParser';
import ProductSidecart from '../ProductSidecart';

const ProductGallery = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSidecartOpen, setIsSidecartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse filter from URL hash
    const hash = window.location.hash;
    const match = hash.match(/[?&]filter=([^&]+)/);
    const urlFilter = match ? match[1] : 'all';
    setFilter(urlFilter);
  }, []);

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
    // Update URL when filter changes
    const newHash = filter === 'all' ? '#productos' : `#productos?filter=${filter}`;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, [filter]);

  const filteredProducts = filterProductsByCategory(products, filter);

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
          <button
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
          <button
            className={`filter-button ${filter === '12mm' ? 'active' : ''}`}
            onClick={() => setFilter('12mm')}
          >
            12mm
          </button>
          <button
            className={`filter-button ${filter === '20mm' ? 'active' : ''}`}
            onClick={() => setFilter('20mm')}
          >
            20mm
          </button>
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
            </div>
            <div className="product-gallery-meta">
              <h3>{product.name}</h3>
              {product.category && (
                <span className="product-category-badge">{product.category}</span>
              )}
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
        isOpen={isSidecartOpen}
        onClose={handleCloseSidecart}
      />
    </div>
  );
};

export default ProductGallery;
