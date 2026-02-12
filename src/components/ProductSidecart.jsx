import { useState, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { parseProductDescription } from '../utils/productParser';

const WHATSAPP_PHONE = '5491124800421';

const ProductSidecart = ({ product, products = [], isOpen, onClose, onSelect }) => {
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

  const safeProduct = product || {};
  const detailImages = safeProduct.detailImages || [];
  const nonRenderImages = safeProduct.nonRenderImages || [];
  const renderImages = safeProduct.renderImages || [];
  const fullBodyImages = detailImages.filter((image) => /full body/i.test(image));
  const galleryImages = [...renderImages, ...fullBodyImages].filter(Boolean);
  const fallbackImages = nonRenderImages.length > 0 ? nonRenderImages : detailImages;
  const carouselImages = galleryImages.length > 0 ? galleryImages : fallbackImages;
  const totalImages = carouselImages.length;
  const mainImage = totalImages > 0
    ? carouselImages[currentImageIndex % totalImages]
    : '';

  const { intro, specs } = useMemo(
    () => parseProductDescription(safeProduct.description || ''),
    [safeProduct.description]
  );

  const similarProducts = useMemo(() => {
    const otherProducts = products.filter((item) => item.id !== safeProduct.id);
    for (let i = otherProducts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherProducts[i], otherProducts[j]] = [otherProducts[j], otherProducts[i]];
    }
    return otherProducts.slice(0, 6);
  }, [products, safeProduct.id]);

  const handleNextImage = () => {
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }
  };

  const handlePrevImage = () => {
    if (totalImages > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const whatsAppMessage = `Hola, quiero consultar disponibilidad de ${safeProduct.name || ''}.`;
  const whatsAppUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsAppMessage)}`;

  if (!isOpen || !product) return null;

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
          {totalImages > 0 && (
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
                {totalImages > 1 && (
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
              {totalImages > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              )}
            </div>
          )}

          {/* Product Description */}
          {(intro || Object.keys(specs).length > 0) && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
              {intro && (
                <p className="text-gray-700 leading-relaxed">
                  {intro}
                  <br />
                  <br />
                </p>
              )}
              <div className="mt-4 border-t border-black/20 pt-4">
                <h4 className="text-sm uppercase tracking-[0.2em] text-gray-600 mb-4">
                  Ficha Técnica
                </h4>
                <div className="grid gap-4">
                  {[
                    { label: 'Aplicaciones', value: specs['Aplicaciones'], icon: 'M4 20h16M4 4h16M4 12h16' },
                    { label: 'Colores', value: specs['Colores'], icon: 'M12 4v16m8-8H4' },
                    { label: 'Interior / Exterior', value: specs['Interior / Exterior'], icon: 'M4 6h16v12H4z' },
                    { label: 'Tipo de Material', value: specs['Tipo de Material'], icon: 'M4 4h16v16H4z' },
                    { label: 'Terminación Superficial', value: specs['Terminación Superficial'], icon: 'M12 4l6 16H6z' }
                  ].map((item) => (
                    item.value ? (
                      <div key={item.label} className="border-t border-black/20 pt-3">
                        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.15em] text-gray-700">
                          <svg
                            className="w-4 h-4 text-gray-700"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d={item.icon} />
                          </svg>
                          <span>{item.label}</span>
                        </div>
                        <p className="text-gray-700 mt-2 leading-relaxed">
                          {item.value}
                        </p>
                      </div>
                    ) : null
                  ))}
                </div>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center mt-6 px-5 py-3 border border-black text-black uppercase tracking-[0.2em] text-xs"
                >
                  Consultar disponibilidad
                </a>
              </div>
            </div>
          )}

          {/* Render Images Gallery */}
          {galleryImages.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Novastone en Espacios</h3>
              <div className="grid grid-cols-2 gap-4">
                {galleryImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const imageIndex = galleryImages.indexOf(image);
                      setCurrentImageIndex(imageIndex);
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

          {similarProducts.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Productos similares
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {similarProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="text-left border border-gray-200 bg-white"
                    onClick={() => onSelect?.(item)}
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-gray-100">
                      <img
                        src={item.thumbnailImage}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = '/placeholder.jpg';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <span className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                        {item.category || 'Coleccion'}
                      </span>
                      <p className="text-sm uppercase tracking-[0.12em] text-gray-900 mt-2">
                        {item.name}
                      </p>
                    </div>
                  </button>
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
