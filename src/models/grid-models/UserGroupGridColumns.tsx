import { Chip, Link, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { APP_ROUTES } from '../../constants/routes'

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
  userIds: number[]
  isDeleted: boolean
  clientId?: number
  createdUser?: string
  modifiedUser?: string
  createdAt: string
  updatedAt: string
}

/**
 * Get user group grid columns with action handlers
 */
export const getUserGroupGridColumns = (onToggleGroup: (userGroupId: number) => void): GridColDef[] => [
  {
    field: 'id',
    headerName: 'ID',
    width: 70,
    align: 'center',
    headerAlign: 'center',
    type: 'number',
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
      // Try userCount, memberCount, or count userIds array length
      return data.userCount ?? data.memberCount ?? data.userIds.length
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

      if (isDeleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onToggleGroup(id)
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

      return (
        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${id}&isView`}
            sx={{
              cursor: 'pointer',
            }}
          >
            View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${id}`}
            sx={{
              cursor: 'pointer',
            }}
          >
            Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onToggleGroup(id)
            }}
            sx={{
              cursor: 'pointer',
              color: 'error.main',
            }}
          >
            Deactivate
          </Link>
        </div>
      )
    },
  },
]
