'use client';

import { withRole } from '@/components/guards/withRole';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  ArrowLeft, 
  Copy, 
  Home, 
  Mail, 
  Phone,
  Building,
  MapPin,
  Globe,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import Link from '@/shims/next-link';

const accountSchema = z.object({
  name: z.string().min(1, 'Organization Name is required'),
  accountOwner: z.string().min(1, 'Account Owner is required'),
  fromEmailName: z.string().min(1, 'Email Name is required'),
  fromEmail: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  address_line1: z.string().min(1, 'Street address is required'),
  address_city: z.string().min(1, 'City is required'),
  address_state: z.string().min(1, 'State is required'),
  address_zip: z.string().min(1, 'ZIP code is required'),
  address_country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  dateFormat: z.string().min(1, 'Date format is required'),
  currency: z.string().min(1, 'Currency is required')
});

type AccountFormData = z.infer<typeof accountSchema>;

function AccountSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    orgId: 'marksampletest',
    isMasterFranchise: false
  });
  const [adminList, setAdminList] = useState([
    { id: '1', fullName: 'Admin User' }
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: 'Sample Organization',
      accountOwner: '1',
      fromEmailName: 'Admin',
      fromEmail: 'admin@example.com',
      phone: '+1-555-0123',
      address_line1: '123 Main Street',
      address_city: 'New York',
      address_state: 'NY',
      address_zip: '10001',
      address_country: 'US',
      timezone: 'America/New_York',
      dateFormat: 'MM/dd/YYYY',
      currency: 'USD'
    }
  });

  const watchedValues = watch();

  const handleCopyOrgId = () => {
    navigator.clipboard.writeText(accountDetails.orgId);
    // You could add a toast notification here
  };

  const onSubmit = async (data: AccountFormData) => {
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
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Account Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your organization details and preferences
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
            <span className="text-green-800 font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Organization ID */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Organization ID:
                </span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">
                  {accountDetails.orgId}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyOrgId}
                className="text-gray-500 hover:text-gray-700"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {/* Organization Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Organization Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Organization Name"
                  {...register('name')}
                  error={errors.name?.message}
                  placeholder="Enter organization name"
                />

                <Select
                  value={watchedValues.accountOwner}
                  onValueChange={(value) => setValue('accountOwner', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {adminList.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="From Email Name"
                  {...register('fromEmailName')}
                  error={errors.fromEmailName?.message}
                  placeholder="Enter email sender name"
                  icon={<Mail className="h-4 w-4" />}
                />

                <Input
                  label="From Email Address"
                  {...register('fromEmail')}
                  error={errors.fromEmail?.message}
                  placeholder="Enter email address"
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>

              <Input
                label="Phone Number"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="Enter phone number"
                icon={<Phone className="h-4 w-4" />}
              />
            </div>

            {/* Address */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Address
              </h3>
              
              <Input
                label="Street Address"
                {...register('address_line1')}
                error={errors.address_line1?.message}
                placeholder="Enter street address"
                icon={<Home className="h-4 w-4" />}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="City"
                  {...register('address_city')}
                  error={errors.address_city?.message}
                  placeholder="Enter city"
                  icon={<MapPin className="h-4 w-4" />}
                />

                <Input
                  label="State/Province"
                  {...register('address_state')}
                  error={errors.address_state?.message}
                  placeholder="Enter state"
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="ZIP/Postal Code"
                  {...register('address_zip')}
                  error={errors.address_zip?.message}
                  placeholder="Enter ZIP code"
                  icon={<MapPin className="h-4 w-4" />}
                />

                <Input
                  label="Country"
                  {...register('address_country')}
                  error={errors.address_country?.message}
                  placeholder="Enter country"
                  icon={<Globe className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Preferences
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  value={watchedValues.timezone}
                  onValueChange={(value) => setValue('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={watchedValues.dateFormat}
                  onValueChange={(value) => setValue('dateFormat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dd/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={watchedValues.currency}
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                className="min-w-[120px]"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default withRole(AccountSettingsPage, { allowedRoles: ['ROLE_ADMIN'] });
