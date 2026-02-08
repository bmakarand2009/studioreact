'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import { membershipPlanService } from '@/services/membershipPlanService';

export default function AddMembershipPlanGroupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    groupName: '',
    groupDescription: '',
    trialDays: 3,
    trialMessage: 'Get started with a free 3-day trial.',
    billingFrequency: ['monthly'] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      setIsLoading(true);
      const payload = {
        ...formData,
        trialPeriod: formData.trialDays > 0,
      };

      const result: any = await membershipPlanService.createPlanGroup(payload);
      
      const newId = result?.planGroup?._id || result?.planGroup?.id || result?._id || result?.id;
      
      if (newId) {
        navigate(`/admin/membership-plans/${newId}`);
      } else {
        console.warn('Could not determine new plan ID from response', result);
        navigate('/admin/membership-plans');
      }
    } catch (err) {
      console.error('Failed to create plan group:', err);
    } finally {
      setIsLoading(false);
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
    <div className="min-h-screen bg-slate-50 pb-8 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              onClick={() => navigate('/admin/membership-plans')}
              aria-label="Back to membership plans"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Create Membership Group
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              Step 1 of 1 · Group Details
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-8 max-w-5xl px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Main Column */}
            <div className="space-y-8">
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

              {/* Action Buttons (Desktop placement - bottom of main column) */}
              <div className="mt-10 flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  onClick={() => navigate('/admin/membership-plans')}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Plan Group'
                  )}
                </Button>
              </div>
            </div>

            {/* Sidebar Column */}
            <aside className="space-y-8">
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

{/* Info Card Removed */}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
