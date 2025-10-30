

import { withRole } from '@/components/guards/withRole';
import { useAuth } from '@/hooks/useAuth';
import { 
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Calendar,
  BarChart3
} from 'lucide-react';

function StudentAssessments() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Assessments
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress and complete assessments
              </p>
            </div>
          </div>
        </div>

        {/* Assessment Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
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
                <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">87%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Assessment List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Assessments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Assessments
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    {
                      title: 'Mathematics Midterm Exam',
                      course: 'Advanced Mathematics',
                      dueDate: 'Dec 20, 2024',
                      duration: '2 hours',
                      status: 'pending',
                      progress: 0
                    },
                    {
                      title: 'English Literature Essay',
                      course: 'English Literature',
                      dueDate: 'Dec 22, 2024',
                      duration: '1 week',
                      status: 'in-progress',
                      progress: 60
                    },
                    {
                      title: 'Computer Science Project',
                      course: 'Introduction to Programming',
                      dueDate: 'Dec 25, 2024',
                      duration: '2 weeks',
                      status: 'pending',
                      progress: 0
                    }
                  ].map((assessment, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{assessment.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.course}</p>
                        </div>
                        <span className={`inline-flex items-center justify-center min-w-[100px] h-6 px-2 text-xs font-medium rounded-full ${
                          assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          assessment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {assessment.status === 'completed' ? 'Completed' :
                           assessment.status === 'in-progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {assessment.dueDate}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {assessment.duration}
                        </span>
                      </div>
                      
                      {assessment.status === 'in-progress' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{assessment.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${assessment.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end space-x-2">
                        {assessment.status === 'pending' && (
                          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                            Start Assessment
                          </button>
                        )}
                        {assessment.status === 'in-progress' && (
                          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Continue
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Completed Assessments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recently Completed
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { title: 'Physics Quiz', course: 'Physics 101', score: 92, completedDate: 'Dec 15, 2024' },
                    { title: 'History Final', course: 'World History', score: 88, completedDate: 'Dec 12, 2024' },
                    { title: 'Chemistry Lab Report', course: 'Chemistry', score: 95, completedDate: 'Dec 10, 2024' }
                  ].map((assessment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{assessment.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{assessment.course}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completed: {assessment.completedDate}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{assessment.score}%</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Progress */}
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
                    <ClipboardCheck className="h-5 w-5 mr-2" />
                    Take Practice Test
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Review Materials
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    View Progress Report
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Performance Overview
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { subject: 'Mathematics', score: 92, trend: 'up' },
                    { subject: 'English', score: 88, trend: 'up' },
                    { subject: 'Science', score: 85, trend: 'down' },
                    { subject: 'History', score: 90, trend: 'up' }
                  ].map((subject, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{subject.subject}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{subject.score}%</span>
                        <div className={`w-2 h-2 rounded-full ${
                          subject.trend === 'up' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Upcoming Deadlines
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { assessment: 'Math Midterm', due: 'Dec 20', daysLeft: 3 },
                    { assessment: 'English Essay', due: 'Dec 22', daysLeft: 5 },
                    { assessment: 'CS Project', due: 'Dec 25', daysLeft: 8 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.assessment}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due: {item.due}</p>
                      </div>
                      <span className={`inline-flex items-center justify-center min-w-[80px] h-6 px-2 text-xs font-medium rounded-full ${
                        item.daysLeft <= 3 ? 'bg-red-100 text-red-800' :
                        item.daysLeft <= 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.daysLeft} days
                      </span>
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

export default withRole(StudentAssessments, { allowedRoles: ['ROLE_STUDENT'] });
