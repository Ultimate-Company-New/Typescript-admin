import { format } from 'date-fns'

import {
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowClassNameParams,
  type GridSortModel,
  type GridValidRowModel,
} from '@mui/x-data-grid'

import { STATE_ABBREVIATIONS } from '../../constants/appConstants'
import { type AddressResponseModel } from '../../models/AddressModels'
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
 * @returns Promise that resolves when fetch is complete
 */
export const createFetchFunction = async <T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  apiCall: (params: any) => Promise<{ data: any; totalDataCount: number }>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setRows: React.Dispatch<React.SetStateAction<T[]>>,
  setTotalCount: React.Dispatch<React.SetStateAction<number>>,
  paginationModel: PaginatedGridInterface,
  includeDeleted: boolean,
  activeFilterGroup: { logicOperator: LogicOperatorType; filters: FilterCondition[] },
): Promise<void> => {
  setLoading(true)
  try {
    const response = await apiCall({
      start: paginationModel.start,
      end: paginationModel.end,
      pageSize: paginationModel.pageSize,
      includeDeleted: includeDeleted,
      logicOperator: activeFilterGroup.logicOperator,
      filters: activeFilterGroup.filters,
    })

    setRows(response.data as T[])
    setTotalCount(response.totalDataCount)
  } catch (error) {
    // Error is logged by axios interceptor
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
 * @returns Promise that resolves when toggle is complete
 */
export const createToggleFunction = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleApiCall: (id: number) => Promise<any>,
  entityId: number,
  refetchFunction: () => Promise<void>,
): Promise<void> => {
  await toggleApiCall(entityId)
  // Refetch data to show updated status
  await refetchFunction()
}

/**
 * Phone formatting helper functions for grid cells
 */

/**
 * Default phone formatter
 * Formats phone numbers based on length:
 * - 10 digits: (123) - 456 - 7890
 * - 11 digits: (+12) - 345 - 67890
 * - Other: returns as-is
 *
 * @example
 * {
 *   field: 'phone',
 *   headerName: 'Phone',
 *   valueFormatter: (value) => formatPhone(value),
 * }
 */
export const formatPhone = (value: string | number | null | undefined, emptyText: string = '—'): string => {
  if (!value) return emptyText

  const phoneStr = typeof value === 'number' ? String(value) : value

  if (typeof phoneStr !== 'string') return emptyText

  // Remove all non-digit characters
  const cleaned = phoneStr.replace(/\D/g, '')

  // Format based on length
  if (cleaned.length === 10) {
    // US format: (123) - 456 - 7890
    return `(${cleaned.slice(0, 3)}) - ${cleaned.slice(3, 6)} - ${cleaned.slice(6)}`
  }

  if (cleaned.length === 11) {
    // International format with country code: (+12) - 345 - 67890
    return `(+${cleaned.slice(0, 2)}) - ${cleaned.slice(2, 5)} - ${cleaned.slice(5)}`
  }

  // If not 10 or 11 digits, return original value
  return phoneStr
}

/**
 * UTC Timestamp formatting helper functions for grid cells
 */

/**
 * Utility function to format UTC timestamp as a string (for valueFormatter)
 * Use this when you don't need a React component but just want formatted text
 *
 * @example
 * {
 *   field: 'createdAt',
 *   headerName: 'Created (UTC)',
 *   valueFormatter: (value) => formatUTCTimestamp(value),
 * }
 */
export const formatUTCTimestamp = (
  value: unknown,
  formatString: string = 'MMM dd, yyyy HH:mm',
  emptyText: string = 'Never',
  showUTCSuffix: boolean = true,
): string => {
  if (!value) return emptyText

  try {
    const formattedDate = format(new Date(value as string), formatString)
    return showUTCSuffix ? `${formattedDate} UTC` : formattedDate
  } catch {
    return String(value)
  }
}

/**
 * Date formatting helper functions for grid cells
 */

/**
 * Utility function to format date as a string (for valueFormatter)
 * Use this when you don't need a React component but just want formatted text
 *
 * @example
 * {
 *   field: 'dob',
 *   headerName: 'Date of Birth',
 *   valueFormatter: (value) => formatDate(value),
 * }
 *
 * @example
 * {
 *   field: 'expiryDate',
 *   headerName: 'Expiry Date',
 *   valueFormatter: (value) => formatDate(value, 'MM/dd/yyyy', 'N/A'),
 * }
 */
export const formatDate = (value: unknown, formatString: string = 'do MMM yyyy', emptyText: string = '—'): string => {
  if (!value) return emptyText

  try {
    return format(new Date(value as string), formatString)
  } catch {
    return String(value)
  }
}

/**
 * Address-related helper functions for grid cells
 */

/**
 * Utility function to get state abbreviation
 */
export const getStateAbbreviation = (state: string): string => STATE_ABBREVIATIONS[state] || state

/**
 * Utility function to format address as a single-line string
 * Use this when you don't need a React component but just want formatted text
 *
 * @example
 * {
 *   field: 'addresses',
 *   headerName: 'Address',
 *   valueFormatter: (value) => formatAddressShort(value as AddressResponseModel[]),
 * }
 */
export const formatAddressShort = (
  addresses: AddressResponseModel[] | null | undefined,
  emptyText: string = '—',
): string => {
  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return emptyText
  }

  const primaryAddress = addresses.find(addr => addr.isPrimary) ?? addresses[0]
  const stateAbbr = getStateAbbreviation(primaryAddress.state)
  const shortDisplayParts = [primaryAddress.city, stateAbbr].filter(Boolean)
  return shortDisplayParts.length > 0 ? shortDisplayParts.join(', ') : primaryAddress.country || emptyText
}

/**
 * Utility function to format full address as a multi-line string
 * Use this for tooltips or detailed views
 *
 * @example
 * const fullAddress = formatAddressFull(user.addresses)
 */
export const formatAddressFull = (
  addresses: AddressResponseModel[] | null | undefined,
  emptyText: string = 'Address not available',
): string => {
  if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
    return emptyText
  }

  const primaryAddress = addresses.find(addr => addr.isPrimary) ?? addresses[0]
  const addressLines: string[] = []

  if (primaryAddress.streetAddress) addressLines.push(String(primaryAddress.streetAddress))
  if (primaryAddress.streetAddress2) addressLines.push(String(primaryAddress.streetAddress2))
  if (primaryAddress.streetAddress3) addressLines.push(String(primaryAddress.streetAddress3))

  const cityStateZip = [primaryAddress.city, primaryAddress.state, primaryAddress.postalCode].filter(Boolean).join(', ')
  if (cityStateZip) addressLines.push(cityStateZip)

  if (primaryAddress.country) addressLines.push(primaryAddress.country)

  return addressLines.length > 0 ? addressLines.join('\n') : emptyText
}
