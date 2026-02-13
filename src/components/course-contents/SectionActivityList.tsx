import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  FileText,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Section, Chapter } from '@/services/courseContentsService';

// Callback types - param names are for documentation only
type SectionHandler = (a: Section) => void;
type LessonHandler = (a: Chapter) => void;
type EditSectionHandler = (a: Section, b: string) => void;
type EditLessonHandler = (a: Chapter, b: string) => void;

interface SectionActivityListProps {
  sections: Section[];
  selectedSection: Section | null;
  selectedLesson: Chapter | null;
  onSelectSection: SectionHandler;
  onSelectLesson: LessonHandler;
  onAddSection: () => void;
  onAddActivity: () => void;
  onEditSection: EditSectionHandler;
  onDeleteSection: SectionHandler;
  onEditLesson: EditLessonHandler;
  isMasterTenant: boolean;
  isAddingSection?: boolean;
  isAddingActivity?: boolean;
}

export const SectionActivityList: React.FC<SectionActivityListProps> = ({
  sections,
  selectedSection,
  selectedLesson,
  onSelectSection,
  onSelectLesson,
  onAddSection,
  onAddActivity,
  onEditSection,
  onDeleteSection,
  onEditLesson,
  isMasterTenant,
  isAddingSection = false,
  isAddingActivity = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(selectedSection ? [selectedSection.guId] : sections[0] ? [sections[0].guId] : [])
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState('');

  const toggleSection = (sec: Section) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sec.guId)) next.delete(sec.guId);
      else next.add(sec.guId);
      return next;
    });
    onSelectSection(sec);
    if (sec.chapters?.length) {
      onSelectLesson(sec.chapters[0]);
    }
  };

  const startEditSection = (s: Section) => {
    setEditingSectionId(s.guId);
    setEditingSectionTitle(s.title);
  };

  const saveEditSection = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      const s = sections.find((x) => x.guId === editingSectionId);
      if (s) onEditSection(s, editingSectionTitle.trim());
    }
    setEditingSectionId(null);
    setEditingSectionTitle('');
  };

  const startEditLesson = (l: Chapter) => {
    setEditingLessonId(l.guId);
    setEditingLessonTitle(l.title);
  };

  const saveEditLesson = () => {
    if (editingLessonId && editingLessonTitle.trim()) {
      const l = selectedSection?.chapters?.find((x) => x.guId === editingLessonId);
      if (l) onEditLesson(l, editingLessonTitle.trim());
    }
    setEditingLessonId(null);
    setEditingLessonTitle('');
  };

  const getTruncatedTitle = (title: string, max = 25) => {
    if (!title) return '';
    return title.length > max ? `${title.slice(0, max)}...` : title;
  };

  return (
    <div className="flex flex-col">
      <div className="space-y-2">
        {sections.map((sec) => {
          const isExpanded = expandedSections.has(sec.guId);
          const isEditing = editingSectionId === sec.guId;

          return (
            <div
              key={sec.guId}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden"
            >
              <div className="px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => toggleSection(sec)}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  )}
                </button>

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingSectionTitle}
                      onChange={(e) => setEditingSectionTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditSection()}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={saveEditSection}
                      className="p-1 text-primary-500 hover:bg-primary-50 rounded"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingSectionId(null);
                        setEditingSectionTitle('');
                      }}
                      className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {sec.title}
                    </span>
                    {isMasterTenant && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => startEditSection(sec)}
                          className="p-1 rounded text-primary-500 hover:bg-primary-50 dark:text-primary-400"
                          title="Edit section"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteSection(sec)}
                          className="p-1 rounded text-secondary-500 hover:bg-secondary-50 dark:text-secondary-400 dark:hover:bg-secondary-900/20"
                          title="Delete section"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {isExpanded && sec.chapters && (
                <div className="px-4 pb-4 space-y-2">
                  {sec.chapters.map((lesson) => {
                    const isLessonSelected = selectedLesson?.guId === lesson.guId;
                    const isLessonEditing = editingLessonId === lesson.guId;

                    return (
                      <div key={lesson.guId} className="flex items-center gap-2">
                        {isLessonEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editingLessonTitle}
                              onChange={(e) => setEditingLessonTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditLesson()}
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                              autoFocus
                            />
                            <button
                              onClick={saveEditLesson}
                              className="p-1 text-primary-500 hover:bg-primary-50 rounded"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingLessonId(null);
                                setEditingLessonTitle('');
                              }}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectLesson(lesson)}
                            className={cn(
                              'flex-1 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                              isLessonSelected
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            )}
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate flex-1">{getTruncatedTitle(lesson.title)}</span>
                            {isMasterTenant && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditLesson(lesson);
                                }}
                                className={cn(
                                  'p-0.5 rounded shrink-0',
                                  isLessonSelected ? 'hover:bg-white/20' : 'hover:bg-slate-200'
                                )}
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {isMasterTenant && (
                    <button
                      onClick={onAddActivity}
                      disabled={isAddingActivity}
                      className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 dark:border-slate-600 py-1 text-sm font-medium text-slate-400 dark:text-slate-500 hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-300 disabled:hover:text-slate-400"
                    >
                      {isAddingActivity ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {isAddingActivity ? 'Adding…' : 'Add Activity'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isMasterTenant && (
          <Button
            variant="outline"
            className="w-full justify-center rounded-lg my-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            onClick={onAddSection}
            disabled={isAddingSection}
          >
            {isAddingSection ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4 mr-2" />
            )}
            {isAddingSection ? 'Adding…' : 'Add Section'}
          </Button>
      )}
    </div>
  );
};
