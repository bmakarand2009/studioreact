import React, { useState, useEffect } from 'react';
import { publicMembershipService, PlanGroup, Plan, PlanPricing } from '@/services/publicMembershipService';
import { appLoadService } from '@/app/core/app-load';
import { Button } from '@/components/ui';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';

// Helper to determine the period string from pricing
const getPricingPeriod = (pricing: PlanPricing): 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'other' => {
  if (pricing.paymentType !== 'recurring' || !pricing.billingCycle) return 'other';
  
  const { frequency, unit } = pricing.billingCycle;
  const u = unit.toLowerCase();
  
  if (frequency === 1 && u === 'weeks') return 'weekly';
  if (frequency === 1 && u === 'months') return 'monthly';
  if (frequency === 3 && u === 'months') return 'quarterly';
  if (frequency === 1 && u === 'years') return 'yearly';
  
  return 'other';
};

interface MembershipPlansListProps {
  tenantId?: string;
  disabledPlanIds?: Set<string>;
  onPlanSelect: (pricing: PlanPricing) => void;
}

export function MembershipPlansList({ 
  tenantId: propTenantId, 
  disabledPlanIds = new Set(), 
  onPlanSelect 
}: MembershipPlansListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [planGroups, setPlanGroups] = useState<PlanGroup[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const toast = useToast();

  // Hardcoded tenant ID from requirements
  const DEFAULT_TENANT_ID = '9xP0p480zR';

  useEffect(() => {
    fetchPlans();
  }, [propTenantId]);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      
      // Ensure app is initialized to get the correct tenant ID
      await appLoadService.initAppConfig();
      
      // Get tenant ID from props, app load service or fallback to default
      const tenantId = propTenantId || appLoadService.tenantId || DEFAULT_TENANT_ID;
      console.log('Fetching public plans for tenant:', tenantId);

      if (!tenantId) {
        console.error('No tenant ID available even after initialization');
        toast.error('Unable to identify tenant.');
        setIsLoading(false);
        return;
      }

      const response = await publicMembershipService.getPublicPlans(tenantId);
      
      const rawGroups = response.planGroups || [];
      
      // Filter out groups that are not published or have no plans
      const validGroups = rawGroups.filter(g => {
        const isPub = g.isPublished === true;
        const notDel = !g.isDeleted;
        const hasPlans = g.plans && g.plans.length > 0;
        
        return isPub && notDel && hasPlans;
      }).map(g => ({
        ...g,
        plans: (g.plans || []).filter(p => {
            const pPub = p.isPublished === true;
            const pNotDel = !p.isDeleted;
            return pPub && pNotDel;
        })
      }));

      // Filter groups that resulted in having plans after plan filtering
      const finalGroups = validGroups.filter(g => g.plans.length > 0);
      
      setPlanGroups(finalGroups);
    } catch (error) {
      console.error('Failed to fetch public plans:', error);
      toast.error('Failed to load membership plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPricingForPeriod = (plan: Plan, period: 'monthly' | 'yearly'): PlanPricing | null => {
    if (!plan.pricing) return null;
    
    // Filter active recurring pricing
    const activeRecurring = plan.pricing.filter(p => 
      p.isActive !== false && 
      p.paymentType === 'recurring'
    );
    
    // Find exact match
    return activeRecurring.find(p => getPricingPeriod(p) === period) || null;
  };

  const formatPrice = (pricing: PlanPricing) => {
    const amount = pricing.subscriptionAmount ?? 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: pricing.currency || 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {planGroups.map((group) => (
        <section key={group._id} className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Group Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {group.groupName}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {group.groupDescription}
            </p>
          </div>

          {/* Billing Toggle */}
          {group.billingFrequency && group.billingFrequency.length > 1 && (
            <div className="flex justify-center mb-12">
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full inline-flex">
                <button
                  type="button"
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === 'monthly'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingPeriod === 'yearly'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {group.plans.map((plan) => {
              const pricing = getPricingForPeriod(plan, billingPeriod);
              const isCurrentPlan = disabledPlanIds.has(pricing?._id || '');
              
              return (
                <div 
                  key={plan._id}
                  className={`relative flex flex-col p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-lg ${
                    plan.isRecommended ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {plan.isRecommended && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        {plan.recommendedBadgeText || 'Recommended'}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {plan.planName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[40px]">
                      {plan.description}
                    </p>
                    {plan.outcomePromise && (
                      <p className="text-xs text-primary dark:text-primary-foreground/80 mt-2 italic">
                        {plan.outcomePromise}
                      </p>
                    )}
                  </div>

                  <div className="text-center mb-8">
                    {pricing ? (
                      <>
                         <div className="flex items-center justify-center gap-2 mb-2">
                          {pricing.wasAmount && pricing.wasAmount > (pricing.subscriptionAmount || 0) && (
                            <span className="text-gray-400 line-through text-lg">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: pricing.currency || 'USD' }).format(pricing.wasAmount)}
                            </span>
                          )}
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">
                            {formatPrice(pricing)}
                          </span>
                        </div>
                        {group.trialPeriod && group.trialMessage && (
                           <p className="text-xs text-gray-500 italic">
                             {group.trialMessage}
                           </p>
                        )}
                      </>
                    ) : (
                      <div className="text-2xl font-bold text-gray-400 py-4">
                        Not available
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                     <Button 
                       size="lg"
                       className="w-full text-lg py-4 rounded-xl"
                       disabled={!pricing || isCurrentPlan}
                       onClick={() => pricing && onPlanSelect(pricing)}
                     >
                       {isCurrentPlan ? 'Current Plan' : `Choose ${plan.planName}`}
                     </Button>
                  </div>

                  <div className="flex-grow space-y-4">
                    {plan.features.map((feature) => (
                      <div key={feature._id || feature.feature} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {feature.feature}
                          </p>
                          {feature.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {plan.bonusFeatures && plan.bonusFeatures.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-4">
                        Bonus Features
                      </p>
                      <div className="space-y-4">
                         {plan.bonusFeatures.map((feature) => (
                           <div key={feature._id || feature.feature} className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg flex items-start gap-3">
                             <div className="flex-shrink-0 mt-0.5">
                               <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
                                 +
                               </div>
                             </div>
                             <div>
                               <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                 {feature.feature}
                               </p>
                               {feature.description && (
                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                   {feature.description}
                                 </p>
                               )}
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      
      {planGroups.length === 0 && !isLoading && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">No public plans available at the moment.</p>
        </div>
      )}
    </div>
  );
}
