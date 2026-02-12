import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Calendar, CreditCard } from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Pricing, Plan } from '@/types/membershipPlan';

interface AddEditPricingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pricingData: Partial<Pricing>) => Promise<void>;
  initialData?: Pricing | null;
  plans: Plan[];
  isLoading?: boolean;
}

export const AddEditPricingDialog: React.FC<AddEditPricingDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  plans,
}) => {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Pricing>>({
    planName: '',
    productId: '',
    paymentType: 'recurring',
    subscriptionAmount: 0,
    oneTimePayment: 0,
    wasAmount: 0,
    billingCycle: { frequency: 1, unit: 'months' },
    isTaxable: false,
    membershipEndDate: {
      membershipEndsWithSubscription: true,
      expiryPeriod: 1,
      expiryPeriodType: 'months'
    },
    // Default values for new fields
    discountPercent: 0,
    isIntroMembership: false,
    limitedSessionsCount: 0,
    offerApplicableOnSubscriptionAmount: true,
    productType: 'plan',
    subscriptionBillingEndsAfter: 'manualRequest',
    // Sync flat fields
    expiryPeriod: 1,
    expiryPeriodType: 'months',
    membershipEndsWithSubscription: true,
    isPlanRenew: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          billingCycle: initialData.billingCycle || { frequency: 1, unit: 'months' },
          membershipEndDate: initialData.membershipEndDate || {
            membershipEndsWithSubscription: true,
            expiryPeriod: 1,
            expiryPeriodType: 'months'
          }
        });
      } else {
        // Reset to default
        setFormData({
            planName: plans.length > 0 ? plans[0].planName : '',
            productId: plans.length > 0 ? plans[0]._id : '',
            paymentType: 'recurring',
            subscriptionAmount: 0,
            oneTimePayment: 0,
            wasAmount: 0,
            billingCycle: { frequency: 1, unit: 'months' },
            isTaxable: false,
            membershipEndDate: {
              membershipEndsWithSubscription: true,
              expiryPeriod: 1,
              expiryPeriodType: 'months'
            },
            discountPercent: 0,
            isIntroMembership: false,
            limitedSessionsCount: 0,
            offerApplicableOnSubscriptionAmount: true,
            productType: 'plan',
            subscriptionBillingEndsAfter: 'manualRequest',
            expiryPeriod: 1,
            expiryPeriodType: 'months',
            membershipEndsWithSubscription: true,
            isPlanRenew: false,
        });
      }
      setStep(1);
    }
  }, [isOpen, initialData, plans]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!formData.productId) {
        // ideally show error
        return;
      }
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save pricing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateBillingCycle = (frequency: number, unit: string) => {
    setFormData(prev => ({
      ...prev,
      billingCycle: { frequency, unit }
    }));
  };

  const updateExpiry = (period: number, type: string) => {
    setFormData(prev => ({
      ...prev,
      expiryPeriod: period,
      expiryPeriodType: type,
      membershipEndDate: {
        ...prev.membershipEndDate!,
        expiryPeriod: period,
        expiryPeriodType: type
      }
    }));
  };

  const handlePlanChange = (planId: string) => {
    const selectedPlan = plans.find(p => p._id === planId);
    setFormData(prev => ({
        ...prev,
        productId: planId,
        planName: selectedPlan ? selectedPlan.planName : ''
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {initialData ? 'Edit Membership Pricing' : 'Add Membership Pricing'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <span className={`hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              step === 1
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}>
              Step {step} of 2 · {step === 1 ? 'Payment Mode' : 'Pricing Details'}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 1 ? (
            <div className="space-y-8">
              {/* Select Plan */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Select Plan
                </label>
                <Select 
                    value={formData.productId} 
                    onValueChange={handlePlanChange}
                >
                  <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-11">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.planName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Mode Cards */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Payment Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recurring Card */}
                    <div 
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'recurring' }))}
                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${
                            formData.paymentType === 'recurring'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {formData.paymentType === 'recurring' && (
                            <div className="absolute top-4 right-4 text-primary-600">
                                <div className="w-5 h-5 rounded-full border-[5px] border-primary-600"></div>
                            </div>
                        )}
                        {formData.paymentType !== 'recurring' && (
                            <div className="absolute top-4 right-4 text-slate-300">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                            </div>
                        )}
                        
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                            formData.paymentType === 'recurring' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                        }`}>
                            <Calendar className="h-5 w-5" />
                        </div>
                        <h3 className={`font-semibold ${formData.paymentType === 'recurring' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white'}`}>
                            Recurring Payment
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            Create sustained revenue with monthly or yearly subscription plans.
                        </p>
                    </div>

                    {/* One Time Card */}
                    <div 
                        onClick={() => setFormData(prev => ({ ...prev, paymentType: 'onetime' }))}
                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all relative ${
                            formData.paymentType === 'onetime'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                        {formData.paymentType === 'onetime' && (
                            <div className="absolute top-4 right-4 text-primary-600">
                                <div className="w-5 h-5 rounded-full border-[5px] border-primary-600"></div>
                            </div>
                        )}
                         {formData.paymentType !== 'onetime' && (
                            <div className="absolute top-4 right-4 text-slate-300">
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                            </div>
                        )}

                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                            formData.paymentType === 'onetime' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                        }`}>
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <h3 className={`font-semibold ${formData.paymentType === 'onetime' ? 'text-primary-900 dark:text-primary-100' : 'text-slate-900 dark:text-white'}`}>
                            One Time Payment
                        </h3>
                        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            Single payment for a fixed number of sessions or unlimited access.
                        </p>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Subscription Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                            <Input 
                                type="number" 
                                className="pl-8" 
                                placeholder="0.00"
                                value={formData.paymentType === 'recurring' ? formData.subscriptionAmount : formData.oneTimePayment}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    if (formData.paymentType === 'recurring') {
                                        setFormData(prev => ({ ...prev, subscriptionAmount: val }));
                                    } else {
                                        setFormData(prev => ({ ...prev, oneTimePayment: val }));
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Was Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Was Price <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                            <Input 
                                type="number" 
                                className="pl-8" 
                                placeholder="0.00"
                                value={formData.wasAmount || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, wasAmount: parseFloat(e.target.value) }))}
                            />
                        </div>
                        <p className="text-xs text-slate-400">Original price to show with strikethrough</p>
                    </div>

                    {/* Billing Cycle - Only for Recurring */}
                    {formData.paymentType === 'recurring' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Billing Cycle <span className="text-red-500">*</span>
                            </label>
                            <Select 
                                value={`${formData.billingCycle?.frequency}-${formData.billingCycle?.unit}`}
                                onValueChange={(val) => {
                                    const [freq, unit] = val.split('-');
                                    updateBillingCycle(parseInt(freq), unit);
                                }}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-months">Monthly</SelectItem>
                                    <SelectItem value="3-months">Quarterly (3 Months)</SelectItem>
                                    <SelectItem value="6-months">Bi-Annual (6 Months)</SelectItem>
                                    <SelectItem value="1-years">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Membership Duration */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl space-y-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Membership Duration
                    </label>
                    <p className="text-xs text-slate-500 -mt-2">
                        Choose whether membership renews with subscription or ends after a fixed period
                    </p>

                    <div className="space-y-4 mt-4">
                        {/* Fixed Duration Option */}
                        <div className="flex items-start gap-3">
                             <div className="pt-1">
                                <input 
                                    type="radio" 
                                    name="duration" 
                                    id="fixed"
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    checked={!formData.membershipEndDate?.membershipEndsWithSubscription}
                                    onChange={() => setFormData(prev => ({
                                        ...prev,
                                        membershipEndsWithSubscription: false,
                                        membershipEndDate: { ...prev.membershipEndDate!, membershipEndsWithSubscription: false }
                                    }))}
                                />
                             </div>
                             <div className="flex-1">
                                <label htmlFor="fixed" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                                    Fixed duration
                                </label>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Set a specific membership validity period
                                </p>
                                
                                {/* Validity Dropdown - Only show if checked */}
                                {!formData.membershipEndDate?.membershipEndsWithSubscription && (
                                    <div className="mt-3 max-w-xs">
                                        <Select 
                                            value={`${formData.membershipEndDate?.expiryPeriod}-${formData.membershipEndDate?.expiryPeriodType}`}
                                            onValueChange={(val) => {
                                                const [period, type] = val.split('-');
                                                updateExpiry(parseInt(period), type);
                                            }}
                                        >
                                            <SelectTrigger className="bg-white dark:bg-slate-800 h-10">
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-months">1 Month</SelectItem>
                                                <SelectItem value="3-months">3 Months</SelectItem>
                                                <SelectItem value="6-months">6 Months</SelectItem>
                                                <SelectItem value="1-years">1 Year</SelectItem>
                                                <SelectItem value="2-years">2 Years</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                             </div>
                        </div>

                        {/* Renews with Subscription Option */}
                         <div className="flex items-start gap-3">
                             <div className="pt-1">
                                <input 
                                    type="radio" 
                                    name="duration" 
                                    id="renews"
                                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                    checked={!!formData.membershipEndDate?.membershipEndsWithSubscription}
                                    onChange={() => setFormData(prev => ({
                                        ...prev,
                                        membershipEndsWithSubscription: true,
                                        membershipEndDate: { ...prev.membershipEndDate!, membershipEndsWithSubscription: true }
                                    }))}
                                />
                             </div>
                             <div className="flex-1">
                                <label htmlFor="renews" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                                    Renews with subscription
                                </label>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Membership stays active as long as subscription is active
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          
          {step === 2 && (
             <Button variant="outline" onClick={handleBack} disabled={isSaving}>
                Back
             </Button>
          )}

          {step === 1 ? (
            <Button onClick={handleNext} disabled={!formData.productId} className="bg-primary-600 hover:bg-primary-700 text-white">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary-600 hover:bg-primary-700 text-white">
              {isSaving ? 'Saving...' : 'Save Details'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
