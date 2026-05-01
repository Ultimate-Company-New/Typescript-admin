/**
 * User-related TypeScript interfaces matching the Spring API models
 */

import { type AddressRequestModel, type AddressResponseModel } from './AddressModels'

export interface FilterCondition {
  column: string
  operator: string
  value: string | number | boolean | null | undefined
}

export interface UserRequestModel {
  userId?: number
  loginName?: string
  firstName?: string
  lastName?: string
  password?: string
  salt?: string
  role?: string
  dob?: string
  phone?: string
  email?: string
  emailConfirmed?: boolean
  deleted?: boolean
  isDeleted?: boolean
  locked?: boolean
  notes?: string
  // Address
  address?: AddressRequestModel
  // Permissions and Groups
  permissionIds?: number[]
  selectedGroupIds?: number[]
  // Profile Picture
  profilePictureBase64?: string
  // Pagination fields
  start?: number
  end?: number
  pageSize?: number
  includeDeleted?: boolean
  // Multi-filter support
  logicOperator?: 'AND' | 'OR'
  filters?: FilterCondition[]
  // Legacy filtering fields (deprecated)
  columnName?: string
  condition?: string
  filterExpr?: string
  selectedUserIds?: number[] // Optional user IDs to filter
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
  isDeleted: boolean // Changed from 'deleted' to match Java
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

export interface UserGroupResponseModel {
  groupId: number
  groupName: string
  description?: string
  users?: {
    userId: number
    firstName?: string
    lastName?: string
    email?: string
    loginName?: string
    phone?: string
    role?: string
    isDeleted?: boolean
    emailConfirmed?: boolean
    profilePicture?: string
  }[]
  isDeleted?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface PaginationBaseResponseModel<T> {
  data: T[]
  totalDataCount: number // Matches Java: setTotalDataCount()
}
