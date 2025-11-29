import { format } from 'date-fns'
import { toast } from 'react-toastify'

import { LocationOn } from '@mui/icons-material'
import { Link, Button, Box, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { purchaseOrderApi } from '../../api/purchaseOrderApi'
import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

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
    valueGetter: (value, row: unknown) => {
      const rowData = row as {
        address?: {
          city?: string
          state?: string
          streetAddress?: string
          streetAddress2?: string
          streetAddress3?: string
        }
      }
      const addr = rowData.address ?? {}
      const city = addr.city ?? ''
      const state = addr.state ?? ''

      if (city === '' && state === '') return '—'
      return `${city}${city !== '' && state !== '' ? ', ' : ''}${state}`.trim()
    },
    renderCell: (params: GridRenderCellParams) => {
      const rowData = params.row as {
        address?: {
          streetAddress?: string
          streetAddress2?: string
          streetAddress3?: string
        }
      }
      const addr = rowData.address ?? {}
      const streetAddress = addr.streetAddress ?? ''
      const streetAddress2 = addr.streetAddress2 ?? ''
      const streetAddress3 = addr.streetAddress3 ?? ''
      const city = addr.city || ''
      const state = addr.state || ''
      const postalCode = addr.postalCode || ''
      const country = addr.country || ''

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
    valueGetter: (value, row: any) => {
      const date = row.expectedDeliveryDate || row.expectedShipmentDate || row.purchaseOrder?.expectedDeliveryDate || row.purchaseOrder?.expectedShipmentDate
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
    valueGetter: (value, row: any) => row.vendorNumber || row.purchaseOrder?.vendorNumber || '—',
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
    valueGetter: (value, row: any) => row.purchaseOrderReceipt || row.orderReceipt || row.purchaseOrder?.purchaseOrderReceipt || row.purchaseOrder?.orderReceipt || '—',
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
    valueGetter: (value, row: any) => {
      const user = row.approvedByUser
      if (!user) return '—'
      return `${user.firstName || ''} ${user.lastName || ''} (${user.loginName || user.email || ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams) => {
      const user = params.row.approvedByUser
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
    valueGetter: (value, row: any) => {
      const date = row.approvedDate || row.purchaseOrder?.approvedDate
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
    valueGetter: (value, row: any) => {
      const user = row.rejectedByUser
      if (!user) return '—'
      return `${user.firstName || ''} ${user.lastName || ''} (${user.loginName || user.email || ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams) => {
      const user = params.row.rejectedByUser
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
    valueGetter: (value, row: any) => {
      const date = row.rejectedDate || row.purchaseOrder?.rejectedDate
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
    valueGetter: (value, row: any) => {
      const { lead } = row
      if (!lead) return '—'
      return `${lead.firstName || ''} ${lead.lastName || ''} (${lead.email || ''})`.trim()
    },
    renderCell: (params: GridRenderCellParams) => {
      const { lead } = params.row
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
    renderCell: (params: GridRenderCellParams) => {
      const isDeleted = params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted
      const isApproved = params.row.approvedByUser != null
      const isRejected = params.row.rejectedByUser != null
      const purchaseOrderId = params.row.purchaseOrderId || params.row.purchaseOrder?.purchaseOrderId

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
              onApprovePurchaseOrder(purchaseOrderId)
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
              onRejectPurchaseOrder(purchaseOrderId)
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
    renderCell: (params: GridRenderCellParams) => {
      const isDeleted = params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted
      const isApproved = params.row.approvedByUser != null
      const purchaseOrderId = params.row.purchaseOrderId || params.row.purchaseOrder?.purchaseOrderId

      if (isDeleted || !isApproved) {
        return null
      }

      const handleDownload = async () => {
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
          // eslint-disable-next-line no-console -- Error logging for PDF download failures
          console.error('Error downloading PDF:', error)
          const errorMessage =
            (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
            (error as { message?: string })?.message ??
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
    renderCell: (params: GridRenderCellParams) => {
      const purchaseOrderId = params.row.purchaseOrderId || params.row.purchaseOrder?.purchaseOrderId

      if (params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onTogglePurchaseOrder(purchaseOrderId)
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
              onTogglePurchaseOrder(purchaseOrderId)
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
