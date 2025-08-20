'use client';

import { withRole } from '@/components/guards/withRole';
import { useState, useEffect } from 'react';
import { 
  Shield, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  Crown,
  BookOpen,
  BarChart3,
  Settings,
  FileText,
  User,
  Filter,
  Search
} from 'lucide-react';
import { Button, Input, Switch, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import Link from 'next/link';
import { settingsService, RoleSettings } from '@/services/settingsService';

function RolesSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [roles, setRoles] = useState<RoleSettings[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error loading roles:', error);
      // Fallback to mock data if API fails
      setRoles([
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full system access with all permissions',
          permissions: ['all'],
          userCount: 2,
          isDefault: false
        },
        {
          id: 'staff',
          name: 'Staff',
          description: 'Manage courses, students, and basic operations',
          permissions: ['courses', 'students', 'reports', 'settings'],
          userCount: 5,
          isDefault: false
        },
        {
          id: 'instructor',
          name: 'Instructor',
          description: 'Create and manage courses, view student progress',
          permissions: ['courses', 'students', 'reports'],
          userCount: 8,
          isDefault: false
        },
        {
          id: 'student',
          name: 'Student',
          description: 'Access to enrolled courses and personal dashboard',
          permissions: ['courses', 'profile'],
          userCount: 150,
          isDefault: true
        },
        {
          id: 'moderator',
          name: 'Moderator',
          description: 'Moderate content and manage community features',
          permissions: ['moderation', 'content', 'reports'],
          userCount: 3,
          isDefault: false
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (roleId: string, isActive: boolean) => {
    setIsSaving(true);
    try {
      // This would be a different API call to activate/deactivate a role
      await settingsService.updateRole(roleId, { isActive });
      setRoles(prev => 
        prev.map(role => 
          role.id === roleId ? { ...role, isActive } : role
        )
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await settingsService.deleteRole(roleId);
      setRoles(prev => prev.filter(role => role.id !== roleId));
      setShowDeleteConfirm(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error deleting role:', error);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'all':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'courses':
        return <BookOpen className="h-4 w-4 text-blue-600" />;
      case 'students':
        return <Users className="h-4 w-4 text-green-600" />;
      case 'reports':
        return <BarChart3 className="h-4 w-4 text-purple-600" />;
      case 'settings':
        return <Settings className="h-4 w-4 text-gray-600" />;
      case 'moderation':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'content':
        return <FileText className="h-4 w-4 text-indigo-600" />;
      case 'profile':
        return <User className="h-4 w-4 text-teal-600" />;
      default:
        return <Lock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'all':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'courses':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'students':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reports':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'settings':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'moderation':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'content':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'profile':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading roles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Roles & Permissions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage user roles and control access to system features
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
              <Link href="/admin/settings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {isSaved && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Role settings updated successfully!</span>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {filteredRoles.map(role => (
            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {role.name}
                        </h3>
                        {role.isDefault && (
                                             <span className="inline-flex items-center justify-center min-w-[60px] h-6 px-2 bg-blue-100 text-blue-800 text-xs font-medium rounded-full dark:bg-blue-900 dark:text-blue-200">
                     Default
                   </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {role.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {!role.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowDeleteConfirm(role.id)}
                        className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>

                {/* Role Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Users
                    </span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.userCount}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Permissions
                    </span>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.permissions.length}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </span>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Active
                    </p>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Permissions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(permission => (
                      <div 
                        key={permission} 
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${getPermissionColor(permission)}`}
                      >
                        {getPermissionIcon(permission)}
                        <span className="capitalize">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === role.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium text-red-800 dark:text-red-200">
                        Confirm Role Deletion
                      </span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      Are you sure you want to delete the "{role.name}" role? This action cannot be undone.
                      {role.userCount > 0 && (
                        <span className="block mt-1 font-medium">
                          ⚠️ This role has {role.userCount} user(s) assigned to it.
                        </span>
                      )}
                    </p>
                    <div className="flex space-x-3">
                      <Button
                        size="sm"
                        onClick={() => handleDeleteRole(role.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Role
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Role Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Need a custom role?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create new roles with specific permissions for your team
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Custom Role
            </Button>
          </div>
        </div>

        {/* Role Guidelines */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-3">
            Role Management Guidelines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
            <div>
              <h4 className="font-medium mb-2">Best Practices:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Follow the principle of least privilege</li>
                <li>Regularly review and update role permissions</li>
                <li>Document the purpose of each custom role</li>
                <li>Test permissions before assigning to users</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Security Notes:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Default roles cannot be deleted</li>
                <li>Role changes affect all assigned users</li>
                <li>Monitor role usage and access patterns</li>
                <li>Use temporary roles for project-based access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(RolesSettingsPage, { allowedRoles: ['ROLE_ADMIN'] });
