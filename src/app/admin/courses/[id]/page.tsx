import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight,
  Edit2, 
  Trash2, 
  Plus,
  Eye,
  Copy,
  Users,
  Smile,
  FileText,
  ClipboardCheck,
  ListChecks,
  Upload,
  Download,
  GripVertical,
  Info,
  ArrowLeft
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Enhanced Header */}
      <div className="bg-card border-b-2 border-border shadow-sm">
        <div className="px-6 py-5">
          {/* Back Button & Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/admin/courses')}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Smile className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{mockCourse.title}</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">Course Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Private</span>
                <Switch 
                  checked={!mockCourse.isPrivate} 
                  onCheckedChange={() => {}}
                  className="data-[state=checked]:bg-green-500" 
                />
              </div>
              <Button
                variant="outline"
                className="w-11 h-11 p-0 border-2"
                title="Edit Course"
              >
                <Edit2 className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="w-11 h-11 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 border-2"
                title="Delete Course"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Info Badges */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Current Batch: {mockCourse.currentBatch}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <Info className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">Free Course</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-purple-900 dark:text-purple-100">Preview:</span>
              <a href="#" className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline">
                {mockCourse.previewUrl}
              </a>
              <button className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded">
                <Copy className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="border-t border-border">
          <div className="flex gap-2 px-6">
            {(['contents', 'attendees', 'pricing', 'activities', 'setup'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-8 py-4 text-base font-semibold capitalize transition-all relative",
                  activeTab === tab
                    ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contents Tab */}
      {activeTab === 'contents' && (
        <div className="flex h-[calc(100vh-280px)]">
          {/* Enhanced Left Sidebar - Sections & Activities */}
          <div className={cn(
            "bg-card border-r-2 border-border overflow-y-auto shadow-sm transition-all duration-300 relative",
            sidebarCollapsed ? "w-16" : "w-96"
          )}>
            {/* Collapse Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-6 z-10 w-6 h-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                !sidebarCollapsed && "rotate-180"
              )} />
            </button>
            <div className="p-6">
              {!sidebarCollapsed && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">Course Structure</h3>
                  <p className="text-sm text-muted-foreground">Organize your course content into sections and activities</p>
                </div>
              )}

              {sections.map(section => (
                <div key={section.id} className="mb-4">
                  {/* Enhanced Section Header */}
                  <div className={cn(
                    "flex items-center justify-between rounded-xl mb-3 group transition-all border-2",
                    section.isExpanded 
                      ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800" 
                      : "bg-muted/50 border-transparent hover:border-muted-foreground/20",
                    sidebarCollapsed ? "p-2" : "p-4"
                  )}>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-3 flex-1"
                      title={sidebarCollapsed ? section.name : undefined}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg transition-colors flex-shrink-0",
                        section.isExpanded ? "bg-cyan-500 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {section.isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="font-bold text-base text-foreground">{section.name}</span>
                        </div>
                      )}
                    </button>
                    {!sidebarCollapsed && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-cyan-100 dark:hover:bg-cyan-900 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        </button>
                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Activities */}
                  {section.isExpanded && !sidebarCollapsed && (
                    <div className="space-y-2 ml-4 pl-4 border-l-2 border-cyan-200 dark:border-cyan-800">
                      {section.activities.map(activity => (
                        <button
                          key={activity.id}
                          onClick={() => handleActivityClick(activity.id)}
                          className={cn(
                            "w-full flex items-center justify-between p-4 rounded-xl text-left transition-all group border-2",
                            selectedActivity === activity.id
                              ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 border-cyan-600"
                              : "bg-card hover:bg-muted border-transparent hover:border-muted-foreground/20"
                          )}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <GripVertical className={cn(
                              "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                              selectedActivity === activity.id ? "text-white/70" : "text-muted-foreground"
                            )} />
                            <FileText className={cn(
                              "w-5 h-5",
                              selectedActivity === activity.id ? "text-white" : "text-cyan-500"
                            )} />
                            <span className={cn(
                              "font-medium text-base",
                              selectedActivity === activity.id ? "text-white" : "text-foreground"
                            )}>
                              {activity.name}
                            </span>
                          </div>
                          <Edit2 className={cn(
                            "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                            selectedActivity === activity.id ? "text-white/70" : "text-cyan-500"
                          )} />
                        </button>
                      ))}
                      
                      {/* Add Activity Button - Inside Section */}
                      <button
                        onClick={handleAddActivity}
                        className="w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors border-2 border-dashed border-cyan-300 dark:border-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-cyan-600 dark:text-cyan-400"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Add Activity</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Enhanced Action Buttons */}
              {!sidebarCollapsed && (
                <div className="mt-6 pt-4 border-t border-border">
                  <button
                    onClick={handleAddSection}
                    className="w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors border-2 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-600 dark:text-blue-400"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Add Section</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Right Panel - Activity Details */}
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950">
            {currentActivity ? (
              <div className="p-8 max-w-6xl mx-auto">
                {/* Enhanced Activity Header */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{currentActivity.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">Activity Configuration</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
                        <span className="text-sm font-medium text-foreground">Private</span>
                        <Switch checked={false} onCheckedChange={() => {}} />
                      </div>
                      <Button 
                        variant="outline"
                        className="w-11 h-11 p-0"
                        title="Batches"
                      >
                        <Users className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-11 h-11 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        title="Delete Activity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 w-fit">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Current Batch: Current
                    </span>
                  </div>
                </div>

                {/* Enhanced Basic Info Section */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
                      <Edit2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    Basic Information
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">
                        Activity Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={currentActivity.name}
                        className="bg-background h-12 text-base border-2"
                        placeholder="Enter activity name visible to members"
                      />
                      <p className="text-xs text-muted-foreground mt-2">This name will be displayed to students</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">
                        Short Description
                      </label>
                      <Textarea
                        value={currentActivity.shortDescription || ''}
                        className="bg-background min-h-[120px] text-base border-2"
                        placeholder="Provide a brief description of this activity"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Help students understand what this activity covers
                      </p>
                    </div>

                    {/* Collapsible Slugs */}
                    <details className="group">
                      <summary className="flex items-center gap-2 text-base font-semibold text-foreground cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 py-3">
                        <ChevronRight className="w-5 h-5 transition-transform group-open:rotate-90 text-cyan-500" />
                        Advanced Settings (Mobile & Date Slugs)
                      </summary>
                      <div className="pl-7 pt-3 space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Mobile Slug</label>
                          <Input className="bg-background h-12 border-2" placeholder="mobile-slug" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Date Slug</label>
                          <Input className="bg-background h-12 border-2" placeholder="date-slug" />
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                {/* Enhanced Content Type Tabs */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-5">Activity Type</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {([
                      { type: 'content', icon: FileText, label: 'Content', color: 'cyan' },
                      { type: 'assessment', icon: ClipboardCheck, label: 'Assessment', color: 'purple' },
                      { type: 'form', icon: ListChecks, label: 'Form', color: 'orange' }
                    ] as const).map(tab => (
                      <button
                        key={tab.type}
                        onClick={() => setContentTab(tab.type)}
                        className={cn(
                          "p-5 rounded-xl text-base font-bold transition-all border-2 flex items-center justify-center gap-3",
                          contentTab === tab.type
                            ? `bg-${tab.color}-500 text-white shadow-lg shadow-${tab.color}-500/30 border-${tab.color}-600 scale-105`
                            : "bg-muted text-foreground hover:bg-muted/80 border-transparent hover:border-muted-foreground/20"
                        )}
                      >
                        <tab.icon className="w-6 h-6" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Enhanced Media Section */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    Media Content
                  </h3>
                  <button className="w-full flex items-start gap-4 text-left hover:bg-muted/50 p-6 rounded-xl transition-all border-2 border-dashed border-muted-foreground/30 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Plus className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-foreground mb-2">Add Content</div>
                      <div className="text-base text-muted-foreground leading-relaxed">
                        Upload images, videos, audio files, or PDFs
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-medium">
                        📄 PDF: Max 20MB • 🎥 Video: Max 2GB
                      </div>
                    </div>
                  </button>
                </div>

                {/* Enhanced Downloadable Resources */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    Downloadable Resources
                  </h3>
                  <button className="w-full flex items-start gap-4 text-left hover:bg-muted/50 p-6 rounded-xl transition-all border-2 border-dashed border-muted-foreground/30 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Plus className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-foreground mb-2">Add Downloadable Resources</div>
                      <div className="text-base text-muted-foreground leading-relaxed">
                        Students can download these materials for offline access
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-medium">
                        🎥 Max file size: 2GB for Videos
                      </div>
                    </div>
                  </button>
                </div>

                {/* Enhanced Settings */}
                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <ListChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    Activity Settings
                  </h3>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox 
                        checked={currentActivity.settings.trackActivity}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">Track Activity Completion</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Students will be able to mark this lesson as complete.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox 
                        checked={currentActivity.settings.hideOnTOC}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">Hide from Table of Contents</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          This activity will not appear in the course table of contents.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox 
                        checked={currentActivity.settings.repeatActivity}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">Allow Multiple Attempts</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Students can complete this assessment, activity, or form multiple times.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox 
                        checked={currentActivity.settings.allowHomeworkUploads}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">Enable Homework Uploads</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Students will be prompted to upload a file or video to complete this activity.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <Checkbox 
                        checked={currentActivity.settings.allowDemoActivity}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-foreground">Show in Demo Access</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Students with demo access will be able to see and access this activity.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Enhanced Submit Button */}
                <div className="flex gap-4 justify-end pt-4">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 text-base font-semibold h-14"
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-12 text-base font-bold h-14 shadow-lg shadow-cyan-500/30"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
                  <FileText className="w-16 h-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">No Activity Selected</h3>
                <p className="text-base text-muted-foreground text-center max-w-md">
                  Select an activity from the left sidebar to view and edit its details
                </p>
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
