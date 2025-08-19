'use client';

import { withRole } from '@/components/guards/withRole';
import { useAuth } from '@/hooks/useAuth';
import { 
  BookOpen, 
  CheckCircle, 
  Clock, 
  Award, 
  Calendar, 
  FileText, 
  MessageCircle 
} from 'lucide-react';

function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-deep-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Student Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to your learning journey
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Courses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Grade</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">A-</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  My Current Courses
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { name: 'Advanced Mathematics', instructor: 'Dr. Smith', progress: 75, nextClass: 'Tomorrow 10:00 AM' },
                    { name: 'Computer Science Fundamentals', instructor: 'Prof. Johnson', progress: 60, nextClass: 'Today 2:00 PM' },
                    { name: 'English Literature', instructor: 'Dr. Williams', progress: 90, nextClass: 'Wednesday 11:00 AM' },
                  ].map((course, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{course.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {course.instructor}</p>
                        </div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>Next Class: {course.nextClass}</span>
                        <button className="text-blue-600 dark:text-blue-400 hover:underline">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Assignments
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { title: 'Math Quiz #5', course: 'Advanced Mathematics', dueDate: 'Due in 2 days', status: 'pending' },
                    { title: 'Programming Assignment', course: 'Computer Science', dueDate: 'Due tomorrow', status: 'urgent' },
                    { title: 'Essay Draft', course: 'English Literature', dueDate: 'Due next week', status: 'pending' },
                  ].map((assignment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.course}</p>
                        <p className={`text-sm ${assignment.status === 'urgent' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {assignment.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          assignment.status === 'urgent' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {assignment.status === 'urgent' ? 'Urgent' : 'Pending'}
                        </span>
                        <button className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                          Submit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Notifications */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Enroll in New Course
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Calendar className="h-5 w-5 mr-2" />
                    View Schedule
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <FileText className="h-5 w-5 mr-2" />
                    My Grades
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contact Instructor
                  </button>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { message: 'New assignment posted in Computer Science', time: '2 hours ago', type: 'info' },
                    { message: 'Grade updated for Math Quiz #4', time: '1 day ago', type: 'success' },
                    { message: 'Class cancelled tomorrow - Advanced Mathematics', time: '2 days ago', type: 'warning' },
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Learning Progress
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="40"
                        cy="40"
                        r="36"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray="226.2"
                        strokeDashoffset="56.55"
                        className="text-blue-600 dark:text-blue-400"
                        style={{ strokeDashoffset: 226.2 - (226.2 * 75) / 100 }}
                      />
                    </svg>
                    <span className="absolute text-lg font-bold text-gray-900 dark:text-white">75%</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Overall Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Protect this page with role-based access control
export default withRole(StudentDashboard, {
  allowedRoles: ['ROLE_STUDENT'],
  redirectTo: '/dashboard'
});
