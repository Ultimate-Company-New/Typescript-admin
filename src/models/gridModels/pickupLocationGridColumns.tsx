import { LocationOn as LocationIcon } from '@mui/icons-material'
import { Link, Box, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

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
    headerName: 'Location ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'locationName',
    headerName: 'Location Name',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: unknown) => {
      const rowData = row as { addressNickName?: string; pickupLocation?: { addressNickName?: string } }
      return rowData.addressNickName ?? rowData.pickupLocation?.addressNickName ?? ''
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={params.value}
        />
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
    valueGetter: (value, row: any) => {
      const addr = row.address
      if (!addr) return '—'

      // Only show city and state in the grid
      const parts = []
      if (addr.city) parts.push(addr.city)
      if (addr.state) parts.push(addr.state)

      return parts.length > 0 ? parts.join(', ') : '—'
    },
    renderCell: (params: GridRenderCellParams) => {
      const addr = params.row.address
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
      const addressParts = []
      if (addr.streetAddress) addressParts.push(addr.streetAddress)
      if (addr.streetAddress2) addressParts.push(addr.streetAddress2)
      if (addr.streetAddress3) addressParts.push(addr.streetAddress3)

      const cityStateZip = []
      if (addr.city) cityStateZip.push(addr.city)
      if (addr.state) cityStateZip.push(addr.state)
      if (addr.postalCode) cityStateZip.push(addr.postalCode)

      if (cityStateZip.length > 0) {
        addressParts.push(cityStateZip.join(', '))
      }

      const fullAddress = addressParts.join('\n')
      const shortAddress = params.value

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
              whiteSpace: 'nowrap' }}>
              {shortAddress}
            </span>
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
    valueGetter: (value, row: any) => row.address?.nameOnAddress || row.nameOnAddress || '',
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={params.value}
        />
      </Box>
    ),
  },
  {
    field: 'phoneOnAddress',
    headerName: 'Phone on Address',
    width: 160,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const phone = row.address?.phoneOnAddress || row.phoneOnAddress || ''
      return formatPhone(phone)
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'emailOnAddress',
    headerName: 'Email on Address',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => row.address?.emailOnAddress || row.emailOnAddress || '—',
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={params.value || '—'}
        />
      </Box>
    ),
  },
  {
    field: 'shipRocketPickupLocationId',
    headerName: 'ShipRocket ID',
    width: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => row.shipRocketPickupLocationId || row.pickupLocation?.shipRocketPickupLocationId || '—',
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 200,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const pickupLocationId = params.row.pickupLocationId || params.row.pickupLocation?.pickupLocationId

      if (params.row.isDeleted || params.row.deleted || params.row.pickupLocation?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onTogglePickupLocation(pickupLocationId)
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
              onTogglePickupLocation(pickupLocationId)
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
