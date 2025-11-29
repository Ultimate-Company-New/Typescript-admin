import type React from 'react'
import { useState, useEffect, useMemo } from 'react'

import { Box } from '@mui/material'
import {
  type GridColumnVisibilityModel,

  type GridToolbarProps,
  type GridSlotsComponent } from '@mui/x-data-grid'

import { promoApi } from '../../api/promoApi'
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
import { getPromoGridColumns } from '../../models/gridModels/promoGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'

import styles from './Promos.module.scss'

/**
 * Promo data structure matching API response
 */
interface PromoData {
  promoId: number
  promoCode: string
  description: string
  discountPercent?: number
  discountAmount?: number
  startDate?: string
  endDate?: string
  isDeleted?: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * Promos Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const Promos = (): React.JSX.Element => {
  const [rows, setRows] = useState<PromoData[]>([])
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
    promoId: false,
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
      getPromoGridColumns(async (promoId: number) => {
        await createToggleFunction(
          promoApi.togglePromo,
          promoId,
          async () => {
            await createFetchFunction(
              promoApi.getPromosInBatches,
              setLoading,
              setRows,
              setTotalCount,
              paginationModel,
              includeDeleted,
              activeFilterGroup,
              'Failed to fetch promos',
            )
          },
          'Failed to toggle promo',
        )
      }),
    [paginationModel, includeDeleted, activeFilterGroup],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'promoId'].includes(col.field))
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch promos on mount and when pagination model changes
  useEffect(() => {
    void createFetchFunction(
      promoApi.getPromosInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
      'Failed to fetch promos',
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className={styles['promos-page']}>
      <Box className={styles['promos-page__container']}>
        <Box className={styles['promos-page__card']} data-test-id="promos-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="promos-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            itemLabel="promos"
            paginationTestId="promos-pagination"
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
            getRowId={row => (row as PromoData).promoId}
            getRowClassName={params => {
              const classes = [(params as { indexRelativeToCurrentPage: number }).indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
              if ((params.row as PromoData).isDeleted ?? (params.row as PromoData).deleted) {
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

export default Promos
