import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { XIcon, UploadCloudIcon, Trash2Icon, Loader2Icon, ImageIcon } from 'lucide-react';
import { sidebarController, SidebarPayload } from '@/services/sidebarControllerService';
import { useMediaSliderContext } from './MediaSliderProvider';
import { GroupedMediaRow, MediaAsset } from './types';
import { groupImagesIntoRows } from './utils';
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const latestOptionsRef = useRef<MediaSliderOptions | null>(null);

  const loadAssets = useCallback(async () => {
    setIsLoadingAssets(true);
    try {
      const result = await fetchAssets();
      setAssets(result);
    } finally {
      setIsLoadingAssets(false);
    }
  }, [fetchAssets]);

  const handleSidebarChange = useCallback(
    (payload: SidebarPayload<MediaSliderOptions>) => {
      if (payload.name !== PANEL_NAME) {
        return;
      }
      setOpen(payload.open);
      const data = payload.data ?? null;
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

  const groupedRows = useMemo<GroupedMediaRow[]>(() => {
    return groupImagesIntoRows(assets);
  }, [assets]);

  const handleSelect = useCallback(
    (asset: MediaAsset) => {
      latestOptionsRef.current?.onSelect?.(asset);
      window.dispatchEvent(
        new CustomEvent('media-slider:select', {
          detail: asset,
        }),
      );
      sidebarController.close(PANEL_NAME);
    },
    [],
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
        await uploadImage(file);
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
      <div className={classes} aria-hidden={!open}>
        <header className="relative flex items-start justify-between px-6 pb-4 pt-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {tenantDetails?.name ?? 'Wajooba'}
            </p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => sidebarController.close(PANEL_NAME)}
            className="ml-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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
              <div className="mt-4 space-y-4">
                {groupedRows.map((row) => (
                  <div
                    key={`${row.columns}-${row.items[0]?.id}`}
                    className="grid gap-3"
                    style={{ gridTemplateColumns: `repeat(${row.columns}, minmax(0, 1fr))` }}
                  >
                    {row.items.map((asset) => (
                      <figure
                        key={asset.id}
                        className="group relative overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg dark:bg-slate-900/60"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelect(asset)}
                          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                        >
                          <img
                            src={asset.displayUrl ?? placeholderUrl}
                            alt="Media asset"
                            className="h-32 w-full object-cover"
                            loading="lazy"
                          />
                        </button>
                        <div className="absolute inset-0 flex items-start justify-end bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => handleDelete(asset)}
                            className="m-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                          >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Delete asset</span>
                          </button>
                        </div>
                      </figure>
                    ))}
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


