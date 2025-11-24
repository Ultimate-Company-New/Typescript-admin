import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/PurchaseOrder'

/**
 * Purchase Order API Service
 * Handles all purchase order-related API calls
 */
export const purchaseOrderApi = {
  /**
   * Get paginated purchase orders with filtering and sorting
   */
  getPurchaseOrdersInBatches: async (
    request: PaginationBaseRequestModel,
  ): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getPurchaseOrdersInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get purchase order details by ID
   */
  getPurchaseOrderById: async (purchaseOrderId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(`${API_BASE_URL}/getPurchaseOrderDetailsById/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createPurchaseOrder`, request)
    return response.data
  },

  /**
   * Update an existing purchase order
   */
  updatePurchaseOrder: async (purchaseOrderId: number, request: unknown): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(
      `${API_BASE_URL}/updatePurchaseOrder/${purchaseOrderId}`,
      request,
    )
    return response.data
  },

  /**
   * Toggle purchase order (activate/deactivate)
   */
  togglePurchaseOrder: async (purchaseOrderId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/togglePurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Approve purchase order
   */
  approvePurchaseOrder: async (purchaseOrderId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/approvedByPurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Reject purchase order
   */
  rejectPurchaseOrder: async (purchaseOrderId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/rejectedByPurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Get purchase order PDF URL
   */
  getPurchaseOrderPdfUrl: (purchaseOrderId: number): string => {
    // Determine base URL based on environment
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''

    const baseUrl = isLocalhost
      ? 'http://localhost:4433/api'
      : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4433/api')

    return `${baseUrl}${API_BASE_URL}/getPurchaseOrderPdf/${purchaseOrderId}`
  },

  /**
   * Download purchase order PDF
   */
  downloadPurchaseOrderPdf: async (purchaseOrderId: number): Promise<Blob> => {
    const response = await axiosInstance.get<Blob>(`${API_BASE_URL}/getPurchaseOrderPdf/${purchaseOrderId}`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    })

    return response.data
  },
}

export default purchaseOrderApi
