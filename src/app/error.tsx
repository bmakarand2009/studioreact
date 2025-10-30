

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong!
          </h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={reset}
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          
          <Link to="/" className="block">
            <Button variant="ghost" size="lg" className="w-full">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            If this error continues, please:
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/contact" className="text-primary hover:text-primary-dark transition-colors">
              Contact Support
            </Link>
            <Link to="/help" className="text-primary hover:text-primary-dark transition-colors">
              Check Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
