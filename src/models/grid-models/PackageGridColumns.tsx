import { memo, useEffect, useState } from 'react'

import { Box, Chip, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { TextFieldInput } from '../../components/form-input'
import { getPackageTypeColor, getPackageTypeLabel, PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import styles from '../../styles/Packages.module.scss'
import type { PackagePickupLocationMappingResponseModel } from '../api-models/PackageModels'

import PackageLocationsButton from './PackageLocationsButton'

/**
 * Memoized Quantity Input Component
 * Manages its own local state to prevent grid re-renders on every keystroke
 */
interface PackageQuantityInputProps {
  initialValue: number | undefined
  onValueChange: (value: number) => void
}

const PackageQuantityInput = memo(({ initialValue, onValueChange }: PackageQuantityInputProps) => {
  const [localValue, setLocalValue] = useState<string>(initialValue?.toString() ?? '')

  // Sync local state when initialValue changes from outside
  useEffect(() => {
    setLocalValue(initialValue?.toString() ?? '')
  }, [initialValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value)
  }

  const handleBlur = () => {
    const value = parseInt(localValue, 10)
    if (isNaN(value) || value < 1) {
      setLocalValue('1')
      onValueChange(1)
    } else {
      onValueChange(value)
    }
  }

  return (
    <TextFieldInput
      type="number"
      size="small"
      variant="outlined"
      margin="none"
      value={localValue}
      placeholder="1"
      onChange={handleChange}
      onBlur={handleBlur}
      inputProps={{ min: 1, style: { textAlign: 'center' } }}
      sx={{ width: 100, backgroundColor: '#fff' }}
      fullWidth={false}
    />
  )
})

PackageQuantityInput.displayName = 'PackageQuantityInput'

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
          data-test-id="package-action-activate"
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
        data-test-id="package-action-view"
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
        data-test-id="package-action-edit"
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
        data-test-id="package-action-toggle"
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
 * Options for configuring package grid columns
 */
export interface PackageGridColumnOptions {
  /** Handler for toggling package active state */
  onTogglePackage: (packageId: number) => void
  /** When true, displays a Quantity column (used for pickup location inventory view) */
  displayQuantity?: boolean
  /** The pickup location ID to get quantity from (required when displayQuantity is true) */
  pickupLocationId?: number
  /** When true, makes quantity column editable with a text input */
  quantityEditable?: boolean
  /** Map of packageId to quantity value (used when quantityEditable is true) */
  quantityValues?: Record<number, number>
  /** Map of packageId to reorder level value (used when quantityEditable is true) */
  reorderLevelValues?: Record<number, number>
  /** Map of packageId to max stock level value (used when quantityEditable is true) */
  maxStockLevelValues?: Record<number, number>
  /** Callback when quantity is changed (used when quantityEditable is true) */
  onQuantityChange?: (packageId: number, quantity: number) => void
  /** Callback when reorder level is changed (used when quantityEditable is true) */
  onReorderLevelChange?: (packageId: number, reorderLevel: number) => void
  /** Callback when max stock level is changed (used when quantityEditable is true) */
  onMaxStockLevelChange?: (packageId: number, maxStockLevel: number) => void
  /** Set of selected package IDs (used when quantityEditable is true to show input only for selected rows) */
  selectedPackageIds?: Set<number>
}

/**
 * Get package grid columns with action handlers
 */
export const getPackageGridColumns = (
  onTogglePackage: (packageId: number) => void,
  options?: {
    displayQuantity?: boolean
    pickupLocationId?: number
    quantityEditable?: boolean
    quantityValues?: Record<number, number>
    reorderLevelValues?: Record<number, number>
    maxStockLevelValues?: Record<number, number>
    onQuantityChange?: (packageId: number, quantity: number) => void
    onReorderLevelChange?: (packageId: number, reorderLevel: number) => void
    onMaxStockLevelChange?: (packageId: number, maxStockLevel: number) => void
    selectedPackageIds?: Set<number>
  }
): GridColDef[] => {
  const {
    displayQuantity = false,
    pickupLocationId,
    quantityEditable = false,
    quantityValues = {},
    reorderLevelValues = {},
    maxStockLevelValues = {},
    onQuantityChange,
    onReorderLevelChange,
    onMaxStockLevelChange,
    selectedPackageIds,
  } = options ?? {}

  const baseColumns: GridColDef[] = [
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
            data-test-id="package-type-label"
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

  // Add quantity, reorder level, and max stock level columns if displayQuantity is enabled (read-only, from API)
  if (displayQuantity && pickupLocationId !== undefined && !quantityEditable) {
    // Insert columns after packageName column
    const packageNameIndex = baseColumns.findIndex(col => col.field === 'packageName')

    const quantityColumn: GridColDef = {
      field: 'quantity',
      headerName: 'Quantity',
      minWidth: 120,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      valueGetter: (_value, row: PackageData) => {
        const rowData = row
        const pickupLocationQuantities = rowData.pickupLocationQuantities ?? rowData._package?.pickupLocationQuantities ?? {}
        const locationData = pickupLocationQuantities[pickupLocationId]
        if (locationData) {
          return locationData.quantity ?? 0
        }
        return 0
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {params.value}
        </Box>
      ),
    }

    const reorderLevelColumn: GridColDef = {
      field: 'reorderLevel',
      headerName: 'Reorder Level',
      minWidth: 130,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      valueGetter: (_value, row: PackageData) => {
        const rowData = row
        const pickupLocationQuantities = rowData.pickupLocationQuantities ?? rowData._package?.pickupLocationQuantities ?? {}
        const locationData = pickupLocationQuantities[pickupLocationId]
        if (locationData) {
          return locationData.reorderLevel ?? 0
        }
        return 0
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {params.value}
        </Box>
      ),
    }

    const maxStockLevelColumn: GridColDef = {
      field: 'maxStockLevel',
      headerName: 'Max Stock Level',
      minWidth: 140,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      valueGetter: (_value, row: PackageData) => {
        const rowData = row
        const pickupLocationQuantities = rowData.pickupLocationQuantities ?? rowData._package?.pickupLocationQuantities ?? {}
        const locationData = pickupLocationQuantities[pickupLocationId]
        if (locationData) {
          return locationData.maxStockLevel ?? 0
        }
        return 0
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {params.value}
        </Box>
      ),
    }

    // Insert all three columns after packageName
    baseColumns.splice(packageNameIndex + 1, 0, quantityColumn, reorderLevelColumn, maxStockLevelColumn)
  }

  // Add editable quantity column if quantityEditable is enabled
  if (quantityEditable) {
    // Insert quantity column after packageName column
    const packageNameIndex = baseColumns.findIndex(col => col.field === 'packageName')
    const quantityColumn: GridColDef = {
      field: 'editableQuantity',
      headerName: 'Quantity',
      minWidth: 120,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<PackageData>) => {
        const packageId = params.row.packageId ?? params.row._package?.packageId ?? 0
        const isSelected = selectedPackageIds?.has(packageId) ?? false
        const currentValue = quantityValues[packageId]

        // Only show input for selected rows
        if (!isSelected) {
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
              py: 1,
            }}
          >
            <PackageQuantityInput
              initialValue={currentValue}
              onValueChange={(value) => onQuantityChange?.(packageId, value)}
            />
          </Box>
        )
      },
    }
    baseColumns.splice(packageNameIndex + 1, 0, quantityColumn)

    // Add Reorder Level column
    const reorderLevelColumn: GridColDef = {
      field: 'editableReorderLevel',
      headerName: 'Reorder Level',
      minWidth: 130,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<PackageData>) => {
        const packageId = params.row.packageId ?? params.row._package?.packageId ?? 0
        const isSelected = selectedPackageIds?.has(packageId) ?? false
        const currentValue = reorderLevelValues[packageId]

        if (!isSelected) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              —
            </Box>
          )
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1 }}>
            <PackageQuantityInput
              initialValue={currentValue}
              onValueChange={(value) => onReorderLevelChange?.(packageId, value)}
            />
          </Box>
        )
      },
    }
    // Insert after quantity column
    baseColumns.splice(packageNameIndex + 2, 0, reorderLevelColumn)

    // Add Max Stock Level column
    const maxStockLevelColumn: GridColDef = {
      field: 'editableMaxStockLevel',
      headerName: 'Max Stock Level',
      minWidth: 140,
      flex: 0.8,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<PackageData>) => {
        const packageId = params.row.packageId ?? params.row._package?.packageId ?? 0
        const isSelected = selectedPackageIds?.has(packageId) ?? false
        const currentValue = maxStockLevelValues[packageId]

        if (!isSelected) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              —
            </Box>
          )
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', py: 1 }}>
            <PackageQuantityInput
              initialValue={currentValue}
              onValueChange={(value) => onMaxStockLevelChange?.(packageId, value)}
            />
          </Box>
        )
      },
    }
    // Insert after reorder level column
    baseColumns.splice(packageNameIndex + 3, 0, maxStockLevelColumn)
  }

  return baseColumns
}

/**
 * Export the PackageActionsCell for potential reuse
 */
export { PackageActionsCell }
