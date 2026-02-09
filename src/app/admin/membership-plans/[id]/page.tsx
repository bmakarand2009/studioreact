import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Calendar, 
  Plus,
  Search,
} from 'lucide-react';
import { Button, Card, CardContent, ToggleSlider, ConfirmationDialog } from '@/components/ui';
import { useToast } from "@/components/ui/ToastProvider";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { membershipPlanDetailService } from '@/services/membershipPlanDetailService';
import { courseDetailService, CourseCategory } from '@/services/courseDetailService';
import { MembershipPlanGroup, Plan, Pricing, Member } from '@/types/membershipPlan';
import { AddEditPlanDialog } from './_components/AddEditPlanDialog';
import { AddEditPricingDialog } from './_components/AddEditPricingDialog';

const VALID_TABS = ["plans", "pricing", "members"] as const;
type TabKey = (typeof VALID_TABS)[number];

const CATEGORY_COLORS = [
  "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-700/10 dark:bg-primary-400/10 dark:text-primary-400 dark:ring-primary-400/20",
];

const getCategoryColor = (category: string) => {
  return CATEGORY_COLORS[0];
};

const getTabFromSearch = (search: string | undefined | null): TabKey => {
  if (!search) return "plans";
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  return VALID_TABS.includes(tab as TabKey) ? (tab as TabKey) : "plans";
};

const formatDate = (date: string | number | undefined | null) => {
  if (!date) return '-';
  const num = Number(date);
  if (num === 0) return '-';
  
  let d: Date;
  
  if (!isNaN(num)) {
    // If it's seconds (roughly < 100 billion), convert to ms
    // 100 billion seconds is year 5138, so this is safe for modern dates
    if (num < 100000000000) {
      d = new Date(num * 1000);
    } else {
      d = new Date(num);
    }
  } else {
    d = new Date(date);
  }

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatExpiryDate = (expiry: string | number | undefined | null, start: string | number | undefined | null) => {
  if (!expiry) return '-';
  const expiryNum = Number(expiry);
  
  // Handle 0 explicitly
  if (expiryNum === 0) return '-';
  
  // If expiry is a small number (interpreted as seconds), e.g. < 10 years (315 million seconds)
  // It is likely a duration relative to the start date.
  if (!isNaN(expiryNum) && expiryNum > 0 && expiryNum < 315360000) {
      let startMs = 0;
      const startNum = Number(start);
      
      if (!isNaN(startNum) && startNum > 0) {
          // If start is a number, normalize to milliseconds
          startMs = startNum < 100000000000 ? startNum * 1000 : startNum;
      } else if (typeof start === 'string' && start) {
          // If start is a string, parse it
          const startDate = new Date(start);
          if (!isNaN(startDate.getTime())) {
              startMs = startDate.getTime();
          }
      }
      
      if (startMs > 0) {
          // Convert duration (seconds) to milliseconds and add to start
          const expiryMs = expiryNum * 1000;
          // Use the timestamp directly
          return new Date(startMs + expiryMs).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
      }
      
      // If we have a duration but no start date, show the duration instead of 1970
      const days = Math.round(expiryNum / 86400);
      return `${days} Days`;
  }
  return formatDate(expiry);
};

interface SortablePlanCardProps {
  plan: Plan;
  onToggleStatus: (id: string, status: boolean) => void;
  onEdit: (plan: Plan) => void;
  getCategoryColor: (category: string) => string;
}

const SortablePlanCard = ({ plan, onToggleStatus, onEdit, getCategoryColor }: SortablePlanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: plan._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl">
        <CardContent className="p-0">
          <div className="p-6">
            {/* Plan Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Drag Handle & Icon */}
                <div 
                    {...attributes} 
                    {...listeners}
                    className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                   <div className="flex flex-col gap-0.5 opacity-40 pointer-events-none">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                      </div>
                    </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {plan.planName}
                    </h3>
                    <ToggleSlider 
                      checked={plan.isPublished}
                      onCheckedChange={() => onToggleStatus(plan._id, plan.isPublished)}
                    />
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 mb-2 text-sm">
                    {plan.description}
                  </p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    LAST UPDATED: {new Date(plan.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Add delete handler here if needed
                  }}
                  className="rounded-lg border-2 border-secondary-500 bg-white px-3 py-2 text-sm font-semibold text-secondary-500 shadow-sm transition hover:bg-secondary-50 hover:border-secondary-600 hover:text-secondary-600 dark:border-secondary-500 dark:bg-slate-800 dark:text-secondary-500 dark:hover:bg-secondary-900/20 dark:hover:border-secondary-400 dark:hover:text-secondary-400"
                  aria-label="Delete plan"
                  title="Delete Plan"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(plan);
                  }}
                  className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                  aria-label="Edit plan"
                  title="Edit Plan"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 dark:bg-gray-700 my-6"></div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* FEATURES COLUMN */}
              <div className="md:col-span-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  FEATURES <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300 min-w-[20px] text-center">{plan.features?.length || 0}</span>
                </h4>
                
                {plan.features && plan.features.length > 0 ? (
                  <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 group">
                        <div className="flex-shrink-0 mt-0.5">
                          {idx % 3 === 0 ? (
                             <Calendar className="w-4 h-4 text-primary-500" />
                          ) : idx % 3 === 1 ? (
                             <div className="w-4 h-4 text-primary-500">
                               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                             </div>
                          ) : (
                             <div className="w-4 h-4 text-primary-500">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                             </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                            {feature.feature}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-xs text-gray-400 italic">No features available.</p>
                )}
              </div>

              {/* BONUS FEATURES COLUMN */}
              <div className="md:col-span-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  BONUS <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300 min-w-[20px] text-center">{plan.bonusFeatures?.length || 0}</span>
                </h4>
                
                {plan.bonusFeatures && plan.bonusFeatures.length > 0 ? (
                  <div className="space-y-4">
                    {plan.bonusFeatures.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 group">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 text-amber-500">
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
                            {feature.feature}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-xs text-gray-400 italic">No bonus features available for this plan.</p>
                )}
              </div>

              {/* CATEGORIES COLUMN */}
              <div className="md:col-span-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  CATEGORIES <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] text-gray-600 dark:text-gray-300 min-w-[20px] text-center">{plan.products?.length || 0}</span>
                </h4>
                
                {plan.products && plan.products.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {plan.products.map((prod, idx) => (
                      <span key={idx} className={`px-3 py-1 rounded-full hover:opacity-80 transition-opacity text-xs font-medium cursor-default ${getCategoryColor(prod.productCategory)}`}>
                        {prod.productCategory}
                      </span>
                    ))}
                  </div>
                ) : (
                   <p className="text-xs text-gray-400 italic">No categories assigned.</p>
                )}
              </div>

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AdminMembershipPlanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState<TabKey>(() => 
    getTabFromSearch(window.location?.search)
  );
  const [planGroup, setPlanGroup] = useState<MembershipPlanGroup | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [pricings, setPricings] = useState<Pricing[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [arePlansLoading, setArePlansLoading] = useState(false);
  const [arePricingsLoading, setArePricingsLoading] = useState(false);
  const [areMembersLoading, setAreMembersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchivedPlans, setShowArchivedPlans] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  
  // Keep active tab in sync with URL (?tab=...)
  useEffect(() => {
    const urlTab = getTabFromSearch(location.search);
    setActiveTab((current) => (current === urlTab ? current : urlTab));
  }, [location.search]);

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      if (tab === activeTab) return;

      // Set loading state immediately to prevent flash of empty content
      if (tab === 'plans') setArePlansLoading(true);
      else if (tab === 'pricing') setArePricingsLoading(true);
      else if (tab === 'members') setAreMembersLoading(true);

      setActiveTab(tab);
      const params = new URLSearchParams(location.search);
      params.set("tab", tab);
      navigate(
        {
          pathname: location.pathname,
          search: params.toString(),
        },
        { replace: true },
      );
    },
    [location.pathname, location.search, navigate, activeTab],
  );

  // Fetch Group Details
  const fetchGroupDetails = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const groupData = await membershipPlanDetailService.getPlanGroupDetail(id);
      setPlanGroup(groupData);
    } catch (err: any) {
      console.error('Failed to load plan group:', err);
      setError(err.message || 'Failed to load details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Fetch Plans
  const fetchPlans = useCallback(async () => {
    if (!id) return;
    try {
      setArePlansLoading(true);
      const plansData = await membershipPlanDetailService.getPlansByGroupId(id);
      const rawPlansData: any = plansData;
      const plansList = rawPlansData?.studioplans || rawPlansData?.data?.studioplans || [];
      setPlans(Array.isArray(plansList) ? plansList : []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setArePlansLoading(false);
    }
  }, [id]);

  // Fetch Pricings
  const fetchPricings = useCallback(async () => {
    if (!id) return;
    try {
      setArePricingsLoading(true);
      const pricingsData = await membershipPlanDetailService.getPricingsByGroupId(id);
      setPricings(pricingsData);
    } catch (err) {
      console.error('Failed to load pricings:', err);
    } finally {
      setArePricingsLoading(false);
    }
  }, [id]);

  // Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!id) return;
    try {
      setAreMembersLoading(true);
      const membersData = await membershipPlanDetailService.getMembersByGroupId(id);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setAreMembersLoading(false);
    }
  }, [id]);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    if (!planGroup?.tenantId) return;
    try {
      const categoriesData = await courseDetailService.getCategories(planGroup.tenantId);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [planGroup?.tenantId]);

  // Initial load
  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);

  useEffect(() => {
    if (planGroup?.tenantId) {
      fetchCategories();
    }
  }, [fetchCategories, planGroup?.tenantId]);

  // Tab switch load
  useEffect(() => {
    if (activeTab === 'plans') {
      fetchPlans();
    } else if (activeTab === 'pricing') {
      fetchPricings();
      fetchPlans();
    } else if (activeTab === 'members') {
      fetchMembers();
    }
  }, [activeTab, fetchPlans, fetchPricings, fetchMembers]);

  // Filter plans based on showArchivedPlans
  const filteredPlans = useMemo(() => {
    if (showArchivedPlans) {
      return plans;
    }
    return plans.filter(plan => !plan.isDeleted);
  }, [plans, showArchivedPlans]);

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPlans((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
             const newItems = arrayMove(items, oldIndex, newIndex);
             
             const activePlan = items[oldIndex];
             // Call API to update order
             membershipPlanDetailService.updatePlanDisplayOrder(activePlan._id, newIndex)
                .catch(err => console.error("Failed to update order", err));

             return newItems;
        }
        return items;
      });
    }
  };

  // Handlers
  const handleTogglePlanStatus = async (planId: string, currentStatus: boolean) => {
    // Update local state immediately
    setPlans(prev => prev.map(p => 
      p._id === planId ? { ...p, isPublished: !currentStatus } : p
    ));
    
    try {
      await membershipPlanDetailService.togglePlanStatus(planId, !currentStatus);
    } catch (err) {
      console.error('Failed to update plan status:', err);
      // Revert on error
      setPlans(prev => prev.map(p => 
        p._id === planId ? { ...p, isPublished: currentStatus } : p
      ));
      throw err;
    }
  };

  const handleToggleGroupStatus = async (newStatus: boolean) => {
    if (!planGroup) return;
    
    // Optimistic update
    const previousStatus = planGroup.isPublished;
    setPlanGroup(prev => prev ? { ...prev, isPublished: newStatus } : null);

    try {
      await membershipPlanDetailService.togglePublishStatus(planGroup._id, newStatus);
    } catch (err) {
      console.error('Failed to update group status', err);
      // Revert
      setPlanGroup(prev => prev ? { ...prev, isPublished: previousStatus } : null);
      throw err;
    }
  };

  const handleTogglePricingStatus = async (pricingId: string, currentStatus: boolean) => {
    // Update local state immediately for UI responsiveness
    setPricings(prev => prev.map(p => 
      p._id === pricingId ? { ...p, isActive: !currentStatus } : p
    ));
    
    try {
      await membershipPlanDetailService.togglePricingStatus(pricingId, !currentStatus);
    } catch (err) {
      console.error('Failed to update pricing status:', err);
      // Revert on error
      setPricings(prev => prev.map(p => 
        p._id === pricingId ? { ...p, isActive: currentStatus } : p
      ));
      throw err;
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleEditPlan = async (plan: Plan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
    
    try {
      setIsPlanLoading(true);
      const detailedPlan = await membershipPlanDetailService.getPlanById(plan._id);
      setEditingPlan(detailedPlan);
    } catch (err) {
      console.error('Failed to load plan details:', err);
    } finally {
      setIsPlanLoading(false);
    }
  };

  const handleSavePlan = async (planData: Partial<Plan>) => {
    if (!id) return;
    try {
      if (editingPlan) {
        await membershipPlanDetailService.updatePlan(editingPlan._id, planData);
      } else {
        await membershipPlanDetailService.createPlan(id, planData);
      }
      // Refresh plans
      fetchPlans();
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save plan:', err);
      throw err; // Re-throw to be caught by dialog
    }
  };

  const handleAddPricing = () => {
    setEditingPricing(null);
    setIsPricingDialogOpen(true);
  };

  const handleEditPricing = (pricing: Pricing) => {
    setEditingPricing(pricing);
    setIsPricingDialogOpen(true);
  };

  const handleSavePricing = async (pricingData: Partial<Pricing>) => {
    if (!id) return;
    try {
      if (editingPricing) {
        await membershipPlanDetailService.updatePricing(editingPricing._id, pricingData);
      } else {
        await membershipPlanDetailService.createPricing(id, pricingData);
      }
      // Refresh pricings
      fetchPricings();
      setIsPricingDialogOpen(false);
    } catch (err) {
      console.error('Failed to save pricing:', err);
      throw err;
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Pricing",
      description: "Are you sure you want to delete this pricing option? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await membershipPlanDetailService.deletePricing(pricingId);
          // Remove from local state
          setPricings(prev => prev.filter(p => p._id !== pricingId));
          toast.success("Pricing deleted successfully");
          setConfirmDialog(null);
        } catch (err: any) {
          console.error('Failed to delete pricing:', err);
          toast.error(err.message || "Failed to delete pricing");
          // Fallback to fetch if optimistic update fails or for safety
          fetchPricings();
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600">Loading details...</p>
      </div>
    );
  }

  if (error || !planGroup) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error</h2>
        <p className="text-gray-600 mt-2">{error || 'Plan group not found'}</p>
        <Button onClick={() => navigate('/admin/membership-plans')} className="mt-4">
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0 hover:bg-transparent hover:text-primary-600"
            onClick={() => navigate('/admin/membership-plans')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Membership Plans
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
               <div className="mt-1">
                 <ToggleSlider 
                   checked={planGroup.isPublished}
                   onCheckedChange={handleToggleGroupStatus}
                 />
               </div>
               <div>
                 <div className="flex items-center gap-3">
                   <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                     {planGroup.groupName || 'Untitled Group'}
                   </h1>
                 </div>
                 <div className="flex items-center text-sm text-gray-500 mt-1">
                   <Calendar className="h-4 w-4 mr-2" />
                   {planGroup.updatedAt && !isNaN(new Date(planGroup.updatedAt).getTime())
                     ? `Updated on ${new Date(planGroup.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                     : 'Update date not available'}
                 </div>
                 <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                   {planGroup.groupDescription}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Trial Offer Card */}
        <Card className="border-l-4 border-l-primary-500">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-primary-600 uppercase tracking-wide mb-2">
              Trial Offer
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xl font-semibold text-gray-900 dark:text-white">
                  {planGroup.trialDays} Days Free Trial
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {planGroup.trialMessage || 'Start your journey with a free trial.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - scrollable on small screens */}
        <div className="bg-white dark:bg-slate-900 rounded-lg mb-6">
          <nav
            className="flex flex-nowrap gap-1 overflow-x-auto overflow-y-hidden p-3 -mx-3 sm:mx-0 sm:px-3"
            style={{ WebkitOverflowScrolling: 'touch' }}
            aria-label="Tabs"
          >
            {VALID_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`
                shrink-0 whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 font-medium text-sm transition-colors rounded-lg capitalize
                  ${
                    activeTab === tab
                      ? "bg-primary-600 text-white shadow-md dark:bg-primary-500 dark:text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'plans' && (
          arePlansLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
          <div className="rounded-lg bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Plans ({plans.length})
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage your membership plans and their features.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <input
                    type="checkbox"
                    checked={showArchivedPlans}
                    onChange={(e) => setShowArchivedPlans(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Show Archived
                  </span>
                </label>
                <Button size="sm" onClick={handleAddPlan} className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plan
                </Button>
              </div>
            </div>

            {filteredPlans.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500">No plans found in this group.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredPlans.map(p => p._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {filteredPlans.map((plan) => (
                      <SortablePlanCard
                        key={plan._id}
                        plan={plan}
                        onToggleStatus={handleTogglePlanStatus}
                        onEdit={handleEditPlan}
                        getCategoryColor={getCategoryColor}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
          )
        )}

        {activeTab === 'pricing' && (
          arePricingsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
          <div className="rounded-lg bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Pricing ({pricings.length})
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage all billing cycles and price variants for this plan group.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search pricing plans..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button size="sm" onClick={handleAddPricing} className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pricing
                </Button>
              </div>

              {/* Table Container */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    <div className="col-span-1">Status</div>
                    <div className="col-span-3">Plan Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Frequency</div>
                    <div className="col-span-2">Amount</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* List */}
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {pricings.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No pricing tiers found.</p>
                      </div>
                    ) : (
                      pricings.map((pricing) => (
                        <div key={pricing._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {/* Status */}
                          <div className="col-span-1 flex items-center">
                            <ToggleSlider 
                              checked={pricing.isActive}
                              onCheckedChange={() => handleTogglePricingStatus(pricing._id, pricing.isActive)}
                            />
                          </div>

                          {/* Plan Name */}
                          <div className="col-span-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {pricing.planName}
                            </h3>
                            {pricing.isActive && (
                              <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide block mt-0.5">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Type */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                              {pricing.paymentType || 'Recurring'}
                            </span>
                          </div>

                          {/* Frequency */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {pricing.billingCycle ? 
                                (pricing.billingCycle.frequency === 1 && pricing.billingCycle.unit === 'months' ? 'Monthly' : 
                                pricing.billingCycle.frequency === 1 && pricing.billingCycle.unit === 'years' ? 'Annual' : 
                                `${pricing.billingCycle.frequency} ${pricing.billingCycle.unit}`) 
                                : '-'}
                            </span>
                          </div>

                          {/* Amount */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-gray-900 dark:text-white">
                                ${pricing.subscriptionAmount?.toFixed(2) ?? pricing.oneTimePayment?.toFixed(2) ?? '0.00'}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePricing(pricing._id);
                                }}
                                className="rounded-lg border-2 border-secondary-500 bg-white px-3 py-2 text-sm font-semibold text-secondary-500 shadow-sm transition hover:bg-secondary-50 hover:border-secondary-600 hover:text-secondary-600 dark:border-secondary-500 dark:bg-slate-800 dark:text-secondary-500 dark:hover:bg-secondary-900/20 dark:hover:border-secondary-400 dark:hover:text-secondary-400"
                                aria-label="Delete pricing"
                                title="Delete Pricing"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditPricing(pricing);
                                }}
                                className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                                aria-label="Edit pricing"
                                title="Edit Pricing"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {activeTab === 'members' && (
          areMembersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
          <div className="rounded-lg bg-white p-4 shadow-xl shadow-primary-500/5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Members ({members.length})
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  View all members subscribed to plans in this group.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-400 uppercase tracking-wider border-y border-gray-100 dark:border-gray-700">
                    <div className="col-span-3">Member</div>
                    <div className="col-span-3">Plan Details</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Start Date</div>
                    <div className="col-span-2">Expiry Date</div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {members.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No members found.</p>
                      </div>
                    ) : (
                      members.map((member) => (
                        <div key={member._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          {/* Member Info */}
                          <div className="col-span-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {member.firstName} {member.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {member.contactEmail}
                            </p>
                          </div>

                          {/* Plan Info */}
                          <div className="col-span-3">
                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                              {member.planId?.planName || member.pricingId?.planName || 'Unknown Plan'}
                            </p>
                            {member.pricingId && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {member.pricingId.paymentType === 'recurring' 
                                  ? `${member.pricingId.billingCycle?.frequency} ${member.pricingId.billingCycle?.unit}`
                                  : 'One-time'}
                              </p>
                            )}
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${member.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                                member.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                              {member.status}
                            </span>
                          </div>

                          {/* Start Date */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {formatDate(member.purchaseDate)}
                            </span>
                          </div>

                          {/* Expiry Date */}
                          <div className="col-span-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {formatExpiryDate(member.expiryDate, member.purchaseDate)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}
      </div>

      {/* Add Plan Dialog */}
      <AddEditPlanDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSavePlan}
        initialData={editingPlan}
        categories={categories}
        isLoading={isPlanLoading}
      />

      {/* Add Pricing Dialog */}
      <AddEditPricingDialog
        isOpen={isPricingDialogOpen}
        onClose={() => setIsPricingDialogOpen(false)}
        onSave={handleSavePricing}
        initialData={editingPricing}
        plans={plans}
      />
      
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
}
