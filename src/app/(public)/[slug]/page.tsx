import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { appLoadService, Web } from '@/app/core/app-load';

/**
 * Dynamic public page component that renders content based on tenant web configuration
 */
export default function DynamicPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [pageData, setPageData] = useState<Web | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true);
        // Try to get cached tenant details first, otherwise initialize
        let tenantDetails = appLoadService.tenantDetails;
        if (!tenantDetails) {
          tenantDetails = await appLoadService.initAppConfig();
        }
        
        if (tenantDetails?.web && Array.isArray(tenantDetails.web)) {
          const page = tenantDetails.web.find(
            (item: Web) => item.url === slug || item.name === slug
          );
          
          if (page) {
            setPageData(page);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Failed to load page data:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadPageData();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !pageData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Handle external links - redirect if needed
  useEffect(() => {
    if (pageData?.isExternalLink && pageData.externalLink) {
      window.location.href = pageData.externalLink;
    }
  }, [pageData]);

  if (pageData?.isExternalLink && pageData.externalLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        {pageData.header && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {pageData.header}
            </h1>
          </div>
        )}

        {/* Sub Header */}
        {pageData.subHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {pageData.subHeader}
            </h2>
          </div>
        )}

        {/* Title (fallback if no header) */}
        {!pageData.header && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              {pageData.title}
            </h1>
          </div>
        )}

        {/* Content placeholder - This can be enhanced with actual content from API */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            Content for {pageData.title} page will be displayed here.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
            Page URL: /{pageData.url} | Name: {pageData.name}
          </p>
        </div>

        {/* Footer */}
        {pageData.footer && (
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">{pageData.footer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
