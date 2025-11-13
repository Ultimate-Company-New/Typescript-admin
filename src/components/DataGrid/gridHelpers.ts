import { GridFilterModel } from '@mui/x-data-grid'
import { PaginatedGridInterface } from '../../types/grid.types'

interface CustomFilteringForDataGridProps {
  gridFilterModel: GridFilterModel
  setGridFunction: (paginationRequestModel: PaginatedGridInterface) => void
  paginatedGridModel: PaginatedGridInterface
  selectionModel?: any
  prevSelectionModel?: any
}

/**
 * Handles filter changes in the DataGrid
 * Converts MUI DataGrid filter model to our custom filter format
 * and updates the pagination model
 */
export const filterChangeFunction = (
  props: CustomFilteringForDataGridProps
) => {
  const filterItem = props.gridFilterModel.items[0]

  if (filterItem && filterItem.value) {
    // Update filter - matching Spring API UserRequestModel format
    props.setGridFunction({
      start: 0, // Reset to first page when filtering
      end: props.paginatedGridModel.pageSize,
      pageSize: props.paginatedGridModel.pageSize,
      includeDeleted: props.paginatedGridModel.includeDeleted,
      includeExpired: props.paginatedGridModel.includeExpired,
      data: props.paginatedGridModel.data,
      actualDataCount: props.paginatedGridModel.actualDataCount,
      totalPaginationBlockCount:
        props.paginatedGridModel.totalPaginationBlockCount,
      columnName: filterItem.field,
      condition: filterItem.operator,
      filterExpr: filterItem.value?.toString() || '',
    })
  } else {
    // Clear filter
    props.setGridFunction({
      start: props.paginatedGridModel.start,
      end: props.paginatedGridModel.end,
      pageSize: props.paginatedGridModel.pageSize,
      includeDeleted: props.paginatedGridModel.includeDeleted,
      includeExpired: props.paginatedGridModel.includeExpired,
      data: props.paginatedGridModel.data,
      actualDataCount: props.paginatedGridModel.actualDataCount,
      totalPaginationBlockCount:
        props.paginatedGridModel.totalPaginationBlockCount,
      columnName: undefined,
      condition: undefined,
      filterExpr: undefined,
    })
  }

  // Retain previously selected rows for selection grids
  if (
    props.selectionModel !== undefined &&
    props.prevSelectionModel !== undefined
  ) {
    props.prevSelectionModel.current = props.selectionModel
  }
}

/**
 * 25 carefully selected colors that match the green theme
 * These colors provide good contrast for white text and are visually appealing
 */
const AVATAR_COLORS = [
  '#2E7D32', // Dark Green
  '#388E3C', // Green
  '#43A047', // Light Green
  '#66BB6A', // Lighter Green
  '#00695C', // Teal Dark
  '#00796B', // Teal
  '#00897B', // Teal Light
  '#26A69A', // Teal Lighter
  '#0277BD', // Blue Dark
  '#0288D1', // Blue
  '#039BE5', // Blue Light
  '#29B6F6', // Blue Lighter
  '#558B2F', // Olive Green
  '#689F38', // Light Olive
  '#7CB342', // Yellow Green
  '#9CCC65', // Light Yellow Green
  '#6A1B9A', // Purple Dark
  '#7B1FA2', // Purple
  '#8E24AA', // Purple Light
  '#AB47BC', // Purple Lighter
  '#00838F', // Cyan Dark
  '#0097A7', // Cyan
  '#00ACC1', // Cyan Light
  '#26C6DA', // Cyan Lighter
  '#5D4037', // Brown
]

/**
 * Gets a consistent color for a user based on their userId
 * Same userId will always get the same color
 */
export const getRandomColor = (userId: number): string => {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length]
}

/**
 * Returns styling for Chip components
 */
export const chipStyles = (
  backgroundColor: string,
  textColor: string
): React.CSSProperties => ({
  backgroundColor,
  color: textColor,
  fontWeight: 'bold',
  borderColor: backgroundColor,
})

