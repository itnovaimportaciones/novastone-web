import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const ProductSidecart = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sidecartRef = useRef(null);
  const backdropRef = useRef(null);

  // GSAP Animation
  useEffect(() => {
    if (isOpen) {
      // Animate in
      gsap.to(backdropRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
      gsap.fromTo(
        sidecartRef.current,
        { x: '100%' },
        { x: '0%', duration: 0.4, ease: 'power3.out' }
      );
    } else {
      // Animate out
      gsap.to(backdropRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in'
      });
      gsap.to(sidecartRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in'
      });
    }
  }, [isOpen]);

  // Reset image index when product changes
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
    }
  }, [product]);

  // Prevent body scroll when sidecart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const detailImages = product.detailImages || [];
  const nonRenderImages = product.nonRenderImages || [];
  const renderImages = product.renderImages || [];

  // Use non-render images for main display, render images as secondary
  const mainImage = nonRenderImages.length > 0 
    ? nonRenderImages[currentImageIndex % nonRenderImages.length]
    : detailImages[currentImageIndex % detailImages.length];

  const handleNextImage = () => {
    const totalImages = detailImages.length;
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }
  };

  const handlePrevImage = () => {
    const totalImages = detailImages.length;
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] opacity-0"
        onClick={onClose}
      />

      {/* Sidecart */}
      <div
        ref={sidecartRef}
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-gray-200 z-[101] flex flex-col translate-x-full overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            {product.category && (
              <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                {product.category}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
            aria-label="Cerrar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Image */}
          {detailImages.length > 0 && (
            <div className="relative bg-gray-100">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
                {detailImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                      aria-label="Imagen anterior"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-colors"
                      aria-label="Siguiente imagen"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {detailImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {detailImages.length}
                </div>
              )}
            </div>
          )}

          {/* Product Description */}
          {product.description && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Render Images Gallery */}
          {renderImages.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Imágenes adicionales</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const imageIndex = detailImages.indexOf(image);
                      if (imageIndex !== -1) {
                        setCurrentImageIndex(imageIndex);
                      }
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - Vista ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductSidecart;
