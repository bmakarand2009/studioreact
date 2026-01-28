import { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';
import { Button, ConfirmationDialog } from '@/components/ui';
import { Input } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { batchService, Batch } from '@/services/batchService';

/**
 * BatchManagementDialog - Generic batch management component
 * 
 * Can be used for:
 * - Courses (itemCategory)
 * - Services (itemCategory)
 * - Product Bundles (itemCategory)
 * 
 * All use the same batch management API endpoints.
 */
interface BatchManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string; // Course/Service/Product Bundle ID (itemCategory guId)
  itemName: string; // Course/Service/Product Bundle name
  currentBatchId?: string;
  onBatchChanged: () => void;
}

export const BatchManagementDialog = ({
  isOpen,
  onClose,
  itemId,
  itemName,
  currentBatchId,
  onBatchChanged,
}: BatchManagementDialogProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddBatch, setIsAddBatch] = useState(false);
  const [isUpdateBatch, setIsUpdateBatch] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [selectedBatchForEditing, setSelectedBatchForEditing] = useState<Batch | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | undefined>(currentBatchId);
  const batchNameInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadBatches();
      setSelectedBatchId(currentBatchId);
    } else {
      // Reset state when dialog closes
      setIsAddBatch(false);
      setIsUpdateBatch(false);
      setBatchName('');
      setSelectedBatchForEditing(null);
    }
  }, [isOpen, currentBatchId]);

  useEffect(() => {
    if ((isAddBatch || isUpdateBatch) && batchNameInputRef.current) {
      setTimeout(() => {
        batchNameInputRef.current?.focus();
      }, 100);
    }
  }, [isAddBatch, isUpdateBatch]);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const allBatches = await batchService.getBatches();
      // Filter out dynamic batches (matching Angular behavior)
      const filteredBatches = allBatches.filter((batch) => !batch.isDynamic);
      setBatches(filteredBatches);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBatch = async () => {
    if (!batchName.trim()) {
      toast.error('Batch name is required');
      return;
    }

    setIsLoading(true);
    try {
      await batchService.createBatch({ name: batchName.trim(), isActive: true });
      toast.success('New batch added successfully');
      setBatchName('');
      setIsAddBatch(false);
      await loadBatches();
      onBatchChanged();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create batch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBatch = async () => {
    if (!batchName.trim() || !selectedBatchForEditing) {
      toast.error('Batch name is required');
      return;
    }

    setIsLoading(true);
    try {
      await batchService.updateBatch(selectedBatchForEditing.guId, { name: batchName.trim() });
      toast.success('Batch updated successfully');
      setBatchName('');
      setIsUpdateBatch(false);
      setSelectedBatchForEditing(null);
      await loadBatches();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update batch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBatch = (batch: Batch) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Batch',
      description: 'Are you sure you want to delete this batch? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await batchService.deleteBatch(batch.guId);
          toast.success('Batch deleted successfully');
          await loadBatches();
          // If deleted batch was the current batch, reset selection
          if (selectedBatchId === batch.guId) {
            setSelectedBatchId(undefined);
          }
          onBatchChanged();
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete batch');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleChangeCourseBatch = (batchId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Change Current Batch',
      description: 'Are you sure you want to change the current batch?',
      confirmText: 'Change',
      variant: 'info',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const batch = batches.find((b) => b.guId === batchId);
          if (!batch) {
            throw new Error('Batch not found');
          }

          await batchService.updateCourseBatch(itemId, {
            name: itemName,
            courseBatchId: batchId,
          });
          toast.success('Batch updated successfully');
          setSelectedBatchId(batchId);
          onBatchChanged();
        } catch (error: any) {
          toast.error(error.message || 'Failed to update course batch');
          setSelectedBatchId(currentBatchId);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleShowAddBatch = () => {
    setIsAddBatch(true);
    setIsUpdateBatch(false);
    setBatchName('');
    setSelectedBatchForEditing(null);
  };

  const handleShowEditBatch = (batch: Batch) => {
    setIsUpdateBatch(true);
    setIsAddBatch(false);
    setBatchName(batch.name);
    setSelectedBatchForEditing(batch);
  };

  const handleHideEditMode = () => {
    setIsAddBatch(false);
    setIsUpdateBatch(false);
    setBatchName('');
    setSelectedBatchForEditing(null);
  };

  const handleSubmit = () => {
    if (isUpdateBatch) {
      handleUpdateBatch();
    } else {
      handleAddBatch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {isAddBatch ? 'Manage Batch - Add' : isUpdateBatch ? 'Manage Batch - Update' : 'Manage Batch'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isAddBatch && !isUpdateBatch && (
            <div className="space-y-4">
              {isLoading && batches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">Loading batches...</div>
              ) : batches.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No batches found</div>
              ) : (
                <div className="space-y-2">
                  {batches.map((batch) => (
                    <div
                      key={batch.guId}
                      className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="radio"
                          id={`batch-${batch.guId}`}
                          name="batch-selection"
                          checked={selectedBatchId === batch.guId}
                          onChange={() => {
                            setSelectedBatchId(batch.guId);
                            handleChangeCourseBatch(batch.guId);
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <label
                          htmlFor={`batch-${batch.guId}`}
                          className="flex-1 cursor-pointer text-slate-900 dark:text-slate-50 font-medium"
                          title={batch.name}
                        >
                          {batch.name}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleShowEditBatch(batch)}
                          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          aria-label="Edit batch"
                        >
                          <Edit className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteBatch(batch)}
                          className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors"
                          aria-label="Delete batch"
                        >
                          <Trash2 className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isAddBatch || isUpdateBatch) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Batch Name
                </label>
                <Input
                  ref={batchNameInputRef}
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Enter batch name"
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          {!isAddBatch && !isUpdateBatch ? (
            <Button onClick={handleShowAddBatch} variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Batch
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button onClick={handleHideEditMode} variant="outline" size="sm">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!batchName.trim() || isLoading} size="sm">
                {isLoading ? 'Saving...' : 'Submit'}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={(confirmed) => {
            if (!confirmed) {
              // If canceling batch change, reset selection
              if (confirmDialog.title === 'Change Current Batch') {
                setSelectedBatchId(currentBatchId);
              }
            }
            setConfirmDialog(null);
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
