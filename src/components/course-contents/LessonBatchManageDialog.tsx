import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ToggleSlider } from '@/components/ui';
import { batchService, Batch } from '@/services/batchService';
import { courseContentsService } from '@/services/courseContentsService';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

interface LessonBatchManageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  onUpdated?: () => void;
}

export const LessonBatchManageDialog: React.FC<LessonBatchManageDialogProps> = ({
  isOpen,
  onClose,
  chapterId,
  onUpdated,
}) => {
  const toast = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [chapterBatches, setChapterBatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [batchList, cbList] = await Promise.all([
        batchService.getBatches(),
        courseContentsService.getChapterBatch(chapterId),
      ]);
      setBatches(batchList.filter((b) => !b.isDynamic));
      setChapterBatches(cbList || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load batches');
      setBatches([]);
      setChapterBatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, toast]);

  useEffect(() => {
    if (isOpen && chapterId) {
      loadData();
    }
  }, [isOpen, chapterId, loadData]);

  const getBatchStatus = (batch: Batch) => {
    const cb = chapterBatches.find((c) => c.courseBatchGuId === batch.guId);
    return cb?.isPublished ?? false;
  };

  const handlePublish = async (batch: Batch, checked: boolean) => {
    try {
      await courseContentsService.publishChapterBatch({
        batchId: batch.guId,
        chapterId,
        isPublished: checked,
      });
      toast.success(checked ? 'Batch is Published' : 'Batch is Private');
      loadData();
      onUpdated?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update batch');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Manage Batches</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No batches found</p>
          ) : (
            <div className="space-y-3">
              {batches.map((batch) => (
                <div
                  key={batch.guId}
                  className={cn(
                    'flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600',
                    'px-4 py-3 bg-white dark:bg-slate-800/50'
                  )}
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1 mr-4">
                    {batch.name}
                  </span>
                  <ToggleSlider
                    checked={getBatchStatus(batch)}
                    onCheckedChange={(checked) => handlePublish(batch, checked)}
                    labelOn=""
                    labelOff=""
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
