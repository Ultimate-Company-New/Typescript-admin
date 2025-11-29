import { useState, useEffect, useMemo } from 'react'

import { Box } from '@mui/material'
import {
  type GridColumnVisibilityModel,

  type GridToolbarProps,
  type GridSlotsComponent } from '@mui/x-data-grid'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
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
import { getPurchaseOrderGridColumns } from '../../models/gridModels/purchaseOrderGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'
import styles from './PurchaseOrders.module.scss'

/**
 * Purchase Order data structure matching API response
 */
interface PurchaseOrderData {
  purchaseOrderId?: number
  purchaseOrder?: {
    purchaseOrderId: number
    deleted?: boolean
  }
  isDeleted?: boolean
  deleted?: boolean
}

/**
 * Purchase Orders Management Page with DataGrid
 * Features:
 * - Server-side pagination
 * - Custom multi-column filtering
 * - Sorting
 * - Include Deleted toggle
 * - Responsive design
 */

const PurchaseOrders = () => {
  const [rows, setRows] = useState<PurchaseOrderData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({ logicOperator: LogicOperator.AND,
    filters: [] })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    purchaseOrderId: false,
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
      getPurchaseOrderGridColumns(
        async (purchaseOrderId: number) => {
          await createToggleFunction(
            purchaseOrderApi.togglePurchaseOrder,
            purchaseOrderId,
            async () => {
              await createFetchFunction(
                purchaseOrderApi.getPurchaseOrdersInBatches,
                setLoading,
                setRows,
                setTotalCount,
                paginationModel,
                includeDeleted,
                activeFilterGroup,
                'Failed to fetch purchase orders',
              )
            },
            'Failed to toggle purchase order',
          )
        },
        async (purchaseOrderId: number) => {
          await createToggleFunction(
            purchaseOrderApi.approvePurchaseOrder,
            purchaseOrderId,
            async () => {
              await createFetchFunction(
                purchaseOrderApi.getPurchaseOrdersInBatches,
                setLoading,
                setRows,
                setTotalCount,
                paginationModel,
                includeDeleted,
                activeFilterGroup,
                'Failed to fetch purchase orders',
              )
            },
            'Failed to approve purchase order',
          )
        },
        async (purchaseOrderId: number) => {
          await createToggleFunction(
            purchaseOrderApi.rejectPurchaseOrder,
            purchaseOrderId,
            async () => {
              await createFetchFunction(
                purchaseOrderApi.getPurchaseOrdersInBatches,
                setLoading,
                setRows,
                setTotalCount,
                paginationModel,
                includeDeleted,
                activeFilterGroup,
                'Failed to fetch purchase orders',
              )
            },
            'Failed to reject purchase order',
          )
        },
      ),
    [paginationModel, includeDeleted, activeFilterGroup],
  )

  useEffect(() => {
    setVisibleColumnFields(
      columns
        .filter(col => columnVisibilityModel[col.field] && !['isDeleted', 'purchaseOrderId'].includes(col.field))
        .map(col => col.field),
    )
  }, [columnVisibilityModel, columns])

  // Fetch purchase orders on mount and when pagination model changes
  useEffect(() => {
    createFetchFunction(
      purchaseOrderApi.getPurchaseOrdersInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
      'Failed to fetch purchase orders',
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className="purchase-orders-page">
      <Box className="purchase-orders-page__container">
        <Box className="purchase-orders-page__card" data-test-id="purchase-orders-grid-card">
          {/* DataGrid with custom toolbar and integrated pagination */}
          <StyledDataGrid
            dataTestId="purchase-orders-data-grid"
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            totalCount={totalCount}
            paginationModelState={paginationModel}
            setPaginationModel={setPaginationModel}
            itemLabel="purchase orders"
            paginationTestId="purchase-orders-pagination"
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
            }
            }
            onFilterModelChange={model => {
              handleFilterModelChange(model, paginationModel, setPaginationModel)
            }
            }
            onSortModelChange={model => {
              handleSortModelChange(model, setPaginationModel)
            }
            }
            getRowId={row => row.purchaseOrderId || row.purchaseOrder?.purchaseOrderId}
            getRowClassName={params => {
              const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
              if (params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted) {
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

export default PurchaseOrders
