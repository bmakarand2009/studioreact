'use client';

import { withRole } from '@/components/guards/withRole';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/contexts/PreviewContext';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  Award, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';

function StudentDashboard() {
  const { user } = useAuth();
  const { isInPreviewMode, previewUser } = usePreview();

  // Use preview user if in preview mode, otherwise use actual user
  const displayUser = isInPreviewMode ? previewUser : user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">W</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Student Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome to your learning dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Courses</p>
                                 <p className="text-xl font-bold text-gray-900 dark:text-white">4</p>
                <p className="text-xs text-green-600 dark:text-green-400">+1 this semester</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
                <p className="text-xs text-green-600 dark:text-green-400">+3 this year</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Study Hours</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">156</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">This month</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GPA</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">3.8</p>
                <p className="text-xs text-green-600 dark:text-green-400">+0.2 this term</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Current Courses */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Courses
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {[
                    { name: 'Computer Science 101', instructor: 'Dr. Smith', progress: 75, nextClass: 'Tomorrow 10:00 AM' },
                    { name: 'Mathematics 201', instructor: 'Prof. Johnson', progress: 60, nextClass: 'Today 2:00 PM' },
                    { name: 'Physics 101', instructor: 'Dr. Wilson', progress: 45, nextClass: 'Wednesday 11:00 AM' },
                    { name: 'English Literature', instructor: 'Prof. Brown', progress: 90, nextClass: 'Friday 1:00 PM' },
                  ].map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{course.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Instructor: {course.instructor}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">Next class: {course.nextClass}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{course.progress}%</div>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { action: 'Assignment submitted', course: 'CS 101', time: '2 hours ago', type: 'success' },
                    { action: 'Quiz completed', course: 'Math 201', time: '1 day ago', type: 'success' },
                    { action: 'Discussion post', course: 'Physics 101', time: '2 days ago', type: 'info' },
                    { action: 'Course material accessed', course: 'English Lit', time: '3 days ago', type: 'info' },
                    { action: 'Assignment deadline reminder', course: 'CS 101', time: '1 week ago', type: 'warning' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.course}</p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</span>
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
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Courses
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Support
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
                    { message: 'New assignment available in CS 101', type: 'info', time: '1 hour ago' },
                    { message: 'Quiz deadline approaching for Math 201', type: 'warning', time: '3 hours ago' },
                    { message: 'Course material updated in Physics 101', type: 'info', time: '1 day ago' },
                    { message: 'Grade posted for English assignment', type: 'success', time: '2 days ago' },
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${
                        notification.type === 'success' ? 'text-green-500' :
                        notification.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notification.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Study Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Study Progress
                </h3>
              </div>
              <div className="p-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    On Track
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You're making excellent progress this semester
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(StudentDashboard, { allowedRoles: ['ROLE_STUDENT'] });
