import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Box, CssBaseline } from '@mui/material'
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
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleDrawerToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top Navigation Bar */}
      <DashboardNavbar open={sidebarOpen} onDrawerToggle={handleDrawerToggle} />
      
      {/* Left Sidebar */}
      <DashboardSidebar open={sidebarOpen} onDrawerToggle={handleDrawerToggle} />
      
      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8, // AppBar height
          minHeight: '100vh',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[900],
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default DashboardLayout

