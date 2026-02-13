import React, { useEffect, useState } from 'react';
import { uploadService, FileUploadStatus } from '@/services/uploadService';
import { Check, CheckCircle2, AlertCircle, PauseCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress Snackbar Component
 * 
 * Displays upload progress for multiple files in a fixed snackbar at top-right.
 * Shows progress circles, status icons, and auto-closes when all uploads complete.
 */
export function ProgressSnackbar() {
  const [fileStatuses, setFileStatuses] = useState<FileUploadStatus[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to upload status updates
    const unsubscribe = uploadService.onStatusUpdate((statuses) => {
      setFileStatuses(statuses);
      setIsVisible(statuses.length > 0);
    });

    return unsubscribe;
  }, []);

  // Auto-hide when all uploads are completed
  useEffect(() => {
    if (fileStatuses.length > 0 && fileStatuses.every((item) => item.status === 'completed')) {
      const timer = setTimeout(() => {
        uploadService.clear();
        setIsVisible(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fileStatuses]);

  if (!isVisible || fileStatuses.length === 0) {
    return null;
  }

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      document.body.classList.contains('dark');
    
    switch (status) {
      case 'completed':
        return (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0055a6' }}>
            <Check className="h-3 w-3 text-white stroke-[3]" strokeWidth={3} />
          </div>
        );
      case 'failed':
        return <AlertCircle className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-red-600'}`} />;
      default:
        return <PauseCircle className={`h-4 w-4 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />;
    }
  };

  const getCircleBackground = (progress: number): string => {
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark') || 
                      document.body.classList.contains('dark');
    
    if (progress < 0) {
      // Failed state - red for error
      return isDarkMode 
        ? 'conic-gradient(#ef4444 0% 100%, #0055a6 100% 100%)'
        : 'conic-gradient(#ef4444 0% 100%, #f3f4f6 100% 100%)';
    }
    
    // Invert colors for dark mode: white progress on blue background
    if (isDarkMode) {
      return `conic-gradient(#ffffff 0% ${progress}%, #0055a6 ${progress}% 100%)`;
    }
    
    // Light mode: blue progress on white background
    return `conic-gradient(#0055a6 0% ${progress}%, #f3f4f6 ${progress}% 100%)`;
  };

  const getStatusText = (status: FileUploadStatus['status'], progress: number): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return `Uploading ${Math.max(0, Math.min(100, progress))}%`;
    }
  };

  const handleClose = () => {
    uploadService.clear();
    setIsVisible(false);
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col min-h-[120px] max-h-[320px]">
        {/* Scrollable content - stable height prevents scrollbar pop-in/out */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 pt-4 space-y-2"
          style={{ scrollbarGutter: 'stable' }}
        >
          {fileStatuses.map((file) => (
            <div
              key={file.uuid}
              className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 shrink-0"
            >
              <span
                className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate mr-3"
                title={file.filename}
              >
                {file.filename}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {/* Progress Circle with Tooltip */}
                <div className="relative w-7 h-7 flex items-center justify-center group">
                  <div
                    className="w-7 h-7 rounded-full cursor-pointer"
                    style={{
                      background: getCircleBackground(file.progress),
                    }}
                    title={getStatusText(file.status, file.progress)}
                  />
                  <div className="absolute flex items-center justify-center bg-white dark:bg-slate-800 rounded-full" style={{ width: '20px', height: '20px' }}>
                    {getStatusIcon(file.status)}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {getStatusText(file.status, file.progress)}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-slate-900 dark:border-t-slate-700"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hide button at bottom - no footer styling */}
        <div className="flex justify-end p-3 shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgressSnackbar;
