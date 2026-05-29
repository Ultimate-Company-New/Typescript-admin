import { Box, Chip, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { AddressCell, RenderLongCellItem } from '../../components/datagrid'
import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import { type AddressResponseModel } from '../../models/api-models/AddressModels'

/**
 * Lead Actions Component - handles permission-based action visibility
 */
const LeadActionsCell = ({
  leadId,
  isDeleted,
  onToggleLead,
}: {
  leadId: number
  isDeleted: boolean
  onToggleLead?: (leadId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  // Check permissions using PERMISSIONS constants
  const canViewLead = hasPermission(PERMISSIONS.VIEW_LEADS)
  const canUpdateLead = hasPermission(PERMISSIONS.UPDATE_LEADS)
  const canToggleLead = hasPermission(PERMISSIONS.TOGGLE_LEADS)

  if (isDeleted) {
    // Only show Activate if user has toggle permission
    if (!canToggleLead) {
      return <span>—</span>
    }

    return (
      <div>
        <Link
          href="#"
          data-test-id="lead-action-activate"
          onClick={e => {
            e.preventDefault()
            if (onToggleLead) {
              onToggleLead(leadId)
            }
          }}
          sx={{
            cursor: 'pointer',
            color: 'success.main',
          }}
        >
          Activate
        </Link>
      </div>
    )
  }

  // Build actions based on permissions
  const actions: JSX.Element[] = []

  if (canViewLead) {
    actions.push(
      <Link
        key="view"
        href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${leadId}&isView`}
        data-test-id="lead-action-view"
        sx={{ cursor: 'pointer' }}
      >
        View
      </Link>,
    )
  }

  if (canUpdateLead) {
    actions.push(
      <Link
        key="edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_LEAD}?leadId=${leadId}`}
        data-test-id="lead-action-edit"
        sx={{ cursor: 'pointer' }}
      >
        Edit
      </Link>,
    )
  }

  if (canToggleLead) {
    actions.push(
      <Link
        key="deactivate"
        href="#"
        data-test-id="lead-action-toggle"
        onClick={e => {
          e.preventDefault()
          if (onToggleLead) {
            onToggleLead(leadId)
          }
        }}
        sx={{
          cursor: 'pointer',
          color: 'error.main',
        }}
      >
        Deactivate
      </Link>,
    )
  }

  // If no permissions, show empty cell
  if (actions.length === 0) {
    return <span>—</span>
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
      }}
    >
      {actions}
    </div>
  )
}

/**
 * Lead data structure from API (flat structure from LeadResponseModel)
 */
export interface LeadData {
  // Lead fields (flat structure from API)
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
  fax?: string
  notes?: string
  isDeleted: boolean

  // Related entities
  address?: AddressResponseModel | null
  assignedAgent?: {
    userId: number
    firstName: string
    lastName: string
    loginName: string
  }
  createdByUser?: {
    userId: number
    firstName: string
    lastName: string
    loginName: string
  }

  // Computed fields from backend
  fullName?: string
  displayName?: string
  statusColor?: string
  isAssigned?: boolean
  isActive?: boolean
  daysOld?: number
  companySizeDisplay?: string
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
    valueGetter: (_value, row: LeadData) => row.leadId,
  },
  {
    field: 'leadStatus',
    headerName: 'Status',
    flex: 0.8,
    minWidth: 140,
    align: 'center',
    headerAlign: 'center',
    valueGetter: (_value, row: LeadData) => row.leadStatus,
    renderCell: (params: GridRenderCellParams<LeadData>) => {
      const status = params.value as string

      // Unique color mapping for each lead status
      const statusColorMap: Record<string, { bg: string; text: string }> = {
        'Not Contacted': { bg: '#9E9E9E', text: '#FFFFFF' }, // Gray - New/untouched
        'Attempted To Contact': { bg: '#FF9800', text: '#FFFFFF' }, // Orange - In progress
        'Contacted': { bg: '#4CAF50', text: '#FFFFFF' }, // Green - Success
        'Contact In Future': { bg: '#2196F3', text: '#FFFFFF' }, // Blue - Scheduled
        'Re Qualified': { bg: '#9C27B0', text: '#FFFFFF' }, // Purple - Re-entered funnel
        'Not Qualified': { bg: '#795548', text: '#FFFFFF' }, // Brown - Doesn't meet criteria
        'Lost Lead': { bg: '#F44336', text: '#FFFFFF' }, // Red - Lost opportunity
        'Junk Lead': { bg: '#424242', text: '#FFFFFF' }, // Dark gray - Invalid/spam
      }

      const colors = statusColorMap[status] ?? { bg: '#757575', text: '#FFFFFF' }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: '100%',
          }}
        >
          <Chip
            label={status}
            size="small"
            data-test-id="lead-status-label"
            sx={{
              backgroundColor: colors.bg,
              color: colors.text,
              fontWeight: 500,
            }}
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
    valueGetter: (_value, row: LeadData) => row.firstName,
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
    valueGetter: (_value, row: LeadData) => row.lastName,
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
    valueGetter: (_value, row: LeadData) => row.email,
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
    valueGetter: (_value, row: LeadData) => formatPhone(row.phone),
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>{params.value as string}</Box>
    ),
  },
  {
    field: 'company',
    headerName: 'Company',
    flex: 1.1,
    minWidth: 150,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => row.company ?? '',
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
    valueGetter: (_value, row: LeadData) => row.title ?? '',
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
      if (!addr) return '—'
      const parts: string[] = []
      if (addr.city) parts.push(addr.city)
      if (addr.state) parts.push(addr.state)
      return parts.length > 0 ? parts.join(', ') : '—'
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <AddressCell
        addresses={params.row.address ? [params.row.address] : []}
        testId="lead-address-cell"
      />
    ),
  },
  {
    field: 'companySize',
    headerName: 'Company Size',
    flex: 0.7,
    minWidth: 110,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => row.companySize ?? '',
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>{params.value as number}</Box>
    ),
  },
  {
    field: 'annualRevenue',
    headerName: 'Annual Revenue',
    flex: 0.9,
    minWidth: 150,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => formatCurrency(row.annualRevenue ?? ''),
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>{params.value as string}</Box>
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
      if (!agent) return '—'
      return `${agent.firstName} ${agent.lastName} (${agent.loginName})`.trim() || '—'
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <RenderLongCellItem value={params.value as string} />
      </Box>
    ),
  },
  {
    field: 'createdBy',
    headerName: 'Created By',
    flex: 1.2,
    minWidth: 180,
    headerAlign: 'left',
    valueGetter: (_value, row: LeadData) => {
      const creator = row.createdByUser
      if (!creator) return '—'
      return `${creator.firstName} ${creator.lastName} (${creator.loginName})`.trim() || '—'
    },
    renderCell: (params: GridRenderCellParams<LeadData>) => (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
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
    renderCell: (params: GridRenderCellParams<LeadData>) => {
      const rowData = params.row
      return <LeadActionsCell leadId={rowData.leadId} isDeleted={rowData.isDeleted} onToggleLead={onToggleLead} />
    },
  },
]

/**
 * Export the LeadActionsCell for potential reuse
 */
export { LeadActionsCell }
