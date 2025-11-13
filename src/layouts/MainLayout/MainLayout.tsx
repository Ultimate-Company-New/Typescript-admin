import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { styled } from '@mui/material/styles'
import MainNavbar from './MainNavbar'

/**
 * Styled components for layout structure
 */
const MainLayoutRoot = styled('div')({
  backgroundColor: '#ffffff',
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  flexDirection: 'column',
})

const MainLayoutWrapper = styled('div')({
  display: 'flex',
  flex: '1 1 auto',
  paddingTop: 64, // Height of AppBar
})

const MainLayoutContent = styled('div')({
  flex: '1 1 auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
})

/**
 * Main layout for public/unauthenticated pages
 * Includes navigation bar and outlet for child routes
 */
const MainLayout = () => {
  return (
    <MainLayoutRoot>
      <MainNavbar />
      <MainLayoutWrapper>
        <MainLayoutContent>
          <Box
            sx={{
              backgroundColor: 'background.default',
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Outlet />
          </Box>
        </MainLayoutContent>
      </MainLayoutWrapper>
    </MainLayoutRoot>
  )
}

export default MainLayout

