

import { withRole } from '@/components/guards/withRole';
import { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowLeft, 
  Plus, 
  Settings, 
  TestTube,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button, Switch, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import Link from '@/shims/next-link';
import { settingsService, PaymentSettings } from '@/services/settingsService';

function PaymentSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [paymentProviders, setPaymentProviders] = useState<PaymentSettings[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    loadPaymentProviders();
  }, []);

  const loadPaymentProviders = async () => {
    setIsLoading(true);
    try {
      const providers = await settingsService.getPaymentSettings();
      setPaymentProviders(providers);
    } catch (error) {
      console.error('Error loading payment providers:', error);
      // Fallback to mock data if API fails
      setPaymentProviders([
        {
          id: 'stripe',
          provider: 'stripe',
          name: 'Stripe',
          description: 'Accept credit cards and digital wallets',
          isActive: true,
          testMode: true,
          config: {
            publishableKey: 'pk_test_...',
            secretKey: 'sk_test_...',
            webhookSecret: 'whsec_...'
          }
        },
        {
          id: 'paypal',
          provider: 'paypal',
          name: 'PayPal',
          description: 'Accept PayPal payments',
          isActive: false,
          testMode: true,
          config: {
            clientId: 'test_client_id',
            clientSecret: 'test_client_secret',
            webhookId: 'webhook_id'
          }
        },
        {
          id: 'razorpay',
          provider: 'razorpay',
          name: 'Razorpay',
          description: 'Indian payment gateway',
          isActive: false,
          testMode: true,
          config: {
            keyId: 'rzp_test_...',
            keySecret: 'test_secret_...',
            webhookSecret: 'webhook_secret'
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string, enabled: boolean) => {
    setIsSaving(true);
    try {
      await settingsService.updatePaymentSettings(providerId, { isActive: enabled });
      setPaymentProviders(prev => 
        prev.map(provider => 
          provider.id === providerId ? { ...provider, isActive: enabled } : provider
        )
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating payment provider:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTestMode = async (providerId: string, testMode: boolean) => {
    setIsSaving(true);
    try {
      await settingsService.updatePaymentSettings(providerId, { testMode });
      setPaymentProviders(prev => 
        prev.map(provider => 
          provider.id === providerId ? { ...provider, testMode } : provider
        )
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating test mode:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      const result = await settingsService.testPaymentConnection(providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: result
      }));
    } catch {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          message: 'Connection test failed'
        }
      }));
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🔵';
      case 'razorpay':
        return '🇮🇳';
      default:
        return '💳';
    }
  };

  const getProviderStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600' : 'text-gray-500';
  };

  const getTestModeColor = (testMode: boolean) => {
    return testMode ? 'text-orange-600' : 'text-blue-600';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading payment settings...</span>
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
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Payment Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Configure payment gateways and manage transactions
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Provider
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
            <span className="text-green-800 font-medium">Payment settings saved successfully!</span>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {paymentProviders.map(provider => (
            <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getProviderIcon(provider.provider)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {provider.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestConnection(provider.id)}
                      disabled={!provider.isActive}
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

                {/* Status and Test Mode Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Provider Status
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {provider.isActive ? 'Active and accepting payments' : 'Inactive - not accepting payments'}
                      </p>
                    </div>
                    <Switch
                      checked={provider.isActive}
                      onCheckedChange={(enabled) => handleToggleProvider(provider.id, enabled)}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Test Mode
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {provider.testMode ? 'Using test credentials' : 'Using live credentials'}
                      </p>
                    </div>
                    <Switch
                      checked={provider.testMode}
                      onCheckedChange={(testMode) => handleToggleTestMode(provider.id, testMode)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Configuration Display */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Configuration
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(provider.config).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          {key}
                        </span>
                        <span className="text-xs text-gray-900 dark:text-white font-mono">
                          {typeof value === 'string' && value.length > 20 
                            ? `${value.substring(0, 20)}...` 
                            : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Test Results */}
                {testResults[provider.id] && (
                  <div className="mt-4">
                    <Alert variant={testResults[provider.id].success ? 'success' : 'destructive'}>
                      <AlertTitle>
                        {testResults[provider.id].success ? 'Connection Successful' : 'Connection Failed'}
                      </AlertTitle>
                      <AlertDescription>
                        {testResults[provider.id].message}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={`text-xs font-medium ${getProviderStatusColor(provider.isActive)}`}>
                      {provider.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${provider.testMode ? 'bg-orange-500' : 'bg-blue-500'}`} />
                    <span className={`text-xs font-medium ${getTestModeColor(provider.testMode)}`}>
                      {provider.testMode ? 'Test Mode' : 'Live Mode'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Provider Section */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Need another payment provider?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Add new payment gateways to expand your payment options
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Provider
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(PaymentSettingsPage, { allowedRoles: ['ROLE_ADMIN', 'ROLE_STAFF'] });
