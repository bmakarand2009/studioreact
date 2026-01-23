import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Providers } from '@/components/providers/Providers';
import { Layout } from '@/app/layout/layout';

// Pages
import HomePage from '@/app/page';
import LoginPage from '@/app/(auth)/login/page';
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page';
import AdminDashboardPage from '@/app/admin/dashboard/page';
import AdminCoursesPage from '@/app/admin/courses/page';
import AddEditCoursePage from '@/app/admin/courses/[id]/page';
import AdminEventsPage from '@/app/admin/events/page';
import AddEditEventPage from '@/app/admin/events/[id]/page';
import DashboardPage from '@/app/dashboard/page';
import StudentDashboardPage from '@/app/student/dashboard/page';
import StudentAssessmentsPage from '@/app/student/assessments/page';
import StudentCalendarPage from '@/app/student/calendar/page';
import StudentStorePage from '@/app/student/store/page';
import StudentCoursesPage from '@/app/student/courses/page';
import PublicAboutPage from '@/app/(public)/about/page';
import PublicContactPage from '@/app/(public)/contact/page';
import PublicCoursesPage from '@/app/(public)/courses/page';
import PublicEventsPage from '@/app/(public)/events/page';
import DynamicPublicPage from '@/app/(public)/[slug]/page';
import ConnectionErrorPage from '@/app/error-connection/page';
import NotFound from '@/app/not-found';

const router = createBrowserRouter(
  [
    // Error page route - outside layout wrapper
    {
      path: '/error-connection',
      element: (
        <Providers>
          <ConnectionErrorPage />
        </Providers>
      ),
    },
    {
      element: (
        <Providers>
          <Layout>
            <Outlet />
          </Layout>
        </Providers>
      ),
      children: [
        // Auth (must come before dynamic routes)
        { path: '/login', element: <LoginPage /> },
        { path: '/forgot-password', element: <ForgotPasswordPage /> },

        // Dashboards
        { path: '/dashboard', element: <DashboardPage /> },
        { path: '/admin/dashboard', element: <AdminDashboardPage /> },
        { path: '/admin/courses', element: <AdminCoursesPage /> },
        { path: '/admin/courses/add', element: <AddEditCoursePage /> },
        { path: '/admin/courses/edit/:id', element: <AddEditCoursePage /> },
        { path: '/admin/events', element: <AdminEventsPage /> },
        { path: '/admin/events/add', element: <AddEditEventPage /> },
        { path: '/admin/events/edit/:id', element: <AddEditEventPage /> },

        // Student
        { path: '/student/dashboard', element: <StudentDashboardPage /> },
        { path: '/student/courses', element: <StudentCoursesPage /> },
        { path: '/student/assessments', element: <StudentAssessmentsPage /> },
        { path: '/student/calendar', element: <StudentCalendarPage /> },
        { path: '/student/store', element: <StudentStorePage /> },

        // Public (specific routes first)
        { path: '/', element: <HomePage /> },
        { path: '/about', element: <PublicAboutPage /> },
        { path: '/contact', element: <PublicContactPage /> },
        { path: '/courses', element: <PublicCoursesPage /> },
        { path: '/events', element: <PublicEventsPage /> },
        
        // Dynamic public pages (catch-all for tenant web pages - must come last before fallback)
        { path: '/:slug', element: <DynamicPublicPage /> },

        // Fallback
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}