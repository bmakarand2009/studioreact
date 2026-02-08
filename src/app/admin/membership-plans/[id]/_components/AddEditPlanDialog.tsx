import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, ArrowRight, ArrowLeft, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button, Input, Textarea, ToggleSlider } from '@/components/ui';
import { Plan, PlanFeature, PlanProduct } from '@/types/membershipPlan';
import { CourseCategory } from '@/services/courseDetailService';

interface AddEditPlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: Partial<Plan>) => Promise<void>;
  initialData?: Plan | null;
  categories: CourseCategory[];
  isLoading?: boolean;
  readOnly?: boolean;
}

const EmptyFeature: PlanFeature = { feature: '', description: '' };

export const AddEditPlanDialog: React.FC<AddEditPlanDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  readOnly = false,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Plan>>({
    planName: '',
    description: '',
    features: [],
    bonusFeatures: [],
    outcomePromise: '',
    isRecommended: false,
    products: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          features: initialData.features || [],
          bonusFeatures: initialData.bonusFeatures || [],
          products: initialData.products || [],
        });
      } else {
        setFormData({
          planName: '',
          description: '',
          features: [],
          bonusFeatures: [],
          outcomePromise: '',
          isRecommended: false,
          products: [],
        });
      }
      setStep(1);
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.planName?.trim()) newErrors.planName = 'Plan name is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
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
      console.error('Failed to save plan:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), { ...EmptyFeature }]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const updateFeature = (index: number, field: keyof PlanFeature, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const addBonusFeature = () => {
    setFormData(prev => ({
      ...prev,
      bonusFeatures: [...(prev.bonusFeatures || []), { ...EmptyFeature }]
    }));
  };

  const removeBonusFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bonusFeatures: (prev.bonusFeatures || []).filter((_, i) => i !== index)
    }));
  };

  const updateBonusFeature = (index: number, field: keyof PlanFeature, value: string) => {
    setFormData(prev => ({
      ...prev,
      bonusFeatures: (prev.bonusFeatures || []).map((f, i) => 
        i === index ? { ...f, [field]: value } : f
      )
    }));
  };

  const toggleCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setFormData(prev => {
      const currentProducts = prev.products || [];
      const exists = currentProducts.some(p => p.productCategoryId === categoryId);

      if (exists) {
        return {
          ...prev,
          products: currentProducts.filter(p => p.productCategoryId !== categoryId)
        };
      } else {
        const newProduct: PlanProduct = {
          productCategory: category.name,
          productCategoryId: category.id,
        };
        return {
          ...prev,
          products: [...currentProducts, newProduct]
        };
      }
    });
  };

  const selectedCategoryIds = formData.products?.map(p => p.productCategoryId).filter(Boolean) as string[] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {initialData ? (readOnly ? 'View Plan' : 'Edit Plan') : 'Add Plan'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
             <span className={`hidden sm:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              step === 1
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
            }`}>
              Step {step} of 2 · {step === 1 ? 'Plan Details' : 'Categorization'}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Plan Name
                  </label>
                  <Input
                    placeholder="e.g. Gold Membership"
                    value={formData.planName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, planName: e.target.value }))}
                    error={errors.planName}
                    disabled={readOnly}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe what's included in this plan..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    error={errors.description}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Core Features</label>
                  {!readOnly && (
                    <Button size="sm" variant="outline" onClick={addFeature} className="text-primary-600 border-primary-200 hover:bg-primary-50 dark:border-primary-900 dark:hover:bg-primary-900/20">
                      <Plus className="h-4 w-4 mr-1" /> Add Feature
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {formData.features?.map((feature, index) => (
                    <div key={index} className="relative p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group transition-all hover:border-slate-300 dark:hover:border-slate-600">
                      {!readOnly && (
                        <button
                          onClick={() => removeFeature(index)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove feature"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                           Feature {index + 1}
                        </div>
                        
                        <div className="space-y-3">
                          <Input
                            placeholder="Feature title (e.g. Weekly Sessions)"
                            value={feature.feature}
                            onChange={(e) => updateFeature(index, 'feature', e.target.value)}
                            disabled={readOnly}
                            className="bg-white dark:bg-slate-900 font-medium"
                          />
                          <Input
                            placeholder="Description (e.g. One-on-one therapy sessions every week)"
                            value={feature.description}
                            onChange={(e) => updateFeature(index, 'description', e.target.value)}
                            className="text-sm bg-white dark:bg-slate-900"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.features || formData.features.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                      <p className="text-sm text-slate-500">No core features added yet.</p>
                      {!readOnly && (
                        <Button variant="ghost" onClick={addFeature} className="text-primary-600 mt-1 hover:bg-primary-50 dark:hover:bg-primary-900/10">
                          Add your first feature
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bonus Features */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bonus Features</label>
                  {!readOnly && (
                    <Button size="sm" variant="outline" onClick={addBonusFeature} className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-900 dark:hover:bg-amber-900/20">
                      <Plus className="h-4 w-4 mr-1" /> Add Bonus
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {formData.bonusFeatures?.map((feature, index) => (
                    <div key={index} className="relative p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 group transition-all hover:border-slate-300 dark:hover:border-slate-600">
                      {!readOnly && (
                        <button
                          onClick={() => removeBonusFeature(index)}
                          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Remove bonus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <div className="space-y-3">
                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                           Bonus {index + 1}
                        </div>
                        
                        <div className="space-y-3">
                          <Input
                            placeholder="Bonus title (e.g. Free Consultation)"
                            value={feature.feature}
                            onChange={(e) => updateBonusFeature(index, 'feature', e.target.value)}
                            disabled={readOnly}
                            className="bg-white dark:bg-slate-900 font-medium"
                          />
                          <Input
                            placeholder="Description (e.g. 30-minute complimentary first session)"
                            value={feature.description}
                            onChange={(e) => updateBonusFeature(index, 'description', e.target.value)}
                            className="text-sm bg-white dark:bg-slate-900"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!formData.bonusFeatures || formData.bonusFeatures.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/30">
                      <p className="text-sm text-slate-500">No bonus features added yet.</p>
                      {!readOnly && (
                        <Button variant="ghost" onClick={addBonusFeature} className="text-amber-600 mt-1 hover:bg-amber-50 dark:hover:bg-amber-900/10">
                          Add your first bonus
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Outcome Promise
                </label>
                <Textarea
                  placeholder="What is the main outcome users can expect?"
                  value={formData.outcomePromise || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, outcomePromise: e.target.value }))}
                  disabled={readOnly}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Mark as Recommended</h4>
                  <p className="text-xs text-slate-500 mt-1">This plan will be highlighted as the recommended choice</p>
                </div>
                <ToggleSlider
                  checked={formData.isRecommended || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecommended: checked }))}
                  disabled={readOnly}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 min-h-[400px]">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Plan Categories
                </label>
                
                <button
                  type="button"
                  onClick={() => !readOnly && setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  disabled={readOnly}
                  className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-all min-h-[46px]
                    ${isCategoryDropdownOpen 
                      ? 'border-primary-500 ring-2 ring-primary-200 dark:border-primary-400 dark:ring-primary-900/30' 
                      : 'border-slate-200 bg-slate-50 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }
                    ${readOnly ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex flex-wrap gap-2">
                    {selectedCategoryIds.length > 0 ? (
                      categories
                        .filter(c => selectedCategoryIds.includes(c.id))
                        .map(c => (
                          <span key={c.id} className="inline-flex items-center rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-700/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/20">
                            {c.name}
                          </span>
                        ))
                    ) : (
                      <span className="text-slate-500">Select categories...</span>
                    )}
                  </div>
                  {isCategoryDropdownOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500 ml-2 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500 ml-2 flex-shrink-0" />
                  )}
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800 max-h-60 overflow-y-auto">
                    {categories.length === 0 ? (
                      <p className="p-3 text-sm text-slate-500 text-center">No categories found.</p>
                    ) : (
                      <div className="space-y-1">
                        {categories.map((category) => {
                          const isSelected = selectedCategoryIds.includes(category.id);
                          return (
                            <div
                              key={category.id}
                              onClick={() => toggleCategory(category.id)}
                              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors
                                ${isSelected 
                                  ? 'bg-primary-50 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100' 
                                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50'
                                }
                              `}
                            >
                              <div className={`flex h-4 w-4 items-center justify-center rounded border
                                ${isSelected
                                  ? 'border-primary-600 bg-primary-600 text-white'
                                  : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700'
                                }
                              `}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{category.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-2">
                  Categorizing your plan helps users filter and find what they need.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between bg-slate-50 dark:bg-slate-800/50 rounded-b-xl">
          {step === 2 ? (
            <Button variant="outline" onClick={handleBack} disabled={isSaving}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          )}

          {step === 1 ? (
            <Button onClick={handleNext}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            readOnly ? (
              <Button onClick={onClose} className="bg-primary-600 hover:bg-primary-700 text-white">
                Close
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={isSaving || selectedCategoryIds.length === 0} className="bg-primary-600 hover:bg-primary-700 text-white">
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Save Plan
                  </>
                )}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
