import { Box, Chip, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { getPackageTypeColor, getPackageTypeLabel, PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/Packages.module.scss'
import type { PackagePickupLocationMappingResponseModel } from '../api-models/PackageModels'

import PackageLocationsButton from './PackageLocationsButton'

/**
 * Package data structure matching API response
 */
export interface PackageData {
  packageId?: number
  _package?: {
    packageId: number
    packageName?: string
    packageType?: string
    length?: number
    breadth?: number
    width?: number
    height?: number
    maxWeight?: number
    pricePerUnit?: number
    pickupLocationQuantities?: Record<number, PackagePickupLocationMappingResponseModel>
  }
  packageName?: string
  packageType?: string
  length?: number
  breadth?: number
  width?: number
  height?: number
  maxWeight?: number
  pricePerUnit?: number
  isDeleted?: boolean
  deleted?: boolean
  pickupLocationQuantities?: Record<number, PackagePickupLocationMappingResponseModel>
}

/**
 * Package Actions Component - handles permission-based action visibility
 */
const PackageActionsCell = ({
  packageId,
  isDeleted,
  onTogglePackage,
}: {
  packageId: number
  isDeleted: boolean
  onTogglePackage?: (packageId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  // Check permissions using PERMISSIONS constants
  const canViewPackage = hasPermission(PERMISSIONS.VIEW_PACKAGES)
  const canUpdatePackage = hasPermission(PERMISSIONS.UPDATE_PACKAGES)
  const canTogglePackage = hasPermission(PERMISSIONS.TOGGLE_PACKAGES)

  if (isDeleted) {
    // Only show Activate if user has toggle permission
    if (!canTogglePackage) {
      return <span>—</span>
    }

    return (
      <div>
        <Link
          href="#"
          onClick={e => {
            e.preventDefault()
            if (onTogglePackage) {
              onTogglePackage(packageId)
            }
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

  // Build actions based on permissions
  const actions: JSX.Element[] = []

  if (canViewPackage) {
    actions.push(
      <Link
        key="view"
        href={`${APP_ROUTES.DASHBOARD.ADD_PACKAGE}?packageId=${packageId}&isView`}
        sx={{ cursor: 'pointer' }}
      >
        View
      </Link>,
    )
  }

  if (canUpdatePackage) {
    actions.push(
      <Link
        key="edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_PACKAGE}?packageId=${packageId}`}
        sx={{ cursor: 'pointer' }}
      >
        Edit
      </Link>,
    )
  }

  if (canTogglePackage) {
    actions.push(
      <Link
        key="deactivate"
        href="#"
        onClick={e => {
          e.preventDefault()
          if (onTogglePackage) {
            onTogglePackage(packageId)
          }
        }}
        sx={{
          cursor: 'pointer',
          color: 'error.main',
        }}
      >
        Deactivate
      </Link>,
    )
  }

  // If no permissions, show empty cell
  if (actions.length === 0) {
    return <span>—</span>
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
      }}
    >
      {actions}
    </div>
  )
}

/**
 * Get package grid columns with action handlers
 */
export const getPackageGridColumns = (onTogglePackage: (packageId: number) => void): GridColDef[] => [
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
    valueGetter: (_value, row: PackageData) => {
      const rowData = row
      const length = rowData.length ?? rowData._package?.length ?? 0
      const breadth = rowData.breadth ?? rowData.width ?? rowData._package?.breadth ?? 0
      const height = rowData.height ?? rowData._package?.height ?? 0
      return `${length} x ${breadth} x ${height}`
    },
  },
  {
    field: 'maxWeight',
    headerName: 'Max Weight',
    width: 120,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PackageData) => {
      const rowData = row
      const maxWeight = rowData.maxWeight ?? rowData._package?.maxWeight ?? 0
      return `${maxWeight} kg`
    },
  },
  {
    field: 'pricePerUnit',
    headerName: 'Price per Unit',
    width: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (_value, row: PackageData) => {
      const rowData = row
      const price = rowData.pricePerUnit ?? rowData._package?.pricePerUnit ?? 0
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
    valueGetter: (_value, row: PackageData) => {
      const rowData = row
      return rowData.packageName ?? rowData._package?.packageName ?? '—'
    },
  },
  {
    field: 'packageType',
    headerName: 'Package Type',
    width: 150,
    align: 'center',
    headerAlign: 'center',
    valueGetter: (_value, row: PackageData) => {
      const rowData = row
      return rowData.packageType ?? rowData._package?.packageType ?? ''
    },
    renderCell: (params: GridRenderCellParams<PackageData>) => {
      const packageType = params.value as string
      if (!packageType) return '—'

      return (
        <Box className={styles['package-grid__type-cell']}>
          <Chip
            label={getPackageTypeLabel(packageType)}
            color={getPackageTypeColor(packageType)}
            size="small"
          />
        </Box>
      )
    },
  },
  {
    field: 'pickupLocationQuantities',
    headerName: 'Locations',
    minWidth: 120,
    flex: 0.8,
    align: 'center',
    headerAlign: 'center',
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PackageData>) => {
      const rowData = params.row
      const pickupLocationQuantities =
        rowData.pickupLocationQuantities ?? rowData._package?.pickupLocationQuantities ?? {}
      const packageName = rowData.packageName ?? rowData._package?.packageName

      if (Object.keys(pickupLocationQuantities).length === 0) {
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            —
          </Box>
        )
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <PackageLocationsButton pickupLocationQuantities={pickupLocationQuantities} packageName={packageName} />
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
    renderCell: (params: GridRenderCellParams<PackageData>) => {
      const rowData = params.row
      const packageId = rowData.packageId ?? rowData._package?.packageId
      const isDeleted = rowData.isDeleted ?? rowData.deleted ?? false

      if (packageId == null) {
        return <span>—</span>
      }

      return <PackageActionsCell packageId={packageId} isDeleted={isDeleted} onTogglePackage={onTogglePackage} />
    },
  },
]

/**
 * Export the PackageActionsCell for potential reuse
 */
export { PackageActionsCell }
