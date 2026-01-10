import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import { APP_ROUTES } from './constants/routes'
import DashboardLayout from './layouts/DashboardLayout'
import { MainLayout } from './layouts/MainLayout'

// Public / Auth Pages
import { ClientLanding, ForgotPassword, Login } from './pages'
import { default as ConfirmEmail } from './pages/login/ConfirmEmail'
import { default as NotFound } from './pages/NotFound'
import { default as Register } from './pages/Register'

// Feature Pages
import { DeveloperDocs } from './pages/developerDocs'
import { AddEditLead, ImportLeads, Leads } from './pages/leads'
import { AddMessages, ImportMessages, Messages, MessagesList, ViewMessage } from './pages/messages'
import { AddEditPackage, ImportPackages, Packages } from './pages/packages'
import { AddEditPickupLocation, ImportPickupLocations, PickupLocations } from './pages/pickupLocations'
import { AddEditProduct, ImportProducts, Products } from './pages/products'
import { AddEditPromo, ImportPromos, Promos } from './pages/promos'
import { AddEditPurchaseOrder, ImportPurchaseOrders, PurchaseOrders, ViewPurchaseOrder } from './pages/purchaseOrders'
import { Shipments } from './pages/shipments'
import { QADashboard } from './pages/qaDashboard'
import { Settings } from './pages/settings'
import { Support } from './pages/support'
import { TodoList } from './pages/todo'
import { AddEditUser, ImportUsers, Users } from './pages/user'
import { AddEditUserGroup, ImportUserGroups, UserGroups } from './pages/user-group'
import { AddWebTemplates, ImportWebTemplates, WebTemplates } from './pages/webTemplates'

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
        element: <AddEditUser />,
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
        element: <AddEditUserGroup />,
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
        element: <AddEditLead />,
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
        element: <AddEditPromo />,
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
        element: <AddEditProduct />,
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
        element: <AddEditPackage />,
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
        element: <AddEditPickupLocation />,
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
        element: <AddEditPurchaseOrder />,
      },
      {
        path: 'purchase-orders/view/:purchaseOrderId',
        element: <ViewPurchaseOrder />,
      },
      {
        path: 'purchase-orders/import',
        element: <ImportPurchaseOrders />,
      },
      {
        path: 'shipments',
        element: <Shipments />,
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

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
  },
})
export default router
