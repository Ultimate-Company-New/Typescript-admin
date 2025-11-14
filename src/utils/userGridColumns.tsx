import { useState, useEffect } from 'react'
import { Avatar, Chip, Link, Tooltip, Box, IconButton, Badge } from '@mui/material'
import { 
  Security as SecurityIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { format } from 'date-fns'
import { chipStyles, getRandomColor } from '../components/DataGrid/gridHelpers'
import { APP_ROUTES } from '../constants/routes'
import { PermissionsModal, UserGroupsModal } from '../components/Users'

// Component to handle avatar with proper image error handling
const UserAvatar = ({ 
  profilePicture, 
  firstName, 
  lastName, 
  userId 
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
      <Avatar sx={{ bgcolor: avatarColor, width: 32, height: 32, fontSize: '0.875rem' }}>
        {initials}
      </Avatar>
    )
  }

  return (
    <Avatar 
      src={profilePicture}
      alt={`${firstName} ${lastName}`}
      onError={() => setImageError(true)}
      sx={{ width: 32, height: 32 }}
    >
      {initials}
    </Avatar>
  )
}

// Permissions Button Component
const PermissionsButton = ({ 
  permissions, 
  userName 
}: { 
  permissions: any[]
  userName: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setOpen(true)}
        sx={{ padding: 0.5 }}
      >
        <Badge badgeContent={permissions?.length || 0} color="primary" max={999}>
          <SecurityIcon fontSize="small" />
        </Badge>
      </IconButton>
      <PermissionsModal
        open={open}
        onClose={() => setOpen(false)}
        permissions={permissions || []}
        userName={userName}
      />
    </>
  )
}

// User Groups Button Component
const UserGroupsButton = ({ 
  userGroups, 
  userName 
}: { 
  userGroups: any[]
  userName: string
}) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setOpen(true)}
        sx={{ padding: 0.5 }}
      >
        <Badge badgeContent={userGroups?.length || 0} color="secondary" max={999}>
          <GroupIcon fontSize="small" />
        </Badge>
      </IconButton>
      <UserGroupsModal
        open={open}
        onClose={() => setOpen(false)}
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
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
          height: '100%'
        }}>
          <Chip
            label={params.value}
            size="small"
            sx={chipStyles[params.value as keyof typeof chipStyles] || chipStyles.default}
          />
          <PermissionsButton
            permissions={params.row.permissions || []}
            userName={userName}
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
    valueFormatter: (value) => {
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
    valueFormatter: (value) => {
      if (!value) return ''
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
        return <span style={{ color: '#999' }}>—</span>
      }

      // Get primary address or first address
      const primaryAddress = addresses.find((addr: any) => addr.isPrimary) || addresses[0]
      
      // Short display: City, State
      const shortDisplay = `${primaryAddress.city || ''}, ${primaryAddress.state || ''}`
      
      // Full address for tooltip
      const fullAddress = [
        primaryAddress.street1,
        primaryAddress.street2,
        `${primaryAddress.city}, ${primaryAddress.state} ${primaryAddress.zipCode}`,
        primaryAddress.country
      ].filter(Boolean).join('\n')

      return (
        <Tooltip 
          title={
            <Box sx={{ whiteSpace: 'pre-line', fontSize: '0.875rem' }}>
              {fullAddress}
            </Box>
          }
          arrow
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

  // 11. Last Login - Activity tracking (hidden by default)
  {
    field: 'lastLoginAt',
    headerName: 'Last Login',
    minWidth: 150,
    flex: 1,
    valueFormatter: (value) => {
      if (!value) return 'Never'
      try {
        return format(new Date(value), 'MMM dd, yyyy HH:mm')
      } catch {
        return value
      }
    },
  },

  // 12. Locked Status (hidden by default)
  {
    field: 'locked',
    headerName: 'Locked',
    minWidth: 100,
    flex: 0.5,
    type: 'boolean',
  },

  // 13. Created Date (hidden by default)
  {
    field: 'createdAt',
    headerName: 'Created',
    minWidth: 150,
    flex: 1,
    valueFormatter: (value) => {
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
    field: 'actions',
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
              href="#"
              onClick={(e) => {
                e.preventDefault()
                if (onToggleUser) {
                  onToggleUser(params.row.userId)
                }
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
            href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${params.row.userId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
            View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${params.row.userId}`}
            sx={{ cursor: 'pointer' }}
          >
            Edit
          </Link>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (onToggleUser) {
                onToggleUser(params.row.userId)
              }
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
