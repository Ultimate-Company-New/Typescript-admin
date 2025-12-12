import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Box, Divider, Paper } from '@mui/material'
import {
    type GridColumnVisibilityModel,
    type GridFilterModel,
    type GridPaginationModel,
    type GridRowId,
    type GridRowSelectionModel,
    type GridSlotsComponent,
    type GridSortModel,
    type GridToolbarProps,
} from '@mui/x-data-grid'

import { packageApi } from '../../api/packageApi'
import { getPackageGridColumns, type PackageData } from '../../models/grid-models/PackageGridColumns'
import styles from '../../styles/Users.module.scss'
import { type PaginatedGridInterface } from '../../types/grid.types'
import {
    createFetchFunction,
    getRowClassName,
    GridDensity,
    handleFilterModelChange,
    handlePaginationModelChange,
    handleSortModelChange,
    LogicOperator,
    type GridDensityType,
} from '../../utils/gridUtil'
import { Subheader } from '../fonts'

import CustomNoRowsOverlay from './CustomNoRowsOverlay'
import { type FilterGroup } from './FilterPanel'
import SimpleToolbar from './SimpleToolbar'
import { StyledDataGrid } from './StyledDataGrid'

/**
 * Package with quantity mapping
 */
export interface PackageQuantityMapping {
  packageId: number
  packageName: string
  quantity: number
  reorderLevel: number
  maxStockLevel: number
}

interface PackageSelectionGridProps {
  /** Current package-quantity mappings */
  selectedPackages: PackageQuantityMapping[]
  /** Callback when selection or quantities change */
  onSelectionChange: (packages: PackageQuantityMapping[]) => void
  /** Whether the grid is in view-only mode */
  isView?: boolean
  /** Grid title */
  title?: string
  /** Default page size */
  defaultPageSize?: number
}

/**
 * Package Selection Grid Component
 * Allows selecting packages and specifying quantities for each
 * Supports server-side pagination for large package catalogs
 * Uses the same columns as PackageGridColumns with editable quantity
 */
const PackageSelectionGrid = ({
  selectedPackages,
  onSelectionChange,
  isView = false,
  title = 'Select Packages',
  defaultPageSize = 10,
}: PackageSelectionGridProps): JSX.Element => {
  const [rows, setRows] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  // Use STANDARD density like Packages.tsx
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  // Same column visibility as Packages.tsx - only hide packageId and isDeleted, plus actions
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    packageId: false,
    actions: false, // Hide actions column for selection grid
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set<GridRowId>(selectedPackages.map(p => p.packageId)),
  })

  // Local state for quantity inputs
  const [quantityInputs, setQuantityInputs] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    selectedPackages.forEach(p => {
      initial[p.packageId] = p.quantity
    })
    return initial
  })

  // Local state for reorder level inputs
  const [reorderLevelInputs, setReorderLevelInputs] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    selectedPackages.forEach(p => {
      initial[p.packageId] = p.reorderLevel
    })
    return initial
  })

  // Local state for max stock level inputs
  const [maxStockLevelInputs, setMaxStockLevelInputs] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {}
    selectedPackages.forEach(p => {
      initial[p.packageId] = p.maxStockLevel
    })
    return initial
  })

  // Pagination model
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: defaultPageSize,
    pageSize: defaultPageSize,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Selected package IDs as a Set for the column
  const selectedPackageIds = useMemo(
    () => new Set(selectedPackages.map(p => p.packageId)),
    [selectedPackages]
  )

  // Use refs to avoid re-creating columns on every quantity/selection change
  const quantityInputsRef = useRef(quantityInputs)
  const selectedPackagesRef = useRef(selectedPackages)
  const onSelectionChangeRef = useRef(onSelectionChange)
  const selectedPackageIdsRef = useRef(selectedPackageIds)

  // Keep refs updated
  useEffect(() => {
    quantityInputsRef.current = quantityInputs
  }, [quantityInputs])

  useEffect(() => {
    selectedPackagesRef.current = selectedPackages
    selectedPackageIdsRef.current = selectedPackageIds
  }, [selectedPackages, selectedPackageIds])

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  // Stable quantity change handler using refs
  const handleQuantityChange = useCallback((packageId: number, quantity: number) => {
    setQuantityInputs(prev => ({ ...prev, [packageId]: quantity }))

    // Update parent if package is already selected
    if (selectedPackageIdsRef.current.has(packageId)) {
      const updatedPackages = selectedPackagesRef.current.map(p =>
        p.packageId === packageId ? { ...p, quantity } : p
      )
      onSelectionChangeRef.current(updatedPackages)
    }
  }, [])

  // Stable reorder level change handler using refs
  const handleReorderLevelChange = useCallback((packageId: number, reorderLevel: number) => {
    setReorderLevelInputs(prev => ({ ...prev, [packageId]: reorderLevel }))

    // Update parent if package is already selected
    if (selectedPackageIdsRef.current.has(packageId)) {
      const updatedPackages = selectedPackagesRef.current.map(p =>
        p.packageId === packageId ? { ...p, reorderLevel } : p
      )
      onSelectionChangeRef.current(updatedPackages)
    }
  }, [])

  // Stable max stock level change handler using refs
  const handleMaxStockLevelChange = useCallback((packageId: number, maxStockLevel: number) => {
    setMaxStockLevelInputs(prev => ({ ...prev, [packageId]: maxStockLevel }))

    // Update parent if package is already selected
    if (selectedPackageIdsRef.current.has(packageId)) {
      const updatedPackages = selectedPackagesRef.current.map(p =>
        p.packageId === packageId ? { ...p, maxStockLevel } : p
      )
      onSelectionChangeRef.current(updatedPackages)
    }
  }, [])

  // Get columns from PackageGridColumns with editable quantity
  // Recreate columns when selectedPackages changes to ensure quantities are correct
  const columns = useMemo(
    () => {
      // Build maps directly from selectedPackages to ensure correct initial values
      const quantityMap: Record<number, number> = {}
      const reorderLevelMap: Record<number, number> = {}
      const maxStockLevelMap: Record<number, number> = {}
      selectedPackages.forEach(p => {
        quantityMap[p.packageId] = p.quantity
        reorderLevelMap[p.packageId] = p.reorderLevel
        maxStockLevelMap[p.packageId] = p.maxStockLevel
      })

      return getPackageGridColumns(
        () => {}, // onTogglePackage - not used in selection grid
        {
          quantityEditable: !isView,
          quantityValues: quantityMap,
          reorderLevelValues: reorderLevelMap,
          maxStockLevelValues: maxStockLevelMap,
          onQuantityChange: handleQuantityChange,
          onReorderLevelChange: handleReorderLevelChange,
          onMaxStockLevelChange: handleMaxStockLevelChange,
          selectedPackageIds,
        }
      )
    },
    [isView, handleQuantityChange, handleReorderLevelChange, handleMaxStockLevelChange, selectedPackageIds, selectedPackages]
  )

  // Update visible column fields when column visibility changes - same logic as Packages.tsx
  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'packageId'].includes(col.field))
        .map(col => col.field)
    )
  }, [columnVisibilityModel, columns])

  // Fetch packages
  useEffect(() => {
    void createFetchFunction(
      packageApi.getPackagesInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      false,
      activeFilterGroup
    )
  }, [paginationModel, activeFilterGroup])

  // Sync selected package IDs with row selection model
  useEffect(() => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(selectedPackages.map(p => p.packageId)),
    })
    // Also sync all inputs
    const newQuantityInputs: Record<number, number> = {}
    const newReorderLevelInputs: Record<number, number> = {}
    const newMaxStockLevelInputs: Record<number, number> = {}
    selectedPackages.forEach(p => {
      newQuantityInputs[p.packageId] = p.quantity
      newReorderLevelInputs[p.packageId] = p.reorderLevel
      newMaxStockLevelInputs[p.packageId] = p.maxStockLevel
    })
    setQuantityInputs(newQuantityInputs)
    setReorderLevelInputs(newReorderLevelInputs)
    setMaxStockLevelInputs(newMaxStockLevelInputs)
  }, [selectedPackages])

  // Handle row selection changes
  const handleRowSelectionChange = useCallback(
    (newSelection: GridRowSelectionModel): void => {
      const currentIds = new Set<GridRowId>(rowSelectionModel.ids)
      const newIds = new Set<GridRowId>(
        'ids' in newSelection ? (newSelection.ids as Iterable<GridRowId>) : []
      )

      // Add newly selected IDs
      newIds.forEach(id => {
        currentIds.add(id)
      })

      // Remove deselected IDs from current page
      const currentPageRowIds = new Set<GridRowId>(
        rows.map((row): GridRowId => row.packageId ?? row._package?.packageId ?? 0)
      )

      currentPageRowIds.forEach(id => {
        if (!newIds.has(id)) {
          currentIds.delete(id)
        }
      })

      const mergedSelection: GridRowSelectionModel = {
        type: 'include',
        ids: currentIds,
      }

      setRowSelectionModel(mergedSelection)

      // Update parent with new selection
      const updatedPackages: PackageQuantityMapping[] = []
      currentIds.forEach(id => {
        const packageId = Number(id)
        const existingPackage = selectedPackages.find(p => p.packageId === packageId)
        const row = rows.find(r => (r.packageId ?? r._package?.packageId) === packageId)
        const packageName = row?.packageName ?? row?._package?.packageName ?? ''

        updatedPackages.push({
          packageId,
          packageName: existingPackage?.packageName ?? packageName,
          quantity: quantityInputs[packageId] ?? existingPackage?.quantity ?? 1,
          reorderLevel: reorderLevelInputs[packageId] ?? existingPackage?.reorderLevel ?? 1,
          maxStockLevel: maxStockLevelInputs[packageId] ?? existingPackage?.maxStockLevel ?? 1,
        })
      })

      onSelectionChange(updatedPackages)
    },
    [rowSelectionModel.ids, rows, selectedPackages, quantityInputs, onSelectionChange]
  )

  // Handle clear selection
  const handleClearSelection = useCallback((): void => {
    setRowSelectionModel({
      type: 'include',
      ids: new Set<GridRowId>(),
    })
    setQuantityInputs({})
    onSelectionChange([])
  }, [onSelectionChange])

  // Toolbar props
  const toolbarProps = useMemo(
    () =>
      ({
        density,
        onDensityChange: setDensity,
        columns,
        onFiltersChange: setActiveFilterGroup,
        activeFilterGroup,
        rows,
        hideIncludeDeleted: true,
        visibleColumnFields,
        columnVisibilityModel,
        onColumnVisibilityChange: setColumnVisibilityModel,
        onClearSelection: isView ? undefined : handleClearSelection,
        selectionCount: isView ? undefined : selectedPackages.length,
      }) as GridToolbarProps,
    [
      density,
      columns,
      activeFilterGroup,
      rows,
      visibleColumnFields,
      columnVisibilityModel,
      handleClearSelection,
      selectedPackages.length,
      isView,
    ]
  )

  return (
    <Paper className={styles['add-users-page__section']} sx={{ overflow: 'hidden' }}>
      <Subheader label={title} className={styles['add-users-page__section-title']} />
      <Divider className={styles['add-users-page__divider']} />
      <Box className={styles['add-users-page__divider-spacer']} />

      <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
        <StyledDataGrid
          dataTestId="package-selection-grid"
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={totalCount}
          totalCount={totalCount}
          paginationModelState={paginationModel}
          setPaginationModel={setPaginationModel}
          density={density}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          paginationModel={{
            page: Math.floor(paginationModel.start / paginationModel.pageSize),
            pageSize: paginationModel.pageSize,
          }}
          onPaginationModelChange={(model: GridPaginationModel) => {
            handlePaginationModelChange(model, setPaginationModel)
          }}
          onFilterModelChange={(model: GridFilterModel) => {
            handleFilterModelChange(model, paginationModel, setPaginationModel)
          }}
          onSortModelChange={(model: GridSortModel) => {
            handleSortModelChange(model, setPaginationModel)
          }}
          getRowId={row =>
            (row as PackageData).packageId ?? (row as PackageData)._package?.packageId ?? 0
          }
          getRowClassName={params => getRowClassName<PackageData>(params)}
          checkboxSelection={!isView}
          disableRowSelectionOnClick
          rowSelectionModel={isView ? undefined : rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          showToolbar
          slots={{
            toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
            noRowsOverlay: CustomNoRowsOverlay,
          }}
          slotProps={{
            toolbar: toolbarProps,
          }}
          disableColumnMenu={false}
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Paper>
  )
}

export default PackageSelectionGrid

