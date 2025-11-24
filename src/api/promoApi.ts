import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Promo'

/**
 * Promo API Service
 * Handles all promo-related API calls
 */
export const promoApi = {
  /**
   * Get paginated promos with filtering and sorting
   */
  getPromosInBatches: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getPromosInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get promo details by ID
   */
  getPromoById: async (promoId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getPromoDetailsById/${promoId}`)
    return response.data
  },

  /**
   * Create a new promo
   */
  createPromo: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createPromo`, request)
    return response.data
  },

  /**
   * Update an existing promo
   */
  updatePromo: async (promoId: number, request: unknown): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/updatePromo/${promoId}`, request)
    return response.data
  },

  /**
   * Toggle promo (activate/deactivate)
   */
  togglePromo: async (promoId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/togglePromo/${promoId}`)
    return response.data
  },
}

export default promoApi
