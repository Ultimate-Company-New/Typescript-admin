import { format } from 'date-fns'

import { Link, Chip, Box, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { APP_ROUTES } from '../../constants/routes'

/**
 * Message data structure matching API response
 */
export interface MessageData {
  messageId: number
  title?: string
  descriptionHtml?: string
  publishDate?: string
  sendAsEmail?: boolean
  userIds?: number[]
  userGroupIds?: number[]
  createdAt?: string
  createdByUser?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  isDeleted?: boolean
}

/**
 * Helper function to strip HTML tags from a string
 */
const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || ''
}

/**
 * Helper function to check if a date is in the future or today
 */
const isDateGreaterThanOrEqualToToday = (dateString: string): boolean => {
  try {
    const date = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  } catch {
    return false
  }
}

/**
 * Message grid columns configuration
 * Columns are arranged from left to right in order of relevance:
 * 1. Message ID - Identifier (hidden by default)
 * 2. Title - Primary content
 * 3. Description - Message content preview
 * 4. Publish Date - When message is/was published
 * 5. Send As Email - Email flag
 * 6. Intended Users Count - Targeting info
 * 7. Intended User Groups Count - Targeting info
 * 8. Actions - Operations
 */
export const getMessageGridColumns = (onToggleMessage?: (messageId: number) => void): GridColDef[] => [
  // Hidden columns for internal use
  {
    field: 'isDeleted',
    headerName: 'IsDeleted',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'messageId',
    headerName: 'Message ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },

  // 1. Title - Primary content
  {
    field: 'title',
    headerName: 'Title',
    minWidth: 200,
    flex: 2,
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as string | undefined
      return (
        <Tooltip title={value ?? ''}>
          <Box
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {value ?? '—'}
          </Box>
        </Tooltip>
      )
    },
  },

  // 2. Message - Message content preview
  {
    field: 'descriptionHtml',
    headerName: 'Message',
    minWidth: 300,
    flex: 3,
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as string | undefined
      const plainText = stripHtml(value ?? '')
      const preview = plainText.length > 100 ? `${plainText.substring(0, 100)}...` : plainText

      return (
        <Tooltip title={plainText}>
          <Box sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}>
            {preview || '—'}
          </Box>
        </Tooltip>
      )
    },
  },

  // 3. Publish Date - When message is/was published
  {
    field: 'publishDate',
    headerName: 'Publish Date',
    minWidth: 150,
    flex: 1,
    valueFormatter: (value: unknown) => {
      if (!value || typeof value !== 'string') return '—'
      try {
        return format(new Date(value), 'do MMM yyyy')
      } catch {
        return String(value)
      }
    },
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      }}>
        {params.formattedValue || '—'}
      </Box>
    ),
  },

  // 4. Send As Email - Email flag
  {
    field: 'sendAsEmail',
    headerName: 'Send As Email',
    minWidth: 140,
    flex: 0.8,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value ? 'Yes' : 'No'
      const color = params.value ? 'success' : 'default'

      return (
        <Chip
          label={value}
          color={color}
          size="small"
        />
      )
    },
  },

  // 5. Intended Users Count - Targeting info
  {
    field: 'totalRecipients',
    headerName: 'Intended Users',
    minWidth: 140,
    flex: 0.8,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row: { userIds?: number[] }) =>
      // Calculate from userIds array length
      row.userIds?.length ?? 0,
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        {params.value || 0}
      </Box>
    ),
  },

  // 6. Intended User Groups Count - Targeting info
  {
    field: 'totalUserGroups',
    headerName: 'Intended Groups',
    minWidth: 140,
    flex: 0.8,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row: MessageData) =>
      // Calculate from userGroupIds array length
      row.userGroupIds?.length ?? 0,
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        {params.value || 0}
      </Box>
    ),
  },

  // 7. Created By - User who created the message
  {
    field: 'createdByUser',
    headerName: 'Created By',
    minWidth: 250,
    flex: 1.8,
    sortable: false,
    valueGetter: (_value, row: MessageData) => {
      const user = row.createdByUser
      if (!user) return '—'
      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      const email = user.email ?? ''
      return name ? `${name} (${email})` : email || '—'
    },
    renderCell: (params: GridRenderCellParams<MessageData>) => {
      const rowData = params.row
      const user = rowData.createdByUser
      if (!user) {
        return (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
          }}>
            —
          </Box>
        )
      }

      const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
      const email = user.email ?? ''
      const displayText = name ? name : email || 'N/A'

      return (
        <Tooltip
          title={
            <Box sx={{ whiteSpace: 'pre-line' }}>
              <div><strong>Name:</strong> {name || 'N/A'}</div>
              <div><strong>Email:</strong> {email || 'N/A'}</div>
            </Box>
          }
          arrow
        >
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
          }}>
            <Box sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}>
              <span style={{ fontWeight: 500 }}>{displayText}</span>
              {name && email && (
                <span style={{ fontSize: '0.85rem',
                  color: '#666',
                  marginLeft: '4px' }}>
                  ({email})
                </span>
              )}
            </Box>
          </Box>
        </Tooltip>
      )
    },
  },

  // 8. Created Date/Time
  {
    field: 'createdAt',
    headerName: 'Created',
    minWidth: 200,
    flex: 1.2,
    valueFormatter: (value: unknown) => {
      if (!value || typeof value !== 'string') return '—'
      try {
        const date = new Date(value)
        const day = date.getDate()
        const month = date.toLocaleString('default', { month: 'long' })
        const year = date.getFullYear()
        const time = date.toLocaleString('default', { hour: 'numeric',
          minute: '2-digit',
          hour12: true })

        // Add ordinal suffix
        const suffix = (day: number): string => {
          if (day > 3 && day < 21) return 'th'
          switch (day % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
          }
        }

        return `${day}${suffix(day)} ${month} ${year} ${time}`
      } catch {
        return String(value)
      }
    },
    renderCell: (params: GridRenderCellParams<MessageData>) => (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
      }}>
        {params.formattedValue || '—'}
      </Box>
    ),
  },

  // 8. Actions - Operations
  {
    field: 'actions',
    headerName: 'Actions',
    minWidth: 220,
    flex: 1.5,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<MessageData>) => {
      const rowData = params.row
      const canEdit = !rowData.publishDate || !isDateGreaterThanOrEqualToToday(rowData.publishDate)

      if (rowData.isDeleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                if (onToggleMessage) {
                  onToggleMessage(rowData.messageId)
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
            href={`${APP_ROUTES.DASHBOARD.ADD_MESSAGE}?messageId=${rowData.messageId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
            View
          </Link>
          {canEdit && (
            <Link
              href={`${APP_ROUTES.DASHBOARD.ADD_MESSAGE}?messageId=${rowData.messageId}`}
              sx={{ cursor: 'pointer' }}
            >
              Edit
            </Link>
          )}
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              if (onToggleMessage) {
                onToggleMessage(rowData.messageId)
              }
            }}
            sx={{ cursor: 'pointer',
              color: 'error.main' }}
          >
            Delete
          </Link>
        </div>
      )
    },
  },
]
