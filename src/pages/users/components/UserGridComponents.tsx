import { useEffect, useState } from 'react'

import { Group as GroupIcon, Security as SecurityIcon } from '@mui/icons-material'
import { Avatar, Badge, IconButton, Link } from '@mui/material'

import { getRandomColor } from '../../../components/datagrid/gridHelpers'
import { PERMISSIONS } from '../../../constants/appConstants'
import { APP_ROUTES } from '../../../constants/routes'
import { usePermissions } from '../../../hooks/usePermissions'
import { type UserGroupResponseModel, type UserPermissionInfo } from '../../../models/UserModels'
import styles from '../../../styles/Users.module.scss'

import { PermissionsModal, UserGroupsModal } from './index'

// Utility to safely handle potential null arrays from API responses
function getSafeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

// Component to handle avatar with proper image error handling
export const UserAvatar = ({
  profilePicture,
  firstName,
  lastName,
  userId,
}: {
  profilePicture: string | null
  firstName: string
  lastName: string
  userId: number
}): JSX.Element => {
  const [imageError, setImageError] = useState(false)
  const initials = `${(firstName || '').charAt(0).toUpperCase()}${(lastName || '').charAt(0).toUpperCase()}`
  const avatarColor: string = getRandomColor(userId)

  useEffect(() => {
    setImageError(false)
  }, [profilePicture])

  if (!profilePicture || imageError) {
    return (
      <Avatar className={styles['user-grid__avatar']} sx={{ bgcolor: avatarColor }}>
        {initials}
      </Avatar>
    )
  }

  return (
    <Avatar
      className={styles['user-grid__avatar']}
      src={profilePicture}
      alt={`${firstName} ${lastName}`}
      onError={() => {
        setImageError(true)
      }}
    >
      {initials}
    </Avatar>
  )
}

// Permissions Button Component
export const PermissionsButton = ({
  permissions,
  userName,
  userEmail,
  userId,
}: {
  permissions: UserPermissionInfo[]
  userName: string
  userEmail?: string
  userId?: number
}): JSX.Element => {
  const [open, setOpen] = useState(false)
  const safePermissions = getSafeArray(permissions)
  const permissionCount = safePermissions.length

  return (
    <>
      <IconButton
        className={styles['user-grid__permissions-button']}
        size="small"
        onClick={() => {
          setOpen(true)
        }}
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
        permissions={safePermissions}
        userName={userName}
      />
    </>
  )
}

// User Groups Button Component
export const UserGroupsButton = ({
  userGroups,
  userName,
  userId,
}: {
  userGroups: UserGroupResponseModel[]
  userName: string
  userId: number
}): JSX.Element => {
  const [open, setOpen] = useState(false)
  const safeUserGroups = getSafeArray(userGroups)
  const groupCount = safeUserGroups.length

  return (
    <>
      <IconButton
        className={styles['user-grid__groups-button']}
        size="small"
        onClick={() => {
          setOpen(true)
        }}
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
        userGroups={safeUserGroups}
        userName={userName}
      />
    </>
  )
}

// User Actions Component - handles permission-based action visibility
export const UserActionsCell = ({
  userId,
  isDeleted,
  onToggleUser,
}: {
  userId: number
  isDeleted: boolean
  onToggleUser?: (userId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  // Check permissions using PERMISSIONS constants for consistency
  const canViewUser = hasPermission(PERMISSIONS.VIEW_USER)
  const canUpdateUser = hasPermission(PERMISSIONS.UPDATE_USER)
  const canDeleteUser = hasPermission(PERMISSIONS.DELETE_USER)

  if (isDeleted) {
    // Only show Activate if user has delete permission
    if (!canDeleteUser) {
      return <span className={styles['user-grid__empty-cell']}>—</span>
    }

    return (
      <div>
        <Link
          data-test-id="user-action-activate"
          href="#"
          onClick={e => {
            e.preventDefault()
            if (onToggleUser) {
              onToggleUser(userId)
            }
          }}
          className={`${styles['user-grid__action-link']} ${styles['user-grid__action-link--activate']}`}
        >
          Activate
        </Link>
      </div>
    )
  }

  // Build actions based on permissions
  const actions: JSX.Element[] = []

  if (canViewUser) {
    actions.push(
      <Link
        key="view"
        data-test-id="user-action-view"
        href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${userId}&isView`}
        className={styles['user-grid__action-link']}
      >
        View
      </Link>,
    )
  }

  if (canUpdateUser) {
    actions.push(
      <Link
        key="edit"
        data-test-id="user-action-edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_USERS}?userId=${userId}`}
        className={styles['user-grid__action-link']}
      >
        Edit
      </Link>,
    )
  }

  if (canDeleteUser) {
    actions.push(
      <Link
        key="deactivate"
        data-test-id="user-action-toggle"
        href="#"
        onClick={e => {
          e.preventDefault()
          if (onToggleUser) {
            onToggleUser(userId)
          }
        }}
        className={`${styles['user-grid__action-link']} ${styles['user-grid__action-link--deactivate']}`}
      >
        Deactivate
      </Link>,
    )
  }

  // If no permissions, show empty cell
  if (actions.length === 0) {
    return <span className={styles['user-grid__empty-cell']}>—</span>
  }

  return <div className={styles['user-grid__actions-container']}>{actions}</div>
}
