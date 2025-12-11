import type { ProductRequestModel } from '../models/api-models'
import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

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
  getProductsInBatches: async (request: PaginationBaseRequestModel): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getProductsInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get product details by ID
   */
  getProductById: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getProductDetailsById/${productId}`)
    return response.data
  },

  /**
   * Create a new product
   */
  createProduct: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/addProduct`, request)
    return response.data
  },

  /**
   * Update an existing product
   */
  updateProduct: async (_productId: number, request: unknown): Promise<unknown> => {
    // Note: productId is in the request body, not the URL path
    const response = await axiosInstance.post<unknown>(`${API_BASE_URL}/editProduct`, request)
    return response.data
  },

  /**
   * Toggle product (activate/deactivate)
   */
  toggleProduct: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleDeleteProduct/${productId}`)
    return response.data
  },

  /**
   * Toggle product returns allowed status
   */
  toggleProductReturns: async (productId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/toggleReturnProduct/${productId}`)
    return response.data
  },

  /**
   * Bulk create products
   * Triggers async processing - results sent via notification
   */
  bulkCreateProducts: async (products: ProductRequestModel[]): Promise<void> => {
    await axiosInstance.put<void>(`${API_BASE_URL}/bulkAddProduct`, products)
  },

  /**
   * Get product image URL
   */
  getProductImageUrl: (productId: number, imageName: string = 'Main'): string => {
    // Determine base URL based on environment
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''

    const baseUrl = isLocalhost
      ? 'http://localhost:4433/api'
      : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4433/api')

    return `${baseUrl}${API_BASE_URL}/getProductImage?imageName=${imageName}&productId=${productId}`
  },
}

export default productApi
