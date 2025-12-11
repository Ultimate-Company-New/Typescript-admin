import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Package'

/**
 * Package API Service
 * Handles all package-related API calls
 */
export const packageApi = {
  /**
   * Get paginated packages with filtering and sorting
   */
  getPackagesInBatches: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getPackagesInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get package details by ID
   */
  getPackageById: async (packageId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getPackageById/${packageId}`)
    return response.data
  },

  /**
   * Create a new package
   */
  createPackage: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createPackage`, request)
    return response.data
  },

  /**
   * Update an existing package
   */
  updatePackage: async (_packageId: number, request: unknown): Promise<unknown> => {
    // Note: packageId is included in the request body, not the URL path
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/updatePackage`, request)
    return response.data
  },

  /**
   * Toggle package (activate/deactivate)
   */
  togglePackage: async (packageId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/togglePackage/${packageId}`)
    return response.data
  },

  /**
   * Bulk create packages
   * Triggers async processing - results sent via message notification
   */
  bulkCreatePackages: async (packages: unknown[]): Promise<void> => {
    await axiosInstance.put<void>(`${API_BASE_URL}/bulkCreatePackage`, packages)
  },
}

export default packageApi
