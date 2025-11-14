import { Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { APP_ROUTES } from '../../constants/routes'
import '../../styles/LayoutStyles.scss'

/**
 * Main navigation bar for public pages
 * Simple navbar with logo/branding
 */
const MainNavbar = () => {
  return (
    <AppBar
      elevation={0}
      position="fixed"
      sx={{ backgroundColor: 'primary.main' }}
    >
      <Toolbar className="main-navbar__toolbar">
        <RouterLink
          to={APP_ROUTES.HOME}
          className="main-navbar__logo-link"
        >
          <Box className="main-navbar__logo-container">
            {/* Logo placeholder - replace with actual logo component */}
            <Typography
              variant="h5"
              component="div"
              className="main-navbar__logo-text"
            >
              ADMIN
            </Typography>
          </Box>
        </RouterLink>
      </Toolbar>
    </AppBar>
  )
}

export default MainNavbar

