import React, { useState, useEffect } from 'react';
import { X, Calendar, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { MembershipPlanGroup } from '@/types/membershipPlan';

interface AddEditPlanGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: MembershipPlanGroup | null;
  isLoading?: boolean;
}

export const AddEditPlanGroupDialog: React.FC<AddEditPlanGroupDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    groupName: '',
    groupDescription: '',
    trialDays: 3,
    trialMessage: 'Get started with a free 3-day trial.',
    billingFrequency: ['monthly'] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          groupName: initialData.groupName || '',
          groupDescription: initialData.groupDescription || '',
          trialDays: initialData.trialDays || 0,
          trialMessage: initialData.trialMessage || '',
          billingFrequency: initialData.billingFrequency || ['monthly'],
        });
      } else {
        setFormData({
          groupName: '',
          groupDescription: '',
          trialDays: 3,
          trialMessage: 'Get started with a free 3-day trial.',
          billingFrequency: ['monthly'],
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.groupName.trim()) newErrors.groupName = 'Plan Group Name is required';
    if (!formData.groupDescription.trim()) newErrors.groupDescription = 'Description is required';
    if (formData.trialDays < 0) newErrors.trialDays = 'Trial days cannot be negative';
    if (formData.billingFrequency.length === 0) newErrors.billingFrequency = 'Select at least one billing frequency';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        trialPeriod: formData.trialDays > 0,
      };
      await onSave(payload);
    } catch (err) {
      console.error('Failed to save plan group:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFrequency = (freq: string) => {
    setFormData(prev => {
      const current = prev.billingFrequency;
      const exists = current.includes(freq);
      if (exists) {
        return { ...prev, billingFrequency: current.filter(f => f !== freq) };
      } else {
        return { ...prev, billingFrequency: [...current, freq] };
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Membership Group' : 'Create Membership Group'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {initialData ? 'Update details for this plan group.' : 'Set up a new collection of plans.'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            {/* Main Column */}
            <div className="space-y-6">
              {/* Group Name */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Plan Group Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="e.g., Therapy Plan"
                    className={`w-full rounded-lg border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900 ${
                      errors.groupName ? 'border-red-400 focus:ring-red-200' : 'border-slate-200'
                    }`}
                  />
                </div>
                {errors.groupName && (
                  <p className="text-xs font-medium text-red-500">{errors.groupName}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Short Description
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <textarea
                    rows={4}
                    placeholder="Describe this membership plan group..."
                    value={formData.groupDescription}
                    onChange={(e) => setFormData({ ...formData, groupDescription: e.target.value })}
                    className="w-full rounded-lg border-0 bg-transparent px-4 py-3 text-sm text-slate-900 focus:ring-0 dark:text-slate-100"
                  />
                </div>
                {errors.groupDescription && (
                  <p className="text-xs font-medium text-red-500">{errors.groupDescription}</p>
                )}
              </div>

              {/* Trial Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Trial Period (Days)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.trialDays}
                      onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 pl-10 text-sm font-medium text-slate-900 transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                  </div>
                  {errors.trialDays && <p className="text-xs font-medium text-red-500">{errors.trialDays}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Trial Message
                  </label>
                  <input
                    type="text"
                    value={formData.trialMessage}
                    onChange={(e) => setFormData({ ...formData, trialMessage: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Column */}
            <aside className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Billing Frequency
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="mb-4 text-xs text-slate-500">
                    Select allowed billing cycles for plans in this group.
                  </p>
                  <div className="flex flex-col gap-2">
                    {['Weekly', 'Monthly', 'Quarterly', 'Yearly'].map((freq) => {
                      const value = freq.toLowerCase();
                      const isSelected = formData.billingFrequency.includes(value);
                      return (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => toggleFrequency(value)}
                          className={`
                            flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 border
                            ${isSelected 
                              ? 'bg-white border-primary-500 text-primary-700 shadow-sm dark:bg-slate-900 dark:text-primary-300' 
                              : 'bg-transparent border-transparent text-slate-600 hover:bg-white hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-900'
                            }
                          `}
                        >
                          <span>{freq}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {errors.billingFrequency && <p className="text-xs font-medium text-red-500">{errors.billingFrequency}</p>}
              </div>
            </aside>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? 'Update Plan Group' : 'Create Plan Group'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
