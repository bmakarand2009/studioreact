'use client';

import { withRole } from '@/components/guards/withRole';
import { 
  Settings, 
  User, 
  Globe, 
  Monitor, 
  CreditCard, 
  Share2, 
  Users, 
  Shield, 
  Type, 
  Building2, 
  FileText, 
  Wallet,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';


interface SettingCard {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<any>;
  color: string;
}

const settingsList: SettingCard[] = [
  {
    title: 'Account',
    description: 'Account Settings',
    url: '/admin/settings/account',
    icon: User,
    color: 'bg-blue-500'
  },
  {
    title: 'Website',
    description: 'Add External website and SEO keywords',
    url: '/admin/settings/website',
    icon: Globe,
    color: 'bg-green-500'
  },
  {
    title: 'Module Settings',
    description: 'Module settings for your studio, changes will get applied immediately',
    url: '/admin/settings/display',
    icon: Monitor,
    color: 'bg-purple-500'
  },
  {
    title: 'Payment Settings',
    description: 'Payment Settings',
    url: '/admin/settings/payment',
    icon: CreditCard,
    color: 'bg-orange-500'
  },
  {
    title: 'Integrations',
    description: 'Third Party Integrations',
    url: '/admin/settings/integrations',
    icon: Share2,
    color: 'bg-indigo-500'
  },
  {
    title: 'Users',
    description: 'Add users to your account with appropriate permissions',
    url: '/admin/settings/users',
    icon: Users,
    color: 'bg-teal-500'
  },
  {
    title: 'Roles',
    description: 'Control User Roles, Functionality/Screens will only be allowed based on permissions given',
    url: '/admin/settings/roles',
    icon: Shield,
    color: 'bg-pink-500'
  },
  {
    title: 'Custom Fields',
    description: 'Create custom fields for your contacts.',
    url: '/admin/settings/custom-fields',
    icon: Type,
    color: 'bg-yellow-500'
  },
  {
    title: 'Franchise',
    description: 'Add or manage your franchises.',
    url: '/admin/settings/franchise',
    icon: Building2,
    color: 'bg-red-500'
  },
  {
    title: 'Templates',
    description: 'Manage your email and success screen templates.',
    url: '/admin/settings/templates',
    icon: FileText,
    color: 'bg-cyan-500'
  },
  {
    title: 'Plans',
    description: 'Your current plan, you may upgrade your plan.',
    url: '/admin/settings/plans',
    icon: Wallet,
    color: 'bg-emerald-500'
  }
];

function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-deep-600 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your application configuration and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {settingsList.map((setting, index) => {
            const IconComponent = setting.icon;
            return (
              <Link 
                key={index} 
                href={setting.url}
                className="group block"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-deep-300 dark:hover:border-deep-600 overflow-hidden h-full">
                  <div className="p-6 h-full flex flex-col">
                    {/* Icon */}
                    <div className={`w-16 h-16 ${setting.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-deep-600 dark:group-hover:text-deep-400 transition-colors">
                      {setting.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed flex-grow">
                      {setting.description}
                    </p>
                    
                    {/* Arrow */}
                    <div className="flex justify-end mt-auto">
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-deep-600 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>


      </div>
    </div>
  );
}

export default withRole(SettingsPage, { allowedRoles: ['ROLE_ADMIN'] });
