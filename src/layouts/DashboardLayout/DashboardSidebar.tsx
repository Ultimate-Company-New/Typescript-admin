import { forwardRef, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Collapse,
  Divider,
} from '@mui/material'
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import { styled, useTheme } from '@mui/material/styles'

interface DashboardSidebarProps {
  open: boolean
  onDrawerToggle: () => void
}

const drawerWidth = 240

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
    },
  }),
  ...(!open && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
      width: `calc(${theme.spacing(8)} + 1px)`,
    },
    '& .MuiDrawer-paper': {
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
      width: `calc(${theme.spacing(7)} + 1px)`,
      [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
      },
    },
  }),
}))

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}))

/**
 * Dashboard Sidebar Component
 * Features:
 * - Collapsible drawer
 * - Expandable menu items
 * - Active route highlighting
 * - Mobile-friendly
 */
const DashboardSidebar = forwardRef<HTMLDivElement, DashboardSidebarProps>(
  ({ open, onDrawerToggle }, ref) => {
    const theme = useTheme()
    const location = useLocation()
    const [usersExpanded, setUsersExpanded] = useState(true)

    const handleUsersToggle = () => {
      setUsersExpanded(!usersExpanded)
    }

    const isActive = (path: string) => location.pathname === path

    return (
      <StyledDrawer ref={ref} variant="permanent" open={open}>
        {/* Drawer Header with Toggle Button */}
        <DrawerHeader>
          <IconButton onClick={onDrawerToggle} data-test-id="sidebar-toggle-button">
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>

        <Divider />

        {/* Navigation Items */}
        <List>
          {/* Users - Parent Item */}
          <ListItemButton
            onClick={handleUsersToggle}
            selected={location.pathname.startsWith('/dashboard/users')}
            data-test-id="sidebar-users-item"
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText primary="Users" sx={{ opacity: open ? 1 : 0 }} />
            {open && (usersExpanded ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>

          {/* Users - Sub Items */}
          <Collapse in={usersExpanded && open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {/* Add Users */}
              <ListItemButton
                component={RouterLink}
                to="/dashboard/users/add"
                selected={isActive('/dashboard/users/add')}
                data-test-id="sidebar-add-users-item"
                sx={{
                  pl: 4,
                  minHeight: 48,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 3,
                    justifyContent: 'center',
                  }}
                >
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Add Users" />
              </ListItemButton>

              {/* Import Users */}
              <ListItemButton
                component={RouterLink}
                to="/dashboard/users/import"
                selected={isActive('/dashboard/users/import')}
                data-test-id="sidebar-import-users-item"
                sx={{
                  pl: 4,
                  minHeight: 48,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: 3,
                    justifyContent: 'center',
                  }}
                >
                  <UploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Import Users" />
              </ListItemButton>
            </List>
          </Collapse>
        </List>
      </StyledDrawer>
    )
  }
)

DashboardSidebar.displayName = 'DashboardSidebar'

export default DashboardSidebar

