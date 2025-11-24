/**
 * Core types and interfaces for DataGrid pagination and filtering
 */

export interface FilterExpression {
  columnName: string
  condition: string
  filterText: string
}

export interface PaginatedGridInterface {
  start: number
  end: number
  pageSize: number
  includeDeleted?: boolean
  includeExpired?: boolean
  data?: unknown[]
  actualDataCount?: number
  totalPaginationBlockCount?: number
  // Filter fields matching Spring API UserRequestModel
  columnName?: string
  condition?: string
  filterExpr?: string
}

export interface PaginationResponseModel<T> {
  data: T[]
  totalCount: number
}

/**
 * Base pagination response model matching Spring API structure
 */
export interface PaginationBaseResponseModel<T> {
  data: T[]
  totalDataCount: number
}

export interface GridCheckbox {
  label: string
  checked: boolean
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/**
 * Base pagination request model for API calls
 */
export interface PaginationBaseRequestModel {
  start: number
  end: number
  pageSize: number
  includeDeleted?: boolean
  includeExpired?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  filters?: unknown[]
  [key: string]: unknown
}
