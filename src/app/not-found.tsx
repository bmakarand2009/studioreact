'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Home, ArrowLeft, Search, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        {/* 404 Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900 rounded-full mb-4">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700">404</h1>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button 
            variant="primary" 
            size="lg" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
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
            Need help? Try these options:
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <Link to="/courses" className="text-primary hover:text-primary-dark transition-colors">
              Browse Courses
            </Link>
            <Link to="/contact" className="text-primary hover:text-primary-dark transition-colors">
              Contact Support
            </Link>
            <Link to="/help" className="text-primary hover:text-primary-dark transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
