import type { PromoRequestModel, PromoResponseModel } from '../models/api-models'
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
  getPromosInBatches: async (
    request: PaginationBaseRequestModel,
  ): Promise<PaginationBaseResponseModel<PromoResponseModel>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<PromoResponseModel>>(
      `${API_BASE_URL}/getPromosInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get promo details by ID
   */
  getPromoById: async (promoId: number): Promise<PromoResponseModel> => {
    const response = await axiosInstance.get<PromoResponseModel>(`${API_BASE_URL}/getPromoDetailsById/${promoId}`)
    return response.data
  },

  /**
   * Get promo details by promo code
   */
  getPromoByCode: async (promoCode: string): Promise<PromoResponseModel> => {
    const response = await axiosInstance.get<PromoResponseModel>(`${API_BASE_URL}/getPromoDetailsByName/${promoCode}`)
    return response.data
  },

  /**
   * Create a new promo
   * Note: Promos cannot be edited after creation
   */
  createPromo: async (request: PromoRequestModel): Promise<void> => {
    await axiosInstance.put(`${API_BASE_URL}/createPromo`, request)
  },

  /**
   * Toggle promo (activate/deactivate)
   */
  togglePromo: async (promoId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/togglePromo/${promoId}`)
  },

  /**
   * Bulk create promos
   */
  bulkCreatePromos: async (promos: PromoRequestModel[]): Promise<void> => {
    await axiosInstance.put(`${API_BASE_URL}/bulkCreatePromo`, promos)
  },
}

export default promoApi
