import { forwardRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Avatar,
  Badge,
  Tooltip,
  Typography,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  CalendarToday as CalendarIcon,
  Logout as LogoutIcon,
  CheckBox as TodoIcon,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { APP_ROUTES } from '../../constants/routes'

interface DashboardNavbarProps {
  open: boolean
  onDrawerToggle: () => void
}

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: 240,
    width: `calc(100% - 240px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}))

/**
 * Dashboard Navbar Component
 * Features:
 * - Drawer toggle button
 * - Client logo and name
 * - Action buttons (todo, calendar, messages, notifications, logout)
 * - Responsive design
 */
const DashboardNavbar = forwardRef<HTMLDivElement, DashboardNavbarProps>(
  ({ open, onDrawerToggle }, ref) => {
    // Get selected carrier info from localStorage
    const selectedCarrierName = localStorage.getItem('selectedCarrierName') || 'Admin Portal'

    const handleLogout = () => {
      // Clear auth data
      localStorage.removeItem('authToken')
      localStorage.removeItem('selectedCarrierId')
      localStorage.removeItem('selectedCarrierName')
      localStorage.removeItem('clients')
      localStorage.removeItem('loginName')
      
      // Redirect to login
      window.location.href = APP_ROUTES.LOGIN
    }

    return (
      <StyledAppBar ref={ref} position="fixed" open={open}>
        <Toolbar>
          {/* Menu Toggle Button */}
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            onClick={onDrawerToggle}
            edge="start"
            sx={{
              marginRight: 2,
            }}
            data-test-id="dashboard-menu-toggle"
          >
            <MenuIcon />
          </IconButton>

          {/* Client Logo & Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.light',
                width: 40,
                height: 40,
              }}
            >
              {selectedCarrierName.charAt(0).toUpperCase()}
            </Avatar>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 600,
              }}
            >
              {selectedCarrierName}
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Todo List */}
            <Tooltip title="Todo List">
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/dashboard/todo"
                data-test-id="dashboard-todo-button"
              >
                <TodoIcon />
              </IconButton>
            </Tooltip>

            {/* Calendar */}
            <Tooltip title="Calendar">
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/dashboard/calendar"
                data-test-id="dashboard-calendar-button"
              >
                <CalendarIcon />
              </IconButton>
            </Tooltip>

            {/* Messages */}
            <Tooltip title="Messages">
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/dashboard/messages"
                data-test-id="dashboard-messages-button"
              >
                <Badge badgeContent={3} color="error">
                  <MessageIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                component={RouterLink}
                to="/dashboard/notifications"
                data-test-id="dashboard-notifications-button"
              >
                <Badge badgeContent={5} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Logout */}
            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={handleLogout}
                data-test-id="dashboard-logout-button"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </StyledAppBar>
    )
  }
)

DashboardNavbar.displayName = 'DashboardNavbar'

export default DashboardNavbar

