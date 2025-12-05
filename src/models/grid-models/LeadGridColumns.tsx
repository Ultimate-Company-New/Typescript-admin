import { LocationOn as LocationIcon } from '@mui/icons-material'
import { Box, Chip, Link, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { RenderLongCellItem } from '../../components/datagrid'
import { APP_ROUTES } from '../../constants/routes'

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
  isDeleted?: boolean
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
  return `₹ ${value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
}

/**
 * Get lead grid columns with action handlers
 */
export const getLeadGridColumns = (onToggleLead: (leadId: number) => void): GridColDef[] => [
  {
    field: 'leadId',
    headerName: 'Lead ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { leadId?: number }
      return rowData.leadId ?? rowData.lead.leadId
    },
  },
  {
    field: 'leadStatus',
    headerName: 'Status',
    flex: 0.8,
    minWidth: 140,
    align: 'center',
    headerAlign: 'center',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { leadStatus?: string }
      return rowData.leadStatus ?? rowData.lead.leadStatus
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => {
      const status = params.value as string
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
        <Box sx={{ display: 'flex',
alignItems: 'center',
justifyContent: 'center',
height: '100%',
width: '100%' }}>
          <Chip label={status} color={color} size="small" />
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
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { firstName?: string }
      return rowData.firstName ?? rowData.lead.firstName
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'lastName',
    headerName: 'Last Name',
    flex: 1,
    minWidth: 120,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { lastName?: string }
      return rowData.lastName ?? rowData.lead.lastName
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'email',
    headerName: 'Email',
    flex: 1.4,
    minWidth: 200,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { email?: string }
      return rowData.email ?? rowData.lead.email
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'phone',
    headerName: 'Phone',
    flex: 0.9,
    minWidth: 140,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { phone?: string }
      return formatPhone(rowData.phone ?? rowData.lead.phone)
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value as string}</Box>
    ),
  },
  {
    field: 'company',
    headerName: 'Company',
    flex: 1.1,
    minWidth: 150,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { company?: string }
      return rowData.company ?? rowData.lead.company
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'title',
    headerName: 'Title',
    flex: 1,
    minWidth: 130,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { title?: string }
      return rowData.title ?? rowData.lead.title
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'address',
    headerName: 'Address',
    flex: 1.5,
    minWidth: 220,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const addr = row.address
      // Only show city and state in the grid
      const parts: string[] = []
      if (addr.city) parts.push(addr.city)
      if (addr.state) parts.push(addr.state)

      return parts.length > 0 ? parts.join(', ') : '—'
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => {
      const rowData = params.row
      const addr = rowData.address

      // Build full address with all parts on separate lines
      const addressParts: string[] = []
      if (addr.streetAddress) addressParts.push(addr.streetAddress)
      if (addr.streetAddress2) addressParts.push(addr.streetAddress2)
      if (addr.streetAddress3) addressParts.push(addr.streetAddress3)

      const cityStateZip: string[] = []
      if (addr.city) cityStateZip.push(addr.city)
      if (addr.state) cityStateZip.push(addr.state)
      if (addr.postalCode) cityStateZip.push(addr.postalCode)

      if (cityStateZip.length > 0) {
        addressParts.push(cityStateZip.join(', '))
      }

      const fullAddress = addressParts.join('\n')
      const shortAddress = params.value as string

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
            <LocationIcon sx={{ fontSize: 18,
color: 'text.secondary',
flexShrink: 0 }} />
            <span style={{ overflow: 'hidden',
textOverflow: 'ellipsis',
whiteSpace: 'nowrap' }}>{shortAddress}</span>
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
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { companySize?: number }
      return rowData.companySize ?? rowData.lead.companySize
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value as number}</Box>
    ),
  },
  {
    field: 'annualRevenue',
    headerName: 'Annual Revenue',
    flex: 0.9,
    minWidth: 150,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const rowData = row as LeadData & { annualRevenue?: string }
      return formatCurrency(rowData.annualRevenue ?? rowData.lead.annualRevenue)
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>{params.value as string}</Box>
    ),
  },
  {
    field: 'assignedAgent',
    headerName: 'Assigned To',
    flex: 1.2,
    minWidth: 180,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const agent = row.assignedAgent
      return `${agent.firstName} ${agent.lastName} (${agent.loginName})`.trim() || '—'
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex',
alignItems: 'center',
height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
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
    renderCell: (params: GridRenderCellParams<LeadData & { leadId?: number; isDeleted?: boolean }>) => {
      const rowData = params.row as LeadData & { leadId?: number; isDeleted?: boolean }
      const resolvedLeadId = rowData.leadId ?? rowData.lead.leadId
      const isDeleted = Boolean(rowData.isDeleted ?? rowData.lead.deleted)

      if (isDeleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onToggleLead(resolvedLeadId)
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
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${resolvedLeadId}&isView`} sx={{ cursor: 'pointer' }}>
            View
          </Link>
          <Link href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${resolvedLeadId}`} sx={{ cursor: 'pointer' }}>
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onToggleLead(resolvedLeadId)
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
