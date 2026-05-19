import { Chip, Link, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { PERMISSIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'

/**
 * User Group Actions Component - handles permission-based action visibility
 */
const UserGroupActionsCell = ({
  groupId,
  isDeleted,
  onToggleGroup,
}: {
  groupId: number
  isDeleted: boolean
  onToggleGroup?: (groupId: number) => void
}): JSX.Element => {
  const { hasPermission } = usePermissions()

  // Check permissions using PERMISSIONS constants
  const canViewGroup = hasPermission(PERMISSIONS.VIEW_GROUPS)
  const canUpdateGroup = hasPermission(PERMISSIONS.UPDATE_GROUPS)
  const canDeleteGroup = hasPermission(PERMISSIONS.DELETE_GROUPS)

  if (isDeleted) {
    // Only show Activate if user has delete permission
    if (!canDeleteGroup) {
      return <span>—</span>
    }

    return (
      <div>
        <Link
          href="#"
          data-test-id="user-group-action-activate"
          onClick={e => {
            e.preventDefault()
            if (onToggleGroup) {
              onToggleGroup(groupId)
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

  if (canViewGroup) {
    actions.push(
      <Link
        key="view"
        href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${groupId}&isView=true`}
        data-test-id="user-group-action-view"
        sx={{
          cursor: 'pointer',
        }}
      >
        View
      </Link>,
    )
  }

  if (canUpdateGroup) {
    actions.push(
      <Link
        key="edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${groupId}`}
        data-test-id="user-group-action-edit"
        sx={{
          cursor: 'pointer',
        }}
      >
        Edit
      </Link>,
    )
  }

  if (canDeleteGroup) {
    actions.push(
      <Link
        key="deactivate"
        href="#"
        data-test-id="user-group-action-toggle"
        onClick={e => {
          e.preventDefault()
          if (onToggleGroup) {
            onToggleGroup(groupId)
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
 * User Group data structure matching API response
 * Note: API returns both groupId and userGroupId depending on the endpoint
 */
export interface UserGroupData {
  groupId?: number
  userGroupId?: number
  groupName?: string
  name?: string
  description: string
  notes?: string
  userCount?: number
  memberCount?: number
  userIds?: number[]
  users?: { userId: number }[]
  isDeleted: boolean
  createdUser?: string
  modifiedUser?: string
  createdAt: string
  updatedAt: string
}

/**
 * Get user group grid columns with action handlers
 */
export const getUserGroupGridColumns = (onToggleGroup: (userGroupId: number) => void): GridColDef[] => [
  // Hidden ID column - for internal use only
  {
    field: 'id',
    headerName: 'ID',
    width: 0,
    minWidth: 0,
    align: 'center',
    headerAlign: 'center',
    type: 'number',
    hideable: false,
    filterable: false,
    valueGetter: (_value, row) => {
      const data = row as UserGroupData
      return data.groupId ?? data.userGroupId
    },
  },
  {
    field: 'groupName',
    headerName: 'Group Name',
    width: 180,
    minWidth: 150,
    valueGetter: (_value, row) => {
      const data = row as UserGroupData
      return data.groupName ?? data.name
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    flex: 2,
    minWidth: 300,
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as string | undefined
      return (
        <Tooltip title={value ?? ''}>
          <span>{value}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'members',
    headerName: 'Members',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    type: 'number',
    filterable: true,
    sortable: true,
    valueGetter: (_value, row) => {
      const data = row as UserGroupData
      return data.userCount ?? data.memberCount ?? data.users?.length ?? data.userIds?.length ?? 0
    },
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as number | undefined
      return <Chip label={value ?? 0} size="small" color="primary" variant="outlined" />
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 250,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams<UserGroupData>) => {
      const { row: rowData } = params
      const { isDeleted } = rowData
      // Handle both groupId and userGroupId
      const id = rowData.groupId ?? rowData.userGroupId ?? 0

      return <UserGroupActionsCell groupId={id} isDeleted={isDeleted} onToggleGroup={onToggleGroup} />
    },
  },
]

/**
 * Export the UserGroupActionsCell for potential reuse
 */
export { UserGroupActionsCell }
