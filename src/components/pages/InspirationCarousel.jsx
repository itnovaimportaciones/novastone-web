import React, { useState, useEffect } from 'react';
import { loadProductData } from '../../utils/productParser';
import ProductSidecart from '../ProductSidecart';

const InspirationCarousel = () => {
  const [renderImages, setRenderImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSidecartOpen, setIsSidecartOpen] = useState(false);

  useEffect(() => {
    loadProductData()
      .then(products => {
        setProducts(products);
        // Collect all render images from all products
        const allRenderImages = [];
        products.forEach(product => {
          if (product.renderImages && product.renderImages.length > 0) {
            product.renderImages.forEach(image => {
              allRenderImages.push({
                src: image,
                productName: product.name,
                productId: product.id
              });
            });
          }
        });
        setRenderImages(allRenderImages);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading render images:', error);
        setLoading(false);
      });
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % renderImages.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + renderImages.length) % renderImages.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleSlideClick = (image) => {
    const match = products.find((product) => product.id === image.productId);
    if (!match) return;
    setSelectedProduct(match);
    setIsSidecartOpen(true);
  };

  const handleCloseSidecart = () => {
    setIsSidecartOpen(false);
    setSelectedProduct(null);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (renderImages.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % renderImages.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [renderImages.length]);

  if (loading) {
    return (
      <div className="inspiration-carousel-loading">
        <p>Cargando imágenes...</p>
      </div>
    );
  }

  if (renderImages.length === 0) {
    return (
      <div className="inspiration-carousel-empty">
        <p>No se encontraron imágenes.</p>
      </div>
    );
  }

  return (
    <div className="inspiration-carousel-page">
      <div className="inspiration-carousel-header">
        <h1>Proyectos</h1>
        <p className="inspiration-subtitle">Novastone pensado en proyectos que elevan la experiencia cotidiana.</p>
      </div>

      <div className="inspiration-carousel-container">
        <button
          className="carousel-button carousel-button-prev"
          onClick={handlePrev}
          aria-label="Imagen anterior"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="carousel-slide-container">
          <div
            className="carousel-slides"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`
            }}
          >
            {renderImages.map((image, index) => (
              <div key={`${image.productId}-${index}`} className="carousel-slide">
                <button
                  className="carousel-slide-button"
                  type="button"
                  onClick={() => handleSlideClick(image)}
                  aria-label={`Ver ${image.productName}`}
                >
                  <img
                    src={image.src}
                    alt={`${image.productName} - Render ${index + 1}`}
                    onError={(e) => {
                      e.target.src = '/placeholder.jpg';
                    }}
                  />
                  <div className="carousel-slide-info">
                    <p className="carousel-product-name">
                      {image.productName} &rarr;
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          className="carousel-button carousel-button-next"
          onClick={handleNext}
          aria-label="Siguiente imagen"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots indicator */}
      <div className="carousel-dots">
        {renderImages.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="carousel-counter">
        {currentIndex + 1} / {renderImages.length}
      </div>

      <ProductSidecart
        product={selectedProduct}
        products={products}
        isOpen={isSidecartOpen}
        onClose={handleCloseSidecart}
        onSelect={setSelectedProduct}
      />
    </div>
  );
};

export default InspirationCarousel;
