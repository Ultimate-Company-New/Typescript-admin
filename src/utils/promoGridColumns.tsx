import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Link, Box } from '@mui/material'
import { APP_ROUTES } from '../constants/routes'
import { RenderLongCellItem } from '../components/DataGrid'

/**
 * Get promo grid columns with action handlers
 */
export const getPromoGridColumns = (
  onTogglePromo: (promoId: number) => void
): GridColDef[] => {
  return [
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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'discountValue',
      headerName: 'Discount Value',
      width: 150,
      headerAlign: 'left',
      valueGetter: (value, row: any) => {
        const discountValue = row.discountValue || 0
        if (row.percent || row.isPercent) {
          return `${discountValue}%`
        } else {
          return `₹ ${discountValue}`
        }
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
        const promoId = params.row.promoId
        
        if (params.row.isDeleted || params.row.deleted) {
          return (
            <div>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onTogglePromo(promoId)
                }}
                sx={{ cursor: 'pointer', color: 'success.main' }}
              >
                Activate
              </Link>
            </div>
          )
        }

        return (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}&isView`}
              sx={{ cursor: 'pointer' }}
            >
              View
            </Link>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_PROMO}?promoId=${promoId}`}
              sx={{ cursor: 'pointer' }}
            >
              Edit
            </Link>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onTogglePromo(promoId)
              }}
              sx={{ cursor: 'pointer', color: 'error.main' }}
            >
              Deactivate
            </Link>
          </div>
        )
      },
    },
  ]
}

