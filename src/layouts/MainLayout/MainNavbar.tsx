import { Link as RouterLink } from 'react-router-dom'

import { AppBar, Toolbar, Typography, Box } from '@mui/material'

import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Layouts.module.scss'

/**
 * Main navigation bar for public pages
 * Simple navbar with logo/branding
 */
const MainNavbar = (): JSX.Element => (
  <AppBar elevation={0} position="fixed" sx={{ backgroundColor: 'primary.main' }}>
    <Toolbar className={styles['main-navbar__toolbar']}>
      <RouterLink to={APP_ROUTES.HOME} className={styles['main-navbar__logo-link']}>
        <Box className={styles['main-navbar__logo-container']}>
          {/* Logo placeholder - replace with actual logo component */}
          <Typography variant="h5" component="div" className={styles['main-navbar__logo-text']}>
            ADMIN
          </Typography>
        </Box>
      </RouterLink>
    </Toolbar>
  </AppBar>
)

export default MainNavbar
