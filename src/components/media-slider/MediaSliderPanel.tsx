import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XIcon, UploadCloudIcon, Trash2Icon, Loader2Icon, ImageIcon } from 'lucide-react';
import { sidebarController, SidebarPayload } from '@/services/sidebarControllerService';
import { useMediaSliderContext } from './MediaSliderProvider';
import { MediaAsset } from './types';
import { MediaSliderOpenOptions } from '@/hooks/useMediaSlider';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

type MediaSliderOptions = MediaSliderOpenOptions;

const PANEL_NAME = 'mediaSlider';
export const MediaSliderPanel = () => {
  const {
    fetchAssets,
    deleteAsset,
    uploadImage,
    placeholderUrl,
    isUploading,
    tenantDetails,
  } = useMediaSliderContext();

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MediaSliderOptions | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [masonryColumns, setMasonryColumns] = useState<MediaAsset[][]>([[], []]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestOptionsRef = useRef<MediaSliderOptions | null>(null);
  const masonryContainerRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const result = await fetchAssets();
      setAssets(result);
      // Clear dimensions when assets change
      setImageDimensions({});
    } finally {
      setIsLoadingAssets(false);
    }
  }, [fetchAssets]);

  const handleSidebarChange = useCallback(
    (payload: SidebarPayload) => {
      if (payload.name !== PANEL_NAME) {
        return;
      }
      setOpen(payload.open);
      const data = (payload.data as MediaSliderOptions | undefined) ?? null;
      latestOptionsRef.current = data;
      setOptions(data);
      if (payload.open) {
        loadAssets().catch(() => undefined);
      }
    },
    [loadAssets],
  );

  useEffect(() => {
    const unsubscribe = sidebarController.subscribe(PANEL_NAME, handleSidebarChange);
    return () => {
      unsubscribe();
    };
  }, [handleSidebarChange]);

  useEffect(() => {
    if (!open) {
      // When sidebar closes, blur any focused element inside it to prevent aria-hidden warning
      // Use setTimeout to ensure this happens after the state update
      setTimeout(() => {
        if (document.activeElement && sidebarRef.current?.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      }, 0);
      return;
    }

    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }

    return undefined;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        sidebarController.close(PANEL_NAME);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleImageLoad = useCallback((assetId: string, event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setImageDimensions((prev) => {
        const updated = {
          ...prev,
          [assetId]: {
            width: img.naturalWidth,
            height: img.naturalHeight,
          },
        };
        return updated;
      });
    }
  }, []);

  // Calculate masonry layout: distribute images into columns based on their heights
  useEffect(() => {
    if (assets.length === 0) {
      setMasonryColumns([[], []]);
      return;
    }

    const NUM_COLUMNS = 2;
    const columns: MediaAsset[][] = Array.from({ length: NUM_COLUMNS }, () => []);
    const columnHeights: number[] = Array(NUM_COLUMNS).fill(0);
    const BASE_WIDTH = 180; // Approximate column width in pixels (accounting for gap)

    assets.forEach((asset) => {
      const dimensions = imageDimensions[asset.id];
      let estimatedHeight = 200; // Default height

      if (dimensions) {
        // Calculate height based on aspect ratio and column width
        const aspectRatio = dimensions.width / dimensions.height;
        estimatedHeight = BASE_WIDTH / aspectRatio;
      }

      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[shortestColumnIndex].push(asset);
      columnHeights[shortestColumnIndex] += estimatedHeight;
    });

    setMasonryColumns(columns);
  }, [assets, imageDimensions]);

  // Extract Cloudinary public ID from URL if needed
  const extractPublicIdFromUrl = useCallback((url: string): string => {
    if (!url) return '';
    // If it's already a public ID (doesn't start with http), return as-is
    if (!url.startsWith('http')) {
      return url;
    }
    // Extract public ID from Cloudinary URL
    // Format: https://res.cloudinary.com/{cloudName}/image/upload/{publicId}
    const match = url.match(/\/image\/upload\/(.+)$/);
    return match ? match[1] : url;
  }, []);

  const handleSelect = useCallback(
    (asset: MediaAsset) => {
      // Extract the public ID - prefer publicId field, fallback to extracting from originalUrl or using id
      let publicId = asset.publicId || '';
      
      // If publicId is empty or looks like a URL, extract from originalUrl
      if (!publicId || publicId.startsWith('http')) {
        publicId = extractPublicIdFromUrl(asset.originalUrl) || asset.id;
      }
      
      // Ensure we have a valid public ID
      if (!publicId) {
        console.warn('MediaSlider: No valid public ID found for asset', asset);
        return;
      }
      
      // Blur any focused element inside the sidebar before closing (prevents aria-hidden warning)
      if (document.activeElement && sidebarRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement).blur();
      }
      
      // Call the callback with the public ID string (matches Angular's uploadSelectedImage pattern)
      if (latestOptionsRef.current?.onSelect) {
        latestOptionsRef.current.onSelect(publicId);
      }
      
      // Also dispatch custom event for any other listeners (backward compatibility)
      window.dispatchEvent(
        new CustomEvent('media-slider:select', {
          detail: { asset, publicId },
        }),
      );
      
      sidebarController.close(PANEL_NAME);
    },
    [extractPublicIdFromUrl],
  );

  const handleDelete = useCallback(
    async (asset: MediaAsset) => {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to delete this media asset?')
          : true;
      if (!confirmed) {
        return;
      }
      try {
        await deleteAsset(asset);
        await loadAssets();
      } catch (error) {
        console.error(error);
      }
    },
    [deleteAsset, loadAssets],
  );

  const handleUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }
      try {
        const response = await uploadImage(file);
        // Extract public ID from upload response (matches Angular pattern)
        // Response structure: { data: { imgUrl: "public-id" } } or { imgUrl: "public-id" }
        const publicId = response?.data?.imgUrl || response?.imgUrl || null;
        
        if (publicId && latestOptionsRef.current?.onSelect) {
          // Call the callback with the public ID (matches Angular's uploadNewImage pattern)
          latestOptionsRef.current.onSelect(publicId);
          sidebarController.close(PANEL_NAME);
        }
        
        await loadAssets();
      } catch (error) {
        console.error(error);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [loadAssets, uploadImage],
  );

  const title = options?.title ?? 'Media Library';
  const description =
    options?.description ?? 'Select from your existing assets or upload a new image.';

  const classes = cn(
    'fixed inset-y-0 right-0 z-[1000] w-full max-w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
    open ? 'translate-x-0' : 'translate-x-full',
  );

  return (
    <>
      <div 
        ref={sidebarRef}
        className={classes} 
        aria-hidden={!open}
        data-media-slider-panel
      >
        <header className="relative flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => sidebarController.close(PANEL_NAME)}
            className="ml-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close media slider</span>
          </button>
        </header>

        <div className="space-y-6 overflow-y-auto px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
            <UploadCloudIcon className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-base font-medium text-slate-900 dark:text-slate-100">
              Upload new media
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              JPG, PNG up to 10MB. Optimized automatically for your tenant.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadCloudIcon className="mr-2 h-4 w-4" />
                    Choose file
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUpload}
                className="hidden"
              />
            </div>
          </div>

          <section aria-live="polite">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Library
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {assets.length} asset{assets.length === 1 ? '' : 's'}
              </span>
            </div>

            {isLoadingAssets ? (
              <div className="mt-4 grid gap-4">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : assets.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <ImageIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Your library is empty
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Upload an image to get started.
                </p>
              </div>
            ) : (
              <div ref={masonryContainerRef} className="mt-4 flex gap-3">
                {masonryColumns.map((column, columnIndex) => (
                  <div key={columnIndex} className="flex-1 space-y-3">
                    {column.map((asset) => {
                      const dimensions = imageDimensions[asset.id];

                      return (
                        <figure
                          key={asset.id}
                          className="group relative cursor-pointer overflow-hidden rounded-lg border border-transparent bg-white shadow-sm transition hover:shadow-lg dark:bg-slate-900/60"
                          onClick={(e) => {
                            // If the click is on the delete button, let it handle it
                            if ((e.target as HTMLElement).closest('button[data-action="delete"]')) {
                              return;
                            }
                            handleSelect(asset);
                          }}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(asset);
                            }}
                            className="block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                          >
                            <img
                              src={asset.displayUrl ?? placeholderUrl}
                              alt="Media asset"
                              className="w-full object-cover"
                              style={
                                dimensions
                                  ? {
                                      aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                                      height: 'auto',
                                    }
                                  : { minHeight: '200px', objectFit: 'cover' }
                              }
                              loading="lazy"
                              onLoad={(e) => handleImageLoad(asset.id, e)}
                            />
                          </button>
                          <div className="pointer-events-none absolute inset-0 flex items-start justify-end bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 transition group-hover:opacity-100">
                            <button
                              type="button"
                              data-action="delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(asset);
                              }}
                              className="pointer-events-auto m-2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
                            >
                              <Trash2Icon className="h-4 w-4" />
                              <span className="sr-only">Delete asset</span>
                            </button>
                          </div>
                        </figure>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => sidebarController.close(PANEL_NAME)}
      />
    </>
  );
};

export default MediaSliderPanel;


