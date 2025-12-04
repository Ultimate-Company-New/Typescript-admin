import { Chip, Tooltip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

import { type UserLogResponseModel } from '../../api/userLogApi'
import { formatUTCTimestamp } from '../../components/datagrid/index.ts'

// Type assertions for helper functions
type FormatUTCTimestampFn = (
  value: string | Date | null | undefined,
  formatString?: string,
  emptyText?: string,
  showUTCSuffix?: boolean,
) => string

const safeFormatUTCTimestamp = formatUTCTimestamp as unknown as FormatUTCTimestampFn

// Log level colors - matches LOG_LEVEL_COLORS from appConstants
const getLogLevelColor = (
  level: string | null | undefined,
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const levelUpper = (level ?? '').toUpperCase()
  switch (levelUpper) {
    case 'DEBUG':
      return 'default'
    case 'INFO':
      return 'info'
    case 'WARN':
      return 'warning'
    case 'ERROR':
      return 'error'
    case 'FATAL':
      return 'error'
    default:
      return 'default'
  }
}

/**
 * User Log grid columns configuration
 * Displays all columns from the UserLog database table
 */
export const getUserLogGridColumns = (): GridColDef[] => [
  {
    field: 'action' satisfies keyof UserLogResponseModel,
    headerName: 'Action',
    minWidth: 250,
    flex: 2,
    renderCell: (params: GridRenderCellParams) => {
      const action = params.value as string
      return (
        <Tooltip title={action}>
          <span>{action}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'description' satisfies keyof UserLogResponseModel,
    headerName: 'Description',
    minWidth: 350,
    flex: 3,
    renderCell: (params: GridRenderCellParams) => {
      const description = params.value as string | null | undefined
      return (
        <Tooltip title={description ?? ''}>
          <span>{description ?? '—'}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'logLevel' satisfies keyof UserLogResponseModel,
    headerName: 'Level',
    minWidth: 100,
    flex: 0.6,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params: GridRenderCellParams) => {
      const level = params.value as string | null
      return level ? <Chip label={level.toUpperCase()} size="small" color={getLogLevelColor(level)} /> : <span>—</span>
    },
  },
  {
    field: 'ipAddress' satisfies keyof UserLogResponseModel,
    headerName: 'IP Address',
    minWidth: 150,
    flex: 1,
    renderCell: (params: GridRenderCellParams) => {
      const ip = params.value as string | null
      return <span>{ip ?? '—'}</span>
    },
  },
  {
    field: 'userAgent' satisfies keyof UserLogResponseModel,
    headerName: 'User Agent',
    minWidth: 250,
    flex: 2,
    renderCell: (params: GridRenderCellParams) => {
      const userAgent = params.value as string | null
      return (
        <Tooltip title={userAgent ?? ''}>
          <span>{userAgent ?? '—'}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'sessionId' satisfies keyof UserLogResponseModel,
    headerName: 'Session ID',
    minWidth: 200,
    flex: 1.5,
    renderCell: (params: GridRenderCellParams) => {
      const sessionId = params.value as string | null
      return (
        <Tooltip title={sessionId ?? ''}>
          <span>{sessionId ?? '—'}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'createdAt' satisfies keyof UserLogResponseModel,
    headerName: 'Created (UTC)',
    minWidth: 200,
    flex: 1.2,
    valueFormatter: (value: unknown): string =>
      safeFormatUTCTimestamp(value as string | Date | null | undefined, 'MMM dd, yyyy HH:mm:ss', ''),
  },
]
