import { Outlet } from 'react-router-dom'

import { Box } from '@mui/material'

import styles from '../../styles/Layouts.module.scss'

import MainNavbar from './MainNavbar'

/**
 * Main layout for public/unauthenticated pages
 * Includes navigation bar and outlet for child routes
 */
const MainLayout = (): JSX.Element => (
  <div className={styles['main-layout__root']}>
    <MainNavbar />
    <div className={styles['main-layout__wrapper']}>
      <div className={styles['main-layout__content']}>
        <Box sx={{ backgroundColor: 'background.default' }} className={styles['main-layout__outlet-container']}>
          <Outlet />
        </Box>
      </div>
    </div>
  </div>
)

export default MainLayout
