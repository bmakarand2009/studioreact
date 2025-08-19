'use client';

import { withRole } from '@/components/guards/withRole';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users,
  BookOpen,
  AlertCircle
} from 'lucide-react';

function StudentCalendar() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View your class schedule and upcoming events
              </p>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  This Week's Schedule
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      day: 'Monday',
                      date: 'Today',
                      classes: [
                        { time: '9:00 AM - 10:30 AM', subject: 'Mathematics', room: 'Room 101', instructor: 'Dr. Smith' },
                        { time: '2:00 PM - 3:30 PM', subject: 'English Literature', room: 'Room 205', instructor: 'Prof. Johnson' }
                      ]
                    },
                    {
                      day: 'Tuesday',
                      date: 'Tomorrow',
                      classes: [
                        { time: '10:00 AM - 11:30 AM', subject: 'Computer Science', room: 'Lab 301', instructor: 'Dr. Brown' }
                      ]
                    },
                    {
                      day: 'Wednesday',
                      date: 'Dec 18',
                      classes: [
                        { time: '9:00 AM - 10:30 AM', subject: 'Mathematics', room: 'Room 101', instructor: 'Dr. Smith' },
                        { time: '1:00 PM - 2:30 PM', subject: 'History', room: 'Room 103', instructor: 'Prof. Davis' }
                      ]
                    }
                  ].map((day, dayIndex) => (
                    <div key={dayIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">{day.day}</h4>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{day.date}</span>
                      </div>
                      <div className="space-y-2">
                        {day.classes.map((cls, clsIndex) => (
                          <div key={clsIndex} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{cls.time}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{cls.subject}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {cls.room}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-3 w-3 mr-1" />
                                  {cls.instructor}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
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
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    <Calendar className="h-5 w-5 mr-2" />
                    Schedule Office Hours
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <BookOpen className="h-5 w-5 mr-2" />
                    View Course Details
                  </button>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Events
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { event: 'Final Exam Week', date: 'Dec 20-24', type: 'exam' },
                    { event: 'Course Registration', date: 'Jan 5', type: 'registration' },
                    { event: 'Student Council Meeting', date: 'Jan 8', type: 'meeting' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        event.type === 'exam' ? 'bg-red-500' : 
                        event.type === 'registration' ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{event.event}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{event.date}</p>
                      </div>
                    </div>
                  ))}
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
                    { message: 'Class cancelled tomorrow', time: '2 hours ago', type: 'warning' },
                    { message: 'New assignment posted', time: '1 day ago', type: 'info' },
                    { message: 'Grade updated for Math', time: '2 days ago', type: 'success' }
                  ].map((notification, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'warning' ? 'bg-yellow-500' : 
                        notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default withRole(StudentCalendar, { allowedRoles: ['ROLE_STUDENT'] });
