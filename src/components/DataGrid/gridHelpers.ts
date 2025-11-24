import {
  type GridPaginationModel,
  type GridFilterModel,
  type GridSortModel,
  type GridRowClassNameParams,
  type GridValidRowModel,
} from '@mui/x-data-grid'

import { type PaginatedGridInterface } from '../../types/grid.types'

import type { FilterCondition } from './FilterPanel'

/**
 * Generic row interface for grid rows that support deletion
 */
export interface DeletableRow {
  isDeleted?: boolean
}

/**
 * DataGrid density options enum
 */
export enum GridDensity {
  COMPACT = 'compact',
  STANDARD = 'standard',
  COMFORTABLE = 'comfortable',
}

/**
 * Type for GridDensity values
 */
export type GridDensityType = GridDensity.COMPACT | GridDensity.STANDARD | GridDensity.COMFORTABLE

/**
 * Filter logic operator enum
 */
export enum LogicOperator {
  AND = 'AND',
  OR = 'OR',
}

/**
 * Type for LogicOperator values
 */
export type LogicOperatorType = LogicOperator.AND | LogicOperator.OR

/**
 * LocalStorage key for storing DataGrid density preference
 */
export const DENSITY_STORAGE_KEY = 'mui-data-grid-density'

/**
 * Get initial density setting from localStorage
 * Returns STANDARD as default if no preference is stored or if there's an error
 */
export const getInitialDensity = (): GridDensityType => {
  try {
    const storedDensity = localStorage.getItem(DENSITY_STORAGE_KEY)
    const validDensities = Object.values(GridDensity)
    if (storedDensity && validDensities.includes(storedDensity as GridDensity)) {
      return storedDensity as GridDensityType
    }
    return GridDensity.STANDARD
  } catch {
    return GridDensity.STANDARD
  }
}

interface CustomFilteringForDataGridProps {
  gridFilterModel: GridFilterModel
  setGridFunction: (paginationRequestModel: PaginatedGridInterface) => void
  paginatedGridModel: PaginatedGridInterface
  selectionModel?: unknown[]
  prevSelectionModel?: React.MutableRefObject<unknown[] | undefined>
}

/**
 * Handles filter changes in the DataGrid
 * Converts MUI DataGrid filter model to our custom filter format
 * and updates the pagination model
 */
export const filterChangeFunction = (props: CustomFilteringForDataGridProps): void => {
  const filterItem = props.gridFilterModel.items[0]

  if (filterItem.value) {
    // Update filter - matching Spring API UserRequestModel format
    props.setGridFunction({
      start: 0, // Reset to first page when filtering
      end: props.paginatedGridModel.pageSize,
      pageSize: props.paginatedGridModel.pageSize,
      includeDeleted: props.paginatedGridModel.includeDeleted,
      includeExpired: props.paginatedGridModel.includeExpired,
      data: props.paginatedGridModel.data,
      actualDataCount: props.paginatedGridModel.actualDataCount,
      totalPaginationBlockCount: props.paginatedGridModel.totalPaginationBlockCount,
      columnName: filterItem.field,
      condition: filterItem.operator,
      filterExpr: filterItem.value != null ? String(filterItem.value) : '',
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
      totalPaginationBlockCount: props.paginatedGridModel.totalPaginationBlockCount,
      columnName: undefined,
      condition: undefined,
      filterExpr: undefined,
    })
  }

  // Retain previously selected rows for selection grids
  if (props.selectionModel !== undefined && props.prevSelectionModel !== undefined) {
    // eslint-disable-next-line no-param-reassign -- Required for maintaining selection state
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
export const getRandomColor = (userId: number): string => AVATAR_COLORS[userId % AVATAR_COLORS.length]

/**
 * Returns styling for Chip components
 */
export const chipStyles = (backgroundColor: string, textColor: string): React.CSSProperties => ({
  backgroundColor,
  color: textColor,
  fontWeight: 'bold',
  borderColor: backgroundColor,
})

/**
 * Handle pagination changes from DataGrid
 * Updates the pagination model with new page and page size
 */
export const handlePaginationModelChange = (
  model: GridPaginationModel,
  setPaginationModel: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>,
): void => {
  const start = model.page * model.pageSize
  const end = start + model.pageSize

  setPaginationModel(prev => ({
    ...prev,
    start,
    end,
    pageSize: model.pageSize,
  }))
}

/**
 * Handle filter changes from DataGrid
 * Uses the existing filterChangeFunction to update filters
 */
export const handleFilterModelChange = (
  model: GridFilterModel,
  paginationModel: PaginatedGridInterface,
  setPaginationModel: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>,
): void => {
  filterChangeFunction({
    gridFilterModel: model,
    setGridFunction: setPaginationModel,
    paginatedGridModel: paginationModel,
  })
}

/**
 * Handle sorting changes from DataGrid
 * Updates the pagination model with sort column and direction
 */
export const handleSortModelChange = (
  model: GridSortModel,
  setPaginationModel: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>,
): void => {
  if (model.length > 0) {
    const sortField = model[0].field
    const sortOrder = model[0].sort

    setPaginationModel(prev => ({
      ...prev,
      columnName: sortField,
      condition: sortOrder === 'desc' ? 'desc' : 'asc',
    }))
  } else {
    // Clear sorting
    setPaginationModel(prev => ({
      ...prev,
      columnName: undefined,
      condition: undefined,
    }))
  }
}

/**
 * Handle include deleted checkbox changes
 * Updates both includeDeleted state and pagination model, resetting to first page
 */
export const handleIncludeDeletedChange = (
  checked: boolean,
  setIncludeDeleted: React.Dispatch<React.SetStateAction<boolean>>,
  setPaginationModel: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>,
): void => {
  setIncludeDeleted(checked)

  setPaginationModel(prev => ({
    ...prev,
    includeDeleted: checked,
    start: 0, // Reset to first page
  }))
}

/**
 * Handle custom pagination component page changes
 * Updates pagination model with new start and end indices
 */
export const handleCustomPaginationChange = (
  page: number,
  pageSize: number,
  setPaginationModel: React.Dispatch<React.SetStateAction<PaginatedGridInterface>>,
): void => {
  const start = (page - 1) * pageSize
  const end = start + pageSize

  setPaginationModel(prev => ({
    ...prev,
    start,
    end,
  }))
}

/**
 * Get row class name for styling deleted rows
 * Returns 'even' or 'odd' plus 'deleted' if the row is deleted
 */
export const getRowClassName = <T extends DeletableRow>(params: GridRowClassNameParams<GridValidRowModel>): string => {
  const row = params.row as T
  const classes = [params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd']
  if (row.isDeleted) {
    classes.push('deleted')
  }
  return classes.join(' ')
}

/**
 * Generic fetch function factory for grid data
 * Handles loading state, API calls, error handling, and state updates
 *
 * @param apiCall - The API function to call with pagination/filter parameters
 * @param setLoading - State setter for loading state
 * @param setRows - State setter for rows data
 * @param setTotalCount - State setter for total count
 * @param paginationModel - Current pagination model
 * @param includeDeleted - Whether to include deleted items
 * @param activeFilterGroup - Current filter group
 * @param errorMessage - Optional custom error message (default: 'Failed to fetch data')
 * @returns Promise that resolves when fetch is complete
 */
export const createFetchFunction = async <T>(
  apiCall: (params: {
    start: number
    end: number
    includeDeleted: boolean
    logicOperator: LogicOperatorType
    filters: FilterCondition[]
  }) => Promise<{ data: T[]; totalDataCount: number }>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setRows: React.Dispatch<React.SetStateAction<T[]>>,
  setTotalCount: React.Dispatch<React.SetStateAction<number>>,
  paginationModel: PaginatedGridInterface,
  includeDeleted: boolean,
  activeFilterGroup: { logicOperator: LogicOperatorType; filters: FilterCondition[] },
  errorMessage: string = 'Failed to fetch data',
): Promise<void> => {
  setLoading(true)
  try {
    const response = await apiCall({
      start: paginationModel.start,
      end: paginationModel.end,
      includeDeleted: includeDeleted,
      logicOperator: activeFilterGroup.logicOperator,
      filters: activeFilterGroup.filters,
    })

    setRows(response.data)
    setTotalCount(response.totalDataCount)
  } catch (error) {
    console.error(errorMessage, error)
    setRows([])
    setTotalCount(0)
  } finally {
    setLoading(false)
  }
}

/**
 * Generic toggle function factory for grid entities
 * Handles API calls and refetches data after toggle
 *
 * @param toggleApiCall - The API function to call for toggling (e.g., toggleUser, toggleProduct)
 * @param entityId - The ID of the entity to toggle
 * @param refetchFunction - Function to refetch data after successful toggle
 * @param errorMessage - Optional custom error message (default: 'Failed to toggle')
 * @returns Promise that resolves when toggle is complete
 */
export const createToggleFunction = async (
  toggleApiCall: (id: number) => Promise<void>,
  entityId: number,
  refetchFunction: () => Promise<void>,
  errorMessage: string = 'Failed to toggle',
): Promise<void> => {
  try {
    await toggleApiCall(entityId)
    // Refetch data to show updated status
    await refetchFunction()
  } catch (error) {
    console.error(errorMessage, error)
    throw error // Re-throw so caller can handle it (e.g., show toast)
  }
}
