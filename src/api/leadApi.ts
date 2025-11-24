import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Lead'

/**
 * Lead API Service
 * Handles all lead-related API calls
 */
export const leadApi = {
  /**
   * Get paginated leads with filtering and sorting
   */
  getLeadsInBatches: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getLeadsInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get lead details by ID
   */
  getLeadById: async (leadId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getLeadDetailsById/${leadId}`)
    return response.data
  },

  /**
   * Get lead details by email
   */
  getLeadByEmail: async (email: string): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getLeadDetailsByEmail/${email}`)
    return response.data
  },

  /**
   * Create a new lead
   */
  createLead: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createLead`, request)
    return response.data
  },

  /**
   * Update an existing lead
   */
  updateLead: async (leadId: number, request: unknown): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/updateLead/${leadId}`, request)
    return response.data
  },

  /**
   * Toggle lead (activate/deactivate)
   */
  toggleLead: async (leadId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleLead/${leadId}`)
    return response.data
  },
}

export default leadApi
