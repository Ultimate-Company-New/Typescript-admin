/**
 * User-related TypeScript interfaces matching the Spring API models
 */

export interface UserRequestModel {
  userId?: number
  loginName?: string
  firstName?: string
  lastName?: string
  password?: string
  role?: string
  dob?: string
  phone?: string
  emailConfirmed?: boolean
  deleted?: boolean
  // Pagination fields
  start?: number
  end?: number
  pageSize?: number
  includeDeleted?: boolean
  // Filtering fields
  columnName?: string  // Single column name for filtering/sorting
  condition?: string   // Filter condition (e.g., "contains", "equals")
  filterExpr?: string  // Filter expression value
  selectedUserIds?: number[]  // Optional user IDs to filter
}

export interface UserResponseModel {
  userId: number
  loginName: string
  firstName: string
  lastName: string
  phone: string
  datePasswordChanges?: string
  loginAttempts?: number
  role: string
  isDeleted: boolean  // Changed from 'deleted' to match Java
  locked?: boolean
  emailConfirmed: boolean
  dob: string
  isGuest?: boolean
  apiKey?: string
  email: string
  addressId?: number
  profilePicture?: string
  lastLoginAt?: string
  createdUser?: string
  modifiedUser?: string
  createdAt?: string
  updatedAt?: string
  notes?: string
  permissions?: UserPermissionInfo[]
  addresses?: AddressResponseModel[]
  userGroups?: UserGroupResponseModel[]
}

export interface UserPermissionInfo {
  permissionId: number
  permissionName: string
  permissionCode: string
  description?: string
  category?: string
}

export interface AddressResponseModel {
  addressId: number
  userId?: number
  clientId?: number
  street1?: string
  street2?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  addressType?: string
  isPrimary?: boolean
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UserGroupResponseModel {
  groupId: number
  groupName: string
  description?: string
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PaginationBaseResponseModel<T> {
  data: T[]
  totalDataCount: number  // Matches Java: setTotalDataCount()
}

