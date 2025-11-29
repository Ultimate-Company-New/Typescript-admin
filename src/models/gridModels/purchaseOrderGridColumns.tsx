import { format } from 'date-fns'
import { toast } from 'react-toastify'

import { LocationOn } from '@mui/icons-material'
import { Link, Button, Box, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

/**
 * Purchase Order data structure matching API response
 */
export interface PurchaseOrderData {
  purchaseOrderId?: number
  purchaseOrder?: {
    purchaseOrderId: number
    deleted?: boolean
    expectedDeliveryDate?: string
    expectedShipmentDate?: string
    vendorNumber?: string
    purchaseOrderReceipt?: string
    orderReceipt?: string
    approvedDate?: string
    rejectedDate?: string
  }
  expectedDeliveryDate?: string
  expectedShipmentDate?: string
  vendorNumber?: string
  purchaseOrderReceipt?: string
  orderReceipt?: string
  approvedDate?: string
  rejectedDate?: string
  isDeleted?: boolean
  deleted?: boolean
  approvedByUser?: {
    userId: number
    firstName?: string
    lastName?: string
    loginName?: string
    email?: string
  }
  rejectedByUser?: {
    userId: number
    firstName?: string
    lastName?: string
    loginName?: string
    email?: string
  }
  lead?: {
    leadId: number
    firstName?: string
    lastName?: string
    email?: string
  }
  address?: {
    city?: string
    state?: string
    streetAddress?: string
    streetAddress2?: string
    streetAddress3?: string
    postalCode?: string
    country?: string
  }
}

/**
 * Get purchase order grid columns with action handlers
 */
export const getPurchaseOrderGridColumns = (
  onTogglePurchaseOrder: (purchaseOrderId: number) => void,
  onApprovePurchaseOrder: (purchaseOrderId: number) => void,
  onRejectPurchaseOrder: (purchaseOrderId: number) => void,
): GridColDef[] => [
  {
    field: 'purchaseOrderId',
    headerName: 'PO ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'address',
    headerName: 'Address',
    flex: 1.5,
    minWidth: 180,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const addr = rowData.address ?? {}
      const city = addr.city ?? ''
      const state = addr.state ?? ''

      if (city === '' && state === '') return '—'
      return `${city}${city !== '' && state !== '' ? ', ' : ''}${state}`.trim()
    },
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const addr = rowData.address ?? {}
      const streetAddress = addr.streetAddress ?? ''
      const streetAddress2 = addr.streetAddress2 ?? ''
      const streetAddress3 = addr.streetAddress3 ?? ''
      const city = addr.city ?? ''
      const state = addr.state ?? ''
      const postalCode = addr.postalCode ?? ''
      const country = addr.country ?? ''

      const fullAddress = [
        streetAddress,
        streetAddress2,
        streetAddress3,
        city,
        state,
        postalCode,
        country,
      ]
        .filter(Boolean)
        .join('\n')

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          height: '100%',
          gap: 1 }}>
          <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{fullAddress || 'No address'}</div>} arrow>
            <Box sx={{ display: 'flex',
              alignItems: 'center',
              gap: 0.5 }}>
              <LocationOn fontSize="small" />
              {params.value}
            </Box>
          </Tooltip>
        </Box>
      )
    },
  },
  {
    field: 'expectedShipmentDate',
    headerName: 'Expected Shipment',
    flex: 1,
    minWidth: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const date =
        rowData.expectedDeliveryDate ??
        rowData.expectedShipmentDate ??
        rowData.purchaseOrder?.expectedDeliveryDate ??
        rowData.purchaseOrder?.expectedShipmentDate
      if (!date) return '—'
      try {
        return format(new Date(date), 'do MMM yyyy')
      } catch {
        return '—'
      }
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'vendorNumber',
    headerName: 'Vendor Number',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      return rowData.vendorNumber ?? rowData.purchaseOrder?.vendorNumber ?? '—'
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'orderReceipt',
    headerName: 'Order Receipt',
    flex: 1.5,
    minWidth: 200,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      return (
        rowData.purchaseOrderReceipt ??
        rowData.orderReceipt ??
        rowData.purchaseOrder?.purchaseOrderReceipt ??
        rowData.purchaseOrder?.orderReceipt ??
        '—'
      )
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        <RenderLongCellItem
          columnWidth={params.colDef.computedWidth}
          value={String(params.value || '—')}
        />
      </Box>
    ),
  },
  {
    field: 'approvedBy',
    headerName: 'Approved By',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const user = rowData.approvedByUser
      if (!user) return '—'
      return `${user.firstName ?? ''} ${user.lastName ?? ''} (${user.loginName ?? user.email ?? ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const user = rowData.approvedByUser
      const userId = user?.userId

      if (!user || !userId) {
        return (
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            height: '100%' }}>
              —
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          height: '100%' }}>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_EDIT_USER}?userId=${userId}&isView`}
            sx={{ cursor: 'pointer',
              textDecoration: 'none' }}
          >
            {params.value}
          </Link>
        </Box>
      )
    },
  },
  {
    field: 'approvedDate',
    headerName: 'Approved Date',
    flex: 1,
    minWidth: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const date = rowData.approvedDate ?? rowData.purchaseOrder?.approvedDate
      if (!date) return '—'
      try {
        return format(new Date(date), 'do MMM yyyy')
      } catch {
        return '—'
      }
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'rejectedBy',
    headerName: 'Rejected By',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const user = rowData.rejectedByUser
      if (!user) return '—'
      return `${user.firstName ?? ''} ${user.lastName ?? ''} (${user.loginName ?? user.email ?? ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const user = rowData.rejectedByUser
      const userId = user?.userId

      if (!user || !userId) {
        return (
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            height: '100%' }}>
              —
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          height: '100%' }}>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_EDIT_USER}?userId=${userId}&isView`}
            sx={{ cursor: 'pointer',
              textDecoration: 'none' }}
          >
            {params.value}
          </Link>
        </Box>
      )
    },
  },
  {
    field: 'rejectedDate',
    headerName: 'Rejected Date',
    flex: 1,
    minWidth: 150,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const date = rowData.rejectedDate ?? rowData.purchaseOrder?.rejectedDate
      if (!date) return '—'
      try {
        return format(new Date(date), 'do MMM yyyy')
      } catch {
        return '—'
      }
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        height: '100%' }}>
        {params.value}
      </Box>
    ),
  },
  {
    field: 'assignedLead',
    headerName: 'Assigned Lead',
    flex: 1.5,
    minWidth: 220,
    align: 'left',
    headerAlign: 'left',
    valueGetter: (value, row: PurchaseOrderData) => {
      const rowData = row
      const { lead } = rowData
      if (!lead) return '—'
      return `${lead.firstName ?? ''} ${lead.lastName ?? ''} (${lead.email ?? ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const { lead } = rowData
      const leadId = lead?.leadId

      if (!lead || !leadId) {
        return (
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            height: '100%' }}>
              —
          </Box>
        )
      }

      return (
        <Box sx={{ display: 'flex',
          alignItems: 'center',
          height: '100%' }}>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${leadId}&isView`}
            sx={{ cursor: 'pointer',
              textDecoration: 'none' }}
          >
            {params.value}
          </Link>
        </Box>
      )
    },
  },
  {
    field: 'approveReject',
    headerName: 'Approve/Reject',
    flex: 1.2,
    minWidth: 220,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const isDeleted = Boolean(rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted)
      const isApproved = rowData.approvedByUser != null
      const isRejected = rowData.rejectedByUser != null
      const purchaseOrderId = rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId

      // Don't show buttons if deleted, already approved, or already rejected
      if (isDeleted || isApproved || isRejected) {
        return null
      }

      return (
        <Box sx={{ display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          px: 1 }}>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => {
              if (purchaseOrderId != null) {
                onApprovePurchaseOrder(purchaseOrderId)
              }
            }}
            sx={{
              minWidth: '80px',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
              Approve
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => {
              if (purchaseOrderId != null) {
                onRejectPurchaseOrder(purchaseOrderId)
              }
            }}
            sx={{
              minWidth: '80px',
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
              Reject
          </Button>
        </Box>
      )
    },
  },
  {
    field: 'downloadPDF',
    headerName: 'Download PDF',
    flex: 1,
    minWidth: 180,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const isDeleted = Boolean(rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted)
      const isApproved = rowData.approvedByUser != null
      const purchaseOrderId = rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId

      if (isDeleted || !isApproved) {
        return null
      }

      const handleDownload = async (): Promise<void> => {
        if (purchaseOrderId == null) return
        try {
          toast.info('Downloading PDF...')
          const blob = await purchaseOrderApi.downloadPurchaseOrderPdf(purchaseOrderId)
          const downloadUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = downloadUrl
          link.download = `PurchaseOrder_${purchaseOrderId}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(downloadUrl)
          toast.success('PDF downloaded successfully!')
        } catch (error: unknown) {
          const errorMessage =
            (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ??
            (error as { message?: string }).message ??
            'Failed to download PDF. Please check your permissions.'
          toast.error(errorMessage)
        }
      }

      return (
        <Button
          variant="outlined"
          size="small"
          onClick={handleDownload}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Download PDF
        </Button>
      )
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 1,
    minWidth: 180,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<PurchaseOrderData>) => {
      const rowData = params.row
      const purchaseOrderId = rowData.purchaseOrderId ?? rowData.purchaseOrder?.purchaseOrderId

      if (rowData.isDeleted ?? rowData.deleted ?? rowData.purchaseOrder?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                if (purchaseOrderId != null) {
                  onTogglePurchaseOrder(purchaseOrderId)
                }
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
            href={`${APP_ROUTES.DASHBOARD.ADD_PURCHASE_ORDER}?purchaseOrderId=${purchaseOrderId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
            View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_PURCHASE_ORDER}?purchaseOrderId=${purchaseOrderId}`}
            sx={{ cursor: 'pointer' }}
          >
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              if (purchaseOrderId != null) {
                onTogglePurchaseOrder(purchaseOrderId)
              }
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
