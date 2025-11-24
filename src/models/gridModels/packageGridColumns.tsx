import { Link, Chip, Box } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { APP_ROUTES } from '../../constants/routes'

/**
 * Get package grid columns with action handlers
 */
export const getPackageGridColumns = (
  onTogglePackage: (packageId: number) => void,
): GridColDef[] => [
  {
    field: 'packageId',
    headerName: 'Package ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'dimensions',
    headerName: 'Dimensions (L x W x H)',
    flex: 1.5,
    minWidth: 180,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: unknown) => {
      const rowData = row as {
        length?: number
        breadth?: number
        width?: number
        height?: number
        _package?: {
          length?: number
          breadth?: number
          height?: number
        }
      }
      const length = rowData.length ?? rowData._package?.length ?? 0
      const breadth = rowData.breadth ?? rowData.width ?? rowData._package?.breadth ?? 0
      const height = rowData.height ?? rowData._package?.height ?? 0
      return `${length} x ${breadth} x ${height}`
    },
  },
  {
    field: 'weight',
    headerName: 'Weight',
    width: 120,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const weight = row.weight || row._package?.weight || 0
      return `${weight} kg`
    },
  },
  {
    field: 'pricePerUnit',
    headerName: 'Price per Unit',
    width: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => {
      const price = row.pricePerUnit || row._package?.pricePerUnit || 0
      return `₹ ${price}`
    },
  },
  {
    field: 'packageName',
    headerName: 'Package Name',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: any) => row.packageName || row._package?.packageName || '—',
  },
  {
    field: 'packageType',
    headerName: 'Package Type',
    width: 150,
    align: 'center',
    headerAlign: 'center',
    valueGetter: (value, row: any) => row.packageType || row._package?.packageType || '',
    renderCell: (params: GridRenderCellParams) => {
      const packageType = params.value
      if (!packageType) return '—'

      // Color mapping for different package types
      let color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' = 'default'

      const typeUpper = packageType.toUpperCase()
      if (typeUpper.includes('BOX') || typeUpper.includes('CARTON')) {
        color = 'primary'
      } else if (typeUpper.includes('ENVELOPE') || typeUpper.includes('MAILER')) {
        color = 'info'
      } else if (typeUpper.includes('PALLET')) {
        color = 'warning'
      } else if (typeUpper.includes('CRATE')) {
        color = 'secondary'
      } else if (typeUpper.includes('CUSTOM')) {
        color = 'success'
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%' }}>
          <Chip label={packageType} color={color} size="small" />
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
    renderCell: (params: GridRenderCellParams) => {
      const packageId = params.row.packageId || params.row._package?.packageId

      if (params.row.isDeleted || params.row.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onTogglePackage(packageId)
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
            href={`${APP_ROUTES.DASHBOARD.ADD_PACKAGE}?packageId=${packageId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
              View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PACKAGE}?packageId=${packageId}`}
            sx={{ cursor: 'pointer' }}
          >
              Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onTogglePackage(packageId)
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
