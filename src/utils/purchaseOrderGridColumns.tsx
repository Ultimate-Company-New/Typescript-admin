import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Link, Button, Box, Tooltip } from '@mui/material'
import { LocationOn } from '@mui/icons-material'
import { APP_ROUTES } from '../constants/routes'
import { RenderLongCellItem } from '../components/DataGrid'
import { format } from 'date-fns'
import { purchaseOrderApi } from '../api/purchaseOrderApi'

/**
 * Get purchase order grid columns with action handlers
 */
export const getPurchaseOrderGridColumns = (
  onTogglePurchaseOrder: (purchaseOrderId: number) => void,
  onApprovePurchaseOrder: (purchaseOrderId: number) => void,
  onRejectPurchaseOrder: (purchaseOrderId: number) => void
): GridColDef[] => {
  return [
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
      valueGetter: (value, row: any) => {
        const addr = row.address || {}
        const city = addr.city || ''
        const state = addr.state || ''
        
        if (!city && !state) return '—'
        return `${city}${city && state ? ', ' : ''}${state}`.trim()
      },
      renderCell: (params: GridRenderCellParams) => {
        const addr = params.row.address || {}
        const streetAddress = addr.streetAddress || ''
        const streetAddress2 = addr.streetAddress2 || ''
        const streetAddress3 = addr.streetAddress3 || ''
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
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 1 }}>
            <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{fullAddress || 'No address'}</div>} arrow>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
      width: 180,
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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
      valueGetter: (value, row: any) => {
        return row.vendorNumber || row.purchaseOrder?.vendorNumber || '—'
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
      valueGetter: (value, row: any) => {
        return row.purchaseOrderReceipt || row.orderReceipt || row.purchaseOrder?.purchaseOrderReceipt || row.purchaseOrder?.orderReceipt || '—'
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              —
            </Box>
          )
        }
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_EDIT_USER}?userId=${userId}&isView`}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
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
      width: 180,
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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              —
            </Box>
          )
        }
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_EDIT_USER}?userId=${userId}&isView`}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
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
      width: 180,
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
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
        const lead = row.lead
        if (!lead) return '—'
        return `${lead.firstName || ''} ${lead.lastName || ''} (${lead.email || ''})`.trim()
      },
      renderCell: (params: GridRenderCellParams) => {
        const lead = params.row.lead
        const leadId = lead?.leadId
        
        if (!lead || !leadId) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              —
            </Box>
          )
        }
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${leadId}&isView`}
              sx={{ cursor: 'pointer', textDecoration: 'none' }}
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
      width: 220,
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', width: '100%', px: 1 }}>
            <Button
              variant="contained"
              size="small"
              color="success"
              onClick={() => onApprovePurchaseOrder(purchaseOrderId)}
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
              onClick={() => onRejectPurchaseOrder(purchaseOrderId)}
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
    width: 180,
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

      return (
        <Button
          variant="outlined"
          size="small"
          component="a"
          href={purchaseOrderApi.getPurchaseOrderPdfUrl(purchaseOrderId)}
          target="_blank"
          rel="noopener noreferrer"
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
    width: 200,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const purchaseOrderId = params.row.purchaseOrderId || params.row.purchaseOrder?.purchaseOrderId
      
      if (params.row.isDeleted || params.row.deleted || params.row.purchaseOrder?.deleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onTogglePurchaseOrder(purchaseOrderId)
              }}
              sx={{ cursor: 'pointer', color: 'success.main' }}
            >
              Activate
            </Link>
          </div>
        )
      }

      return (
        <div style={{ display: 'flex', gap: '12px' }}>
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
            onClick={(e) => {
              e.preventDefault()
              onTogglePurchaseOrder(purchaseOrderId)
            }}
            sx={{ cursor: 'pointer', color: 'error.main' }}
          >
            Deactivate
          </Link>
        </div>
      )
    },
  },
  ]
}

