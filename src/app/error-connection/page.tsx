import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ServerOff } from 'lucide-react';
import { appLoadService } from '@/app/core/app-load';

/**
 * Error page shown when connection to Wajooba servers fails
 */
export default function ConnectionErrorPage() {
  const navigate = useNavigate();

  const handleRetry = () => {
    // Clear error state and navigate to homepage which will trigger re-initialization
    appLoadService.clearError();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4 relative pb-32">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            {/* Animated pulsing background */}
            <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/20 animate-ping opacity-75"></div>
            <div className="relative rounded-full bg-red-100 dark:bg-red-900/20 p-6">
              {/* Server icon with animation */}
              <ServerOff className="h-16 w-16 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Connection Error
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          Can't connect to Wajooba servers
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
          Please try again after sometime
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={handleRetry}
            variant="primary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Retry
          </Button>
          
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="lg"
          >
            Go to Homepage
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            If the problem persists, please check your internet connection or contact support.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6 px-4 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto flex flex-col items-center gap-3">
          <img 
            src="https://marksampletest.wajooba.me/assets/images/logos/Wajooba_Logo_w.png" 
            alt="Wajooba Logo" 
            className="h-8 w-auto"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Wajooba. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
