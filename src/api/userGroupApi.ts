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
  filters?: any[]
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
  getUserGroups: async (request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/getUserGroupsInBatches`, request)
    return response.data
  },

  /**
   * Get user group by ID
   */
  getUserGroupById: async (userGroupId: number): Promise<UserGroupResponseModel> => {
    const response = await axiosInstance.get(`${API_BASE_URL}/getUserGroupDetailsById/${userGroupId}`)
    return response.data
  },

  /**
   * Create new user group
   */
  createUserGroup: async (request: UserGroupRequestModel) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/createUserGroup`, request)
    return response.data
  },

  /**
   * Update existing user group
   */
  updateUserGroup: async (userGroupId: number, request: UserGroupRequestModel) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/updateUserGroup/${userGroupId}`, request)
    return response.data
  },

  /**
   * Toggle user group (activate/deactivate)
   */
  toggleUserGroup: async (userGroupId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/toggleUserGroup/${userGroupId}`)
    return response.data
  },

  /**
   * Bulk import user groups
   */
  bulkImportUserGroups: async (request: BulkUserGroupImportRequest) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/bulkImport`, request)
    return response.data
  },

  /**
   * Get all users (for selection grid)
   */
  getAllUsers: async () => {
    const response = await axiosInstance.get(`/User/all`)
    return response.data
  },
}

export default userGroupApi

