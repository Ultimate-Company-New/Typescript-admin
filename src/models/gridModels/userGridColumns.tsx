import { useState, useEffect } from 'react'

import { format } from 'date-fns'

import {
  Security as SecurityIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material'
import { Avatar, Chip, Link, Tooltip, Box, IconButton, Badge } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { getRandomColor } from '../../components/DataGrid/gridHelpers'
import { PermissionsModal, UserGroupsModal } from '../../components/Users'
import { APP_ROUTES } from '../../constants/routes'
import { type AddressResponseModel } from '../AddressModels'
import { type UserPermissionInfo, type UserGroupResponseModel } from '../UserModels'

// Chip styles mapping for different roles
const roleChipStyles: Record<string, React.CSSProperties> = {
  Admin: { backgroundColor: '#d32f2f',
    color: '#fff',
    fontWeight: 'bold',
    borderColor: '#d32f2f' },
  Manager: { backgroundColor: '#1976d2',
    color: '#fff',
    fontWeight: 'bold',
    borderColor: '#1976d2' },
  User: { backgroundColor: '#388e3c',
    color: '#fff',
    fontWeight: 'bold',
    borderColor: '#388e3c' },
  Guest: { backgroundColor: '#757575',
    color: '#fff',
    fontWeight: 'bold',
    borderColor: '#757575' },
  default: { backgroundColor: '#9e9e9e',
    color: '#fff',
    fontWeight: 'bold',
    borderColor: '#9e9e9e' },
}

// Component to handle avatar with proper image error handling
const UserAvatar = ({
  profilePicture,
  firstName,
  lastName,
  userId,
}: {
  profilePicture: string | null
  firstName: string
  lastName: string
  userId: number
}) => {
  const [imageError, setImageError] = useState(false)
  const initials = `${(firstName || '').charAt(0).toUpperCase()}${(lastName || '').charAt(0).toUpperCase()}`
  const avatarColor = getRandomColor(userId)

  useEffect(() => {
    setImageError(false)
  }, [profilePicture])

  if (!profilePicture || imageError) {
    return (
      <Avatar sx={{ bgcolor: avatarColor,
        width: 32,
        height: 32,
        fontSize: '0.875rem' }}>
        {initials}
      </Avatar>
    )
  }

  return (
    <Avatar
      src={profilePicture}
      alt={`${firstName} ${lastName}`}
      onError={() => {
        setImageError(true)
      }}
      sx={{ width: 32,
        height: 32 }}
    >
      {initials}
    </Avatar>
  )
}

// Permissions Button Component
const PermissionsButton = ({
  permissions,
  userName,
  userEmail,
  userId,
}: {
  permissions: UserPermissionInfo[]
  userName: string
  userEmail?: string
  userId?: number
}) => {
  const [open, setOpen] = useState(false)
  const permissionCount = permissions.length || 0

  return (
    <>
      <IconButton
        size="small"
        onClick={() => {
          setOpen(true)
        }}
        sx={{ padding: 0.5 }}
        data-test-id="user-permissions-button"
        data-permission-count={permissionCount}
        data-user-email={userEmail}
        data-user-id={userId}
        aria-label={`View permissions for ${userName}`}
      >
        <Badge badgeContent={permissionCount} color="primary" max={999}>
          <SecurityIcon fontSize="small" />
        </Badge>
      </IconButton>
      <PermissionsModal
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        permissions={permissions || []}
        userName={userName}
      />
    </>
  )
}

// User Groups Button Component
const UserGroupsButton = ({
  userGroups,
  userName,
  userId,
}: {
  userGroups: UserGroupResponseModel[]
  userName: string
  userId: number
}) => {
  const [open, setOpen] = useState(false)
  const groupCount = userGroups.length || 0

  return (
    <>
      <IconButton
        size="small"
        onClick={() => {
          setOpen(true)
        }}
        sx={{ padding: 0.5 }}
        data-test-id="user-groups-button"
        data-user-id={userId}
        data-group-count={groupCount}
        aria-label={`View groups for ${userName}`}
      >
        <Badge badgeContent={groupCount} color="secondary" max={999}>
          <GroupIcon fontSize="small" />
        </Badge>
      </IconButton>
      <UserGroupsModal
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        userGroups={userGroups || []}
        userName={userName}
      />
    </>
  )
}

/**
 * User grid columns configuration
 * Columns are arranged from left to right in order of relevance:
 * 1. Avatar/Icon - Visual identifier
 * 2. First Name, Last Name - Primary identity
 * 3. Email - Contact info
 * 4. Role (with Permissions badge) - Access level
 * 5. DOB, Phone - Personal details
 * 6. Groups - Group membership
 * 7. Address - Location info
 * 8. Account Status - Current state
 * 9. Actions - Operations
 */
export const getUserGridColumns = (onToggleUser?: (userId: number) => void): GridColDef[] => [
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
    field: 'userId',
    headerName: 'User ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },

  // 1. Avatar/Icon - Visual identifier
  {
    field: 'avatar',
    headerName: 'Icon',
    width: 70,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => (
      <Box sx={{ display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%' }}>
        <UserAvatar
          profilePicture={params.row.profilePicture}
          firstName={params.row.firstName}
          lastName={params.row.lastName}
          userId={params.row.userId}
        />
      </Box>
    ),
  },

  // 2. First Name - Primary identity
  {
    field: 'firstName',
    headerName: 'First Name',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={params.value || ''}>
        <span>{params.value}</span>
      </Tooltip>
    ),
  },

  // 3. Last Name - Primary identity
  {
    field: 'lastName',
    headerName: 'Last Name',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={params.value || ''}>
        <span>{params.value}</span>
      </Tooltip>
    ),
  },

  // 4. Email - Contact info
  {
    field: 'email',
    headerName: 'Email',
    minWidth: 250,
    flex: 2,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={params.value || ''}>
        <span>{params.value}</span>
      </Tooltip>
    ),
  },

  // 5. Role with Permissions badge - Access level
  {
    field: 'role',
    headerName: 'Role',
    minWidth: 150,
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const userName = `${params.row.firstName} ${params.row.lastName}`
      return (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          width: '100%',
          height: '100%',
        }}>
          <Chip
            label={params.value}
            size="small"
            sx={roleChipStyles[params.value as string] || roleChipStyles.default}
          />
          <PermissionsButton
            permissions={params.row.permissions || []}
            userName={userName}
            userEmail={params.row.email}
            userId={params.row.userId}
          />
        </Box>
      )
    },
  },

  // 6. Date of Birth - Personal details
  {
    field: 'dob',
    headerName: 'DOB',
    minWidth: 130,
    flex: 0.8,
    valueFormatter: value => {
      if (!value) return ''
      try {
        return format(new Date(value), 'do MMM yyyy')
      } catch {
        return value
      }
    },
  },

  // 7. Phone - Contact info
  {
    field: 'phone',
    headerName: 'Phone',
    width: 160,
    valueFormatter: (value: unknown) => {
      if (!value || typeof value !== 'string') return ''
      // Format phone number: (123) - 456 - 7890
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) - ${cleaned.slice(3, 6)} - ${cleaned.slice(6)}`
      }
      if (cleaned.length === 11) {
        return `(+${cleaned.slice(0, 2)}) - ${cleaned.slice(2, 5)} - ${cleaned.slice(5)}`
      }
      return value
    },
  },

  // 8. Groups - Group membership
  {
    field: 'userGroups',
    headerName: 'Groups',
    width: 90,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const userName = `${params.row.firstName} ${params.row.lastName}`
      const userGroups = params.row.userGroups || []

      if (userGroups.length === 0) {
        return <span style={{ color: '#999' }}>—</span>
      }

      return (
        <UserGroupsButton
          userGroups={userGroups}
          userName={userName}
          userId={params.row.userId}
        />
      )
    },
  },

  // 9. Address - Location info with full address on hover
  {
    field: 'addresses',
    headerName: 'Address',
    minWidth: 140,
    flex: 1,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const addresses = params.row.addresses || []
      if (addresses.length === 0) {
        return <span style={{ color: '#999' }} data-test-id="user-address-cell">—</span>
      }

      // Get primary address or first address
      const primaryAddress = addresses.find((addr: AddressResponseModel) => addr.isPrimary) || addresses[0]

      const shortDisplayParts = [primaryAddress.city, primaryAddress.state].filter(Boolean)
      const shortDisplay = shortDisplayParts.length > 0 ? shortDisplayParts.join(', ') : primaryAddress.country || '—'

      // Full address for tooltip
      const fullAddress = [
        primaryAddress.street1,
        primaryAddress.street2,
        [primaryAddress.city, primaryAddress.state, primaryAddress.zipCode].filter(Boolean).join(', '),
        primaryAddress.country,
      ]
        .filter(line => line && line.trim().length > 0)
        .join('\n')

      return (
        <Tooltip
          title={
            <Box sx={{ whiteSpace: 'pre-line',
              fontSize: '0.875rem' }}>
              {fullAddress || 'Address not available'}
            </Box>
          }
          arrow
          slotProps={{
            tooltip: {
              'data-test-id': 'user-address-tooltip',
            } as React.HTMLAttributes<HTMLDivElement>,
          }}
        >
          <Box sx={{ display: 'flex',
            alignItems: 'center',
            gap: 0.5 }} data-test-id="user-address-cell">
            <LocationIcon fontSize="small" sx={{ color: 'action.active' }} />
            <span>{shortDisplay}</span>
          </Box>
        </Tooltip>
      )
    },
  },

  // 10. Account Status - Current state
  {
    field: 'emailConfirmed',
    headerName: 'Account Status',
    width: 130,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const status = params.value ? 'Active' : 'Pending'
      const color = params.value ? 'success' : 'warning'
      return (
        <Chip
          label={status}
          color={color}
          size="small"
        />
      )
    },
  },

  // 11. Last Login - Activity tracking (visible by default)
  {
    field: 'lastLoginAt',
    headerName: 'Last Login',
    minWidth: 150,
    flex: 1,
    valueFormatter: value => {
      if (!value) return 'Never'
      try {
        return format(new Date(value), 'MMM dd, yyyy HH:mm')
      } catch {
        return value
      }
    },
  },

  // 12. Locked Status (visible by default)
  {
    field: 'locked',
    headerName: 'Locked',
    minWidth: 100,
    flex: 0.5,
    type: 'boolean',
  },

  // 13. Created Date (visible by default)
  {
    field: 'createdAt',
    headerName: 'Created',
    minWidth: 150,
    flex: 1,
    valueFormatter: value => {
      if (!value) return ''
      try {
        return format(new Date(value), 'MMM dd, yyyy')
      } catch {
        return value
      }
    },
  },

  // 14. Actions - Operations
  {
    field: 'userActions',
    headerName: 'Actions',
    minWidth: 220,
    flex: 1.5,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      if (params.row.isDeleted) {
        return (
          <div>
            <Link
              data-test-id="user-action-activate"
              href="#"
              onClick={e => {
                e.preventDefault()
                if (onToggleUser) {
                  onToggleUser(params.row.userId)
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
            data-test-id="user-action-view"
            href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${params.row.userId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
            View
          </Link>
          <Link
            data-test-id="user-action-edit"
            href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${params.row.userId}`}
            sx={{ cursor: 'pointer' }}
          >
            Edit
          </Link>
          <Link
            data-test-id="user-action-toggle"
            href="#"
            onClick={e => {
              e.preventDefault()
              if (onToggleUser) {
                onToggleUser(params.row.userId)
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
