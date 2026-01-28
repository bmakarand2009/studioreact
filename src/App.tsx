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
import CourseDetailsPage from '@/app/admin/courses/details/[id]/page';
import AdminEventsPage from '@/app/admin/events/page';
import AddEditEventPage from '@/app/admin/events/[id]/page';
import AdminSettingsPage from '@/app/admin/settings/page';
import AdminSettingsAccountPage from '@/app/admin/settings/account/page';
import AdminSettingsWebsitePage from '@/app/admin/settings/website/page';
import AdminSettingsDisplayPage from '@/app/admin/settings/display/page';
import AdminSettingsPaymentPage from '@/app/admin/settings/payment/page';
import AdminSettingsIntegrationsPage from '@/app/admin/settings/integrations/page';
import AdminSettingsUsersPage from '@/app/admin/settings/users/page';
import AdminSettingsRolesPage from '@/app/admin/settings/roles/page';
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
        { path: '/admin/courses/:id', element: <CourseDetailsPage /> },
        { path: '/admin/courses/edit/:id', element: <AddEditCoursePage /> },
        { path: '/admin/events', element: <AdminEventsPage /> },
        { path: '/admin/events/add', element: <AddEditEventPage /> },
        { path: '/admin/events/edit/:id', element: <AddEditEventPage /> },

        // Admin Settings
        { path: '/admin/settings', element: <AdminSettingsPage /> },
        { path: '/admin/settings/account', element: <AdminSettingsAccountPage /> },
        { path: '/admin/settings/website', element: <AdminSettingsWebsitePage /> },
        { path: '/admin/settings/display', element: <AdminSettingsDisplayPage /> },
        { path: '/admin/settings/payment', element: <AdminSettingsPaymentPage /> },
        { path: '/admin/settings/integrations', element: <AdminSettingsIntegrationsPage /> },
        { path: '/admin/settings/users', element: <AdminSettingsUsersPage /> },
        { path: '/admin/settings/roles', element: <AdminSettingsRolesPage /> },

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