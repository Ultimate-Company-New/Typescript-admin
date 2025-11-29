import type React from 'react'
import { useState, useEffect, useMemo } from 'react'

import { Box } from '@mui/material'
import { type GridColumnVisibilityModel, type GridToolbarProps, type GridSlotsComponent } from '@mui/x-data-grid'

import { packageApi } from '../../api/packageApi'
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
import { getPackageGridColumns } from '../../models/gridModels/packageGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'

import styles from './Packages.module.scss'

/**
 * Package data structure matching API response
 */
interface PackageData {
  packageId?: number
  _package?: {
    packageId: number
    deleted?: boolean
  }
  isDeleted?: boolean
  deleted?: boolean
}

/**
 * Packages Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const Packages = (): React.JSX.Element => {
  const [rows, setRows] = useState<PackageData[]>([])
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
    packageId: false,
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
      getPackageGridColumns(async (packageId: number) => {
        await createToggleFunction(
          packageApi.togglePackage,
          packageId,
          async () => {
            await createFetchFunction(
              packageApi.getPackagesInBatches,
              setLoading,
              setRows,
              setTotalCount,
              paginationModel,
              includeDeleted,
              activeFilterGroup,
              'Failed to fetch packages',
            )
          },
          'Failed to toggle package',
        )
      }),
    [paginationModel, includeDeleted, activeFilterGroup],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'packageId'].includes(col.field))
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch packages on mount and when pagination model changes
  useEffect(() => {
    void createFetchFunction(
      packageApi.getPackagesInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
      'Failed to fetch packages',
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className={styles['packages-page']}>
      <Box className={styles['packages-page__container']}>
        <Box className={styles['packages-page__card']} data-test-id="packages-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="packages-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            itemLabel="packages"
            paginationTestId="packages-pagination"
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model as GridColumnVisibilityModel)
            }}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={model => {
              void handlePaginationModelChange(model, setPaginationModel)
            }}
            onFilterModelChange={model => {
              void handleFilterModelChange(model, paginationModel, setPaginationModel)
            }}
            onSortModelChange={model => {
              void handleSortModelChange(model, setPaginationModel)
            }}
            getRowId={row => (row as PackageData).packageId ?? (row as PackageData)._package?.packageId ?? 0}
            getRowClassName={params => {
              const classes = [(params as { indexRelativeToCurrentPage: number }).indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
              if ((params.row as PackageData).isDeleted ?? (params.row as PackageData).deleted) {
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

export default Packages
