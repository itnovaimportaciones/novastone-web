import { useState, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { parseProductDescription } from '../utils/productParser';

const WHATSAPP_PHONE = '5491124800421';

const rotateImageIfPortrait = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      if (!width || !height || width >= height) {
        resolve(src);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = height;
      canvas.height = width;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -width / 2, -height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });

const slugifyMoodboardKey = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');

const imageExists = async (src) => {
  try {
    const response = await fetch(src, { method: 'GET', cache: 'no-store' });
    if (!response.ok) return false;
    const contentType = response.headers.get('content-type') || '';
    return contentType.toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
};

const firstExisting = async (candidates = []) => {
  for (const src of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await imageExists(src);
    if (ok) return src;
  }
  return null;
};

const ProductSidecart = ({ product, products = [], isOpen, onClose, onSelect }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slabPreviewSrc, setSlabPreviewSrc] = useState('');
  const [moodboardPreviewImages, setMoodboardPreviewImages] = useState([]);
  const [isSlabLightboxOpen, setIsSlabLightboxOpen] = useState(false);
  const [canHoverSlabPreview, setCanHoverSlabPreview] = useState(false);
  const [isSlabPreviewHovering, setIsSlabPreviewHovering] = useState(false);
  const [slabPreviewOffset, setSlabPreviewOffset] = useState({ x: 0, y: 0 });
  const sidecartRef = useRef(null);
  const backdropRef = useRef(null);
  const touchStartXRef = useRef(null);
  const touchDeltaXRef = useRef(0);

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
      setIsSlabLightboxOpen(false);
      setIsSlabPreviewHovering(false);
      setSlabPreviewOffset({ x: 0, y: 0 });
    }
  }, [product]);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setCanHoverSlabPreview(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

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
  const normalizeKey = (value = '') =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  const getStem = (imagePath = '') => {
    const filename = decodeURIComponent(imagePath.split('/').pop() || '');
    return filename.replace(/\.[^.]+$/, '');
  };
  const findImage = (images = [], keys = []) =>
    images.find((image) => keys.includes(normalizeKey(getStem(image))));

  const baseKey = normalizeKey(safeProduct.name || '');
  const textureImage =
    findImage(detailImages, [baseKey]) || nonRenderImages[0] || detailImages[0];
  const renderImage =
    findImage(detailImages, [`${baseKey} render`]) || renderImages[0];
  const fullBodyImage = findImage(detailImages, [
    `${baseKey} full body`,
    `${baseKey} fullbody`
  ]);

  const galleryImages = (renderImages || []).filter(Boolean);
  const additionalRenderImages = galleryImages.filter((image) => image !== renderImage);
  const carouselImages = [textureImage, renderImage, ...additionalRenderImages, fullBodyImage]
    .filter(Boolean)
    .filter((image, index, list) => list.indexOf(image) === index);
  const totalImages = carouselImages.length;
  const mainImage = totalImages > 0
    ? carouselImages[currentImageIndex % totalImages]
    : '';

  const { intro, specs } = useMemo(
    () => parseProductDescription(safeProduct.description || ''),
    [safeProduct.description]
  );

  useEffect(() => {
    let active = true;

    const resolvePreviewImages = async () => {
      const baseKey = slugifyMoodboardKey(safeProduct.name || '');
      const keyVariants = [baseKey, baseKey.replace(/_/g, '-')].filter(Boolean);
      const exts = ['jpg', 'jpeg', 'png', 'webp'];
      const folderImages = [];

      for (const key of keyVariants) {
        const basePath = `/moodboard/${key}`;
        for (let i = 1; i <= 6; i += 1) {
          const candidates = exts.map(
            (ext) => `${basePath}/${key}_moodboard_${i}.${ext}`
          );
          // eslint-disable-next-line no-await-in-loop
          const found = await firstExisting(candidates);
          if (found) folderImages.push(found);
          if (folderImages.length >= 4) break;
        }
        if (folderImages.length > 0) break;
      }

      if (!active) return;

      if (folderImages.length > 0) {
        setMoodboardPreviewImages(folderImages.slice(0, 4));
        return;
      }

      const fallbackCandidates = [
        ...(renderImages || []),
        ...(detailImages || []).filter((image) => image !== textureImage),
        renderImage,
        fullBodyImage,
      ]
        .filter(Boolean)
        .filter((image, index, list) => list.indexOf(image) === index)
        .slice(0, 4);

      if (fallbackCandidates.length >= 4) {
        setMoodboardPreviewImages(fallbackCandidates);
        return;
      }

      const seed = fallbackCandidates.length > 0 ? fallbackCandidates : [textureImage].filter(Boolean);
      const filled = [...fallbackCandidates];
      while (seed.length > 0 && filled.length < 4) {
        filled.push(seed[filled.length % seed.length]);
      }
      setMoodboardPreviewImages(filled);
    };

    resolvePreviewImages();

    return () => {
      active = false;
    };
  }, [
    safeProduct.name,
    renderImages,
    detailImages,
    textureImage,
    renderImage,
    fullBodyImage,
  ]);

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

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    touchDeltaXRef.current = 0;
  };

  const handleTouchMove = (event) => {
    if (touchStartXRef.current == null) return;
    const currentX = event.touches?.[0]?.clientX ?? touchStartXRef.current;
    touchDeltaXRef.current = currentX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current == null) return;
    const deltaX = touchDeltaXRef.current;
    const swipeThreshold = 40;
    if (Math.abs(deltaX) >= swipeThreshold) {
      if (deltaX < 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
  };

  const whatsAppMessage = `Hola, quiero consultar disponibilidad de ${safeProduct.name || ''}.`;
  const whatsAppUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsAppMessage)}`;
  const textureSlug = slugifyMoodboardKey(safeProduct.name || '');
  const exploreTextureUrl = textureSlug
    ? `/inspiracion?texture=${encodeURIComponent(textureSlug)}`
    : '/inspiracion';

  useEffect(() => {
    let active = true;
    if (!textureImage) {
      setSlabPreviewSrc('');
      return undefined;
    }

    rotateImageIfPortrait(textureImage).then((resolvedSrc) => {
      if (!active) return;
      setSlabPreviewSrc(resolvedSrc || textureImage);
    });

    return () => {
      active = false;
    };
  }, [textureImage]);

  useEffect(() => {
    if (!isSlabLightboxOpen) return undefined;
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setIsSlabLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSlabLightboxOpen]);

  const slabHoverScale = canHoverSlabPreview && isSlabPreviewHovering ? 1.1 : 1;
  const slabTranslateX =
    canHoverSlabPreview && isSlabPreviewHovering ? slabPreviewOffset.x : 0;
  const slabTranslateY =
    canHoverSlabPreview && isSlabPreviewHovering ? slabPreviewOffset.y : 0;
  const slabTransform = `translate(${slabTranslateX}%, ${slabTranslateY}%) scale(${slabHoverScale})`;

  if (!isOpen || !product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[260] opacity-0"
        onClick={onClose}
      />

      {/* Sidecart */}
      <div
        ref={sidecartRef}
        className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white border-l border-gray-200 z-[261] flex flex-col translate-x-full overflow-hidden"
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
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4 relative z-10"
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
              <div
                className="relative aspect-[4/3] overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
              >
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
                  className="inline-flex items-center justify-center mt-6 px-5 py-3 uppercase tracking-[0.2em] text-xs nav-cta product-sidecart-cta"
                >
                  Consultar disponibilidad
                </a>
              </div>
            </div>
          )}

          {/* Technical slab preview */}
          {textureImage && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Placa 3.20 x 1.6 mts
              </h3>
              <div
                className="slab-preview-frame"
                onMouseEnter={() => {
                  if (canHoverSlabPreview) setIsSlabPreviewHovering(true);
                }}
                onMouseLeave={() => {
                  if (!canHoverSlabPreview) return;
                  setIsSlabPreviewHovering(false);
                  setSlabPreviewOffset({ x: 0, y: 0 });
                }}
                onMouseMove={(event) => {
                  if (!canHoverSlabPreview) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const px = (event.clientX - rect.left) / rect.width;
                  const py = (event.clientY - rect.top) / rect.height;
                  const offsetX = (px - 0.5) * -8;
                  const offsetY = (py - 0.5) * -6;
                  setSlabPreviewOffset({ x: offsetX, y: offsetY });
                }}
                onClick={() => setIsSlabLightboxOpen(true)}
              >
                <img
                  src={slabPreviewSrc || textureImage}
                  alt={`${product.name} - Textura completa`}
                  className="slab-preview-image"
                  style={{ transform: slabTransform }}
                  onError={(e) => {
                    e.target.src = '/placeholder.jpg';
                  }}
                />
              </div>
            </div>
          )}

          {textureImage && (
            <div className="p-6 border-t border-gray-200">
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-5 rounded-lg overflow-hidden bg-gray-100">
                  <a
                    href={exploreTextureUrl}
                    aria-label="Explorar textura"
                    className="moodboard-preview-cta group"
                  >
                    <img
                      src={textureImage}
                      alt={`${product.name} textura activa`}
                      className="moodboard-preview-cta-image"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="moodboard-preview-cta-overlay">
                      <span className="moodboard-preview-cta-text">
                        <span className="moodboard-preview-cta-line">Explorar</span>
                        <span className="moodboard-preview-cta-line">
                          Textura
                          <span className="moodboard-preview-cta-arrow" aria-hidden="true">
                            &nbsp;&rarr;
                          </span>
                        </span>
                      </span>
                    </div>
                  </a>
                </div>
                <div className="col-span-7 grid grid-cols-2 gap-3">
                  {moodboardPreviewImages.map((image, index) => (
                    <div
                      key={`${product.id}-moodboard-preview-${index + 1}`}
                      className="rounded-lg overflow-hidden bg-gray-100"
                    >
                      <div className="aspect-square">
                        <img
                          src={image}
                          alt={`${product.name} inspiración ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.jpg';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSlabLightboxOpen && (
        <div
          className="slab-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada de ${product.name}`}
          onClick={() => setIsSlabLightboxOpen(false)}
        >
          <button
            type="button"
            className="slab-lightbox-close"
            onClick={() => setIsSlabLightboxOpen(false)}
            aria-label="Cerrar imagen"
          >
            &#10005;
          </button>
          <div
            className="slab-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={slabPreviewSrc || textureImage}
              alt={`${product.name} - Textura completa ampliada`}
              className="slab-lightbox-image"
              onError={(e) => {
                e.target.src = '/placeholder.jpg';
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ProductSidecart;
