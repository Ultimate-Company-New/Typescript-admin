import { Box, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

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
    width: 150,
    headerAlign: 'left',
    valueGetter: (_value, row: unknown) => {
      const rowData = row as {
        discountValue?: number
        percent?: boolean
        isPercent?: boolean
      }
      const discountValue = rowData.discountValue ?? 0
      if (rowData.percent === true || rowData.isPercent === true) {
        return `${discountValue}%`
      }
      return `₹ ${discountValue}`
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
    renderCell: (params: GridRenderCellParams) => {
      const rowData = params.row as {
        promoId?: number
        isDeleted?: boolean
        deleted?: boolean
      }
      const promoId = rowData.promoId ?? 0

      if (rowData.isDeleted === true || rowData.deleted === true) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onTogglePromo(promoId)
              }}
              sx={{
                cursor: 'pointer',
                color: 'success.main',
              }}
            >
              Activate
            </Link>
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
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}&isView`} sx={{ cursor: 'pointer' }}>
            View
          </Link>
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}`} sx={{ cursor: 'pointer' }}>
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onTogglePromo(promoId)
            }}
            sx={{
              cursor: 'pointer',
              color: 'error.main',
            }}
          >
            Deactivate
          </Link>
        </div>
      )
    },
  },
]
