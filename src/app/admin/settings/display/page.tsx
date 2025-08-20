'use client';

import { withRole } from '@/components/guards/withRole';
import { useState } from 'react';
import { 
  Monitor, 
  ArrowLeft, 
  BookOpen, 
  Users, 
  Calendar, 
  ShoppingCart, 
  Gift, 
  FileText, 
  Video,
  CheckCircle
} from 'lucide-react';
import { Button, Switch } from '@/components/ui';
import Link from 'next/link';

interface ModuleSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  category: string;
}

function DisplaySettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [moduleSettings, setModuleSettings] = useState<ModuleSetting[]>([
    {
      id: 'courses',
      title: 'Courses',
      description: 'Enable course management and online learning features',
      icon: BookOpen,
      enabled: true,
      category: 'Learning'
    },
    {
      id: 'classes',
      title: 'Classes',
      description: 'Enable class scheduling and management',
      icon: Calendar,
      enabled: true,
      category: 'Learning'
    },
    {
      id: 'workshops',
      title: 'Workshops',
      description: 'Enable workshop and event management',
      icon: Users,
      enabled: true,
      category: 'Learning'
    },
    {
      id: 'store',
      title: 'Store',
      description: 'Enable product store and e-commerce features',
      icon: ShoppingCart,
      enabled: false,
      category: 'Commerce'
    },
    {
      id: 'donations',
      title: 'Donations',
      description: 'Enable donation and fundraising features',
      icon: Gift,
      enabled: false,
      category: 'Commerce'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      description: 'Enable calendar and scheduling features',
      icon: Calendar,
      enabled: true,
      category: 'Management'
    },
    {
      id: 'contacts',
      title: 'Contacts',
      description: 'Enable contact management and CRM features',
      icon: Users,
      enabled: true,
      category: 'Management'
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Enable email and form templates',
      icon: FileText,
      enabled: true,
      category: 'Communication'
    },
    {
      id: 'zoom',
      title: 'Zoom Integration',
      description: 'Enable Zoom meeting integration',
      icon: Video,
      enabled: false,
      category: 'Integration'
    },
    {
      id: 'studentSchedule',
      title: 'Student Schedule',
      description: 'Show schedule menu for students',
      icon: Calendar,
      enabled: true,
      category: 'Student'
    },
    {
      id: 'studentCourses',
      title: 'Student Courses',
      description: 'Show courses menu for students',
      icon: BookOpen,
      enabled: true,
      category: 'Student'
    }
  ]);

  const handleToggleModule = (moduleId: string, enabled: boolean) => {
    setModuleSettings(prev => 
      prev.map(module => 
        module.id === moduleId ? { ...module, enabled } : module
      )
    );
  };

  const handleSaveSettings = async () => {
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

  const categories = ['Learning', 'Commerce', 'Management', 'Communication', 'Integration', 'Student'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Module Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Enable or disable features for your learning management system
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
            <span className="text-green-800 font-medium">Module settings saved successfully!</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryModules = moduleSettings.filter(module => module.category === category);
            
            if (categoryModules.length === 0) return null;

            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {category}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {categoryModules.map(module => {
                      const IconComponent = module.icon;
                      return (
                        <div 
                          key={module.id} 
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            module.enabled 
                              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                module.enabled 
                                  ? 'bg-green-100 dark:bg-green-900' 
                                  : 'bg-gray-100 dark:bg-gray-700'
                              }`}>
                                <IconComponent className={`h-5 w-5 ${
                                  module.enabled 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-gray-500 dark:text-gray-400'
                                }`} />
                              </div>
                              
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  module.enabled 
                                    ? 'text-green-900 dark:text-green-100' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {module.title}
                                </h4>
                                <p className={`text-sm mt-1 ${
                                  module.enabled 
                                    ? 'text-green-700 dark:text-green-300' 
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            
                            <Switch
                              checked={module.enabled}
                              onCheckedChange={(enabled: boolean) => handleToggleModule(module.id, enabled)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Save Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-end">
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading}
                className="min-w-[120px]"
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

export default withRole(DisplaySettingsPage, { allowedRoles: ['ROLE_ADMIN'] });
