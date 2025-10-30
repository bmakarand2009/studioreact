import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  Edit2, 
  Trash2, 
  Plus,
  Eye,
  Copy,
  Users,
  Smile
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  name: string;
  type: 'content' | 'assessment' | 'form';
  shortDescription?: string;
  mobileSlug?: string;
  dateSlug?: string;
  settings: {
    trackActivity: boolean;
    hideOnTOC: boolean;
    repeatActivity: boolean;
    allowHomeworkUploads: boolean;
    allowDemoActivity: boolean;
  };
}

interface Section {
  id: string;
  name: string;
  activities: Activity[];
  isExpanded: boolean;
}

const mockCourse = {
  id: '1',
  title: 'Mastering Rider Skills',
  isPrivate: false,
  isFree: true,
  currentBatch: 'current',
  previewUrl: 'mastering-rider-skills',
};

const mockSections: Section[] = [
  {
    id: 'section-1',
    name: 'Section 1',
    isExpanded: true,
    activities: [
      {
        id: 'new-activity',
        name: 'New Activity',
        type: 'content',
        settings: {
          trackActivity: true,
          hideOnTOC: false,
          repeatActivity: false,
          allowHomeworkUploads: false,
          allowDemoActivity: false,
        },
      },
      {
        id: 'activity-2',
        name: 'Activity 2',
        type: 'content',
        shortDescription: '',
        mobileSlug: '',
        dateSlug: '',
        settings: {
          trackActivity: true,
          hideOnTOC: false,
          repeatActivity: false,
          allowHomeworkUploads: false,
          allowDemoActivity: false,
        },
      },
    ],
  },
];

type TabType = 'contents' | 'attendees' | 'pricing' | 'activities' | 'setup';
type ContentTabType = 'content' | 'assessment' | 'form';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('contents');
  const [sections, setSections] = useState<Section[]>(mockSections);
  const [selectedActivity, setSelectedActivity] = useState<string>('activity-2');
  const [contentTab, setContentTab] = useState<ContentTabType>('content');

  const currentActivity = sections
    .flatMap(s => s.activities)
    .find(a => a.id === selectedActivity);

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, isExpanded: !s.isExpanded } : s
    ));
  };

  const handleActivityClick = (activityId: string) => {
    setSelectedActivity(activityId);
  };

  const handleAddActivity = () => {
    console.log('Add activity');
  };

  const handleAddSection = () => {
    console.log('Add section');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Smile className="w-6 h-6 text-cyan-500" />
              <h1 className="text-2xl font-semibold text-foreground">{mockCourse.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!mockCourse.isPrivate} onCheckedChange={() => {}} />
              <span className="text-sm text-muted-foreground">Private</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Edit2 className="w-5 h-5 text-cyan-500" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Current Batch -</span>
            <span className="text-foreground">{mockCourse.currentBatch}</span>
            <Users className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-foreground">Free Course</span>
            <button className="text-muted-foreground">?</button>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Preview:</span>
            <a href="#" className="text-cyan-500 hover:underline">{mockCourse.previewUrl}</a>
            <button className="p-1 hover:bg-muted rounded">
              <Copy className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="flex gap-1 px-6">
          {(['contents', 'attendees', 'pricing', 'activities', 'setup'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3 text-sm font-medium capitalize transition-colors relative",
                activeTab === tab
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Contents Tab */}
      {activeTab === 'contents' && (
        <div className="flex h-[calc(100vh-200px)]">
          {/* Left Sidebar - Sections & Activities */}
          <div className="w-80 bg-card border-r border-border overflow-y-auto">
            <div className="p-4">
              {sections.map(section => (
                <div key={section.id} className="mb-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg mb-2 group">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-2 flex-1"
                    >
                      {section.isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-foreground">{section.name}</span>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-muted rounded">
                        <Edit2 className="w-3 h-3 text-cyan-500" />
                      </button>
                      <button className="p-1 hover:bg-muted rounded">
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Activities */}
                  {section.isExpanded && (
                    <div className="space-y-1 ml-2">
                      {section.activities.map(activity => (
                        <button
                          key={activity.id}
                          onClick={() => handleActivityClick(activity.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors group",
                            selectedActivity === activity.id
                              ? "bg-primary/10 text-foreground"
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          <span className="text-sm">{activity.name}</span>
                          <button className="p-1 hover:bg-background rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 className="w-3 h-3 text-cyan-500" />
                          </button>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Action Buttons */}
              <div className="space-y-2 mt-6">
                <button
                  onClick={handleAddActivity}
                  className="w-full text-left px-4 py-2 text-sm text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors"
                >
                  Add Activity
                </button>
                <button
                  onClick={handleAddSection}
                  className="w-full text-left px-4 py-2 text-sm text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950 rounded-lg transition-colors"
                >
                  Add Section
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Activity Details */}
          <div className="flex-1 overflow-y-auto">
            {currentActivity ? (
              <div className="p-6 max-w-5xl">
                {/* Activity Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">{currentActivity.name}</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">Current Batch - Current</div>
                    <div className="flex items-center gap-2">
                      <Switch checked={false} onCheckedChange={() => {}} />
                      <span className="text-sm text-muted-foreground">Private</span>
                    </div>
                    <button className="p-1">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <button className="p-1">
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      BASIC INFO
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          NAME - Activity name for members *
                        </label>
                        <Input
                          type="text"
                          value={currentActivity.name}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">
                          SHORT DESCRIPTION
                        </label>
                        <Textarea
                          value={currentActivity.shortDescription || ''}
                          className="bg-background min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Slugs */}
                  <div className="space-y-2">
                    <button className="flex items-center gap-2 text-sm text-foreground">
                      <ChevronDown className="w-4 h-4 text-cyan-500" />
                      <span>Mobile Slug</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm text-foreground">
                      <ChevronDown className="w-4 h-4 text-cyan-500" />
                      <span>Date Slug</span>
                    </button>
                  </div>
                </div>

                {/* Content Tabs */}
                <div className="flex gap-2 mb-6">
                  {(['content', 'assessment', 'form'] as ContentTabType[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setContentTab(tab)}
                      className={cn(
                        "px-6 py-2 rounded-lg text-sm font-medium capitalize transition-colors flex items-center gap-2",
                        contentTab === tab
                          ? "bg-cyan-500 text-white"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      )}
                    >
                      {tab === 'content' && <Smile className="w-4 h-4" />}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Media Section */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">MEDIA</h3>
                    <button className="flex items-start gap-3 text-left hover:bg-muted/50 p-4 rounded-lg transition-colors w-full">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground mb-1">Add Content</div>
                        <div className="text-sm text-muted-foreground">
                          Upload images, video, audio, pdfs. Max file size permitted is 20MB for PDF Files and 2GB for Videos.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Downloadable Resources */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      ADD RESOURCES (DOWNLOADABLE)
                    </h3>
                    <button className="flex items-start gap-3 text-left hover:bg-muted/50 p-4 rounded-lg transition-colors w-full">
                      <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground mb-1">Downloadable Resources</div>
                        <div className="text-sm text-muted-foreground">
                          User will be able to download these resources. Max file size permitted is 2GB for Videos.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">SETTINGS</h3>
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={currentActivity.settings.trackActivity} />
                      <div>
                        <div className="font-medium text-foreground mb-1">Track Activity</div>
                        <div className="text-sm text-muted-foreground">
                          Student will mark the lesson as complete for tracking purposes.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={currentActivity.settings.hideOnTOC} />
                      <div>
                        <div className="font-medium text-foreground mb-1">Hide Activity on member TOC</div>
                        <div className="text-sm text-muted-foreground">
                          If checked the activity will not show on the table of content.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={currentActivity.settings.repeatActivity} />
                      <div>
                        <div className="font-medium text-foreground mb-1">Repeat Activity</div>
                        <div className="text-sm text-muted-foreground">
                          Student can appear for the Assessment I Activity I Form multiple times
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={currentActivity.settings.allowHomeworkUploads} />
                      <div>
                        <div className="font-medium text-foreground mb-1">Allow Homework Uploads</div>
                        <div className="text-sm text-muted-foreground">
                          Prompts the member to upload a video or file to complete the activity.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <Checkbox checked={currentActivity.settings.allowDemoActivity} />
                      <div>
                        <div className="font-medium text-foreground mb-1">Allow Demo Activity</div>
                        <div className="text-sm text-muted-foreground">
                          Student registered for Demo will see this activity
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white px-8">
                    Submit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Select an activity to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'contents' && (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground capitalize">{activeTab} content coming soon...</p>
        </div>
      )}
    </div>
  );
}
