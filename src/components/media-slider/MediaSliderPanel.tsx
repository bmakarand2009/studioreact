import { useCallback, useEffect, useRef, useState } from 'react';
import { XIcon, Trash2Icon, ImageIcon } from 'lucide-react';
import { sidebarController, SidebarPayload } from '@/services/sidebarControllerService';
import { useMediaSliderContext } from './MediaSliderProvider';
import { MediaAsset } from './types';
import { MediaSliderOpenOptions } from '@/hooks/useMediaSlider';
import { cn } from '@/utils/cn';
import { UploadMediaFile } from '@/components/upload-media-file';
import { Button } from '@/components/ui/Button';
import { uploadService, FileUploadStatus } from '@/services/uploadService';

type MediaSliderOptions = MediaSliderOpenOptions;

const PANEL_NAME = 'mediaSlider';
export const MediaSliderPanel = () => {
  const {
    fetchAssets,
    deleteAsset,
    placeholderUrl,
  } = useMediaSliderContext();

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<MediaSliderOptions | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [masonryColumns, setMasonryColumns] = useState<MediaAsset[][]>([[], []]);
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

  const handleTestProgress = useCallback(() => {
    const timestamp = Date.now();
    // Create test upload statuses
    const testFile1: FileUploadStatus = {
      filename: 'test-image-1.jpg',
      progress: 0,
      hash: '',
      uuid: `test_${timestamp}_1`,
      upload: null,
      status: 'uploading',
    };
    
    const testFile2: FileUploadStatus = {
      filename: 'test-video-1.mp4',
      progress: 25,
      hash: '',
      uuid: `test_${timestamp}_2`,
      upload: null,
      status: 'uploading',
    };
    
    const testFile3: FileUploadStatus = {
      filename: 'test-audio-1.mp3',
      progress: 100,
      hash: '',
      uuid: `test_${timestamp}_3`,
      upload: null,
      status: 'completed',
    };

    // Add test files to upload service
    uploadService.updateFileStatus(testFile1);
    uploadService.updateFileStatus(testFile2);
    uploadService.updateFileStatus(testFile3);

    // Simulate slow progress updates to keep snackbar visible for at least 1 minute
    let progress1 = 0;
    let progress2 = 25;
    
    // Update file 1: very slow progress (will take ~60 seconds to reach 99%, then stays at 99% until cleared)
    // Increment by ~1.65% every second to reach 99% in ~60 seconds, then stop
    const interval1 = setInterval(() => {
      progress1 += 1.65;
      if (progress1 >= 99) {
        // Keep it at 99% to prevent auto-hide, will be cleared after 1 minute
        uploadService.updateFileStatus({
          ...testFile1,
          progress: 99,
          status: 'uploading',
        });
      } else {
        uploadService.updateFileStatus({
          ...testFile1,
          progress: Math.round(progress1),
          status: 'uploading',
        });
      }
    }, 1000); // Update every 1 second

    // Update file 2: slower progress (will complete in ~25 seconds)
    const interval2 = setInterval(() => {
      progress2 += 3;
      if (progress2 >= 100) {
        uploadService.updateFileStatus({
          ...testFile2,
          progress: 100,
          status: 'completed',
        });
        clearInterval(interval2);
      } else {
        uploadService.updateFileStatus({
          ...testFile2,
          progress: progress2,
          status: 'uploading',
        });
      }
    }, 1000); // Update every 1 second

    // Clear test uploads after 1 minute (60000ms)
    // This ensures the snackbar stays visible for the full minute
    setTimeout(() => {
      clearInterval(interval1);
      clearInterval(interval2);
      uploadService.clear();
    }, 60000);
  }, []);

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
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestProgress}
              className="text-xs"
            >
              Test Progress
            </Button>
            <button
              type="button"
              onClick={() => sidebarController.close(PANEL_NAME)}
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close media slider</span>
            </button>
          </div>
        </header>

        <div className="space-y-6 overflow-y-auto px-6 pb-6">
          <UploadMediaFile
            title="Upload new media"
            isSingleUploadBlock={true}
            moduleName="tasset"
            allowMultipleUploads={false}
            helpText="JPG, PNG up to 10MB. Optimized automatically for your tenant."
            onOutput={(data) => {
              if (data === 'refresh') {
                loadAssets();
              } else if (data?.type === 'image' && data?.value && latestOptionsRef.current?.onSelect) {
                // If image was uploaded, call the onSelect callback
                latestOptionsRef.current.onSelect(data.value);
                sidebarController.close(PANEL_NAME);
              }
            }}
          />

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


