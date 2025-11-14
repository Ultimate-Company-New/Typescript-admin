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
  getPackagesInBatches: async (request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/getPackagesInBatches`, request)
    return response.data
  },

  /**
   * Get package details by ID
   */
  getPackageById: async (packageId: number) => {
    const response = await axiosInstance.get(`${API_BASE_URL}/getPackageDetailsById/${packageId}`)
    return response.data
  },

  /**
   * Create a new package
   */
  createPackage: async (request: any) => {
    const response = await axiosInstance.put(`${API_BASE_URL}/createPackage`, request)
    return response.data
  },

  /**
   * Update an existing package
   */
  updatePackage: async (packageId: number, request: any) => {
    const response = await axiosInstance.post(`${API_BASE_URL}/updatePackage/${packageId}`, request)
    return response.data
  },

  /**
   * Toggle package (activate/deactivate)
   */
  togglePackage: async (packageId: number) => {
    const response = await axiosInstance.delete(`${API_BASE_URL}/togglePackage/${packageId}`)
    return response.data
  },
}

export default packageApi

