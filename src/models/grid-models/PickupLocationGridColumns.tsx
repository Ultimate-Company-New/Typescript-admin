import { LocationOn as LocationIcon } from '@mui/icons-material'
import { Box, Link, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

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
 * Get pickup location grid columns with action handlers
 */
export const getPickupLocationGridColumns = (
  onTogglePickupLocation: (pickupLocationId: number) => void,
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
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PickupLocationData>) => {
      const rowData = params.row
      const pickupLocationId = rowData.pickupLocationId ?? rowData.pickupLocation?.pickupLocationId

      if (rowData.isDeleted ?? rowData.deleted ?? rowData.pickupLocation?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                if (pickupLocationId != null) {
                  onTogglePickupLocation(pickupLocationId)
                }
              }}
              sx={{ cursor: 'pointer',
color: 'success.main' }}
            >
              Activate
            </Link>
          </div>
        )
      }

      return (
        <div style={{ display: 'flex',
gap: '12px' }}>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION}?pickupLocationId=${pickupLocationId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
            View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PICKUP_LOCATION}?pickupLocationId=${pickupLocationId}`}
            sx={{ cursor: 'pointer' }}
          >
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              if (pickupLocationId != null) {
                onTogglePickupLocation(pickupLocationId)
              }
            }}
            sx={{ cursor: 'pointer',
color: 'error.main' }}
          >
            Deactivate
          </Link>
        </div>
      )
    },
  },
]
