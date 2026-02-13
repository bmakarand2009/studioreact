import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Trash2,
  Info,
  Play,
  ClipboardList,
  FileText,
  Film,
  CloudDownload,
  Settings,
  Loader2,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button, Input, Textarea, ToggleSlider, SearchableDropdown } from "@/components/ui";
import { UploadMediaFile } from "@/components/upload-media-file";
import { LessonBatchManageDialog } from "./LessonBatchManageDialog";
import {
  courseContentsService,
  type Activity,
  type Section,
  type Chapter,
} from "@/services/courseContentsService";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import type { AssetData } from "@/types/upload";
import { appLoadService } from "@/app/core/app-load";
import { setupService, type CustomForm } from "@/services/setupService";

type ActivityTab = "content" | "test" | "form";

interface ActivityEditorProps {
  courseId: string;
  courseObject: any;
  section: Section | null;
  lesson: Chapter | null;
  currentBatchName?: string;
  onActivityDeleted: () => void;
  onActivityUpdated: () => void;
  isMasterTenant: boolean;
}

export const ActivityEditor: React.FC<ActivityEditorProps> = ({
  courseId,
  courseObject,
  section,
  lesson,
  currentBatchName,
  onActivityDeleted,
  onActivityUpdated,
  isMasterTenant,
}) => {
  const toast = useToast();
  const [activityData, setActivityData] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [chapterBatchPublished, setChapterBatchPublished] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>("content");
  const [showMobileSlug, setShowMobileSlug] = useState(false);
  const [showDateSlug, setShowDateSlug] = useState(false);
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [testList, setTestList] = useState<{ _id: string; name: string }[]>([]);

  const [formState, setFormState] = useState({
    name: "",
    shortDescription: "",
    additionalInfo: "",
    dateSlug: "",
    activityType: "content" as ActivityTab,
    customFormGuId: "",
    quizId: "",
    isTrackActivity: true,
    isRepeatActivity: false,
    isHideActivityOnToc: false,
    isAllowUserToUploadFiles: false,
    isDemoActivity: false,
  });

  const assetData = (activityData?.assetData?.filter(
    (a: any) => !a.isDownloadable,
  ) || []) as AssetData[];
  const downloadableAssetData = (activityData?.assetData?.filter(
    (a: any) => a.isDownloadable,
  ) || []) as AssetData[];

  const loadActivity = useCallback(async () => {
    if (!lesson?.guId || !courseId) {
      setActivityData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await courseContentsService.getActivity(
        courseId,
        lesson.guId,
      );
      const data = res?.data ?? null;

      if (data) {
        setActivityData(data);
        setFormState({
          name: data.name || lesson.title,
          shortDescription: data.shortDescription || "",
          additionalInfo: data.additionalInfo || "",
          dateSlug: "",
          activityType: (data.activityType || "content") as ActivityTab,
          customFormGuId: data.customFormGuId || "",
          quizId: data.quizId || "",
          isTrackActivity: data.isTrackActivity !== false,
          isRepeatActivity: data.isRepeatActivity || false,
          isHideActivityOnToc: data.isHideActivityOnToc || false,
          isAllowUserToUploadFiles: data.isAllowUserToUploadFiles || false,
          isDemoActivity: data.isDemoActivity || false,
        });
        setActiveTab((data.activityType || "content") as ActivityTab);

        const chapterBatches = await courseContentsService.getChapterBatch(
          lesson.guId,
        );
        const currentBatch = courseObject?.currentBatch;
        const cb = currentBatch
          ? chapterBatches.find(
              (c: any) => c.courseBatchGuId === currentBatch.guId,
            )
          : null;
        setChapterBatchPublished(cb?.isPublished ?? false);
      } else {
        setActivityData(null);
        setFormState({
          name: lesson.title,
          shortDescription: "",
          additionalInfo: "",
          dateSlug: "",
          activityType: "content",
          customFormGuId: "",
          quizId: "",
          isTrackActivity: true,
          isRepeatActivity: false,
          isHideActivityOnToc: false,
          isAllowUserToUploadFiles: false,
          isDemoActivity: false,
        });
      }
    } catch {
      setActivityData(null);
      setFormState({
        name: lesson.title,
        shortDescription: "",
        additionalInfo: "",
        dateSlug: "",
        activityType: "content",
        customFormGuId: "",
        quizId: "",
        isTrackActivity: true,
        isRepeatActivity: false,
        isHideActivityOnToc: false,
        isAllowUserToUploadFiles: false,
        isDemoActivity: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lesson?.guId, lesson?.title, courseObject?.currentBatch]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [forms, testsRes] = await Promise.all([
          setupService.getCustomFormsByType("STUDENT_REGISTRATION"),
          courseContentsService.getTestList(),
        ]);
        setCustomForms(forms);
        setTestList(testsRes?.data ?? []);
      } catch {
        // ignore
      }
    };
    loadOptions();
  }, []);

  const handlePublishToggle = async (checked: boolean) => {
    if (!courseObject?.currentBatch?.guId || !lesson?.guId) return;
    try {
      await courseContentsService.publishChapterBatch({
        batchId: courseObject.currentBatch.guId,
        chapterId: lesson.guId,
        isPublished: checked,
      });
      setChapterBatchPublished(checked);
      toast.success(checked ? "Batch is Published" : "Batch is Private");
      onActivityUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update publish status");
    }
  };

  const handleMediaOutput = async (event: any) => {
    if (event === "refresh") {
      try {
        const res = await courseContentsService.getActivity(
          courseId,
          lesson!.guId,
        );
        setActivityData(res?.data ?? null);
      } catch {
        // ignore
      }
      return;
    }
    if (event?.type === "description" && activityData?._id) {
      try {
        await courseContentsService.updateActivity({
          _id: activityData._id,
          paragraph: event.value,
        });
      } catch {
        // ignore
      }
    }
    if (event?.type === "image" && activityData?._id) {
      try {
        await courseContentsService.updateActivity({
          _id: activityData._id,
          imgUrl: event.value,
        });
      } catch {
        // ignore
      }
    }
  };

  const handleSubmit = async () => {
    if (!section || !lesson || !formState.name.trim()) {
      toast.error("Activity name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        _id: activityData?._id,
        name: formState.name,
        shortDescription: formState.shortDescription,
        additionalInfo: formState.additionalInfo,
        activityType: formState.activityType,
        customFormGuId: formState.customFormGuId || undefined,
        quizId: formState.quizId || undefined,
        course: courseId,
        chapter: lesson.guId,
        section: section.guId,
        sequence: 1,
        isTrackActivity: formState.isTrackActivity,
        isRepeatActivity: formState.isRepeatActivity,
        isHideActivityOnToc: formState.isHideActivityOnToc,
        isAllowUserToUploadFiles: formState.isAllowUserToUploadFiles,
        isDemoActivity: formState.isDemoActivity,
      };

      if (activityData?._id) {
        await courseContentsService.updateActivity(payload);
        toast.success("Activity updated successfully");
      } else {
        await courseContentsService.submitActivity(payload);
        toast.success("Activity created successfully");
      }
      loadActivity();
      onActivityUpdated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save activity");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!activityData?._id) return;
    if (!confirm(`Delete "${formState.name}"?`)) return;
    courseContentsService
      .deleteActivity(activityData._id)
      .then(() => {
        toast.success("Activity deleted");
        onActivityDeleted();
      })
      .catch((err: any) => toast.error(err?.message || "Failed to delete"));
  };

  const productData = {
    productId: courseObject?.guId,
    productName: courseObject?.name,
    chapterId: lesson?.guId,
    sectionId: section?.guId,
  };

  if (!section || !lesson) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Header Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="bg-white dark:bg-slate-900 px-4 py-4 sm:px-6 sm:py-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-500 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                {formState.name || "New Activity"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Define the core content and settings for this lesson.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {isMasterTenant && (
                <button
                  onClick={handleDelete}
                  className="p-2 rounded-lg text-secondary-500 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-900/20 transition-colors"
                  title="Delete activity"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setShowBatchDialog(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Manage Batches"
              >
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </button>
              <ToggleSlider
                checked={chapterBatchPublished}
                onCheckedChange={handlePublishToggle}
                labelOn="Published"
                labelOff="Private"
                disabled={!courseObject?.currentBatch || !isMasterTenant}
              />
            </div>
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 w-fit">
              Current Batch: {currentBatchName || "Not Applied"}
            </span>
          </div>
        </div>
      </div>

      {/* Basic Information Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Basic Information
          </h3>
        </div>
        <div className="space-y-4">
          <Input
            label="Activity Name *"
            value={formState.name}
            onChange={(e) =>
              setFormState((p) => ({ ...p, name: e.target.value }))
            }
            disabled={!isMasterTenant}
            placeholder="Activity name for members"
          />
          <Textarea
            label="Short Description"
            value={formState.shortDescription}
            onChange={(e) =>
              setFormState((p) => ({ ...p, shortDescription: e.target.value }))
            }
            placeholder="Provide a brief overview of what this activity covers..."
            rows={4}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <button
                type="button"
                onClick={() => setShowMobileSlug(!showMobileSlug)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showMobileSlug && "rotate-180",
                  )}
                />
                Mobile Slug
              </button>
              {showMobileSlug && (
                <Input
                  value={formState.additionalInfo}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      additionalInfo: e.target.value,
                    }))
                  }
                  disabled={!isMasterTenant}
                  placeholder="Used only by the Mobile App for chapter type or other logic."
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowDateSlug(!showDateSlug)}
                className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showDateSlug && "rotate-180",
                  )}
                />
                Date Slug
              </button>
              {showDateSlug && (
                <Input
                  type="datetime-local"
                  value={formState.dateSlug}
                  onChange={(e) =>
                    setFormState((p) => ({ ...p, dateSlug: e.target.value }))
                  }
                  disabled={!isMasterTenant}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Type Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2 bg-white gap-1">
          {(
            [
              { id: "content" as const, label: "Content", icon: Play },
              { id: "test" as const, label: "Assessment", icon: ClipboardList },
              { id: "form" as const, label: "Form", icon: FileText },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setFormState((p) => ({ ...p, activityType: tab.id }));
              }}
              disabled={!isMasterTenant}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-primary-500 text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Form - only when activityType is form */}
      {activeTab === "form" && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Custom Form
            </h3>
          </div>
          <SearchableDropdown<CustomForm>
            items={customForms}
            value={formState.customFormGuId || ""}
            onChange={(v) =>
              setFormState((p) => ({ ...p, customFormGuId: v }))
            }
            getItemValue={(f) => f.guId}
            getItemLabel={(f) => f.name}
            placeholder="Select Student Custom Form"
            searchPlaceholder="Search forms..."
            emptyMessage="No form found."
            disabled={!isMasterTenant}
          />
        </div>
      )}

      {/* Assessment - only when activityType is test */}
      {activeTab === "test" && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessment
            </h3>
          </div>
          <SearchableDropdown<{ _id: string; name: string }>
            items={testList}
            value={formState.quizId || ""}
            onChange={(v) => setFormState((p) => ({ ...p, quizId: v }))}
            getItemValue={(t) => t._id}
            getItemLabel={(t) => t.name}
            placeholder="Select assessment"
            searchPlaceholder="Search assessment..."
            emptyMessage="No assessment found."
            disabled={!isMasterTenant}
          />
        </div>
      )}

      {/* Media Content Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Media Content
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
            MAX 2GB FOR VIDEO / 20MB FOR PDF
          </span>
        </div>
        <div>
          <UploadMediaFile
            moduleName="course"
            title="Add Media Content"
            helpText="Upload images, video, audio, PDFs, or add links."
            assetData={assetData}
            showPreview
            allowMultipleUploads
            productData={productData}
            isUploadDisabled={!isMasterTenant}
            isFranchiseCourse={courseObject?.isFranchiseCourse}
            cloudName={appLoadService.tenantDetails?.cloudName ?? ''}
            allowedMedia={[
              "video",
              "audio",
              "image",
              "pdf",
              "link",
              "description",
            ]}
            imageUrl={activityData?.imgUrl}
            description={activityData?.paragraph}
            onOutput={handleMediaOutput}
          />
        </div>
      </div>

      {/* Downloadable Resources Card - No preview, files go to Wasabi/S3 (vs Media Content: preview + Cloudinary/Bunny) */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <CloudDownload className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Downloadable Resources
          </h3>
        </div>
        <div>
          <UploadMediaFile
            moduleName="course"
            title="Click to add downloadable files (PDF, ZIP, DOCX)"
            assetData={downloadableAssetData}
            isDownloadable
            showPreview={false}
            productData={productData}
            isUploadDisabled={!isMasterTenant}
            allowedMedia={["video", "audio", "image", "pdf", "other"]}
            onOutput={handleMediaOutput}
          />
        </div>
      </div>

      {/* Activity Behavior Card */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Activity Behavior
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="block cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.isTrackActivity}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    isTrackActivity: e.target.checked,
                  }))
                }
                disabled={!isMasterTenant}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Track Activity Completion
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
              Students will need to mark the lesson as complete for tracking
              and course progress purposes.
            </p>
          </label>

          <label className="block cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.isRepeatActivity}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    isRepeatActivity: e.target.checked,
                  }))
                }
                disabled={!isMasterTenant}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Repeat Activity
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
              Allow students to complete this assessment or activity multiple
              times.
            </p>
          </label>

          {(activeTab === "content" || activeTab === "test") && (
            <label className="block cursor-pointer">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.isDemoActivity}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      isDemoActivity: e.target.checked,
                    }))
                  }
                  disabled={!isMasterTenant}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Allow Demo Access
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
                Students registered for a demo version of the course will be
                able to view this activity.
              </p>
            </label>
          )}

          <label className="block cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formState.isHideActivityOnToc}
                onChange={(e) =>
                  setFormState((p) => ({
                    ...p,
                    isHideActivityOnToc: e.target.checked,
                  }))
                }
                disabled={!isMasterTenant}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Hide from TOC
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
              If checked, this activity will not be visible on the
              student&apos;s table of contents until unlocked.
            </p>
          </label>

          {activeTab === "content" && (
            <label className="block cursor-pointer md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formState.isAllowUserToUploadFiles}
                  onChange={(e) =>
                    setFormState((p) => ({
                      ...p,
                      isAllowUserToUploadFiles: e.target.checked,
                    }))
                  }
                  disabled={!isMasterTenant}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Homework Uploads
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
                Prompts the member to upload a video, document or image to
                complete the activity.
              </p>
            </label>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!formState.name.trim() || isSaving || !isMasterTenant}
          loading={isSaving}
        >
          {isSaving ? "Saving..." : "Submit"}
        </Button>
      </div>

      {lesson && (
        <LessonBatchManageDialog
          isOpen={showBatchDialog}
          onClose={() => setShowBatchDialog(false)}
          chapterId={lesson.guId}
          onUpdated={() => {
            loadActivity();
            onActivityUpdated();
          }}
        />
      )}
    </div>
  );
};
