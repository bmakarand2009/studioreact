import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CreditCard, AlertCircle, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, ToggleSlider, ConfirmationDialog } from '@/components/ui';
import { useToast } from "@/components/ui/ToastProvider";
import { membershipPlanService } from '@/services/membershipPlanService';
import { MembershipPlanGroup } from '@/types/membershipPlan';
import { AddEditPlanGroupDialog } from './_components/AddEditPlanGroupDialog';

export default function AdminMembershipPlansPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  
  const [planGroups, setPlanGroups] = useState<MembershipPlanGroup[]>([]);
  const [selectedPlanGroup, setSelectedPlanGroup] = useState<MembershipPlanGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  const fetchPlanGroups = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await membershipPlanService.getPlanGroups({
        search: searchQuery || undefined,
        isShowArchived: showArchived,
      });

      const sortedData = data.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return a.groupName.localeCompare(b.groupName);
      });

      setPlanGroups(sortedData);
    } catch (err: any) {
      console.error('Failed to fetch membership plan groups:', err);
      setError(err.message || 'Failed to load membership plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, showArchived]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlanGroups();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPlanGroups]);


  const handleAddPlanGroup = () => {
    setSelectedPlanGroup(null);
    setIsAddDialogOpen(true);
  };

  const handleEditPlanGroup = (plan: MembershipPlanGroup) => {
    setSelectedPlanGroup(plan);
    setIsAddDialogOpen(true);
  };

  const handleSavePlanGroup = async (data: any) => {
    try {
      if (selectedPlanGroup) {
        await membershipPlanService.updatePlanGroup(selectedPlanGroup._id, data);
        toast.success("Membership plan group updated successfully");
        setIsAddDialogOpen(false);
        fetchPlanGroups();
      } else {
        const result: any = await membershipPlanService.createPlanGroup(data);
        const newId = result?.planGroup?._id || result?.planGroup?.id || result?._id || result?.id;
        
        toast.success("Membership plan group created successfully");
        setIsAddDialogOpen(false);
        
        if (newId) {
          navigate(`/admin/membership-plans/${newId}`);
        } else {
          fetchPlanGroups();
        }
      }
    } catch (err: any) {
      console.error('Failed to save plan group:', err);
      toast.error(err.message || 'Failed to save plan group');
      throw err;
    }
  };

  const handlePlanGroupClick = (id: string) => {
    navigate(`/admin/membership-plans/${id}`);
  };

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    // Optimistic update
    setPlanGroups(prev => prev.map(p => 
      p._id === id ? { ...p, isPublished: newStatus } : p
    ));

    try {
      await membershipPlanService.togglePublishStatus(id, newStatus);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      // Revert on error
      setPlanGroups(prev => prev.map(p => 
        p._id === id ? { ...p, isPublished: !newStatus } : p
      ));
      throw err;
    }
  };

  const handleDeletePlanGroup = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Plan Group",
      description: "Are you sure you want to delete this membership plan group? This action cannot be undone.",
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await membershipPlanService.deletePlanGroup(id);
          toast.success("Membership plan group deleted successfully");
          // Update local state
          setPlanGroups(prev => prev.filter(p => p._id !== id));
        } catch (error: any) {
          console.error("Failed to delete plan group:", error);
          toast.error(error.message || "Failed to delete plan group");
        }
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-brand-500 rounded-xl flex items-center justify-center shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Membership Plans</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your membership plan groups
                </p>
              </div>
            </div>
            <Button
              onClick={handleAddPlanGroup}
              className="bg-gradient-to-r from-primary-600 to-brand-600 hover:from-primary-700 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Membership Group
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for Memberships"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Show Archived
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">Please Wait.</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-1">
                  Error Loading Membership Plans
                </h3>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPlanGroups}
                  className="mt-4 border-red-200 hover:bg-red-50 text-red-700 dark:border-red-800 dark:hover:bg-red-900/30 dark:text-red-300"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* List Content */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {planGroups.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  You don’t have any membership groups yet.
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Click below to create one.
                </p>
                <Button
                  onClick={handleAddPlanGroup}
                  variant="ghost"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  create membership group
                </Button>
              </div>
            ) : (
              planGroups.map((plan) => (
                <Card 
                  key={plan._id} 
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary-500"
                  onClick={() => handlePlanGroupClick(plan._id)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()} className="mt-1">
                            <ToggleSlider 
                              checked={!!plan.isPublished} 
                              onCheckedChange={(checked) => handleToggleStatus(plan._id, checked)}
                              disabled={!!plan.isDeleted} 
                            />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {plan.groupName}
                          </h3>
                          {plan.isPublished && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-600 uppercase tracking-wide">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlanGroup(plan._id);
                            }}
                            className="rounded-lg border-2 border-secondary-500 bg-white px-3 py-2 text-sm font-semibold text-secondary-500 shadow-sm transition hover:bg-secondary-50 hover:border-secondary-600 hover:text-secondary-600 dark:border-secondary-500 dark:bg-slate-800 dark:text-secondary-500 dark:hover:bg-secondary-900/20 dark:hover:border-secondary-400 dark:hover:text-secondary-400"
                            aria-label="Delete plan"
                            title="Delete plan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPlanGroup(plan);
                            }}
                            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-primary-500/30 transition hover:bg-primary-700"
                            aria-label="Edit plan"
                            title="Edit plan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>
                          Updated on{' '}
                          {new Date(plan.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {plan.groupDescription}
                      </p>

                      {/* Stats row - placeholder/inferred from design */}
                      {/* 
                      <div className="flex items-center gap-6 pt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>1,248 Members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>$149.00 / mo</span>
                        </div>
                      </div> 
                      */}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

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

      <AddEditPlanGroupDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={handleSavePlanGroup}
        initialData={selectedPlanGroup}
      />
    </div>
  );
}