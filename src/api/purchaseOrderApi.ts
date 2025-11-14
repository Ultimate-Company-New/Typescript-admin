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
  getPurchaseOrdersInBatches: async (request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/getPurchaseOrdersInBatches`, request)
    return response.data
  },

  /**
   * Get purchase order details by ID
   */
  getPurchaseOrderById: async (purchaseOrderId: number) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/getPurchaseOrderDetailsById/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Create a new purchase order
   */
  createPurchaseOrder: async (request: any) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/createPurchaseOrder`, request)
    return response.data
  },

  /**
   * Update an existing purchase order
   */
  updatePurchaseOrder: async (purchaseOrderId: number, request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/updatePurchaseOrder/${purchaseOrderId}`, request)
    return response.data
  },

  /**
   * Toggle purchase order (activate/deactivate)
   */
  togglePurchaseOrder: async (purchaseOrderId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/togglePurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Approve purchase order
   */
  approvePurchaseOrder: async (purchaseOrderId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/approvedByPurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Reject purchase order
   */
  rejectPurchaseOrder: async (purchaseOrderId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/rejectedByPurchaseOrder/${purchaseOrderId}`)
    return response.data
  },

  /**
   * Get purchase order PDF URL
   */
  getPurchaseOrderPdfUrl: (purchaseOrderId: number) => {
    // Determine base URL based on environment
    const isLocalhost = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === ''
    
    const baseUrl = isLocalhost 
      ? 'http://localhost:4433/api' 
      : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4433/api')
    
    return `${baseUrl}${API_BASE_URL}/getPurchaseOrderPdf/${purchaseOrderId}`
  },
}

export default purchaseOrderApi

