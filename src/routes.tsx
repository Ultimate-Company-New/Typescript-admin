import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import { APP_ROUTES } from './constants/routes'
import DashboardLayout from './layouts/DashboardLayout'
import { MainLayout } from './layouts/MainLayout'
import { ClientLanding, ForgotPassword, Login, NotFound, Register } from './pages'
import { DeveloperDocs } from './pages/developerDocs'
import { AddLeads, ImportLeads, Leads } from './pages/leads'
import ConfirmEmail from './pages/login/ConfirmEmail'
import { AddMessages, ImportMessages, Messages, MessagesList, ViewMessage } from './pages/messages'
import { AddPackages, ImportPackages, Packages } from './pages/packages'
import { AddPickupLocations, ImportPickupLocations, PickupLocations } from './pages/pickupLocations'
import { AddProducts, ImportProducts, Products } from './pages/products'
import { AddPromos, ImportPromos, Promos } from './pages/promos'
import { AddPurchaseOrders, ImportPurchaseOrders, PurchaseOrders } from './pages/purchaseOrders'
import { QADashboard } from './pages/qaDashboard'
import { AddSalesOrders, SalesOrders } from './pages/salesOrders'
import { Settings } from './pages/settings'
import { Support } from './pages/support'
import { TodoList } from './pages/todo'
import { AddEditUsers, ImportUsers, Users } from './pages/user'
import { AddEditUserGroups, ImportUserGroups, UserGroups } from './pages/user-group'
import { AddWebTemplates, ImportWebTemplates, WebTemplates } from './pages/webTemplates'

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
        path: 'confirm-email',
        element: <ConfirmEmail />,
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
        element: <AddEditUsers />,
      },
      {
        path: 'users/import',
        element: <ImportUsers />,
      },
      {
        path: 'groups',
        element: <UserGroups />,
      },
      {
        path: 'groups/add',
        element: <AddEditUserGroups />,
      },
      {
        path: 'groups/import',
        element: <ImportUserGroups />,
      },
      {
        path: 'leads',
        element: <Leads />,
      },
      {
        path: 'leads/add',
        element: <AddLeads />,
      },
      {
        path: 'leads/import',
        element: <ImportLeads />,
      },
      {
        path: 'promos',
        element: <Promos />,
      },
      {
        path: 'promos/add',
        element: <AddPromos />,
      },
      {
        path: 'promos/import',
        element: <ImportPromos />,
      },
      {
        path: 'products',
        element: <Products />,
      },
      {
        path: 'products/add',
        element: <AddProducts />,
      },
      {
        path: 'products/import',
        element: <ImportProducts />,
      },
      {
        path: 'packages',
        element: <Packages />,
      },
      {
        path: 'packages/add',
        element: <AddPackages />,
      },
      {
        path: 'packages/import',
        element: <ImportPackages />,
      },
      {
        path: 'pickup-locations',
        element: <PickupLocations />,
      },
      {
        path: 'pickup-locations/add',
        element: <AddPickupLocations />,
      },
      {
        path: 'pickup-locations/import',
        element: <ImportPickupLocations />,
      },
      {
        path: 'purchase-orders',
        element: <PurchaseOrders />,
      },
      {
        path: 'purchase-orders/add',
        element: <AddPurchaseOrders />,
      },
      {
        path: 'purchase-orders/import',
        element: <ImportPurchaseOrders />,
      },
      {
        path: 'messages',
        element: <Messages />,
      },
      {
        path: 'messages/inbox',
        element: <MessagesList />,
      },
      {
        path: 'messages/view/:messageId',
        element: <ViewMessage />,
      },
      {
        path: 'messages/add',
        element: <AddMessages />,
      },
      {
        path: 'messages/import',
        element: <ImportMessages />,
      },
      {
        path: 'web-templates',
        element: <WebTemplates />,
      },
      {
        path: 'web-templates/add',
        element: <AddWebTemplates />,
      },
      {
        path: 'web-templates/import',
        element: <ImportWebTemplates />,
      },
      {
        path: 'sales-orders',
        element: <SalesOrders />,
      },
      {
        path: 'sales-orders/add',
        element: <AddSalesOrders />,
      },
      // Placeholder routes for navbar items
      {
        path: 'todo',
        element: <TodoList />,
      },
      {
        path: 'calendar',
        element: <div>Calendar - Coming Soon</div>,
      },
      {
        path: 'notifications',
        element: <div>Notifications - Coming Soon</div>,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'qa-dashboard',
        element: <QADashboard />,
      },
      {
        path: 'support',
        element: <Support />,
      },
      {
        path: 'developer-docs',
        element: <DeveloperDocs />,
      },
    ],
  },
]

const router = createBrowserRouter(routes)

export default router
