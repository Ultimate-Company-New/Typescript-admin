import { createBrowserRouter, RouteObject, Navigate } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import DashboardLayout from './layouts/DashboardLayout'
import { Login, Register, ForgotPassword, ClientLanding, NotFound } from './pages'
import { Users, AddEditUsers, ImportUsers } from './pages/users'
import { UserGroups, AddUserGroups, ImportUserGroups } from './pages/groups'
import { Leads, AddLeads, ImportLeads } from './pages/leads'
import { Promos, AddPromos, ImportPromos } from './pages/promos'
import { Products, AddProducts, ImportProducts } from './pages/products'
import { Packages, AddPackages, ImportPackages } from './pages/packages'
import { PickupLocations, AddPickupLocations, ImportPickupLocations } from './pages/pickupLocations'
import { PurchaseOrders, AddPurchaseOrders, ImportPurchaseOrders } from './pages/purchaseOrders'
import { Messages, AddMessages, ImportMessages } from './pages/messages'
import { WebTemplates, AddWebTemplates, ImportWebTemplates } from './pages/webTemplates'
import { SalesOrders, AddSalesOrders } from './pages/salesOrders'
import { Settings } from './pages/settings'
import { Support } from './pages/support'
import { DeveloperDocs } from './pages/developerDocs'
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
        element: <AddUserGroups />,
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
      {
        path: 'settings',
        element: <Settings />,
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

