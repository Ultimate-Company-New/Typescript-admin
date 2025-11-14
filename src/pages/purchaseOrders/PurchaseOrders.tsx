import { useState, useEffect, useCallback } from 'react'
import { Box } from '@mui/material'
import {
  GridPaginationModel,
  GridFilterModel,
  GridSortModel,
} from '@mui/x-data-grid'
import { toast } from 'react-toastify'
import {
  StyledDataGrid,
  CustomNoRowsOverlay,
  SimpleToolbar,
  filterChangeFunction,
  FilterGroup,
  PaginationComponent,
} from '../../components/DataGrid'
import { getPurchaseOrderGridColumns } from '../../utils/purchaseOrderGridColumns'
import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { PaginatedGridInterface } from '../../types/grid.types'
import '../../styles/PurchaseOrders.scss'

const DENSITY_STORAGE_KEY = 'mui-data-grid-density-purchase-orders'

const getInitialDensity = (): 'compact' | 'standard' | 'comfortable' => {
  try {
    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY)
    if (storedDensity && ['compact', 'standard', 'comfortable'].includes(storedDensity)) {
      return storedDensity as 'compact' | 'standard' | 'comfortable'
    }
    return 'standard'
  } catch {
    return 'standard'
  }
}

const PurchaseOrders = () => {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>(getInitialDensity())
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({ logicOperator: 'AND', filters: [] })

  /**
   * Handle density change
   */
  const handleDensityChange = (newDensity: 'compact' | 'standard' | 'comfortable') => {
    setDensity(newDensity)
    try {
      localStorage.setItem(DENSITY_STORAGE_KEY, newDensity)
    } catch (error) {
      console.error('Error saving density preference:', error)
    }
  }

  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  /**
   * Fetch purchase orders from API
   */
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true)
    try {
      const response = await purchaseOrderApi.getPurchaseOrdersInBatches({
        start: paginationModel.start,
        end: paginationModel.end,
        includeDeleted: includeDeleted,
        logicOperator: activeFilterGroup.logicOperator,
        filters: activeFilterGroup.filters,
      })

      setRows(response.data || [])
      setTotalCount(response.totalDataCount || 0)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
      toast.error('Failed to fetch purchase orders')
      setRows([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, includeDeleted, activeFilterGroup])

  /**
   * Handle toggle purchase order (activate/deactivate)
   */
  const handleTogglePurchaseOrder = useCallback(async (purchaseOrderId: number) => {
    try {
      await purchaseOrderApi.togglePurchaseOrder(purchaseOrderId)
      toast.success('Purchase order toggled successfully')
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error toggling purchase order:', error)
      toast.error('Failed to toggle purchase order')
    }
  }, [fetchPurchaseOrders])

  /**
   * Handle approve purchase order
   */
  const handleApprovePurchaseOrder = useCallback(async (purchaseOrderId: number) => {
    try {
      await purchaseOrderApi.approvePurchaseOrder(purchaseOrderId)
      toast.success('Purchase order approved successfully')
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error approving purchase order:', error)
      toast.error('Failed to approve purchase order')
    }
  }, [fetchPurchaseOrders])

  /**
   * Handle reject purchase order
   */
  const handleRejectPurchaseOrder = useCallback(async (purchaseOrderId: number) => {
    try {
      await purchaseOrderApi.rejectPurchaseOrder(purchaseOrderId)
      toast.success('Purchase order rejected successfully')
      fetchPurchaseOrders()
    } catch (error) {
      console.error('Error rejecting purchase order:', error)
      toast.error('Failed to reject purchase order')
    }
  }, [fetchPurchaseOrders])

  /**
   * Get grid columns with action handlers
   */
  const columns = getPurchaseOrderGridColumns(handleTogglePurchaseOrder, handleApprovePurchaseOrder, handleRejectPurchaseOrder)

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  /**
   * Handle pagination changes
   */
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    const start = model.page * model.pageSize
    const end = start + model.pageSize

    setPaginationModel((prev) => ({
      ...prev,
      start,
      end,
      pageSize: model.pageSize,
    }))
  }

  /**
   * Handle filter model changes
   */
  const handleFilterModelChange = (model: GridFilterModel) => {
    filterChangeFunction({
      gridFilterModel: model,
      setGridFunction: setPaginationModel,
      paginatedGridModel: paginationModel,
    })
  }

  /**
   * Handle sort model changes
   */
  const handleSortModelChange = (model: GridSortModel) => {
    if (model.length > 0) {
      const sortField = model[0].field
      const sortOrder = model[0].sort

      setPaginationModel((prev) => ({
        ...prev,
        columnName: sortField,
        condition: sortOrder === 'desc' ? 'desc' : 'asc',
      }))
    } else {
      setPaginationModel((prev) => ({
        ...prev,
        columnName: undefined,
        condition: undefined,
      }))
    }
  }

  /**
   * Handle include deleted checkbox change
   */
  const handleIncludeDeletedChange = (checked: boolean) => {
    setIncludeDeleted(checked)
    setPaginationModel((prev) => ({
      ...prev,
      includeDeleted: checked,
      start: 0,
    }))
  }

  /**
   * Handle custom pagination change
   */
  const handleCustomPaginationChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const start = (page - 1) * paginationModel.pageSize
    const end = start + paginationModel.pageSize

    setPaginationModel((prev) => ({
      ...prev,
      start,
      end,
    }))
  }

  /**
   * Get row class name for styling deleted rows
   */
  const getRowClassName = (params: any) => {
    const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
    if (params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted) {
      classes.push('deleted')
    }
    return classes.join(' ')
  }

  return (
    <Box className="purchase-orders-page">
      <Box className="purchase-orders-page__container">
        <Box className="purchase-orders-page__card">
          <StyledDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            rowCount={totalCount}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationMode="server"
            filterMode="server"
            sortingMode="server"
            density={density}
            paginationModel={{
              page: Math.floor(paginationModel.start / paginationModel.pageSize),
              pageSize: paginationModel.pageSize,
            }}
            onPaginationModelChange={handlePaginationModelChange}
            onFilterModelChange={handleFilterModelChange}
            onSortModelChange={handleSortModelChange}
            getRowId={(row) => row.purchaseOrderId || row.purchaseOrder?.purchaseOrderId}
            getRowClassName={getRowClassName}
            slots={{
              toolbar: SimpleToolbar,
              noRowsOverlay: CustomNoRowsOverlay,
            }}
            slotProps={{
              toolbar: {
                density,
                onDensityChange: handleDensityChange,
                columns,
                onFiltersChange: setActiveFilterGroup,
                activeFilterGroup,
                rows,
                includeDeleted,
                onIncludeDeletedChange: handleIncludeDeletedChange,
              },
            }}
            showToolbar
            disableRowSelectionOnClick
            disableColumnMenu={false}
            hideFooter
            initialState={{
              columns: {
                columnVisibilityModel: {
                  isDeleted: false,
                  purchaseOrderId: false,
                },
              },
            }}
          />

          <Box className="purchase-orders-page__pagination">
            <PaginationComponent
              totalItems={totalCount}
              currentPage={Math.floor(paginationModel.start / paginationModel.pageSize) + 1}
              pageSize={paginationModel.pageSize}
              onPageChange={handleCustomPaginationChange}
              itemLabel="purchase orders"
              data-test-id="purchase-orders-pagination"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default PurchaseOrders

