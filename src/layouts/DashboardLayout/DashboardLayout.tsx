import { useState } from 'react'

import { Outlet } from 'react-router-dom'

import { Box, CssBaseline } from '@mui/material'

import DashboardNavbar from './DashboardNavbar'
import DashboardSidebar from './DashboardSidebar'
import styles from '../../styles/Layouts.module.scss'

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

  const handleDrawerToggle = (): void => {
    setSidebarOpen(!sidebarOpen)
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
