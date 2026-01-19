import { useCallback, useEffect, useMemo, useState } from 'react';
import { environment } from '@/config/environment';
import { useToast } from '@/components/ui/ToastProvider';
import { appLoadService, TenantDetails } from '@/app/core/app-load';
import { MediaAsset } from '@/components/media-slider/types';

const PLACEHOLDER =
  'https://res.cloudinary.com/wajooba/image/upload/c_thumb,h_320,w_480/v1692705773/master/placeholder.jpg';

interface MediaAssetResponse {
  _id?: string;
  id?: string;
  imgUrl?: string;
  originalUrl?: string;
}

const getAuthToken = () => {
  const nameEQ = 'accessToken=';
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i += 1) {
    let c = cookies[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
};

const buildCloudinaryImageUrl = (
  cloudName: string | null,
  publicId?: string,
  width?: number,
  height?: number,
) => {
  if (!cloudName || !publicId) {
    return PLACEHOLDER;
  }
  const cleanPublicId = publicId.startsWith('/') ? publicId.substring(1) : publicId;
  const hasSizing = width && height;
  const transformation = hasSizing ? `/c_fill,h_${height},w_${width}` : '';
  return `https://res.cloudinary.com/${cloudName}/image/upload${transformation}/${cleanPublicId}`;
};

export interface UseMediaSliderServiceResult {
  isLoading: boolean;
  isUploading: boolean;
  fetchAssets: () => Promise<MediaAsset[]>;
  deleteAsset: (asset: MediaAsset) => Promise<void>;
  uploadImage: (file: File) => Promise<any>;
  mapToAsset: (value: MediaAssetResponse) => MediaAsset;
  placeholderUrl: string;
  tenantDetails: TenantDetails | null;
}

export const useMediaSliderService = (): UseMediaSliderServiceResult => {
  const toast = useToast();
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(appLoadService.tenantDetails);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!tenantDetails) {
      appLoadService
        .initAppConfig()
        .then(details => setTenantDetails(details))
        .catch(() => setTenantDetails(null));
    }
  }, [tenantDetails]);

  const mapToAsset = useCallback(
    (value: MediaAssetResponse): MediaAsset => {
      const fallbackId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `media-${Math.random().toString(36).slice(2)}`;
      const id = value._id ?? value.id ?? value.imgUrl ?? fallbackId;
      // Extract the Cloudinary public ID (matches Angular pattern where originalUrl = imgUrl)
      const publicId = value.imgUrl ?? value.originalUrl ?? value.id ?? '';
      return {
        id,
        displayUrl: buildCloudinaryImageUrl(tenantDetails?.cloudName ?? null, publicId, 420, 280),
        originalUrl: buildCloudinaryImageUrl(tenantDetails?.cloudName ?? null, publicId),
        thumbnailUrl: buildCloudinaryImageUrl(tenantDetails?.cloudName ?? null, publicId, 200, 200),
        publicId, // Store the public ID separately for easy access (matches Angular pattern)
      };
    },
    [tenantDetails?.cloudName],
  );

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${environment.api.baseUrl}/edmedia/pmedia`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch media assets');
      }

      const payload = await response.json();
      const items: MediaAssetResponse[] = Array.isArray(payload?.data) ? payload.data : payload?.data?.data ?? [];

      const normalized = (Array.isArray(items) ? items : []).map(mapToAsset);
      return normalized;
    } catch (error) {
      console.error(error);
      toast.error('Unable to load media assets. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mapToAsset, toast]);

  const deleteAsset = useCallback(
    async (asset: MediaAsset) => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${environment.api.baseUrl}/edmedia/asset/${asset.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete media asset');
        }

        toast.success('Media asset removed successfully.');
      } catch (error) {
        console.error(error);
        toast.error('Unable to delete media asset.');
        throw error;
      }
    },
    [toast],
  );

  const uploadImage = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('Authentication required');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('moduleName', 'tasset');

        const response = await fetch(`${environment.api.baseUrl}/edmedia/pmedia/image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const payload = await response.json();
        toast.success('Image uploaded successfully.');
        return payload?.data ?? payload;
      } catch (error) {
        console.error(error);
        toast.error('Unable to upload image. Please try again.');
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [toast],
  );

  const placeholderUrl = useMemo(() => PLACEHOLDER, []);

  return {
    isLoading,
    isUploading,
    fetchAssets,
    deleteAsset,
    uploadImage,
    mapToAsset,
    placeholderUrl,
    tenantDetails,
  };
};


