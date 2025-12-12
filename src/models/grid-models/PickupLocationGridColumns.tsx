import { LocationOn as LocationIcon } from '@mui/icons-material'
import InventoryIcon from '@mui/icons-material/Inventory'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { Box, Chip, Link, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'

/**
 * Options for product/package column click handlers
 */
export interface PickupLocationMappingHandlers {
  onProductsClick?: (pickupLocationId: number, locationName: string) => void
  onPackagesClick?: (pickupLocationId: number, locationName: string) => void
}

/**
 * Pickup Location data structure matching API response
 */
export interface PickupLocationData {
  pickupLocationId?: number
  pickupLocation?: {
    pickupLocationId: number
    deleted?: boolean
    shipRocketPickupLocationId?: string
    addressNickName?: string
  }
  addressNickName?: string
  shipRocketPickupLocationId?: string
  nameOnAddress?: string
  phoneOnAddress?: string
  emailOnAddress?: string
  isDeleted?: boolean
  deleted?: boolean
  /** Count of products at this location */
  productCount?: number
  /** Count of packages at this location */
  packageCount?: number
  address?: {
    nameOnAddress?: string
    phoneOnAddress?: string
    emailOnAddress?: string
    city?: string
    state?: string
    streetAddress?: string
    streetAddress2?: string
    streetAddress3?: string
    postalCode?: string
  }
}

/**
 * Format phone number with () and -
 */
const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 10) return phone
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
}

/**
 * Pickup Location Actions Component - handles permission-based action visibility
 */
const PickupLocationActionsCell = ({
  pickupLocationId,
  isDeleted,
  onTogglePickupLocation,
}: {
  pickupLocationId: number
  isDeleted: boolean
  onTogglePickupLocation?: (pickupLocationId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  // Check permissions using PERMISSIONS constants
  const canViewPickupLocation = hasPermission(PERMISSIONS.VIEW_PICKUP_LOCATIONS)
  const canUpdatePickupLocation = hasPermission(PERMISSIONS.UPDATE_PICKUP_LOCATIONS)
  const canDeletePickupLocation = hasPermission(PERMISSIONS.DELETE_PICKUP_LOCATIONS)

  if (isDeleted) {
    // Only show Activate if user has delete permission
    if (!canDeletePickupLocation) {
      return <span>—</span>
    }

    return (
      <div>
        <Link
          href="#"
          onClick={e => {
            e.preventDefault()
            if (onTogglePickupLocation) {
              onTogglePickupLocation(pickupLocationId)
            }
          }}
          sx={{ cursor: 'pointer', color: 'success.main' }}
        >
          Activate
        </Link>
      </div>
    )
  }

  // Build actions based on permissions
  const actions: JSX.Element[] = []

  if (canViewPickupLocation) {
    actions.push(
      <Link
        key="view"
        href={`${APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION}?pickupLocationId=${pickupLocationId}&isView`}
        sx={{ cursor: 'pointer' }}
      >
        View
      </Link>,
    )
  }

  if (canUpdatePickupLocation) {
    actions.push(
      <Link
        key="edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION}?pickupLocationId=${pickupLocationId}`}
        sx={{ cursor: 'pointer' }}
      >
        Edit
      </Link>,
    )
  }

  if (canDeletePickupLocation) {
    actions.push(
      <Link
        key="deactivate"
        href="#"
        onClick={e => {
          e.preventDefault()
          if (onTogglePickupLocation) {
            onTogglePickupLocation(pickupLocationId)
          }
        }}
        sx={{ cursor: 'pointer', color: 'error.main' }}
      >
        Deactivate
      </Link>,
    )
  }

  // If no actions available, show dash
  if (actions.length === 0) {
    return <span>—</span>
  }

  return <div style={{ display: 'flex', gap: '12px' }}>{actions}</div>
}

/**
 * Get pickup location grid columns with action handlers
 */
export const getPickupLocationGridColumns = (
  onTogglePickupLocation: (pickupLocationId: number) => void,
  mappingHandlers?: PickupLocationMappingHandlers,
): GridColDef[] => [
  {
    field: 'pickupLocationId',
    headerName: 'ID',
    hideable: false,
    filterable: true,
    width: 80,
    minWidth: 80,
    align: 'center',
    headerAlign: 'center',
    type: 'number',
  },
  {
    field: 'locationName',
    headerName: 'Location Name',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      return rowData.addressNickName ?? rowData.pickupLocation?.addressNickName ?? ''
    },
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'address',
    headerName: 'Address',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      const addr = rowData.address
      if (!addr) return '—'

      // Only show city and state in the grid
      const parts: string[] = []
      if (addr.city) parts.push(addr.city)
      if (addr.state) parts.push(addr.state)

      return parts.length > 0 ? parts.join(', ') : '—'
    },
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => {
      const rowData = params.row
      const addr = rowData.address
      if (!addr) {
        return (
          <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%',
gap: '8px' }}>
            <LocationIcon sx={{ fontSize: 18,
color: 'text.secondary' }} />
            <span>—</span>
          </Box>
        )
      }

      // Build full address with all parts on separate lines
      const addressParts: string[] = []
      if (addr.streetAddress) addressParts.push(addr.streetAddress)
      if (addr.streetAddress2) addressParts.push(addr.streetAddress2)
      if (addr.streetAddress3) addressParts.push(addr.streetAddress3)

      const cityStateZip: string[] = []
      if (addr.city) cityStateZip.push(addr.city)
      if (addr.state) cityStateZip.push(addr.state)
      if (addr.postalCode) cityStateZip.push(addr.postalCode)

      if (cityStateZip.length > 0) {
        addressParts.push(cityStateZip.join(', '))
      }

      const fullAddress = addressParts.join('\n')
      const shortAddress = params.value as string

      return (
        <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{fullAddress}</div>} placement="top">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              gap: '8px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <LocationIcon sx={{ fontSize: 18,
color: 'text.secondary',
flexShrink: 0 }} />
            <span style={{ overflow: 'hidden',
textOverflow: 'ellipsis',
whiteSpace: 'nowrap' }}>{shortAddress}</span>
          </Box>
        </Tooltip>
      )
    },
  },
  {
    field: 'nameOnAddress',
    headerName: 'Name on Address',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      return rowData.address?.nameOnAddress ?? rowData.nameOnAddress ?? ''
    },
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'phoneOnAddress',
    headerName: 'Phone on Address',
    width: 160,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      const phone = rowData.address?.phoneOnAddress ?? rowData.phoneOnAddress ?? ''
      return formatPhone(phone)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'emailOnAddress',
    headerName: 'Email on Address',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      return rowData.address?.emailOnAddress ?? rowData.emailOnAddress ?? '—'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={(params.value as string) || '—'} />
      </Box>
    ),
  },
  {
    field: 'shipRocketPickupLocationId',
    headerName: 'ShipRocket ID',
    width: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PickupLocationData) => {
      const rowData = row
      return rowData.shipRocketPickupLocationId ?? rowData.pickupLocation?.shipRocketPickupLocationId ?? '—'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value}</Box>
    ),
  },
  {
    field: 'products',
    headerName: 'Products',
    width: 150,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => {
      const rowData = params.row
      const pickupLocationId = rowData.pickupLocationId ?? rowData.pickupLocation?.pickupLocationId
      const locationName = rowData.addressNickName ?? rowData.pickupLocation?.addressNickName ?? ''
      const productCount = rowData.productCount ?? 0

      if (pickupLocationId == null) {
        return <span>—</span>
      }

      // Show "None" chip if no products
      if (productCount === 0) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip label="None" size="small" variant="outlined" />
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Tooltip title="Click to view products at this location">
            <Chip
              icon={<ShoppingCartIcon />}
              label={`${productCount} Product${productCount !== 1 ? 's' : ''}`}
              color="primary"
              size="small"
              onClick={e => {
                e.stopPropagation()
                mappingHandlers?.onProductsClick?.(pickupLocationId, locationName)
              }}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>
      )
    },
  },
  {
    field: 'packages',
    headerName: 'Packages',
    width: 150,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => {
      const rowData = params.row
      const pickupLocationId = rowData.pickupLocationId ?? rowData.pickupLocation?.pickupLocationId
      const locationName = rowData.addressNickName ?? rowData.pickupLocation?.addressNickName ?? ''
      const packageCount = rowData.packageCount ?? 0

      if (pickupLocationId == null) {
        return <span>—</span>
      }

      // Show "None" chip if no packages
      if (packageCount === 0) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Chip label="None" size="small" variant="outlined" />
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Tooltip title="Click to view packages at this location">
            <Chip
              icon={<InventoryIcon />}
              label={`${packageCount} Package${packageCount !== 1 ? 's' : ''}`}
              color="secondary"
              size="small"
              onClick={e => {
                e.stopPropagation()
                mappingHandlers?.onPackagesClick?.(pickupLocationId, locationName)
              }}
              sx={{ cursor: 'pointer' }}
            />
          </Tooltip>
        </Box>
      )
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => {
      const rowData = params.row
      const pickupLocationId = rowData.pickupLocationId ?? rowData.pickupLocation?.pickupLocationId
      const isDeleted = rowData.isDeleted ?? rowData.deleted ?? rowData.pickupLocation?.deleted ?? false

      if (pickupLocationId == null) {
        return <span>—</span>
      }

      return (
        <PickupLocationActionsCell
          pickupLocationId={pickupLocationId}
          isDeleted={isDeleted}
          onTogglePickupLocation={onTogglePickupLocation}
        />
      )
    },
  },
]
