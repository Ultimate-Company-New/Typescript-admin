import { createBrowserRouter, RouteObject, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { Login, Register, ForgotPassword, ClientLanding, NotFound } from './pages'
import { Users, AddUsers, ImportUsers } from './pages/users'
import { APP_ROUTES } from './constants/routes'

/**
 * Application routes configuration
 * Uses React Router v6 createBrowserRouter for modern routing
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={APP_ROUTES.LOGIN} replace />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'client-landing',
        element: <ClientLanding />,
      },
      {
        path: '404',
        element: <NotFound />,
      },
      {
        path: '*',
        element: <Navigate to="/404" replace />,
      },
    ],
  },
  // Dashboard routes (protected)
  {
    path: 'dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <Navigate to={APP_ROUTES.DASHBOARD.USERS} replace />,
      },
      {
        path: 'users',
        element: <Users />,
      },
      {
        path: 'users/add',
        element: <AddUsers />,
      },
      {
        path: 'users/import',
        element: <ImportUsers />,
      },
      // Placeholder routes for navbar items
      {
        path: 'todo',
        element: <div>Todo - Coming Soon</div>,
      },
      {
        path: 'calendar',
        element: <div>Calendar - Coming Soon</div>,
      },
      {
        path: 'messages',
        element: <div>Messages - Coming Soon</div>,
      },
      {
        path: 'notifications',
        element: <div>Notifications - Coming Soon</div>,
      },
    ],
  },
]

const router = createBrowserRouter(routes)

export default router

