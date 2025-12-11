import * as React from 'react'

import { format } from 'date-fns'
import { toast } from 'react-toastify'
import * as XLSX from 'xlsx'
import type { ZodType } from 'zod'

import {
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowClassNameParams,
  type GridSortModel,
  type GridValidRowModel,
} from '@mui/x-data-grid'

import type { FilterCondition, FilterGroup } from '../components/datagrid/FilterPanel'
import { STATE_ABBREVIATIONS } from '../constants/appConstants'
import { type AddressResponseModel } from '../models/api-models'
import {
  ExcelRowParser,
  createColumnIndexMap,
  createColumnIndexMapFromHeader,
  type TemplateStructure,
} from '../models/ImportTemplateStructure'
import { type PaginatedGridInterface } from '../types/grid.types'

// ============================================================================
// Grid Helper Types and Enums
// ============================================================================

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

// ============================================================================
// Grid Helper Constants
// ============================================================================

/**
 * LocalStorage key for storing DataGrid density preference
 */
export const DENSITY_STORAGE_KEY = 'mui-data-grid-density'

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

// ============================================================================
// Grid Helper Functions
// ============================================================================

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
 * @param successMessage - Optional custom success message (defaults to "Updated successfully")
 * @returns Promise that resolves when toggle is complete
 */
export const createToggleFunction = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toggleApiCall: (id: number) => Promise<any>,
  entityId: number,
  refetchFunction: () => Promise<void>,
  successMessage = 'Updated successfully',
): Promise<void> => {
  try {
  await toggleApiCall(entityId)
  // Refetch data to show updated status
  await refetchFunction()
    toast.success(successMessage)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update'
    toast.error(errorMessage)
  }
}

// ============================================================================
// Formatting Helper Functions
// ============================================================================

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

// ============================================================================
// Excel Import/Export Utilities
// ============================================================================

type StylableCell = XLSX.CellObject & { s?: Record<string, unknown> }

const applyCellStyle = (cell: XLSX.CellObject | string | undefined, style: Record<string, unknown>): void => {
  if (!cell || typeof cell === 'string') {
    return
  }

  const stylableCell = cell as StylableCell
  stylableCell.s = style
}

const sanitizeHeader = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')

interface TemplateDownloadOptions {
  templateStructure: TemplateStructure
  sheetName?: string
  fileName: string
  columnWidth?: number
}

export const downloadImportTemplate = ({
  templateStructure,
  sheetName = 'Template',
  fileName,
  columnWidth = 15,
}: TemplateDownloadOptions): void => {
  const wb = XLSX.utils.book_new()

  const categoryRow: string[] = []
  const fieldRow: string[] = []

  templateStructure.forEach(section => {
    categoryRow.push(section.category)
    section.fields.slice(1).forEach(() => categoryRow.push(''))
    fieldRow.push(...section.fields)
  })

  const ws = XLSX.utils.aoa_to_sheet([categoryRow, fieldRow])

  const merges: XLSX.Range[] = []
  let colIndex = 0

  templateStructure.forEach(section => {
    const startCol = colIndex
    const endCol = colIndex + section.fields.length - 1
    merges.push({
      s: {
        r: 0,
        c: startCol,
      },
      e: {
        r: 0,
        c: endCol,
      },
    })
    colIndex += section.fields.length
  })

  ws['!merges'] = merges

  ws['!cols'] = fieldRow.map(() => ({
    wch: columnWidth,
  }))

  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
  const categoryHeaderStyle: Record<string, unknown> = {
    font: {
      bold: true,
      sz: 12,
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
    fill: {
      fgColor: {
        rgb: 'D3D3D3',
      },
    },
  }
  const fieldHeaderStyle: Record<string, unknown> = {
    font: {
      bold: true,
    },
    alignment: {
      horizontal: 'center',
    },
    fill: {
      fgColor: {
        rgb: 'E8E8E8',
      },
    },
  }

  for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
    const categoryCell = XLSX.utils.encode_cell({
      r: 0,
      c: columnIndex,
    })
    const categoryCellObject = ws[categoryCell] as XLSX.CellObject | string | undefined
    applyCellStyle(categoryCellObject, categoryHeaderStyle)

    const fieldCell = XLSX.utils.encode_cell({
      r: 1,
      c: columnIndex,
    })
    const fieldCellObject = ws[fieldCell] as XLSX.CellObject | string | undefined
    applyCellStyle(fieldCellObject, fieldHeaderStyle)
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, fileName, {
    cellStyles: true,
    bookType: 'xlsx',
  })
}

interface RowParsingHelpers {
  rowNumber: number
  rowParser: ExcelRowParser
  getRequiredValue: (fieldName: string, fallback?: string) => string
  getOptionalValue: (fieldName: string) => string | undefined
}

interface RowBuildResult<TParsed, TValidation> {
  parsedRow: TParsed
  validationPayload: TValidation
}

export interface ParseImportFileOptions<TParsed, TValidation> {
  file: File
  templateStructure: TemplateStructure
  headerNames: Record<string, string>
  maxRecords: number
  validator?: ZodType<TValidation>
  createRowData: (helpers: RowParsingHelpers) => RowBuildResult<TParsed, TValidation>
}

export interface ParsedRowResult<TParsed> {
  rowNumber: number
  data: TParsed
  errors?: string[]
}

export const parseImportFile = <TParsed, TValidation>({
  file,
  templateStructure,
  headerNames,
  maxRecords,
  validator,
  createRowData,
}: ParseImportFileOptions<TParsed, TValidation>): Promise<Array<ParsedRowResult<TParsed>>> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      try {
        const data = e.target?.result
        if (!data) {
          throw new Error('Failed to read file')
        }

        const workbook = XLSX.read(data, { type: 'binary' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const sheetData: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

        if (sheetData.length < 3) {
          throw new Error('File is empty or invalid (must have 2 header rows and at least 1 data row)')
        }

        const dataRowCount = sheetData.length - 2
        if (dataRowCount > maxRecords) {
          throw new Error(
            `File contains ${dataRowCount} rows but maximum allowed is ${maxRecords}. Please select a higher limit or reduce the number of rows in your file.`,
          )
        }

        const templateColumnMap = createColumnIndexMap(templateStructure)
        const headerRowRaw = sheetData[1] as Array<string | number | boolean | undefined>
        const headerRow = headerRowRaw.map(value => (value != null ? String(value) : ''))
        const headerColumnMap = createColumnIndexMapFromHeader(headerRow)
        const sanitizedHeaderMap = new Map<string, number>()
        headerRow.forEach((value, index) => {
          if (value) {
            sanitizedHeaderMap.set(sanitizeHeader(value), index)
          }
        })

        const columnMap = new Map<string, number>()
        templateColumnMap.forEach((index, fieldName) => {
          let resolvedIndex = headerColumnMap.get(fieldName)
          if (resolvedIndex === undefined) {
            resolvedIndex = sanitizedHeaderMap.get(sanitizeHeader(fieldName))
          }
          if (resolvedIndex === undefined) {
            const friendlyName = headerNames[fieldName]
            if (friendlyName) {
              resolvedIndex = sanitizedHeaderMap.get(sanitizeHeader(friendlyName))
            }
          }
          columnMap.set(fieldName, resolvedIndex ?? index)
        })

        const parsedResults: Array<ParsedRowResult<TParsed>> = []

        for (let i = 2; i < sheetData.length; i++) {
          const row = sheetData[i] as Array<string | number | boolean | undefined | null>
          const rowParser = new ExcelRowParser(columnMap, row)
          const rowValueMap = new Map<string, string>()
          headerRow.forEach((headerLabel, headerIndex) => {
            if (!headerLabel) return
            const sanitized = sanitizeHeader(headerLabel)
            const cellValue = row[headerIndex]
            rowValueMap.set(sanitized, cellValue !== undefined && cellValue !== null ? String(cellValue) : '')
          })

          const resolveHeaderValue = (fieldName: string): string | undefined => {
            const directValue = rowValueMap.get(sanitizeHeader(fieldName))
            if (directValue !== undefined) {
              return directValue
            }
            const friendlyHeader = headerNames[fieldName]
            if (friendlyHeader) {
              const friendlyValue = rowValueMap.get(sanitizeHeader(friendlyHeader))
              if (friendlyValue !== undefined) {
                return friendlyValue
              }
            }
            return undefined
          }

          const getOptionalValue = (fieldName: string): string | undefined => {
            const resolved = resolveHeaderValue(fieldName)
            if (resolved !== undefined) {
              return resolved || undefined
            }
            return rowParser.getOptionalString(fieldName)
          }

          const getRequiredValue = (fieldName: string, fallback?: string): string => {
            const resolved = resolveHeaderValue(fieldName)
            if (resolved !== undefined && resolved !== '') {
              return resolved
            }
            return fallback ?? rowParser.getString(fieldName)
          }

          const { parsedRow, validationPayload } = createRowData({
            rowNumber: i - 1,
            rowParser,
            getOptionalValue,
            getRequiredValue,
          })

          let errors: string[] | undefined
          if (validator) {
            const validationResult = validator.safeParse(validationPayload)
            if (!validationResult.success) {
              errors = validationResult.error.errors.map(err => {
                const fieldName = err.path.join('.')
                return `${fieldName}: ${err.message}`
              })
            }
          }

          parsedResults.push({
            rowNumber: i - 1,
            data: parsedRow,
            errors,
          })
        }

        resolve(parsedResults)
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to parse file'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsBinaryString(file)
  })

// ============================================================================
// Local Filtering Utilities
// ============================================================================

/**
 * Generic local filtering utility for DataGrid components
 * Applies multi-column filters with AND/OR logic to any data array
 *
 * @param data - Array of data to filter
 * @param filterGroup - Filter group containing filters and logic operator
 * @returns Filtered array
 */
export const applyLocalFilters = <T extends object>(data: T[], filterGroup: FilterGroup): T[] => {
  if (filterGroup.filters.length === 0) {
    return data
  }

  return data.filter((row: T) => {
    const rowRecord = row as Record<string, unknown>
    const results = filterGroup.filters.map((filter: FilterCondition) => {
      const value = rowRecord[filter.column]
      const filterValue = filter.value as string

      // Handle different operators
      switch (filter.operator) {
        // String operators
        case 'contains':
          return String(value ?? '')
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        case 'equals':
          return String(value ?? '').toLowerCase() === filterValue.toLowerCase()
        case 'startsWith':
          return String(value ?? '')
            .toLowerCase()
            .startsWith(filterValue.toLowerCase())
        case 'endsWith':
          return String(value ?? '')
            .toLowerCase()
            .endsWith(filterValue.toLowerCase())
        case 'isEmpty':
          return !value || String(value).trim() === ''
        case 'isNotEmpty':
          return value != null && String(value).trim() !== ''

        // Number operators
        case '=':
          return Number(value) === Number(filterValue)
        case '!=':
          return Number(value) !== Number(filterValue)
        case '>':
          return Number(value) > Number(filterValue)
        case '>=':
          return Number(value) >= Number(filterValue)
        case '<':
          return Number(value) < Number(filterValue)
        case '<=':
          return Number(value) <= Number(filterValue)

        // Boolean operators
        case 'is':
          if (typeof value === 'boolean') {
            return value === (filterValue.toLowerCase() === 'true')
          }
          return String(value).toLowerCase() === filterValue.toLowerCase()

        // Date operators
        case 'isAfter':
          return new Date(String(value)) > new Date(filterValue)
        case 'isOnOrAfter':
          return new Date(String(value)) >= new Date(filterValue)
        case 'isBefore':
          return new Date(String(value)) < new Date(filterValue)
        case 'isOnOrBefore':
          return new Date(String(value)) <= new Date(filterValue)
        case 'isNot':
          return String(value) !== filterValue

        default:
          return true
      }
    })

    // Apply logic operator (AND/OR)
    if (filterGroup.logicOperator === LogicOperator.OR) {
      return results.some((result: boolean) => result)
    }
    return results.every((result: boolean) => result)
  })
}

/**
 * Hook for managing local filtering state and logic
 * Returns filtered data and filter state management
 *
 * @example
 * ```typescript
 * const {
 *   filteredData,
 *   activeFilterGroup,
 *   setActiveFilterGroup,
 * } = useLocalFiltering(rawData)
 * ```
 */
interface UseLocalFilteringResult<T> {
  filteredData: T[]
  activeFilterGroup: FilterGroup
  setActiveFilterGroup: React.Dispatch<React.SetStateAction<FilterGroup>>
}

export const useLocalFiltering = <T extends object>(
  rawData: T[],
  initialFilterGroup?: FilterGroup,
): UseLocalFilteringResult<T> => {
  const [activeFilterGroup, setActiveFilterGroup] = React.useState<FilterGroup>(
    initialFilterGroup ?? {
      logicOperator: LogicOperator.AND,
      filters: [],
    },
  )

  const filteredData = React.useMemo(() => applyLocalFilters(rawData, activeFilterGroup), [rawData, activeFilterGroup])

  return {
    filteredData,
    activeFilterGroup,
    setActiveFilterGroup,
  }
}
