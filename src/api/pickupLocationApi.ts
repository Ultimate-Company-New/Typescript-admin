import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/PickupLocation'

/**
 * Pickup Location API Service
 * Handles all pickup location-related API calls
 */
export const pickupLocationApi = {
  /**
   * Get paginated pickup locations with filtering and sorting
   */
  getPickupLocationsInBatches: async (
    request: PaginationBaseRequestModel,
  ): Promise<PaginationBaseResponseModel<unknown>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<unknown>>(
      `${API_BASE_URL}/getPickupLocationsInBatches`,
      request,
    )
    return response.data
  },

  /**
   * Get pickup location details by ID
   */
  getPickupLocationById: async (pickupLocationId: number): Promise<unknown> => {
    const response = await axiosInstance.get<unknown>(
      `${API_BASE_URL}/getPickupLocationDetailsById/${pickupLocationId}`,
    )
    return response.data
  },

  /**
   * Create a new pickup location
   */
  createPickupLocation: async (request: unknown): Promise<unknown> => {
    const response = await axiosInstance.put<unknown>(`${API_BASE_URL}/createPickupLocation`, request)
    return response.data
  },

  /**
   * Update an existing pickup location
   */
  updatePickupLocation: async (pickupLocationId: number, request: unknown): Promise<unknown> => {
    const response = await axiosInstance.post<unknown>(
      `${API_BASE_URL}/updatePickupLocation/${pickupLocationId}`,
      request,
    )
    return response.data
  },

  /**
   * Toggle pickup location (activate/deactivate)
   */
  togglePickupLocation: async (pickupLocationId: number): Promise<unknown> => {
    const response = await axiosInstance.delete<unknown>(`${API_BASE_URL}/togglePickupLocation/${pickupLocationId}`)
    return response.data
  },
}

export default pickupLocationApi
