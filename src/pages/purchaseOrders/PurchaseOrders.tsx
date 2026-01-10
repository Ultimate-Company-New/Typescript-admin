import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Box } from '@mui/material'
import {
    type GridColumnVisibilityModel,
    type GridFilterModel,
    type GridPaginationModel,
    type GridSlotsComponent,
    type GridSortModel,
    type GridToolbarProps,
} from '@mui/x-data-grid'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { ConfirmDialog } from '../../components/dialogs/ConfirmDialog'
import { PaymentModal } from '../../components/dialogs/PaymentModal'
import {
    CustomNoRowsOverlay,
    GridDensity,
    LogicOperator,
    SimpleToolbar,
    StyledDataGrid,
    createFetchFunction,
    createToggleFunction,
    handleFilterModelChange,
    handleIncludeDeletedChange,
    handlePaginationModelChange,
    handleSortModelChange,
    type FilterGroup,
    type GridDensityType,
} from '../../components/datagrid'
import { getPurchaseOrderGridColumns, type ApprovePaymentData } from '../../models/grid-models/PurchaseOrderGridColumns'
import { type PaginatedGridInterface } from '../../types/grid.types'
import ProductModal from '../pickupLocations/components/ProductModal'
import ShipmentsModal from './components/ShipmentsModal'
import FinancialsModal from './components/FinancialsModal'
import PaymentsModal from './components/PaymentsModal'
import { type ShipmentResponseData, type OrderSummaryResponseData, type PaymentResponseModel } from '../../models/api-models'

import styles from '../../styles/PurchaseOrders.module.scss'

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

const PurchaseOrders = (): React.JSX.Element => {
  const [rows, setRows] = useState<PurchaseOrderData[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [density, setDensity] = useState<GridDensityType>(GridDensity.STANDARD)
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterGroup>({
    logicOperator: LogicOperator.AND,
    filters: [],
  })
  const [columnVisibilityModel, setColumnVisibilityModel] = useState<GridColumnVisibilityModel>({
    isDeleted: false,
    purchaseOrderId: true,
  })
  const [visibleColumnFields, setVisibleColumnFields] = useState<string[]>([])

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [selectedPurchaseOrderId, setSelectedPurchaseOrderId] = useState<number | undefined>()
  const [selectedProducts, setSelectedProducts] = useState<Array<{ productId: number; quantity: number; pricePerUnit?: number }>>([])

  // Shipments modal state
  const [shipmentsModalOpen, setShipmentsModalOpen] = useState(false)
  const [selectedShipments, setSelectedShipments] = useState<ShipmentResponseData[]>([])

  // Financials modal state
  const [financialsModalOpen, setFinancialsModalOpen] = useState(false)
  const [selectedOrderSummary, setSelectedOrderSummary] = useState<OrderSummaryResponseData | null>(null)
  const [selectedShipmentsCount, setSelectedShipmentsCount] = useState<number>(0)

  // Confirmation dialog state (for reject only)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmDialogPurchaseOrderId, setConfirmDialogPurchaseOrderId] = useState<number | null>(null)

  // Payment modal state (for approve with payment)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentModalData, setPaymentModalData] = useState<ApprovePaymentData | null>(null)

  // Payments history modal state
  const [paymentsModalOpen, setPaymentsModalOpen] = useState(false)
  const [selectedPayments, setSelectedPayments] = useState<PaymentResponseModel[]>([])
  const [paymentsGrandTotal, setPaymentsGrandTotal] = useState<number>(0)
  const [paymentsPendingAmount, setPaymentsPendingAmount] = useState<number>(0)
  const [paymentsPurchaseOrderId, setPaymentsPurchaseOrderId] = useState<number | undefined>()
  const [paymentsVendorNumber, setPaymentsVendorNumber] = useState<string>('')

  // Pagination model
  const [paginationModel, setPaginationModel] = useState<PaginatedGridInterface>({
    start: 0,
    end: 25,
    pageSize: 25,
    includeDeleted: false,
    actualDataCount: 0,
    totalPaginationBlockCount: 0,
  })

  // Handle products click
  const handleProductsClick = useCallback((purchaseOrderId: number, products: Array<{ productId: number; quantity: number; pricePerUnit?: number }>): void => {
    setSelectedPurchaseOrderId(purchaseOrderId)
    setSelectedProducts(products)
    setProductModalOpen(true)
  }, [])

  // Handle shipments click
  const handleShipmentsClick = useCallback((shipments: unknown[]): void => {
    // Convert unknown[] to ShipmentResponseData[]
    const typedShipments = shipments as ShipmentResponseData[]
    setSelectedShipments(typedShipments)
    setShipmentsModalOpen(true)
  }, [])

  const handleFinancialsClick = useCallback((orderSummary: unknown, shipmentsCount: number): void => {
    // Convert unknown to OrderSummaryResponseData
    const typedOrderSummary = orderSummary as OrderSummaryResponseData
    setSelectedOrderSummary(typedOrderSummary)
    setSelectedShipmentsCount(shipmentsCount)
    setFinancialsModalOpen(true)
  }, [])

  // Handle payments click
  const handlePaymentsClick = useCallback((payments: unknown[], grandTotal: number, pendingAmount: number, purchaseOrderId?: number, vendorNumber?: string): void => {
    // Convert unknown[] to PaymentResponseModel[]
    const typedPayments = payments as PaymentResponseModel[]
    setSelectedPayments(typedPayments)
    setPaymentsGrandTotal(grandTotal)
    setPaymentsPendingAmount(pendingAmount)
    setPaymentsPurchaseOrderId(purchaseOrderId)
    setPaymentsVendorNumber(vendorNumber || '')
    setPaymentsModalOpen(true)
  }, [])

  // Handle approve - opens payment modal
  const handleApproveClick = useCallback((data: ApprovePaymentData): void => {
    setPaymentModalData(data)
    setPaymentModalOpen(true)
  }, [])

  // Handle reject - opens confirmation dialog
  const handleRejectClick = useCallback((purchaseOrderId: number): void => {
    setConfirmDialogPurchaseOrderId(purchaseOrderId)
    setConfirmDialogOpen(true)
  }, [])

  // Handle payment success - refresh the grid
  const handlePaymentSuccess = useCallback(async (): Promise<void> => {
    await createFetchFunction(
      purchaseOrderApi.getPurchaseOrdersInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  // Close payment modal
  const handleClosePaymentModal = useCallback((): void => {
    setPaymentModalOpen(false)
    setPaymentModalData(null)
  }, [])

  // Execute reject after confirmation
  const handleConfirmReject = async (): Promise<void> => {
    if (!confirmDialogPurchaseOrderId) return

    await createToggleFunction(purchaseOrderApi.rejectPurchaseOrder, confirmDialogPurchaseOrderId, async () => {
      await createFetchFunction(
        purchaseOrderApi.getPurchaseOrdersInBatches,
        setLoading,
        setRows,
        setTotalCount,
        paginationModel,
        includeDeleted,
        activeFilterGroup,
      )
    })

    // Close dialog after action completes
    setConfirmDialogOpen(false)
    setConfirmDialogPurchaseOrderId(null)
  }

  const handleCloseDialog = (): void => {
    setConfirmDialogOpen(false)
    setConfirmDialogPurchaseOrderId(null)
  }

  // Get grid columns with action handlers
  const columns = useMemo(
    () =>
      getPurchaseOrderGridColumns(
        async (purchaseOrderId: number) => {
          await createToggleFunction(purchaseOrderApi.togglePurchaseOrder, purchaseOrderId, async () => {
            await createFetchFunction(
              purchaseOrderApi.getPurchaseOrdersInBatches,
              setLoading,
              setRows,
              setTotalCount,
              paginationModel,
              includeDeleted,
              activeFilterGroup,
            )
          })
        },
        handleApproveClick,
        handleRejectClick,
        handleProductsClick,
        handleShipmentsClick,
        handleFinancialsClick,
        handlePaymentsClick,
      ),
    [paginationModel, includeDeleted, activeFilterGroup, handleApproveClick, handleRejectClick, handleProductsClick, handleShipmentsClick, handleFinancialsClick, handlePaymentsClick],
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
    void createFetchFunction(
      purchaseOrderApi.getPurchaseOrdersInBatches,
      setLoading,
      setRows,
      setTotalCount,
      paginationModel,
      includeDeleted,
      activeFilterGroup,
    )
  }, [paginationModel, includeDeleted, activeFilterGroup])

  return (
    <Box className={styles['purchase-orders-page']}>
      <Box className={styles['purchase-orders-page__container']}>
        <Box className={styles['purchase-orders-page__card']} data-test-id="purchase-orders-grid-card">
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
            density={density}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={model => {
              setColumnVisibilityModel(model)
            }}
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
            getRowId={row => {
              const rowData = row as PurchaseOrderData
              return rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId ?? 0
            }}
            getRowClassName={params => {
              const classes = [
                (params as { indexRelativeToCurrentPage: number }).indexRelativeToCurrentPage % 2 === 0
                  ? 'even'
                  : 'odd',
              ]
              const rowData = params.row as PurchaseOrderData
              if (rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted) {
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

      {/* Product Modal */}
      <ProductModal
        open={productModalOpen}
        onClose={() => {
          setProductModalOpen(false)
          setSelectedPurchaseOrderId(undefined)
          setSelectedProducts([])
        }}
        purchaseOrderProducts={selectedProducts}
        purchaseOrderId={selectedPurchaseOrderId}
      />

      {/* Shipments Modal */}
      <ShipmentsModal
        open={shipmentsModalOpen}
        onClose={() => {
          setShipmentsModalOpen(false)
          setSelectedShipments([])
        }}
        shipments={selectedShipments}
      />

      {/* Financials Modal */}
      {selectedOrderSummary && (
        <FinancialsModal
          open={financialsModalOpen}
          onClose={() => {
            setFinancialsModalOpen(false)
            setSelectedOrderSummary(null)
            setSelectedShipmentsCount(0)
          }}
          orderSummary={selectedOrderSummary}
          shipmentsCount={selectedShipmentsCount}
        />
      )}

      {/* Payment Modal (for Approve with Payment) */}
      {paymentModalData && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={handleClosePaymentModal}
          purchaseOrderId={paymentModalData.purchaseOrderId}
          vendorNumber={paymentModalData.vendorNumber}
          grandTotal={paymentModalData.grandTotal}
          pendingAmount={paymentModalData.pendingAmount}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Payments History Modal */}
      <PaymentsModal
        open={paymentsModalOpen}
        onClose={() => {
          setPaymentsModalOpen(false)
          setSelectedPayments([])
          setPaymentsGrandTotal(0)
          setPaymentsPendingAmount(0)
          setPaymentsPurchaseOrderId(undefined)
          setPaymentsVendorNumber('')
        }}
        payments={selectedPayments}
        grandTotal={paymentsGrandTotal}
        pendingAmount={paymentsPendingAmount}
        purchaseOrderId={paymentsPurchaseOrderId}
        vendorNumber={paymentsVendorNumber}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Confirmation Dialog (for Reject only) */}
      {confirmDialogPurchaseOrderId && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onClose={handleCloseDialog}
          title="Reject Purchase Order"
          message={
            <>
              Are you sure you want to reject Purchase Order{' '}
              <strong>#{confirmDialogPurchaseOrderId}</strong>?
              <br />
              This action cannot be undone.
            </>
          }
          confirmLabel="Reject"
          confirmColor="error"
          onConfirm={handleConfirmReject}
        />
      )}
    </Box>
  )
}

export default PurchaseOrders
