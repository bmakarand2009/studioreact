'use client';

import { usePreview } from '@/contexts/PreviewContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { Eye, X, User } from 'lucide-react';
import { authService } from '@/services/authService';

export function PreviewModeHeader() {
  const { previewUser, exitPreviewMode } = usePreview();
  const router = useRouter();

  if (!previewUser) return null;

  const handleExitPreview = () => {
    const adminToken = exitPreviewMode();
    // Restore admin token and redirect to admin dashboard
    if (adminToken) {
      authService.accessToken = adminToken;
      router.push('/admin/dashboard');
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Preview Mode
            </span>
            <div className="flex items-center space-x-2 text-sm text-yellow-700 dark:text-yellow-300">
              <User className="h-4 w-4" />
              <span>Viewing as: {previewUser.name}</span>
              <span className="text-yellow-600 dark:text-yellow-400">
                ({previewUser.email})
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitPreview}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-800"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
