import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import MainNavbar from './MainNavbar'
import '../../styles/LayoutStyles.scss'

/**
 * Main layout for public/unauthenticated pages
 * Includes navigation bar and outlet for child routes
 */
const MainLayout = () => {
  return (
    <div className="main-layout__root">
      <MainNavbar />
      <div className="main-layout__wrapper">
        <div className="main-layout__content">
          <Box
            sx={{ backgroundColor: 'background.default' }}
            className="main-layout__outlet-container"
          >
            <Outlet />
          </Box>
        </div>
      </div>
    </div>
  )
}

export default MainLayout

