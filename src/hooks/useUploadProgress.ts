import { useEffect, useState } from 'react';
import { uploadService, FileUploadStatus } from '@/services/uploadService';

/**
 * Hook to track upload progress
 * 
 * @returns Current upload statuses and utility functions
 */
export function useUploadProgress() {
  const [statuses, setStatuses] = useState<FileUploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Initial load
    setStatuses(uploadService.getUploadStatuses());
    setIsUploading(uploadService.isUploading);

    // Subscribe to updates
    const unsubscribe = uploadService.onStatusUpdate((newStatuses: FileUploadStatus[]) => {
      setStatuses(newStatuses);
      setIsUploading(uploadService.isUploading);
    });

    return unsubscribe;
  }, []);

  return {
    statuses,
    isUploading,
    clear: (all?: boolean) => uploadService.clear(all),
    deleteUpload: (uuid: string) => uploadService.deleteUpload(uuid),
  };
}
