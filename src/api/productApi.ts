import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Product'

/**
 * Product API Service
 * Handles all product-related API calls
 */
export const productApi = {
  /**
   * Get paginated products with filtering and sorting
   */
  getProductsInBatches: async (request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/getProductsInBatches`, request)
    return response.data
  },

  /**
   * Get product details by ID
   */
  getProductById: async (productId: number) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/getProductDetailsById/${productId}`)
    return response.data
  },

  /**
   * Create a new product
   */
  createProduct: async (request: any) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/createProduct`, request)
    return response.data
  },

  /**
   * Update an existing product
   */
  updateProduct: async (productId: number, request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/updateProduct/${productId}`, request)
    return response.data
  },

  /**
   * Toggle product (activate/deactivate)
   */
  toggleProduct: async (productId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/toggleDeleteProduct/${productId}`)
    return response.data
  },

  /**
   * Toggle product returns allowed status
   */
  toggleProductReturns: async (productId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/toggleReturnProduct/${productId}`)
    return response.data
  },

  /**
   * Get product image URL
   */
  getProductImageUrl: (productId: number, imageName: string = 'Main') => {
    // Determine base URL based on environment
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''
    
    const baseUrl = isLocalhost 
      ? 'http://localhost:4433/api' 
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4433/api')
    
    return `${baseUrl}${API_BASE_URL}/getProductImage?imageName=${imageName}&productId=${productId}`
  },
}

export default productApi

