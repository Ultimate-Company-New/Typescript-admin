import { Chip } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'

/**
 * Permission data structure matching API response
 */
export interface PermissionData {
  permissionId: number
  permissionName: string
  permissionCode: string
  description?: string
  category?: string
}

/**
 * Category color mapping for visual distinction
 * Each permission category gets a unique color
 */
const CATEGORY_COLORS: Record<string, string> = {
  ADDRESS_MANAGEMENT: '#8E24AA', // Purple
  API_MANAGEMENT: '#5E35B1', // Deep Purple
  CLIENT_MANAGEMENT: '#1E88E5', // Blue
  COMMUNICATION: '#00ACC1', // Cyan
  EVENT_MANAGEMENT: '#43A047', // Green
  LEAD_MANAGEMENT: '#7CB342', // Light Green
  LOGISTICS: '#FB8C00', // Orange
  MARKETING: '#F4511E', // Deep Orange
  ORDER_MANAGEMENT: '#E53935', // Red
  PACKAGE_MANAGEMENT: '#D81B60', // Pink
  PAYMENT_MANAGEMENT: '#6D4C41', // Brown
  PRODUCT_MANAGEMENT: '#039BE5', // Light Blue
  PURCHASE_MANAGEMENT: '#00897B', // Teal
  REPORTING: '#3949AB', // Indigo
  SALES_MANAGEMENT: '#C0CA33', // Lime
  SUPPORT_MANAGEMENT: '#FFB300', // Amber
  SYSTEM_ADMIN: '#B71C1C', // Dark Red
  USER_MANAGEMENT: '#1565C0', // Dark Blue
  WEB_TEMPLATE_MANAGEMENT: '#6A1B9A', // Dark Purple
}

/**
 * Get category background color
 */
const getCategoryBackgroundColor = (category: string): string => CATEGORY_COLORS[category] ?? '#757575' // Default grey

/**
 * Get permission grid columns (read-only, no actions)
 */
export const getPermissionGridColumns = (): GridColDef[] => [
  {
    field: 'permissionId',
    headerName: 'ID',
    width: 80,
    align: 'center',
    headerAlign: 'center',
  },
  {
    field: 'permissionName',
    headerName: 'Permission Name',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'permissionCode',
    headerName: 'Code',
    flex: 1,
    minWidth: 150,
  },
  {
    field: 'category',
    headerName: 'Category',
    flex: 0.8,
    minWidth: 200,
    renderCell: (params: GridRenderCellParams) => {
      const value = params.value as string | undefined
      if (!value) return '—'
      const bgColor = getCategoryBackgroundColor(value)
      // Format label: SNAKE_CASE -> Title Case
      const formattedLabel = value
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
      return (
        <Chip
          label={formattedLabel}
          size="small"
          variant="filled"
          sx={{
            fontWeight: 500,
            backgroundColor: bgColor,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: bgColor,
            },
          }}
        />
      )
    },
  },
]
