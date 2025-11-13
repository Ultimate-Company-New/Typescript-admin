import { Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import { APP_ROUTES } from '../../constants/routes'

/**
 * Main navigation bar for public pages
 * Simple navbar with logo/branding
 */
const MainNavbar = () => {
  return (
    <AppBar
      elevation={0}
      position="fixed"
      sx={{
        backgroundColor: 'primary.main',
      }}
    >
      <Toolbar sx={{ height: 64 }}>
        <RouterLink
          to={APP_ROUTES.HOME}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Logo placeholder - replace with actual logo component */}
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: 700,
                color: 'white',
                letterSpacing: 1,
              }}
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

