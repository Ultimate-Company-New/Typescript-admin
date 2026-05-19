import { useEffect, useState } from 'react'

import { Outlet, useNavigate } from 'react-router-dom'

import { Box, CssBaseline } from '@mui/material'

import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Layouts.module.scss'

import DashboardNavbar from './DashboardNavbar'
import DashboardSidebar from './DashboardSidebar'

/**
 * Dashboard Layout Component
 * Features:
 * - Responsive sidebar (collapsible)
 * - Top navigation bar
 * - Content area with outlet for nested routes
 * - Mobile-friendly design
 */
const DashboardLayout = (): JSX.Element => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isAuthenticated = localStorage.getItem('authToken') !== null
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(APP_ROUTES.LOGIN, { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleDrawerToggle = (): void => {
    setSidebarOpen(!sidebarOpen)
  }

  if (!isAuthenticated) {
    return <></>
  }

  return (
    <Box className={styles['dashboard-layout']}>
      <CssBaseline />

      {/* Top Navigation Bar */}
      <DashboardNavbar open={sidebarOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Left Sidebar */}
      <DashboardSidebar open={sidebarOpen} onDrawerToggle={handleDrawerToggle} />

      {/* Main Content Area */}
      <Box component="main" className={styles['dashboard-layout__main-content']}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default DashboardLayout
