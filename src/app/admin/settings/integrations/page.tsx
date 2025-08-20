'use client';

import { withRole } from '@/components/guards/withRole';
import { useState, useEffect } from 'react';
import { 
  Share2, 
  ArrowLeft, 
  Plus, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  MessageSquare,
  CreditCard,
  BarChart3,
  Link
} from 'lucide-react';
import { Button, Input, Switch, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { settingsService, IntegrationSettings } from '@/services/settingsService';

function IntegrationsSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationSettings[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setIsLoading(true);
    try {
      const data = await settingsService.getIntegrations();
      setIntegrations(data);
    } catch (error) {
      console.error('Error loading integrations:', error);
      // Fallback to mock data if API fails
      setIntegrations([
        {
          id: 'mailchimp',
          name: 'Mailchimp',
          type: 'email',
          provider: 'mailchimp',
          isActive: true,
          config: {
            apiKey: 'mc_api_key_...',
            listId: 'list_id_123',
            serverPrefix: 'us1'
          },
          lastSync: '2024-01-15T10:30:00Z'
        },
        {
          id: 'twilio',
          name: 'Twilio',
          type: 'sms',
          provider: 'twilio',
          isActive: false,
          config: {
            accountSid: 'AC_account_sid_...',
            authToken: 'auth_token_...',
            phoneNumber: '+1234567890'
          }
        },
        {
          id: 'google-analytics',
          name: 'Google Analytics',
          type: 'analytics',
          provider: 'google',
          isActive: true,
          config: {
            trackingId: 'GA-123456789',
            measurementId: 'G-ABCDEFGHIJ'
          },
          lastSync: '2024-01-15T09:15:00Z'
        },
        {
          id: 'stripe-webhooks',
          name: 'Stripe Webhooks',
          type: 'payment',
          provider: 'stripe',
          isActive: true,
          config: {
            webhookSecret: 'whsec_webhook_secret_...',
            endpointUrl: 'https://api.wajooba.me/webhooks/stripe'
          },
          lastSync: '2024-01-15T11:45:00Z'
        },
        {
          id: 'brevo',
          name: 'Brevo (Sendinblue)',
          type: 'email',
          provider: 'brevo',
          isActive: false,
          config: {
            apiKey: 'brevo_api_key_...',
            senderEmail: 'noreply@wajooba.me'
          }
        },
        {
          id: 'plivo',
          name: 'Plivo',
          type: 'sms',
          provider: 'plivo',
          isActive: false,
          config: {
            authId: 'plivo_auth_id_...',
            authToken: 'plivo_auth_token_...',
            phoneNumber: '+1234567890'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIntegration = async (integrationId: string, isActive: boolean) => {
    setIsSaving(true);
    try {
      await settingsService.updateIntegration(integrationId, { isActive });
      setIntegrations(prev => 
        prev.map(integration => 
          integration.id === integrationId ? { ...integration, isActive } : integration
        )
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating integration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestIntegration = async (integrationId: string) => {
    try {
      const result = await settingsService.testIntegration(integrationId);
      setTestResults(prev => ({
        ...prev,
        [integrationId]: result
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [integrationId]: {
          success: false,
          message: 'Integration test failed'
        }
      }));
    }
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      case 'analytics':
        return <BarChart3 className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const getIntegrationTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'sms':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'payment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'analytics':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mailchimp':
        return '📧';
      case 'twilio':
        return '📱';
      case 'google':
        return '🔍';
      case 'stripe':
        return '💳';
      case 'brevo':
        return '📨';
      case 'plivo':
        return '📞';
      default:
        return '🔗';
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    return new Date(lastSync).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading integrations...</span>
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
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Integrations
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Connect third-party services and manage external integrations
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
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
            <span className="text-green-800 font-medium">Integration settings saved successfully!</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {integrations.map(integration => (
            <div key={integration.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderIcon(integration.provider)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {integration.provider} integration
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestIntegration(integration.id)}
                      disabled={!integration.isActive}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>

                {/* Integration Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {getIntegrationIcon(integration.type)}
                                         <span className={`inline-flex items-center justify-center min-w-[80px] h-6 px-2 rounded-full text-xs font-medium ${getIntegrationTypeColor(integration.type)}`}>
                       {integration.type}
                     </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {integration.isActive ? 'Active and connected' : 'Inactive - not connected'}
                      </p>
                    </div>
                    <Switch
                      checked={integration.isActive}
                      onCheckedChange={(isActive) => handleToggleIntegration(integration.id, isActive)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Sync
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatLastSync(integration.lastSync)}
                    </p>
                  </div>
                </div>

                {/* Configuration Display */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(integration.config).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          {key}
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white font-mono">
                          {typeof value === 'string' && value.length > 25 
                            ? `${value.substring(0, 25)}...` 
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Results */}
                {testResults[integration.id] && (
                  <div className="mt-4">
                    <Alert variant={testResults[integration.id].success ? 'success' : 'destructive'}>
                      <AlertTitle>
                        {testResults[integration.id].success ? 'Connection Successful' : 'Connection Failed'}
                      </AlertTitle>
                      <AlertDescription>
                        {testResults[integration.id].message}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${integration.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={`text-xs font-medium ${integration.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {integration.isActive ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-medium text-blue-600">
                      {integration.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Integration Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Need another integration?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Connect new services to expand your platform capabilities
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </div>

        {/* Integration Categories */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email Services</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mailchimp, Brevo, SendGrid</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">SMS Services</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Twilio, Plivo, MessageBird</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Payment Services</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stripe, PayPal, Razorpay</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Analytics</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Google Analytics, Mixpanel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(IntegrationsSettingsPage, { allowedRoles: ['ROLE_ADMIN'] });
