import { Chip, Tooltip, Link } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { APP_ROUTES } from '../../constants/routes'

/**
 * Get user group grid columns with action handlers
 */
export const getUserGroupGridColumns = (
  onToggleGroup: (userGroupId: number) => void,
): GridColDef[] => [
  {
    field: 'groupId',
    headerName: 'Group ID',
    hideable: false,
    filterable: false,
    width: 0,
    minWidth: 0,
  },
  {
    field: 'groupName',
    headerName: 'Group Name',
    flex: 1,
    minWidth: 200,
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
    field: 'memberCount',
    headerName: 'Members',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as number | undefined
      return (
        <Chip
          label={value ?? 0}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 250,
    sortable: false,
    filterable: false,
    renderCell: (params: GridRenderCellParams) => {
      const groupId = params.row.groupId || params.row.userGroupId

      if (params.row.isDeleted) {
        return (
          <div>
            <Link
              href="#"
              onClick={e => {
                e.preventDefault()
                onToggleGroup(groupId)
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
            href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${groupId}&isView`}
            sx={{ cursor: 'pointer' }}
          >
              View
          </Link>
          <Link
            href={`${APP_ROUTES.DASHBOARD.ADD_GROUPS}?userGroupId=${groupId}`}
            sx={{ cursor: 'pointer' }}
          >
              Edit
          </Link>
          <Link
            href="#"
            onClick={e => {
              e.preventDefault()
              onToggleGroup(groupId)
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
