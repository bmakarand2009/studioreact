import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  Play
} from 'lucide-react';

export default function CourseCatalogPage() {
  const courses = [
    {
      id: 1,
      title: 'Introduction to Computer Science',
      instructor: 'Dr. Sarah Johnson',
      category: 'Technology',
      level: 'Beginner',
      duration: '8 weeks',
      students: 1247,
      rating: 4.8,
      price: '$99',
      image: '/api/placeholder/300/200',
      description: 'Learn the fundamentals of computer science and programming concepts.'
    },
    {
      id: 2,
      title: 'Advanced Mathematics for Engineers',
      instructor: 'Prof. Michael Chen',
      category: 'Mathematics',
      level: 'Advanced',
      duration: '12 weeks',
      students: 856,
      rating: 4.9,
      price: '$149',
      image: '/api/placeholder/300/200',
      description: 'Master advanced mathematical concepts essential for engineering applications.'
    },
    {
      id: 3,
      title: 'Business Strategy & Leadership',
      instructor: 'Dr. Emily Rodriguez',
      category: 'Business',
      level: 'Intermediate',
      duration: '10 weeks',
      students: 2034,
      rating: 4.7,
      price: '$129',
      image: '/api/placeholder/300/200',
      description: 'Develop strategic thinking and leadership skills for modern business challenges.'
    },
    {
      id: 4,
      title: 'Creative Writing Workshop',
      instructor: 'Prof. David Thompson',
      category: 'Arts & Humanities',
      level: 'All Levels',
      duration: '6 weeks',
      students: 1567,
      rating: 4.6,
      price: '$79',
      image: '/api/placeholder/300/200',
      description: 'Unlock your creative potential through guided writing exercises and feedback.'
    },
    {
      id: 5,
      title: 'Data Science Fundamentals',
      instructor: 'Dr. Lisa Wang',
      category: 'Technology',
      level: 'Intermediate',
      duration: '10 weeks',
      students: 1892,
      rating: 4.8,
      price: '$119',
      image: '/api/placeholder/300/200',
      description: 'Learn data analysis, visualization, and machine learning basics.'
    },
    {
      id: 6,
      title: 'Environmental Science & Sustainability',
      instructor: 'Prof. James Wilson',
      category: 'Science',
      level: 'Beginner',
      duration: '8 weeks',
      students: 945,
      rating: 4.7,
      price: '$89',
      image: '/api/placeholder/300/200',
      description: 'Explore environmental challenges and sustainable solutions for the future.'
    }
  ];

  const categories = ['All', 'Technology', 'Mathematics', 'Business', 'Arts & Humanities', 'Science'];
  const levels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Explore Our Courses
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover high-quality courses from expert instructors. Start your learning journey today.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <Button variant="secondary">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-brand-100 dark:from-primary-900/30 dark:to-brand-900/30 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {course.price}
                </div>
              </div>

              {/* Course Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                    {course.category}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                    {course.level}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center mr-4">
                    <Clock className="h-4 w-4 mr-1" />
                    {course.duration}
                  </span>
                  <span className="flex items-center mr-4">
                    <Users className="h-4 w-4 mr-1" />
                    {course.students.toLocaleString()}
                  </span>
                  <span className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    {course.rating}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    by {course.instructor}
                  </span>
                  <Link href={`/courses/${course.id}`}>
                    <Button size="sm" variant="secondary">
                      <Play className="h-4 w-4 mr-1" />
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button variant="secondary" size="lg">
            Load More Courses
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 to-brand-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Contact our team to discuss custom course development or specific learning needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                Contact Us
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-4 bg-white text-primary-600 hover:bg-gray-100">
                Sign Up for Updates
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
