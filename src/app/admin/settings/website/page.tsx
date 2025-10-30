

import { withRole } from '@/components/guards/withRole';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Globe, 
  ArrowLeft, 
  Search, 
  Link as LinkIcon,
  Image,
  Palette,
  CheckCircle
} from 'lucide-react';
import { Button, Input, Textarea, Switch } from '@/components/ui';
import Link from '@/shims/next-link';

const websiteSchema = z.object({
  customDomain: z.string().optional(),
  websiteTitle: z.string().min(1, 'Website title is required'),
  websiteDescription: z.string().min(1, 'Website description is required'),
  keywords: z.string().optional(),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().min(1, 'Primary color is required'),
  enableCustomDomain: z.boolean(),
  enableSEO: z.boolean(),
  enableAnalytics: z.boolean(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional()
});

type WebsiteFormData = z.infer<typeof websiteSchema>;

function WebsiteSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const form = useForm<WebsiteFormData>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      customDomain: '',
      websiteTitle: 'Wajooba Learning Management System',
      websiteDescription: 'Professional learning management system for educational institutions',
      keywords: 'LMS, education, learning, courses, online learning',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#0055a6',
      enableCustomDomain: false,
      enableSEO: true,
      enableAnalytics: false,
      googleAnalyticsId: '',
      facebookPixelId: ''
    }
  });

  const { register, handleSubmit, formState: { errors, isDirty }, setValue, watch } = form;

  const watchedValues = watch();

  const onSubmit = async (data: WebsiteFormData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Website Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure your website appearance and SEO settings
                </p>
              </div>
            </div>
            <Link href="/admin/settings">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Website settings saved successfully!</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Website Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Website Information
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Website Title"
                  {...register('websiteTitle')}
                  error={errors.websiteTitle?.message}
                  placeholder="Enter website title"
                  icon={<Globe className="h-4 w-4" />}
                />

                <Input
                  label="Primary Color"
                  {...register('primaryColor')}
                  error={errors.primaryColor?.message}
                  placeholder="#0055a6"
                  type="color"
                  icon={<Palette className="h-4 w-4" />}
                />
              </div>

              <Textarea
                label="Website Description"
                {...register('websiteDescription')}
                error={errors.websiteDescription?.message}
                placeholder="Enter a brief description of your website"
                rows={3}
              />

              <Textarea
                label="SEO Keywords"
                {...register('keywords')}
                error={errors.keywords?.message}
                placeholder="Enter keywords separated by commas"
                rows={2}
                icon={<Search className="h-4 w-4" />}
              />
            </form>
          </div>

          {/* Domain & Branding */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
              Domain & Branding
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enable Custom Domain</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use your own domain instead of the default subdomain</p>
                </div>
                <Switch
                  checked={watchedValues.enableCustomDomain}
                  onCheckedChange={(checked) => setValue('enableCustomDomain', checked)}
                />
              </div>

              {watchedValues.enableCustomDomain && (
                <Input
                  label="Custom Domain"
                  {...register('customDomain')}
                  error={errors.customDomain?.message}
                  placeholder="yourdomain.com"
                  icon={<LinkIcon className="h-4 w-4" />}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Logo URL"
                  {...register('logoUrl')}
                  error={errors.logoUrl?.message}
                  placeholder="https://example.com/logo.png"
                  icon={<Image className="h-4 w-4" />}
                />

                <Input
                  label="Favicon URL"
                  {...register('faviconUrl')}
                  error={errors.faviconUrl?.message}
                  placeholder="https://example.com/favicon.ico"
                  icon={<Image className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>

          {/* SEO & Analytics */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
              SEO & Analytics
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enable SEO Features</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Optimize your website for search engines</p>
                </div>
                <Switch
                  checked={watchedValues.enableSEO}
                  onCheckedChange={(checked) => setValue('enableSEO', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Enable Analytics</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track website performance and user behavior</p>
                </div>
                <Switch
                  checked={watchedValues.enableAnalytics}
                  onCheckedChange={(checked) => setValue('enableAnalytics', checked)}
                />
              </div>

              {watchedValues.enableAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Google Analytics ID"
                    {...register('googleAnalyticsId')}
                    error={errors.googleAnalyticsId?.message}
                    placeholder="G-XXXXXXXXXX"
                    icon={<Search className="h-4 w-4" />}
                  />

                  <Input
                    label="Facebook Pixel ID"
                    {...register('facebookPixelId')}
                    error={errors.facebookPixelId?.message}
                    placeholder="XXXXXXXXXX"
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                className="min-w-[120px]"
                onClick={handleSubmit(onSubmit)}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(WebsiteSettingsPage, { allowedRoles: ['ROLE_ADMIN', 'ROLE_STAFF'] });
