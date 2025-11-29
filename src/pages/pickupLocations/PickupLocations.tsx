import { useState, useEffect, useMemo } from 'react'

import { Box } from '@mui/material'
import { type GridColumnVisibilityModel, type GridToolbarProps, type GridSlotsComponent } from '@mui/x-data-grid'

import { pickupLocationApi } from '../../api/pickupLocationApi'
import {
  StyledDataGrid,
  CustomNoRowsOverlay,
  SimpleToolbar,
  type FilterGroup,
  handlePaginationModelChange,
  handleFilterModelChange,
  handleSortModelChange,
  handleIncludeDeletedChange,
  getInitialDensity,
  type GridDensityType,
  LogicOperator,
  createFetchFunction,
  createToggleFunction,
} from '../../components/datagrid'
import { getPickupLocationGridColumns } from '../../models/gridModels/pickupLocationGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'
import styles from './PickupLocations.module.scss'

/**
 * Pickup Location data structure matching API response
 */
interface PickupLocationData {
  pickupLocationId?: number
  pickupLocation?: {
    pickupLocationId: number
    deleted?: boolean
  }
  isDeleted?: boolean
  deleted?: boolean
}

/**
 * Pickup Locations Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const PickupLocations = () => {
  const [rows, setRows] = useState<PickupLocationData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    pickupLocationId: false,
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])

  // Pagination model
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Get grid columns with action handlers
  const columns = useMemo(
    () =>
      getPickupLocationGridColumns(async (pickupLocationId: number) => {
        await createToggleFunction(
          pickupLocationApi.togglePickupLocation,
          pickupLocationId,
          async () => {
            await createFetchFunction(
              pickupLocationApi.getPickupLocationsInBatches,
              setLoading,
              setRows,
              setTotalCount,
              paginationModel,
              includeDeleted,
              activeFilterGroup,
              'Failed to fetch pickup locations',
            )
          },
          'Failed to toggle pickup location',
        )
      }),
    [paginationModel, includeDeleted, activeFilterGroup],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'pickupLocationId'].includes(col.field))
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch pickup locations on mount and when pagination model changes
  useEffect(() => {
    createFetchFunction(
      pickupLocationApi.getPickupLocationsInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
      'Failed to fetch pickup locations',
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className={styles['pickup-locations-page']}>
      <Box className={styles['pickup-locations-page__container']}>
        <Box className={styles['pickup-locations-page__card']} data-test-id="pickup-locations-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="pickup-locations-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            itemLabel="pickup locations"
            paginationTestId="pickup-locations-pagination"
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model)
            }}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={model => {
              handlePaginationModelChange(model, setPaginationModel)
            }}
            onFilterModelChange={model => {
              handleFilterModelChange(model, paginationModel, setPaginationModel)
            }}
            onSortModelChange={model => {
              handleSortModelChange(model, setPaginationModel)
            }}
            getRowId={row => row.pickupLocationId || row.pickupLocation?.pickupLocationId}
            getRowClassName={params => {
              const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
              if (params.row.isDeleted || params.row.deleted || params.row.pickupLocation?.deleted) {
                classes.push('deleted')
              }
              return classes.join(' ')
            }}
            slots={{
              toolbar: SimpleToolbar as GridSlotsComponent['toolbar'],
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              toolbar: {
                density,
                onDensityChange: setDensity,
                columns,
                onFiltersChange: setActiveFilterGroup,
                activeFilterGroup,
                rows,
                includeDeleted,
                onIncludeDeletedChange: (checked: boolean) => {
                  handleIncludeDeletedChange(checked, setIncludeDeleted, setPaginationModel)
                },
                visibleColumnFields,
                columnVisibilityModel,
                onColumnVisibilityChange: setColumnVisibilityModel,
              } as GridToolbarProps,
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default PickupLocations
