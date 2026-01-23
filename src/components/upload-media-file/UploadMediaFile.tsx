import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadService } from '@/services/uploadService';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { UploadMediaFileProps, MediaType, AssetData, UploadPayload } from '@/types/upload';
import {
  CirclePlus,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  FileText as DescriptionIcon,
  Delete,
  Download,
  Copy,
  PlayCircle,
  UploadCloud as UploadCloudIcon,
  Loader2 as Loader2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Available file MIME types for different media types
 */
const AVAILABLE_FILE_MIME_TYPES: Record<string, string[]> = {
  video: [
    'video/mp4',
    'video/x-matroska',
    'video/3gpp',
    'video/x-flv',
    'video/MP2T',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-ms-wmv',
    'application/x-mpegURL',
  ],
  audio: [
    'audio/x-m4a',
    'audio/flac',
    'audio/mpeg',
    'audio/wav',
    'audio/x-ms-wma',
    'audio/aac',
    'audio/vnd.dlna.adts',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/vnd.adobe.photoshop',
    'image/x-raw',
    'image/bmp',
    'image/svg+xml',
  ],
  pdf: ['application/pdf'],
};

/**
 * Upload Media File Component
 * 
 * A comprehensive upload component that supports:
 * - Video uploads (via Bunny CDN)
 * - Image uploads (via Cloudinary)
 * - Audio uploads (via S3)
 * - PDF uploads (via S3)
 * - Link uploads (YouTube/Vimeo)
 * - Description (rich text)
 * 
 * Features:
 * - Multiple file support
 * - Progress tracking
 * - Preview functionality
 * - Delete functionality
 * - Download support
 */
export function UploadMediaFile({
  title = 'Add Media',
  helpText = '',
  moduleName = '',
  allowMultipleUploads = false,
  buttonName = 'Upload Files',
  assetData = [],
  isUploadDisabled = false,
  isStudentFile = false,
  isFranchiseCourse = false,
  imageUrl = '',
  description = null,
  showPreview = true,
  isShowScorm = false,
  isSingleUploadBlock = false,
  horizontalPosition = 'start',
  width = '100%',
  isDownloadable = false,
  productData = {},
  allowedMedia = ['video', 'audio', 'image', 'pdf', 'link', 'description'],
  onOutput,
}: UploadMediaFileProps) {
  const [enableDescription, setEnableDescription] = useState(!!description);
  const [descriptionValue, setDescriptionValue] = useState(description || '');
  const [linkValue, setLinkValue] = useState('');
  const [linkPreview, setLinkPreview] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isDescriptionLoading, setIsDescriptionLoading] = useState(false);
  const [dynamicPreviewUpdates, setDynamicPreviewUpdates] = useState<Record<string, string>>({});
  const [playVideoStates, setPlayVideoStates] = useState<Record<string, boolean>>({});
  const assetDataRef = useRef<string>('');

  const { statuses } = useUploadProgress();

  // File input refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    };

    if (showUploadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadMenu]);

  /**
   * Sanitize YouTube/Vimeo URL for iframe
   */
  const sanitizeYoutubeUrl = useCallback((url: string): string | null => {
    if (!url) return null;
    
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/)(?:.*\/)?(\d+)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
  }, []);

  // Process assets using useMemo to avoid infinite loops
  // Create a stable key from assetData to detect actual changes
  const assetDataKey = useMemo(() => JSON.stringify(assetData.map(a => ({
    _id: a._id,
    mediaType: a.mediaType,
    fileName: a.fileName,
    videoStatus: a.videoStatus,
    thumbnailUrl: a.thumbnailUrl,
    previewUrl: a.previewUrl,
  }))), [assetData]);
  
  // Base processed assets (without dynamic updates)
  const baseProcessedAssets = useMemo(() => {
    return assetData.map((asset) => {
      const processedAsset = { ...asset };
      
      if (asset.mediaType === 'video') {
        if (asset.videoStatus !== 'Finished') {
          processedAsset.dynamicPreview = 'https://res.cloudinary.com/wajooba/image/upload/v1727274438/master/Encoding.gif';
        } else {
          processedAsset.dynamicPreview = asset.thumbnailUrl;
        }
      }
      
      if (asset.mediaType === 'link') {
        processedAsset.url = sanitizeYoutubeUrl(asset.fileName) || undefined;
      }
      
      return processedAsset;
    });
  }, [assetDataKey, sanitizeYoutubeUrl]);
  
  // Merge base assets with dynamic preview updates
  const processedAssets = useMemo(() => {
    return baseProcessedAssets.map((asset) => {
      if (dynamicPreviewUpdates[asset._id]) {
        return { ...asset, dynamicPreview: dynamicPreviewUpdates[asset._id] };
      }
      return asset;
    });
  }, [baseProcessedAssets, dynamicPreviewUpdates]);

  // Description debounce handler
  useEffect(() => {
    if (!enableDescription) return;

    const timer = setTimeout(() => {
      if (descriptionValue !== description) {
        sendTextualResources('description', descriptionValue);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [descriptionValue, description, enableDescription]);

  /**
   * Generate upload payload
   */
  const generatePayload = useCallback(
    (fileName: string, mediaType: MediaType): UploadPayload => {
      return {
        mediaType,
        fileName,
        productType: moduleName,
        productId: productData?.productId || 'na',
        questionId: productData?.questionId || '',
        productName: productData?.productName || moduleName,
        chapterId: productData?.chapterId || '',
        sectionId: productData?.sectionId || '',
        isDownloadable,
        isHomework: productData?.isHomework || false,
        sequence: 1,
      };
    },
    [moduleName, productData, isDownloadable]
  );

  /**
   * Get media type from file
   */
  const getMediaType = useCallback((file: File): MediaType => {
    for (const [type, mimeTypes] of Object.entries(AVAILABLE_FILE_MIME_TYPES)) {
      if (mimeTypes.includes(file.type)) {
        return type as MediaType;
      }
    }
    return 'other';
  }, []);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const files = Array.from(event.target.files);
      
      for (const file of files) {
        const mediaType = getMediaType(file);
        const payload = generatePayload(file.name, mediaType);

        try {
          switch (mediaType) {
            case 'video':
              if (isDownloadable) {
                await uploadService.uploadFile(file, payload, (data) => {
                  onOutput?.(data);
                });
              } else {
                await uploadService.uploadVideo(file, payload, (data) => {
                  onOutput?.(data);
                });
              }
              break;
            case 'image':
              if (isDownloadable) {
                await uploadService.uploadFile(file, payload, (data) => {
                  onOutput?.(data);
                });
              } else {
                await uploadService.uploadImage(file, moduleName, (data) => {
                  onOutput?.(data);
                });
              }
              break;
            default:
              await uploadService.uploadFile(file, payload, (data) => {
                onOutput?.(data);
              });
          }
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Reset input
      event.target.value = '';
    },
    [getMediaType, generatePayload, isDownloadable, moduleName, onOutput]
  );

  /**
   * Handle link upload
   */
  const handleLinkUpload = useCallback(async () => {
    if (!linkValue.trim()) return;

    const payload = generatePayload(linkValue, 'link');
    try {
      await uploadService.uploadLink(payload, (data) => {
        onOutput?.(data);
        setShowLinkDialog(false);
        setLinkValue('');
        setLinkPreview(null);
      });
    } catch (error) {
      console.error('Error uploading link:', error);
    }
  }, [linkValue, generatePayload, onOutput]);

  /**
   * Handle link input change
   */
  const handleLinkChange = useCallback((value: string) => {
    setLinkValue(value);
    setLinkPreview(sanitizeYoutubeUrl(value));
  }, []);

  /**
   * Send textual resources (description/image)
   */
  const sendTextualResources = useCallback(
    async (type: 'description' | 'image', value: string) => {
      setIsDescriptionLoading(true);
      uploadService.setLoading({ description: true });
      
      const payload = { type, value };
      onOutput?.(payload);
      
      setTimeout(() => {
        setIsDescriptionLoading(false);
        uploadService.setLoading({ description: false });
      }, 500);
    },
    [onOutput]
  );

  /**
   * Delete asset
   */
  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      if (!confirm('Are you sure you want to delete this asset?')) return;

      try {
        await uploadService.deleteAsset(assetId);
        onOutput?.('refresh');
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset');
      }
    },
    [onOutput]
  );

  /**
   * Delete description
   */
  const handleDeleteDescription = useCallback(() => {
    sendTextualResources('description', '');
    setEnableDescription(false);
    setDescriptionValue('');
  }, [sendTextualResources]);

  /**
   * Download asset
   */
  const handleDownload = useCallback((url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  }, []);

  /**
   * Copy to clipboard
   */
  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to show a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);


  /**
   * Get video embed URL
   */
  const getVideoEmbedUrl = (asset: AssetData): string => {
    if (asset.libraryId && asset.videoId) {
      return `https://iframe.mediadelivery.net/embed/${asset.libraryId}/${asset.videoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`;
    }
    return '';
  };

  /**
   * Check if control should be shown
   */
  const showControl = (control: MediaType): boolean => {
    return allowedMedia.includes(control);
  };

  /**
   * Handle video hover
   */
  const handleVideoHover = useCallback((assetId: string) => {
    const asset = assetData.find((a) => a._id === assetId);
    if (asset?.videoStatus === 'Finished' && asset.previewUrl) {
      setDynamicPreviewUpdates((prev) => ({
        ...prev,
        [assetId]: asset.previewUrl!,
      }));
    }
  }, [assetData]);

  /**
   * Handle video leave
   */
  const handleVideoLeave = useCallback((assetId: string) => {
    const asset = assetData.find((a) => a._id === assetId);
    if (asset?.videoStatus === 'Finished' && asset.thumbnailUrl) {
      setDynamicPreviewUpdates((prev) => {
        const updates = { ...prev };
        // Remove the dynamic update to fall back to thumbnail
        delete updates[assetId];
        return updates;
      });
    }
  }, [assetData]);

  /**
   * Handle video click
   */
  const handleVideoClick = useCallback((assetId: string) => {
    setPlayVideoStates((prev) => ({ ...prev, [assetId]: true }));
  }, []);

  // Render single upload block (similar to media slider)
  if (isSingleUploadBlock) {
    const isUploading = statuses.some((s) => s.status === 'uploading');
    
    return (
      <div className="flex flex-col gap-4" style={{ width }}>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <UploadCloudIcon className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-base font-medium text-slate-900 dark:text-slate-100">
            {title || 'Upload new media'}
          </h3>
          {helpText && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {helpText}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              hidden
              multiple={allowMultipleUploads}
              accept="image/*"
              onChange={handleFileUpload}
            />
            <Button
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadDisabled || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloudIcon className="mr-2 h-4 w-4" />
                  {buttonName || 'Choose file'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" style={{ width }}>
      {/* Upload Button */}
      <div className="flex flex-col">
        <div className="relative" ref={menuRef}>
          <Button
            variant="ghostSecondary"
            disabled={isUploadDisabled}
            className="flex items-center gap-2 p-0"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
          >
            <CirclePlus className="h-5 w-5 text-brand-500" />
            <span>{title}</span>
          </Button>
          
          {/* Upload Menu */}
          {showUploadMenu && (
            <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
            {showControl('description') && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                disabled={isUploadDisabled}
                onClick={() => {
                  setEnableDescription(true);
                  setShowUploadMenu(false);
                }}
              >
                <DescriptionIcon className="h-4 w-4" />
                <span>Description</span>
              </button>
            )}

            {showControl('image') && (
              <>
                <input
                  ref={imageInputRef}
                  type="file"
                  hidden
                  multiple={allowMultipleUploads}
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isUploadDisabled}
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>Upload Image</span>
                </button>
              </>
            )}

            {showControl('video') && (
              <>
                <input
                  ref={videoInputRef}
                  type="file"
                  hidden
                  multiple={allowMultipleUploads}
                  accept="video/*"
                  onChange={handleFileUpload}
                />
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isUploadDisabled}
                  onClick={() => {
                    videoInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                >
                  <Video className="h-4 w-4" />
                  <span>Upload Video</span>
                </button>
              </>
            )}

            {showControl('audio') && (
              <>
                <input
                  ref={audioInputRef}
                  type="file"
                  hidden
                  multiple={allowMultipleUploads}
                  accept="audio/*"
                  onChange={handleFileUpload}
                />
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isUploadDisabled}
                  onClick={() => {
                    audioInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                >
                  <Music className="h-4 w-4" />
                  <span>Upload Audio</span>
                </button>
              </>
            )}

            {showControl('pdf') && (
              <>
                <input
                  ref={pdfInputRef}
                  type="file"
                  hidden
                  multiple={allowMultipleUploads}
                  accept="application/pdf"
                  onChange={handleFileUpload}
                />
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isUploadDisabled}
                  onClick={() => {
                    pdfInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Upload PDF</span>
                </button>
              </>
            )}

            {showControl('link') && (
              <button
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                disabled={isUploadDisabled}
                onClick={() => {
                  setShowLinkDialog(true);
                  setShowUploadMenu(false);
                }}
              >
                <LinkIcon className="h-4 w-4" />
                <span>Link</span>
              </button>
            )}

            {showControl('other') && (
              <>
                <input
                  ref={otherInputRef}
                  type="file"
                  hidden
                  onChange={handleFileUpload}
                />
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                  disabled={isUploadDisabled}
                  onClick={() => {
                    otherInputRef.current?.click();
                    setShowUploadMenu(false);
                  }}
                >
                  <FileText className="h-4 w-4" />
                  <span>Other</span>
                </button>
              </>
            )}
            </div>
          )}
        </div>
        {helpText && <p className="text-sm text-gray-600 mt-1 ml-8">{helpText}</p>}
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLinkDialog(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            {linkPreview && (
              <div className="mb-4 aspect-video">
                <iframe
                  src={linkPreview}
                  className="w-full h-full rounded"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                />
              </div>
            )}
            <textarea
              className="w-full p-2 border rounded mb-4 min-h-[100px]"
              placeholder="Paste YouTube or Vimeo link here (e.g., https://www.youtube.com/watch?v=abcxyz)"
              value={linkValue}
              onChange={(e) => handleLinkChange(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => {
                setShowLinkDialog(false);
                setLinkValue('');
                setLinkPreview(null);
              }}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleLinkUpload} disabled={!linkValue.trim()}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Section */}
      <div className="flex flex-col gap-4 w-full">
        {/* Description */}
        {showControl('description') && enableDescription && (
          <div className="border border-gray-200 rounded-lg">
            {showPreview && (
              <div className="p-4 bg-blue-50 rounded-t-lg">
                <textarea
                  className="w-full min-h-[100px] p-2 border rounded"
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  placeholder="Enter description..."
                />
              </div>
            )}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded">
                  <DescriptionIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Description</p>
                  {isDescriptionLoading && (
                    <div className="w-32 h-1 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              {!isUploadDisabled && (
                <Button variant="ghost" size="icon" onClick={handleDeleteDescription}>
                  <Delete className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Static Image */}
        {showControl('image') && imageUrl && (
          <div className="border border-gray-200 rounded-lg">
            {showPreview && (
              <div className="p-4">
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="rounded max-w-[200px]"
                />
              </div>
            )}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium">Image</span>
              </div>
              {!isUploadDisabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => sendTextualResources('image', '')}
                >
                  <Delete className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Asset List */}
        {processedAssets.map((asset) => (
          <AssetPreview
            key={asset._id}
            asset={asset}
            showPreview={showPreview}
            isDownloadable={isDownloadable}
            isUploadDisabled={isUploadDisabled}
            onDelete={handleDeleteAsset}
            onDownload={handleDownload}
            onCopy={handleCopy}
            onVideoHover={handleVideoHover}
            onVideoLeave={handleVideoLeave}
            onVideoClick={handleVideoClick}
            playVideo={playVideoStates[asset._id] || false}
            getVideoEmbedUrl={getVideoEmbedUrl}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Asset Preview Component
 */
interface AssetPreviewProps {
  asset: AssetData;
  showPreview: boolean;
  isDownloadable: boolean;
  isUploadDisabled: boolean;
  onDelete: (id: string) => void;
  onDownload: (url: string) => void;
  onCopy: (text: string) => void;
  onVideoHover: (id: string) => void;
  onVideoLeave: (id: string) => void;
  onVideoClick: (id: string) => void;
  playVideo: boolean;
  getVideoEmbedUrl: (asset: AssetData) => string;
}

function AssetPreview({
  asset,
  showPreview,
  isDownloadable,
  isUploadDisabled,
  onDelete,
  onDownload,
  onCopy,
  onVideoHover,
  onVideoLeave,
  onVideoClick,
  playVideo,
  getVideoEmbedUrl,
}: AssetPreviewProps) {
  const getIcon = () => {
    switch (asset.mediaType) {
      case 'video':
        return <Video className="h-5 w-5 text-orange-600" />;
      case 'audio':
        return <Music className="h-5 w-5 text-green-600" />;
      case 'image':
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'link':
        return <LinkIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getIconBg = () => {
    switch (asset.mediaType) {
      case 'video':
        return 'bg-orange-100';
      case 'audio':
        return 'bg-green-100';
      case 'image':
        return 'bg-purple-100';
      case 'pdf':
        return 'bg-red-100';
      case 'link':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Video Preview */}
      {asset.mediaType === 'video' && showPreview && (
        <div className="relative">
          {!playVideo ? (
            <div
              className="relative w-full aspect-video cursor-pointer"
              onMouseEnter={() => onVideoHover(asset._id)}
              onMouseLeave={() => onVideoLeave(asset._id)}
              onClick={() => onVideoClick(asset._id)}
            >
              <img
                src={asset.dynamicPreview || asset.thumbnailUrl}
                alt="Video preview"
                className="w-full h-full object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video">
              <iframe
                src={getVideoEmbedUrl(asset)}
                className="w-full h-full rounded-t-lg"
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              />
            </div>
          )}
        </div>
      )}

      {/* Image Preview */}
      {asset.mediaType === 'image' && showPreview && asset.s3url && (
        <div className="p-4">
          <img src={asset.s3url} alt={asset.fileName} className="rounded max-w-[200px]" />
        </div>
      )}

      {/* Audio Preview */}
      {asset.mediaType === 'audio' && showPreview && asset.s3url && (
        <div className="p-4">
          <audio controls className="w-full">
            <source src={asset.s3url} />
          </audio>
        </div>
      )}

      {/* PDF Preview */}
      {asset.mediaType === 'pdf' && showPreview && asset.s3url && (
        <div className="w-full h-80">
          <iframe src={asset.s3url} className="w-full h-full rounded-t-lg" />
        </div>
      )}

      {/* Link Preview */}
      {asset.mediaType === 'link' && showPreview && asset.url && (
        <div className="w-full aspect-video">
          <iframe
            src={asset.url}
            className="w-full h-full rounded-t-lg"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        </div>
      )}

      {/* Asset Details */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded', getIconBg())}>{getIcon()}</div>
          <div>
            <p className="font-medium capitalize">{asset.mediaType}</p>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-600 truncate max-w-[200px]">{asset.fileName}</p>
              {(asset.videoId || asset.mediaType === 'link') && (
                <button
                  onClick={() => onCopy(asset.videoId || asset.fileName || '')}
                  className="text-brand-500 hover:text-brand-600"
                  title="Copy ID"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isUploadDisabled && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(asset._id)}>
              <Delete className="h-4 w-4" />
            </Button>
          )}
          {isDownloadable && asset.downloadUrl && (
            <Button variant="ghost" size="icon" onClick={() => onDownload(asset.downloadUrl!)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadMediaFile;
