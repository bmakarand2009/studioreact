import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui';
import { withRole } from '@/components/guards/withRole';

interface Course {
  id: number;
  title: string;
  date: string;
  progress: number;
  description: string;
  image: string;
}

function StudentCoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const courses: Course[] = [
    {
      id: 1,
      title: 'Wajooba Course',
      date: 'Mar2022',
      progress: 0,
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis',
      image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      title: 'List view course character length testing with 50 characters',
      date: 'Mar2022',
      progress: 0,
      description: 'This will help in testing truncated text view of product list',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop'
    },
    {
      id: 3,
      title: 'Dental Kickstarter',
      date: 'current',
      progress: 0,
      description: 'gh',
      image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      title: 'Quis odit ea eos vol',
      date: 'current',
      progress: 0,
      description: 'Voluptatem ex dicta officiis perspiciatis aut quam felis suscipit itaque sit quo exercitationem repudiandae ullam ex culpa quam adipisci commodo',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop'
    },
    {
      id: 5,
      title: 'Advanced JavaScript Concepts',
      date: 'Apr2022',
      progress: 25,
      description: 'Deep dive into advanced JavaScript patterns, closures, prototypes, and async programming',
      image: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      title: 'UI/UX Design Fundamentals',
      date: 'May2022',
      progress: 10,
      description: 'Learn the principles of user interface and user experience design to create beautiful and functional applications',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop'
    },
    {
      id: 7,
      title: 'Data Structures & Algorithms',
      date: 'Jun2022',
      progress: 0,
      description: 'Master fundamental data structures and algorithms essential for technical interviews and efficient programming',
      image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      title: 'React & Modern Web Development',
      date: 'current',
      progress: 50,
      description: 'Build modern web applications with React, including hooks, context, and state management',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop'
    }
  ];

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search for Courses"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredCourses.map((course) => (
          <div
            key={course.id}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
          >
            {/* Course Image */}
            <div className="relative h-40 bg-gray-200 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Course Content */}
            <div className="p-4">
              {/* Title */}
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[3rem]">
                {course.title}
              </h3>

              {/* Date */}
              <p className="text-sm text-gray-500 mb-3">{course.date}</p>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">
                    {course.progress}% Complete
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-4">
                {course.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses found matching your search.</p>
        </div>
      )}
    </div>
  );
}

export default withRole(StudentCoursesPage, { allowedRoles: ['ROLE_STUDENT', 'ROLE_ADMIN'] });
