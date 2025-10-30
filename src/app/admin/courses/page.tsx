import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Grid3x3, List, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, DollarSign, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { courseService, CourseListItem } from '@/services/courseService';

interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  isPaid: boolean;
  isPublished: boolean;
}

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  
  // Mock courses data
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'Introduction to React',
      description: 'Learn the fundamentals of React including components, props, and state management.',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      isPaid: true,
      isPublished: true,
    },
    {
      id: '2',
      title: 'Advanced TypeScript',
      description: 'Master TypeScript with advanced types, generics, and design patterns.',
      imageUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80',
      isPaid: true,
      isPublished: true,
    },
    {
      id: '3',
      title: 'Web Design Fundamentals',
      description: 'Create beautiful and responsive web designs with modern CSS techniques.',
      imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
      isPaid: false,
      isPublished: false,
    },
    {
      id: '4',
      title: 'Node.js Backend Development',
      description: 'Build scalable backend applications with Node.js and Express.',
      imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&q=80',
      isPaid: true,
      isPublished: true,
    },
    {
      id: '5',
      title: 'Database Design with PostgreSQL',
      description: 'Learn database design principles and master PostgreSQL.',
      imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
      isPaid: true,
      isPublished: false,
    },
    {
      id: '6',
      title: 'UI/UX Design Principles',
      description: 'Master the art of creating intuitive and engaging user experiences.',
      imageUrl: 'https://images.unsplash.com/photo-1561070791-36c11767b26a?w=800&q=80',
      isPaid: false,
      isPublished: true,
    },
  ];

  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalCourses = mockCourses.length;

  // Filter courses locally based on search
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return courses;
    
    const query = searchQuery.toLowerCase();
    return courses.filter(course =>
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query)
    );
  }, [courses, searchQuery]);

  const handleTogglePublish = (courseId: string) => {
    setCourses(courses.map(c =>
      c.id === courseId ? { ...c, isPublished: !c.isPublished } : c
    ));
  };

  const handleAddCourse = () => {
    console.log('Add new course');
    // TODO: Navigate to create course page
  };


  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white rounded" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Courses</h1>
          </div>
          <Button
            onClick={handleAddCourse}
            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for Courses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={showArchived}
                onCheckedChange={setShowArchived}
              />
              <span className="text-sm text-foreground whitespace-nowrap">Show Archived</span>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === 'grid' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
            <span className="ml-3 text-muted-foreground">Loading courses...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">Error Loading Courses</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <div className="text-muted-foreground text-lg mb-2">
              {searchQuery ? 'No courses found matching your search' : 'No courses available'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-cyan-500 hover:underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && !error && filteredCourses.length > 0 && (
          <div className={cn(
            "grid gap-6 mb-6",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
          )}>
            {filteredCourses.map((course) => (
            <Card
              key={course.id}
              onClick={() => window.location.href = `/admin/courses/${course.id}`}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {/* Course Image */}
              <div className="relative aspect-[3/2] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                    <div className="text-center">
                      <div className="text-6xl mb-2">○</div>
                      <div className="text-sm font-medium">3 : 2</div>
                      <div className="text-xs">Ratio</div>
                      <div className="text-xs">OR</div>
                      <div className="text-xs">480" X 320"</div>
                      <div className="mt-4 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[40px] border-b-gray-300 dark:border-b-gray-600 mx-auto" />
                    </div>
                  </div>
                )}
              </div>

              {/* Course Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">{course.title}</h3>
                  <div className="flex-shrink-0">
                    {course.isPaid ? (
                      <DollarSign className="w-5 h-5 text-foreground" />
                    ) : (
                      <Check className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                </div>

                {course.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center justify-end">
                  <Switch
                    checked={course.isPublished}
                    onCheckedChange={() => handleTogglePublish(course.id)}
                  />
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-background border border-border rounded px-3 py-1 text-sm text-foreground"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCourses)} of {totalCourses}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage * itemsPerPage >= totalCourses}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(totalCourses / itemsPerPage))}
                  disabled={currentPage * itemsPerPage >= totalCourses}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
