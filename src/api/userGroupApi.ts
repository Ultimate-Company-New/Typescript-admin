import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/UserGroup'

/**
 * User Group Request Model
 */
export interface UserGroupRequestModel {
  userGroupId?: number
  name: string
  description: string
  notes?: string
  userIds: number[]
}

/**
 * User Group Response Model
 */
export interface UserGroupResponseModel {
  userGroupId: number
  name: string
  description: string
  notes?: string
  userCount: number
  userIds: number[]
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Pagination Request for User Groups
 */
export interface UserGroupPaginationRequest {
  start: number
  end: number
  pageSize: number
  includeDeleted?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
  filters?: unknown[]
}

/**
 * Bulk Import Request
 */
export interface BulkUserGroupImportRequest {
  maxRecords: number
  userGroups: Array<{
    name: string
    description: string
    notes?: string
    userIds: number[]
  }>
}

/**
 * User Group API Service
 */
export const userGroupApi = {
  /**
   * Get paginated user groups
   */
  getUserGroups: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getUserGroupsInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get user group by ID
   */
  getUserGroupById: async (userGroupId: number): Promise<UserGroupResponseModel> => {
    const response = await axiosInstance.get<UserGroupResponseModel>(
      `${API_BASE_URL}/getUserGroupDetailsById/${userGroupId}`,
    )
    return response.data
  },

  /**
   * Create new user group
   */
  createUserGroup: async (request: UserGroupRequestModel): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createUserGroup`, request)
    return response.data
  },

  /**
   * Update existing user group
   */
  updateUserGroup: async (userGroupId: number, request: UserGroupRequestModel): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/updateUserGroup/${userGroupId}`, request)
    return response.data
  },

  /**
   * Toggle user group (activate/deactivate)
   */
  toggleUserGroup: async (userGroupId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleUserGroup/${userGroupId}`)
    return response.data
  },

  /**
   * Bulk import user groups
   */
  bulkImportUserGroups: async (request: BulkUserGroupImportRequest): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/bulkImport`, request)
    return response.data
  },

  /**
   * Get all users (for selection grid)
   */
  getAllUsers: async (): Promise<unknown[]> => {
    const response = await axiosInstance.get<unknown[]>(`/User/all`)
    return response.data
  },
}

export default userGroupApi
