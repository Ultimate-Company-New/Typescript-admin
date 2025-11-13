import { useState, useEffect } from 'react'
import { Avatar, Chip, Link, Tooltip, Box } from '@mui/material'
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { format } from 'date-fns'
import { chipStyles, getRandomColor } from '../components/DataGrid/gridHelpers'
import { APP_ROUTES } from '../constants/routes'

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

  // Reset error state when profilePicture changes
  useEffect(() => {
    setImageError(false)
  }, [profilePicture])

  // Check if profile picture is valid (not null, not empty, not whitespace)
  const hasValidProfilePicture = profilePicture &&
    typeof profilePicture === 'string' &&
    profilePicture.trim() !== '' &&
    !imageError

  return (
    <Avatar
      src={hasValidProfilePicture ? profilePicture : undefined}
      alt={`${firstName} ${lastName}`}
      imgProps={{
        onError: () => setImageError(true),
      }}
      sx={{
        bgcolor: avatarColor,
        width: 40,
        height: 40,
        fontSize: '1rem',
        fontWeight: 'bold',
      }}
    >
      {initials}
    </Avatar>
  )
}

/**
 * Component to render text with ellipsis and tooltip on hover
 * Industry standard approach for displaying long text in data grids
 */
const TextCellWithTooltip = ({ value }: { value: string }) => {
  return (
    <Tooltip title={value} arrow placement="top" enterDelay={300}>
      <Box
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
      >
        {value}
      </Box>
    </Tooltip>
  )
}

/**
 * User DataGrid column definitions
 * Defines all columns for the users grid with appropriate renderers and formatters
 */
export const getUserGridColumns = (): GridColDef[] => [
  {
    field: 'isDeleted',
    headerName: 'IsDeleted',
    hideable: false,
    filterable: false,
    width: 0,
    renderCell: () => null,
  },
  {
    field: 'userId',
    headerName: 'User Id',
    flex: 1,
    minWidth: 100,
    hideable: false,
    filterable: false,
    valueGetter: (_value, row) => row.userId,
  },
  {
    field: 'avatar',
    headerName: 'Icon',
    flex: 1,
    minWidth: 80,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    sortable: false,
    renderCell: (params: GridRenderCellParams) => {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <UserAvatar
            profilePicture={params.row.profilePicture}
            firstName={params.row.firstName || ''}
            lastName={params.row.lastName || ''}
            userId={params.row.userId}
          />
        </div>
      )
    },
  },
  {
    field: 'firstName',
    headerName: 'First Name',
    flex: 2,
    minWidth: 150,
    align: 'left',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <TextCellWithTooltip value={params.row.firstName || ''} />
    ),
  },
  {
    field: 'lastName',
    headerName: 'Last Name',
    flex: 2,
    minWidth: 150,
    align: 'left',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <TextCellWithTooltip value={params.row.lastName || ''} />
    ),
  },
  {
    field: 'loginName',
    headerName: 'Email',
    flex: 2,
    minWidth: 200,
    align: 'left',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <TextCellWithTooltip value={params.row.loginName || ''} />
    ),
  },
  {
    field: 'role',
    headerName: 'Role',
    flex: 2,
    minWidth: 150,
    align: 'left',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => (
      <TextCellWithTooltip value={params.row.role || ''} />
    ),
  },
  {
    field: 'dob',
    headerName: 'DOB',
    flex: 2,
    minWidth: 150,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row) => {
      if (!row.dob) return 'N/A'
      try {
        return format(new Date(row.dob), 'do MMM yyyy')
      } catch {
        return 'Invalid Date'
      }
    },
  },
  {
    field: 'phone',
    headerName: 'Phone',
    flex: 2,
    minWidth: 150,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row) => {
      const phone = row.phone
      if (!phone || phone.length < 10) return phone
      return `(${phone.slice(0, 3)}) - ${phone.slice(3, 6)} - ${phone.slice(
        6
      )}`
    },
  },
  {
    field: 'emailConfirmed',
    headerName: 'Account Status',
    flex: 2,
    minWidth: 150,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const confirmed = params.row.emailConfirmed
      const label = confirmed ? 'Confirmed' : 'Pending'
      const backgroundColor = confirmed ? '#28a745' : '#dc3545'
      const textColor = '#fff'

      return (
        <Chip
          label={label}
          style={chipStyles(backgroundColor, textColor)}
          variant="outlined"
          size="small"
        />
      )
    },
  },
  {
    field: 'locked',
    headerName: 'Locked',
    flex: 1,
    minWidth: 120,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const locked = params.row.locked
      const label = locked ? 'Locked' : 'Active'
      const backgroundColor = locked ? '#dc3545' : '#28a745'
      const textColor = '#fff'

      return (
        <Chip
          label={label}
          style={chipStyles(backgroundColor, textColor)}
          variant="outlined"
          size="small"
        />
      )
    },
  },
  {
    field: 'lastLoginAt',
    headerName: 'Last Login',
    flex: 2,
    minWidth: 180,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row) => {
      if (!row.lastLoginAt) return 'Never'
      try {
        return format(new Date(row.lastLoginAt), 'do MMM yyyy, HH:mm')
      } catch {
        return 'Invalid Date'
      }
    },
  },
  {
    field: 'createdAt',
    headerName: 'Created At',
    flex: 2,
    minWidth: 180,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    valueGetter: (_value, row) => {
      if (!row.createdAt) return 'N/A'
      try {
        return format(new Date(row.createdAt), 'do MMM yyyy, HH:mm')
      } catch {
        return 'Invalid Date'
      }
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    flex: 2,
    minWidth: 200,
    align: 'center',
    headerAlign: 'center',
    filterable: false,
    sortable: false,
    renderCell: (params: GridRenderCellParams) => {
      if (params.row.isDeleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault()
                // Handle activate
              }}
              sx={{ cursor: 'pointer' }}
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
              // Handle deactivate
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

