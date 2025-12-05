import { Box, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import type { PromoResponseModel } from '../../models/api-models'

/**
 * Promo data structure matching API response
 */
export interface PromoData extends PromoResponseModel {}

/**
 * Promo Actions Cell Component
 * Renders View, Activate, Deactivate links based on user permissions
 * Note: Promos cannot be edited after creation
 */
const PromoActionsCell = ({
  promoId,
  isDeleted,
  onToggle,
}: {
  promoId: number
  isDeleted: boolean
  onToggle: (promoId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  const canView = hasPermission(PERMISSIONS.VIEW_PROMOS)
  const canToggle = hasPermission(PERMISSIONS.DELETE_PROMOS)

  if (isDeleted) {
    return (
      <div>
        {canToggle && (
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onToggle(promoId)
            }}
            sx={{
              cursor: 'pointer',
              color: 'success.main',
            }}
          >
            Activate
          </Link>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
      }}
    >
      {canView && (
        <Link href={`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}&isView`} sx={{ cursor: 'pointer' }}>
          View
        </Link>
      )}
      {canToggle && (
        <Link
          href="#"
          onClick={e => {
            e.preventDefault()
            onToggle(promoId)
          }}
          sx={{
            cursor: 'pointer',
            color: 'error.main',
          }}
        >
          Deactivate
        </Link>
      )}
    </div>
  )
}

/**
 * Get promo grid columns with action handlers
 */
export const getPromoGridColumns = (onTogglePromo: (promoId: number) => void): GridColDef[] => [
  {
    field: 'promoId',
    headerName: 'Promo ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'promoCode',
    headerName: 'Promo Code',
    flex: 1,
    minWidth: 150,
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <RenderLongCellItem value={(params.value as string) || '—'} />
      </Box>
    ),
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 3,
    minWidth: 250,
    headerAlign: 'left',
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <RenderLongCellItem value={(params.value as string) || '—'} />
      </Box>
    ),
  },
  {
    field: 'discountValue',
    headerName: 'Discount Value',
    flex: 1,
    minWidth: 130,
    headerAlign: 'left',
    valueGetter: (_value, row: PromoData) => {
      const discountValue = row.discountValue ?? 0
      if (row.isPercent === true) {
        return `${discountValue}%`
      }
      return `₹ ${discountValue}`
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {params.value}
      </Box>
    ),
  },
  {
    field: 'createdUser',
    headerName: 'Created By',
    flex: 1.2,
    minWidth: 180,
    headerAlign: 'left',
    valueGetter: (_value, row: PromoData) => row.createdUser ?? '—',
    renderCell: (params: GridRenderCellParams<PromoData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'startDate',
    headerName: 'Start Date',
    flex: 1,
    minWidth: 120,
    headerAlign: 'left',
    valueGetter: (_value, row: PromoData) => {
      if (!row.startDate) return '—'
      return new Date(row.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {params.value}
      </Box>
    ),
  },
  {
    field: 'expiryDate',
    headerName: 'Expiry Date',
    flex: 1,
    minWidth: 120,
    headerAlign: 'left',
    valueGetter: (_value, row: PromoData) => {
      if (!row.expiryDate) return '—'
      return new Date(row.expiryDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        {params.value}
      </Box>
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1.2,
    minWidth: 180,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PromoData>) => {
      const promoId = params.row.promoId ?? 0
      const isDeleted = params.row.isDeleted ?? false

      return <PromoActionsCell promoId={promoId} isDeleted={isDeleted} onToggle={onTogglePromo} />
    },
  },
]

export { PromoActionsCell }
