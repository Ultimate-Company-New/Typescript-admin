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

export interface GridCheckbox {
  label: string
  checked: boolean
  onCheckboxChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

