import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { Link, Tooltip, Chip, Box } from '@mui/material'
import { LocationOn as LocationIcon } from '@mui/icons-material'
import { APP_ROUTES } from '../constants/routes'
import { RenderLongCellItem } from '../components/DataGrid'

/**
 * Lead data structure from API
 */
export interface LeadData {
  lead: {
    leadId: number
    leadStatus: string
    firstName: string
    lastName: string
    email: string
    website: string
    phone: string
    company: string
    companySize: number
    annualRevenue: string
    title: string
    deleted: boolean
  }
  address: {
    streetAddress: string
    streetAddress2: string
    streetAddress3: string
    city: string
    state: string
    postalCode: string
  }
  assignedAgent: {
    firstName: string
    lastName: string
    loginName: string
  }
  createdBy: {
    firstName: string
    lastName: string
    loginName: string
  }
}

/**
 * Format phone number with () and -
 */
const formatPhone = (phone: string): string => {
  if (!phone || phone.length < 10) return phone
  return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
}

/**
 * Format currency with commas
 */
const formatCurrency = (value: string): string => {
  if (!value) return ''
  return '₹ ' + value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Get lead grid columns with action handlers
 */
export const getLeadGridColumns = (
  onToggleLead: (leadId: number) => void
): GridColDef[] => {
  return [
    {
      field: 'leadId',
      headerName: 'Lead ID',
      hideable: false,
      filterable: false,
      width: 0,
      minWidth: 0,
      valueGetter: (value, row: any) => row.leadId || row.lead?.leadId || '',
    },
    {
      field: 'leadStatus',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 140,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (value, row: any) => row.leadStatus || row.lead?.leadStatus || '',
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value
        let color: 'success' | 'warning' | 'error' | 'info' | 'default' = 'default'
        
        // Map status to colors
        if (status === 'Contacted' || status === 'Contact In Future' || status === 'Re Qualified') {
          color = 'success'
        } else if (status === 'Not Contacted') {
          color = 'warning'
        } else if (status === 'Lost Lead') {
          color = 'error'
        } else {
          color = 'info'
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
            <Chip
              label={status}
              color={color}
              size="small"
            />
          </Box>
        )
      },
    },
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      minWidth: 120,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.firstName || row.lead?.firstName || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'lastName',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 120,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.lastName || row.lead?.lastName || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.4,
      minWidth: 200,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.email || row.lead?.email || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      flex: 0.9,
      minWidth: 140,
      headerAlign: 'left',
      valueGetter: (value, row: any) => formatPhone(row.phone || row.lead?.phone || ''),
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'company',
      headerName: 'Company',
      flex: 1.1,
      minWidth: 150,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.company || row.lead?.company || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 130,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.title || row.lead?.title || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1.5,
      minWidth: 220,
      headerAlign: 'left',
      valueGetter: (value, row: LeadData) => {
        const addr = row.address
        if (!addr) return '—'
        
        // Only show city and state in the grid
        const parts = []
        if (addr.city) parts.push(addr.city)
        if (addr.state) parts.push(addr.state)
        
        return parts.length > 0 ? parts.join(', ') : '—'
      },
      renderCell: (params: GridRenderCellParams) => {
        const addr = params.row.address
        if (!addr) {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: '8px' }}>
              <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <span>—</span>
            </Box>
          )
        }

        // Build full address with all parts on separate lines
        const addressParts = []
        if (addr.streetAddress) addressParts.push(addr.streetAddress)
        if (addr.streetAddress2) addressParts.push(addr.streetAddress2)
        if (addr.streetAddress3) addressParts.push(addr.streetAddress3)
        
        const cityStateZip = []
        if (addr.city) cityStateZip.push(addr.city)
        if (addr.state) cityStateZip.push(addr.state)
        if (addr.postalCode) cityStateZip.push(addr.postalCode)
        
        if (cityStateZip.length > 0) {
          addressParts.push(cityStateZip.join(', '))
        }
        
        const fullAddress = addressParts.join('\n')
        const shortAddress = params.value

        return (
          <Tooltip title={<div style={{ whiteSpace: 'pre-line' }}>{fullAddress}</div>} placement="top">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                gap: '8px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <LocationIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shortAddress}
              </span>
            </Box>
          </Tooltip>
        )
      },
    },
    {
      field: 'companySize',
      headerName: 'Company Size',
      flex: 0.7,
      minWidth: 110,
      headerAlign: 'left',
      valueGetter: (value, row: any) => row.companySize || row.lead?.companySize || '',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'annualRevenue',
      headerName: 'Annual Revenue',
      flex: 0.9,
      minWidth: 150,
      headerAlign: 'left',
      valueGetter: (value, row: any) => formatCurrency(row.annualRevenue || row.lead?.annualRevenue || ''),
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {params.value}
        </Box>
      ),
    },
    {
      field: 'assignedAgent',
      headerName: 'Assigned To',
      flex: 1.2,
      minWidth: 180,
      headerAlign: 'left',
      valueGetter: (value, row: LeadData) => {
        const agent = row.assignedAgent
        if (!agent) return '—'
        return `${agent.firstName || ''} ${agent.lastName || ''} (${agent.loginName || ''})`.trim() || '—'
      },
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <RenderLongCellItem
            columnWidth={params.colDef.computedWidth}
            value={params.value}
          />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 220,
      flex: 1.2,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<LeadData>) => {
        if (params.row.isDeleted || params.row.lead?.deleted) {
          return (
            <div>
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  onToggleLead(params.row.leadId || params.row.lead?.leadId)
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
              href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${params.row.leadId || params.row.lead?.leadId}&isView`}
              sx={{ cursor: 'pointer' }}
            >
              View
            </Link>
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${params.row.leadId || params.row.lead?.leadId}`}
              sx={{ cursor: 'pointer' }}
            >
              Edit
            </Link>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault()
                onToggleLead(params.row.leadId || params.row.lead?.leadId)
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

