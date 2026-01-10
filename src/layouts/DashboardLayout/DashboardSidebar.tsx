import { forwardRef, useState } from 'react'

import { Link as RouterLink, useLocation } from 'react-router-dom'

import {
  Add as AddIcon,
  BugReport as BugReportIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  ExpandLess,
  ExpandMore,
  GroupAdd as GroupAddIcon,
  Groups as GroupsIcon,
  Inventory as InventoryIcon,
  Leaderboard as LeaderboardIcon,
  LocalOffer as LocalOfferIcon,
  LocalShipping as LocalShippingIcon,
  LocationOn as LocationOnIcon,
  Message as MessageIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Settings as SettingsIcon,
  ShoppingCart as ShoppingCartIcon,
  Support as SupportIcon,
  Upload as UploadIcon,
  Web as WebIcon,
} from '@mui/icons-material'
import {
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'

import { APP_ROUTES } from '../../constants/routes'
import styles from '../../styles/Layouts.module.scss'

interface DashboardSidebarProps {
  open: boolean
  onDrawerToggle: () => void
}

const drawerWidth = 280

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== 'open',
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
const DashboardSidebar = forwardRef<HTMLDivElement, DashboardSidebarProps>(({ open, onDrawerToggle }, ref) => {
  const theme = useTheme()
  const location = useLocation()
  const [usersExpanded, setUsersExpanded] = useState(true)
  const [groupsExpanded, setGroupsExpanded] = useState(false)
  const [leadsExpanded, setLeadsExpanded] = useState(false)
  const [promosExpanded, setPromosExpanded] = useState(false)
  const [productsExpanded, setProductsExpanded] = useState(false)
  const [packagesExpanded, setPackagesExpanded] = useState(false)
  const [pickupLocationsExpanded, setPickupLocationsExpanded] = useState(false)
  const [purchaseOrdersExpanded, setPurchaseOrdersExpanded] = useState(false)
  const [messagesExpanded, setMessagesExpanded] = useState(false)
  const [webTemplatesExpanded, setWebTemplatesExpanded] = useState(false)

  const handleUsersToggle = (): void => {
    setUsersExpanded(!usersExpanded)
  }

  const handleGroupsToggle = (): void => {
    setGroupsExpanded(!groupsExpanded)
  }

  const handleLeadsToggle = (): void => {
    setLeadsExpanded(!leadsExpanded)
  }

  const handlePromosToggle = (): void => {
    setPromosExpanded(!promosExpanded)
  }

  const handleProductsToggle = (): void => {
    setProductsExpanded(!productsExpanded)
  }

  const handlePackagesToggle = (): void => {
    setPackagesExpanded(!packagesExpanded)
  }

  const handlePickupLocationsToggle = (): void => {
    setPickupLocationsExpanded(!pickupLocationsExpanded)
  }

  const handlePurchaseOrdersToggle = (): void => {
    setPurchaseOrdersExpanded(!purchaseOrdersExpanded)
  }

  const handleMessagesToggle = (): void => {
    setMessagesExpanded(!messagesExpanded)
  }

  const handleWebTemplatesToggle = (): void => {
    setWebTemplatesExpanded(!webTemplatesExpanded)
  }

  const isActive = (path: string): boolean => location.pathname === path

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
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.USERS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.USERS}
          data-test-id="sidebar-users-item"
          className={`${styles['dashboard-sidebar__list-item']} ${styles['dashboard-sidebar__parent-item']} ${open ? styles['dashboard-sidebar__list-item--open'] : styles['dashboard-sidebar__list-item--closed']}`}
        >
          <ListItemIcon
            className={`${styles['dashboard-sidebar__list-item-icon']} ${open ? styles['dashboard-sidebar__list-item-icon--open'] : styles['dashboard-sidebar__list-item-icon--closed']}`}
          >
            <PeopleIcon />
          </ListItemIcon>
          <ListItemText
            primary="Users"
            className={`${styles['dashboard-sidebar__list-item-text']} ${open ? styles['dashboard-sidebar__list-item-text--visible'] : styles['dashboard-sidebar__list-item-text--hidden']}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleUsersToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {usersExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Users - Sub Items */}
        <Collapse in={usersExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Users */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_USERS}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_USERS)}
              data-test-id="sidebar-add-users-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <PersonAddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Users" />
            </ListItemButton>

            {/* Import Users */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_USERS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_USERS)}
              data-test-id="sidebar-import-users-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Users" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* User Groups - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.GROUPS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.GROUPS}
          data-test-id="sidebar-groups-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <GroupsIcon />
          </ListItemIcon>
          <ListItemText
            primary="User Groups"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleGroupsToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {groupsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* User Groups - Sub Items */}
        <Collapse in={groupsExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add User Group */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_GROUPS}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_GROUPS)}
              data-test-id="sidebar-add-group-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <GroupAddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Group" />
            </ListItemButton>

            {/* Import User Groups */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_GROUPS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_GROUPS)}
              data-test-id="sidebar-import-groups-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Groups" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Leads - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.LEADS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.LEADS}
          data-test-id="sidebar-leads-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <LeaderboardIcon />
          </ListItemIcon>
          <ListItemText
            primary="Leads"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleLeadsToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {leadsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Leads - Sub Items */}
        <Collapse in={leadsExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Lead */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_LEAD}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_LEAD)}
              data-test-id="sidebar-add-lead-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Lead" />
            </ListItemButton>

            {/* Import Leads */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_LEADS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_LEADS)}
              data-test-id="sidebar-import-leads-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Leads" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Promos - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.PROMOS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.PROMOS}
          data-test-id="sidebar-promos-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <LocalOfferIcon />
          </ListItemIcon>
          <ListItemText
            primary="Promos"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePromosToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {promosExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Promos - Sub Items */}
        <Collapse in={promosExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Promo */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_PROMO}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_PROMO)}
              data-test-id="sidebar-add-promo-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Promo" />
            </ListItemButton>

            {/* Import Promos */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_PROMOS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_PROMOS)}
              data-test-id="sidebar-import-promos-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Promos" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Products - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.PRODUCTS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.PRODUCTS}
          data-test-id="sidebar-products-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText
            primary="Products"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleProductsToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {productsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Products - Sub Items */}
        <Collapse in={productsExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Product */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_PRODUCT}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_PRODUCT)}
              data-test-id="sidebar-add-product-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Product" />
            </ListItemButton>

            {/* Import Products */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_PRODUCTS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_PRODUCTS)}
              data-test-id="sidebar-import-products-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Products" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Packages - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.PACKAGES}
          selected={location.pathname === APP_ROUTES.DASHBOARD.PACKAGES}
          data-test-id="sidebar-packages-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <LocalShippingIcon />
          </ListItemIcon>
          <ListItemText
            primary="Packages"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePackagesToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {packagesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Packages - Sub Items */}
        <Collapse in={packagesExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Package */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_PACKAGE}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_PACKAGE)}
              data-test-id="sidebar-add-package-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Package" />
            </ListItemButton>

            {/* Import Packages */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_PACKAGES}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_PACKAGES)}
              data-test-id="sidebar-import-packages-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Packages" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Pickup Locations - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.PICKUP_LOCATIONS}
          data-test-id="sidebar-pickup-locations-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <LocationOnIcon />
          </ListItemIcon>
          <ListItemText
            primary="Pickup Locations"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePickupLocationsToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {pickupLocationsExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Pickup Locations - Sub Items */}
        <Collapse in={pickupLocationsExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Pickup Location */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION)}
              data-test-id="sidebar-add-pickup-location-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Location" />
            </ListItemButton>

            {/* Import Pickup Locations */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_PICKUP_LOCATIONS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_PICKUP_LOCATIONS)}
              data-test-id="sidebar-import-pickup-locations-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Locations" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Purchase Orders - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.PURCHASE_ORDERS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.PURCHASE_ORDERS}
          data-test-id="sidebar-purchase-orders-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <ShoppingCartIcon />
          </ListItemIcon>
          <ListItemText
            primary="Purchase Orders"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handlePurchaseOrdersToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {purchaseOrdersExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Purchase Orders - Sub Items */}
        <Collapse in={purchaseOrdersExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Purchase Order */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_PURCHASE_ORDER}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_PURCHASE_ORDER)}
              data-test-id="sidebar-add-purchase-order-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Order" />
            </ListItemButton>

            {/* Import Purchase Orders */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_PURCHASE_ORDERS}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_PURCHASE_ORDERS)}
              data-test-id="sidebar-import-purchase-orders-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Orders" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Shipments - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.SHIPMENTS}
          selected={location.pathname === APP_ROUTES.DASHBOARD.SHIPMENTS}
          data-test-id="sidebar-shipments-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <LocalShippingIcon />
          </ListItemIcon>
          <ListItemText
            primary="Shipments"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
        </ListItemButton>

        {/* Messages - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.MESSAGES}
          selected={location.pathname === APP_ROUTES.DASHBOARD.MESSAGES}
          data-test-id="sidebar-messages-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <MessageIcon />
          </ListItemIcon>
          <ListItemText
            primary="Messages"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleMessagesToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {messagesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Messages - Sub Items */}
        <Collapse in={messagesExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Message */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_MESSAGE}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_MESSAGE)}
              data-test-id="sidebar-add-message-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Message" />
            </ListItemButton>

            {/* Import Messages */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_MESSAGES}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_MESSAGES)}
              data-test-id="sidebar-import-messages-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Messages" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Web Templates - Parent Item */}
        <ListItemButton
          component={RouterLink}
          to={APP_ROUTES.DASHBOARD.WEB_TEMPLATES}
          selected={location.pathname === APP_ROUTES.DASHBOARD.WEB_TEMPLATES}
          data-test-id="sidebar-web-templates-item"
          className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
        >
          <ListItemIcon
            className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
          >
            <WebIcon />
          </ListItemIcon>
          <ListItemText
            primary="Web Templates"
            className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
          />
          {open && (
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                handleWebTemplatesToggle()
              }}
              className={styles['dashboard-sidebar__expand-icon']}
            >
              {webTemplatesExpanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </ListItemButton>

        {/* Web Templates - Sub Items */}
        <Collapse in={webTemplatesExpanded && open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {/* Add Web Template */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.ADD_WEB_TEMPLATE}
              selected={isActive(APP_ROUTES.DASHBOARD.ADD_WEB_TEMPLATE)}
              data-test-id="sidebar-add-web-template-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <AddIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Add Template" />
            </ListItemButton>

            {/* Import Web Templates */}
            <ListItemButton
              component={RouterLink}
              to={APP_ROUTES.DASHBOARD.IMPORT_WEB_TEMPLATES}
              selected={isActive(APP_ROUTES.DASHBOARD.IMPORT_WEB_TEMPLATES)}
              data-test-id="sidebar-import-web-templates-item"
              className={styles['dashboard-sidebar__sub-item']}
            >
              <ListItemIcon className={styles['dashboard-sidebar__sub-item-icon']}>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Import Templates" />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Bottom Items (Settings, Support, Developer Docs) */}
        <Box
          sx={{
            marginTop: 'auto',
            paddingTop: 2,
          }}
        >
          <Divider sx={{ mb: 1 }} />

          {/* Settings */}
          <ListItemButton
            component={RouterLink}
            to={APP_ROUTES.DASHBOARD.SETTINGS}
            selected={isActive(APP_ROUTES.DASHBOARD.SETTINGS)}
            data-test-id="sidebar-settings-item"
            className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
          >
            <ListItemIcon
              className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
            >
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
            />
          </ListItemButton>

          {/* QA Dashboard */}
          <ListItemButton
            component={RouterLink}
            to={APP_ROUTES.DASHBOARD.QA_DASHBOARD}
            selected={isActive(APP_ROUTES.DASHBOARD.QA_DASHBOARD)}
            data-test-id="sidebar-qa-dashboard-item"
            className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
          >
            <ListItemIcon
              className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
            >
              <BugReportIcon />
            </ListItemIcon>
            <ListItemText
              primary="QA Dashboard"
              className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
            />
          </ListItemButton>

          {/* Support */}
          <ListItemButton
            component={RouterLink}
            to={APP_ROUTES.DASHBOARD.SUPPORT}
            selected={isActive(APP_ROUTES.DASHBOARD.SUPPORT)}
            data-test-id="sidebar-support-item"
            className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
          >
            <ListItemIcon
              className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
            >
              <SupportIcon />
            </ListItemIcon>
            <ListItemText
              primary="Support"
              className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
            />
          </ListItemButton>

          {/* Developer Docs */}
          <ListItemButton
            component={RouterLink}
            to={APP_ROUTES.DASHBOARD.DEVELOPER_DOCS}
            selected={isActive(APP_ROUTES.DASHBOARD.DEVELOPER_DOCS)}
            data-test-id="sidebar-developer-docs-item"
            className={`dashboard-sidebar__list-item dashboard-sidebar__parent-item ${open ? 'dashboard-sidebar__list-item--open' : 'dashboard-sidebar__list-item--closed'}`}
          >
            <ListItemIcon
              className={`dashboard-sidebar__list-item-icon ${open ? 'dashboard-sidebar__list-item-icon--open' : 'dashboard-sidebar__list-item-icon--closed'}`}
            >
              <DescriptionIcon />
            </ListItemIcon>
            <ListItemText
              primary="Developer Docs"
              className={`dashboard-sidebar__list-item-text ${open ? 'dashboard-sidebar__list-item-text--visible' : 'dashboard-sidebar__list-item-text--hidden'}`}
            />
          </ListItemButton>
        </Box>
      </List>
    </StyledDrawer>
  )
})

DashboardSidebar.displayName = 'DashboardSidebar'

export default DashboardSidebar
