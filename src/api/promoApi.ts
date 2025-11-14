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
  getPromosInBatches: async (request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/getPromosInBatches`, request)
    return response.data
  },

  /**
   * Get promo details by ID
   */
  getPromoById: async (promoId: number) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/getPromoDetailsById/${promoId}`)
    return response.data
  },

  /**
   * Create a new promo
   */
  createPromo: async (request: any) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/createPromo`, request)
    return response.data
  },

  /**
   * Update an existing promo
   */
  updatePromo: async (promoId: number, request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/updatePromo/${promoId}`, request)
    return response.data
  },

  /**
   * Toggle promo (activate/deactivate)
   */
  togglePromo: async (promoId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/togglePromo/${promoId}`)
    return response.data
  },
}

export default promoApi

