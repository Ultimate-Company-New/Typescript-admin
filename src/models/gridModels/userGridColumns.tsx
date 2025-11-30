import { Box, Chip, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { AddressCell, formatDate, formatPhone, formatUTCTimestamp } from '../../components/datagrid'
import { USER_ROLES } from '../../constants/appConstants'
import { PermissionsButton, UserActionsCell, UserAvatar, UserGroupsButton } from '../../pages/users/components'
import styles from '../../styles/Users.module.scss'
import { type UserResponseModel } from '../UserModels'

// Type assertions for helper functions to ensure type safety
type FormatPhoneFn = (value: string | number | null | undefined, emptyText?: string) => string
type FormatUTCTimestampFn = (
  value: string | Date | null | undefined,
  formatString?: string,
  emptyText?: string,
  showUTCSuffix?: boolean,
) => string
type FormatDateFn = (value: unknown, formatString?: string, emptyText?: string) => string

const safeFormatPhone = formatPhone as unknown as FormatPhoneFn
const safeFormatUTCTimestamp = formatUTCTimestamp as unknown as FormatUTCTimestampFn
const safeFormatDate = formatDate as unknown as FormatDateFn

// Utility to safely handle potential null arrays from API responses
function getSafeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

// Type for grid row data
type UserGridRow = UserResponseModel

// Chip styles mapping for different roles
const getRoleChipClass = (role: string): string => {
  const roleKey = role.toUpperCase()
  switch (roleKey) {
    case USER_ROLES.SUPER_ADMIN:
      return styles['user-grid__role-chip--superadmin']
    case USER_ROLES.ADMIN:
      return styles['user-grid__role-chip--admin']
    case USER_ROLES.MANAGER:
      return styles['user-grid__role-chip--manager']
    case USER_ROLES.VIEWER:
      return styles['user-grid__role-chip--viewer']
    case USER_ROLES.CUSTOMER:
      return styles['user-grid__role-chip--customer']
    case USER_ROLES.CUSTOM:
      return styles['user-grid__role-chip--custom']
    default:
      return styles['user-grid__role-chip--default']
  }
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
    field: 'isDeleted' satisfies keyof UserResponseModel,
    headerName: 'IsDeleted',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'userId' satisfies keyof UserResponseModel,
    headerName: 'User ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },

  // 1. Avatar/Icon - Visual identifier
  {
    field: 'profilePicture' satisfies keyof UserResponseModel,
    headerName: 'Icon',
    minWidth: 70,
    maxWidth: 80,
    flex: 0.3,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<UserGridRow>) => {
      const { profilePicture, firstName, lastName, userId } = params.row
      return (
        <Box className={styles['user-grid__avatar-container']}>
          <UserAvatar
            profilePicture={profilePicture ?? null}
            firstName={firstName}
            lastName={lastName}
            userId={userId}
          />
        </Box>
      )
    },
  },

  // 2. First Name - Primary identity
  {
    field: 'firstName' satisfies keyof UserResponseModel,
    headerName: 'First Name',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams) => {
      const firstName = params.value as string
      return (
        <Tooltip title={firstName}>
          <span>{firstName}</span>
        </Tooltip>
      )
    },
  },

  // 3. Last Name - Primary identity
  {
    field: 'lastName' satisfies keyof UserResponseModel,
    headerName: 'Last Name',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams) => (
      <Tooltip title={params.value as string}>
        <span>{params.value as string}</span>
      </Tooltip>
    ),
  },

  // 4. Email - Contact info
  {
    field: 'email' satisfies keyof UserResponseModel,
    headerName: 'Email',
    minWidth: 250,
    flex: 2,
    renderCell: (params: GridRenderCellParams) => {
      const email = params.value as string
      return (
        <Tooltip title={email}>
          <span>{email}</span>
        </Tooltip>
      )
    },
  },

  // 5. Role with Permissions badge - Access level
  {
    field: 'role' satisfies keyof UserResponseModel,
    headerName: 'Role',
    minWidth: 180,
    flex: 1,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<UserGridRow>) => {
      const { firstName, lastName, email, userId } = params.row
      const permissions = getSafeArray(params.row.permissions)
      const userName = `${firstName} ${lastName}`
      const role = params.value as string
      return (
        <Box className={styles['user-grid__role-container']}>
          <Chip label={role} size="small" className={getRoleChipClass(role)} />
          <PermissionsButton permissions={permissions} userName={userName} userEmail={email} userId={userId} />
        </Box>
      )
    },
  },

  // 6. Date of Birth - Personal details
  {
    field: 'dob' satisfies keyof UserResponseModel,
    headerName: 'DOB',
    minWidth: 130,
    flex: 0.8,
    valueFormatter: (value: unknown): string => safeFormatDate(value, 'do MMM yyyy', ''),
  },

  // 7. Phone - Contact info
  {
    field: 'phone' satisfies keyof UserResponseModel,
    headerName: 'Phone',
    minWidth: 160,
    flex: 1,
    valueFormatter: (value: unknown): string => safeFormatPhone(value as string | number | null | undefined, ''),
  },

  // 8. Groups - Group membership
  {
    field: 'userGroups' satisfies keyof UserResponseModel,
    headerName: 'Groups',
    minWidth: 90,
    maxWidth: 110,
    flex: 0.4,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<UserGridRow>) => {
      const { firstName, lastName, userId } = params.row
      const userGroups = getSafeArray(params.row.userGroups)
      const userName = `${firstName} ${lastName}`

      if (userGroups.length === 0) {
        return <span className={styles['user-grid__empty-cell']}>—</span>
      }

      return <UserGroupsButton userGroups={userGroups} userName={userName} userId={userId} />
    },
  },

  // 9. Address - Location info with full address on hover
  {
    field: 'addresses' satisfies keyof UserResponseModel,
    headerName: 'Address',
    minWidth: 170,
    flex: 1,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<UserGridRow>) => (
      <AddressCell
        addresses={params.row.addresses}
        containerClassName={styles['user-grid__address-container']}
        iconClassName={styles['user-grid__address-icon']}
        tooltipClassName={styles['user-grid__address-tooltip']}
        emptyClassName={styles['user-grid__empty-cell']}
        testId="user-address-cell"
      />
    ),
  },

  // 10. Account Status - Current state
  {
    field: 'emailConfirmed' satisfies keyof UserResponseModel,
    headerName: 'Account Status',
    minWidth: 130,
    flex: 0.8,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams<UserGridRow>) => {
      const isActive = Boolean(params.value)
      const status = isActive ? 'Active' : 'Pending'
      const color = isActive ? 'success' : 'warning'
      return <Chip label={status} color={color} size="small" />
    },
  },

  // 11. Last Login - Activity tracking (visible by default)
  {
    field: 'lastLoginAt' satisfies keyof UserResponseModel,
    headerName: 'Last Login (UTC)',
    minWidth: 180,
    flex: 1,
    valueFormatter: (value: unknown): string => safeFormatUTCTimestamp(value as string | Date | null | undefined),
  },

  // 12. Locked Status (visible by default)
  {
    field: 'locked' satisfies keyof UserResponseModel,
    headerName: 'Locked',
    minWidth: 100,
    flex: 0.5,
    type: 'boolean',
  },

  // 13. Created Date (visible by default)
  {
    field: 'createdAt' satisfies keyof UserResponseModel,
    headerName: 'Created (UTC)',
    minWidth: 220,
    flex: 1.2,
    valueFormatter: (value: unknown): string =>
      safeFormatUTCTimestamp(value as string | Date | null | undefined, 'MMM dd, yyyy HH:mm', ''),
  },

  // 14. Actions - Operations (permission-based visibility)
  {
    field: 'userActions',
    headerName: 'Actions',
    minWidth: 220,
    flex: 1.5,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<UserGridRow>) => {
      const { userId, isDeleted = false } = params.row
      return <UserActionsCell userId={userId} isDeleted={isDeleted} onToggleUser={onToggleUser} />
    },
  },
]
