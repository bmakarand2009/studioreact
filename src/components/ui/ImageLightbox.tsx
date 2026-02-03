import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export interface ImageLightboxProps {
  /** Whether the lightbox is open */
  isOpen: boolean;
  /** Called when the lightbox should close (backdrop click, close button, or Escape) */
  onClose: () => void;
  /** Image URL to display */
  imageSrc: string;
  /** Alt text for the image and optional caption */
  alt?: string;
  /** Optional caption shown below the image */
  caption?: string;
}

/**
 * Reusable full-screen image lightbox. Mobile responsive: touch-friendly close,
 * safe area padding, and prevents body scroll when open.
 */
export function ImageLightbox({
  isOpen,
  onClose,
  imageSrc,
  alt = '',
  caption,
}: ImageLightboxProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 sm:p-6 md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image preview'}
      onClick={handleBackdropClick}
    >
      {/* Close button – top right, large touch target on mobile */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Close preview"
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      {/* Image container – centered, responsive max dimensions */}
      <div className="flex max-h-full w-full max-w-6xl flex-col items-center justify-center gap-4">
        <img
          src={imageSrc}
          alt={alt}
          className="max-h-[85vh] w-auto max-w-full object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
        {(caption || alt) && (
          <p className="max-w-full text-center text-sm text-white/90 sm:text-base">
            {caption ?? alt}
          </p>
        )}
      </div>
    </div>
  );
}
