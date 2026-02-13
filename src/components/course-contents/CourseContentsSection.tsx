import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { ConfirmationDialog } from '@/components/ui';
import { SectionActivityList } from './SectionActivityList';
import { ActivityEditor } from './ActivityEditor';
import { courseDetailService } from '@/services/courseDetailService';
import { courseContentsService, type Section, type Chapter } from '@/services/courseContentsService';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

interface CourseContentsSectionProps {
  courseId: string;
  courseObject: any;
  isMasterTenant: boolean;
  onRefresh?: () => void;
}

export const CourseContentsSection: React.FC<CourseContentsSectionProps> = ({
  courseId,
  courseObject,
  isMasterTenant,
  onRefresh,
}) => {
  const toast = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Chapter | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  const loadSections = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const res = await courseDetailService.getCourseDetail(courseId);
      const course = res?.data || res;
      const courseSections = course?.courseSections || [];

      if (Array.isArray(courseSections) && courseSections.length > 0) {
        setSections(courseSections);
        const first = courseSections[0];
        setSelectedSection(first);
        const firstLesson = first?.chapters?.[0];
        setSelectedLesson(firstLesson ?? null);
      } else {
        setSections([]);
        setSelectedSection(null);
        setSelectedLesson(null);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load sections');
      setSections([]);
      setSelectedSection(null);
      setSelectedLesson(null);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, toast]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const addSection = async () => {
    setIsAddingSection(true);
    try {
      const nextSeq = sections.length + 1;
      const res = await courseContentsService.addSection(courseId, {
        title: `Section ${nextSeq}`,
        course: courseId,
        chapter: { title: 'New Activity', isNote: true },
        isDefaultSection: false,
      });
      setSections((prev) => [...prev, res]);
      setSelectedSection(res);
      setSelectedLesson(res.chapters?.[0] ?? null);
      toast.success('Section added successfully');
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add section');
    } finally {
      setIsAddingSection(false);
    }
  };

  const updateSection = async (s: Section, newTitle: string) => {
    try {
      await courseContentsService.updateSection({ ...s, title: newTitle });
      setSections((prev) =>
        prev.map((x) => (x.guId === s.guId ? { ...x, title: newTitle } : x))
      );
      if (selectedSection?.guId === s.guId) {
        setSelectedSection((prev) => (prev?.guId === s.guId ? { ...prev!, title: newTitle } : prev));
      }
      toast.success('Section updated successfully');
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update section');
    }
  };

  const deleteSection = (s: Section) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${s.title}?`,
      description: 'Are you sure you want to continue?',
      onConfirm: async () => {
        try {
          await courseContentsService.deleteSection(courseId, s.guId);
          setSections((prev) => prev.filter((x) => x.guId !== s.guId));
          if (selectedSection?.guId === s.guId) {
            const remaining = sections.filter((x) => x.guId !== s.guId);
            const next = remaining[remaining.length - 1];
            setSelectedSection(next ?? null);
            setSelectedLesson(next?.chapters?.[0] ?? null);
          }
          toast.success('Section deleted successfully');
          onRefresh?.();
        } catch (err: any) {
          toast.error((err as Error)?.message || 'Failed to delete section');
        }
      },
    });
  };

  const addActivity = async () => {
    if (!selectedSection) {
      toast.error('Select a section first');
      return;
    }
    setIsAddingActivity(true);
    try {
      const chapters = selectedSection.chapters || [];
      const nextSeq =
        chapters.length > 0
          ? Math.max(...chapters.map((c) => c.sequence ?? 0), 0) + 1
          : 1;

      const res = await courseContentsService.addActivity({
        name: `Activity ${nextSeq}`,
        course: selectedSection.course || courseId,
        section: selectedSection.guId,
        sequence: nextSeq,
        isNote: true,
      });

      const newChapter = res?.studioChapter;
      if (newChapter) {
        setSections((prev) =>
          prev.map((sec) =>
            sec.guId === selectedSection.guId
              ? {
                  ...sec,
                  chapters: [...(sec.chapters || []), newChapter],
                }
              : sec
          )
        );
        setSelectedSection((prev) => {
          if (prev?.guId !== selectedSection.guId) return prev;
          return {
            ...prev,
            chapters: [...(prev.chapters || []), newChapter],
          };
        });
        setSelectedLesson(newChapter);
        toast.success('Activity added successfully');
        onRefresh?.();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add activity');
    } finally {
      setIsAddingActivity(false);
    }
  };

  const updateLesson = async (l: Chapter, newTitle: string) => {
    if (!selectedSection) return;
    try {
      await courseContentsService.updateLesson(
        courseId,
        selectedSection.guId,
        l.guId,
        { ...l, title: newTitle }
      );
      setSections((prev) =>
        prev.map((sec) =>
          sec.guId === selectedSection.guId
            ? {
                ...sec,
                chapters: (sec.chapters || []).map((c) =>
                  c.guId === l.guId ? { ...c, title: newTitle } : c
                ),
              }
            : sec
        )
      );
      if (selectedLesson?.guId === l.guId) {
        setSelectedLesson((prev) => (prev?.guId === l.guId ? { ...prev!, title: newTitle } : prev));
      }
      toast.success('Activity updated successfully');
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update activity');
    }
  };

  const handleActivityDeleted = () => {
    if (selectedSection) {
      const updated = (selectedSection.chapters || []).filter(
        (c) => c.guId !== selectedLesson?.guId
      );
      setSections((prev) =>
        prev.map((sec) =>
          sec.guId === selectedSection.guId ? { ...sec, chapters: updated } : sec
        )
      );
      setSelectedSection((prev) =>
        prev?.guId === selectedSection.guId ? { ...prev!, chapters: updated } : prev
      );
      setSelectedLesson(updated[0] ?? null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Left Panel - Sections & Activities */}
      <div className="lg:w-[320px] xl:w-[360px] flex-shrink-0">
        <SectionActivityList
            sections={sections}
            selectedSection={selectedSection}
            selectedLesson={selectedLesson}
            onSelectSection={setSelectedSection}
            onSelectLesson={setSelectedLesson}
            onAddSection={addSection}
            onAddActivity={addActivity}
            onEditSection={updateSection}
            onDeleteSection={deleteSection}
            onEditLesson={updateLesson}
            isMasterTenant={isMasterTenant}
            isAddingSection={isAddingSection}
            isAddingActivity={isAddingActivity}
          />
      </div>

      {/* Right Panel - Activity Editor */}
      <div className="flex-1 min-w-0">
        {selectedSection?.guId && selectedLesson?.guId ? (
            <ActivityEditor
              courseId={courseId}
              courseObject={courseObject}
              section={selectedSection}
              lesson={selectedLesson}
              currentBatchName={courseObject?.currentBatch?.name}
              onActivityDeleted={handleActivityDeleted}
              onActivityUpdated={() => onRefresh?.()}
              isMasterTenant={isMasterTenant}
            />
        ) : (
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border border-dashed',
              'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-16'
            )}
          >
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No activities found</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 text-center">
              Add an activity to get started, or create a new section first.
            </p>
            <Button
              onClick={addActivity}
              className="mt-6"
              disabled={!selectedSection || !isMasterTenant || isAddingActivity}
            >
              {isAddingActivity ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isAddingActivity ? 'Adding…' : 'Add Activity'}
            </Button>
          </div>
        )}
      </div>

      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText="Delete"
          variant="danger"
          onConfirm={confirmDialog.onConfirm}
        />
      )}
    </div>
  );
};
