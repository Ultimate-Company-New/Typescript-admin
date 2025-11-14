import axiosInstance from './axiosConfig'
import {
  UserRequestModel,
  UserResponseModel,
  PaginationBaseResponseModel,
} from '../models/UserModels'

/**
 * API endpoints for user operations
 */
const API_ROUTES = {
  GET_USER_BY_ID: '/User/getUserById',
  GET_USER_BY_EMAIL: '/User/getUserByEmail',
  CREATE_USER: '/User/createUser',
  UPDATE_USER: '/User/updateUser',
  TOGGLE_USER: '/User/toggleUser',
  GET_USERS_IN_CARRIER_IN_BATCHES: '/User/getUsersInCarrierInBatches',
  CONFIRM_EMAIL: '/User/confirmEmail',
}

/**
 * User API Service
 * Handles all user-related API calls
 */
export const userApi = {
  /**
   * Fetches a user by their ID
   */
  getUserById: async (id: number): Promise<UserResponseModel> => {
    const response = await axiosInstance.get<UserResponseModel>(
      `${API_ROUTES.GET_USER_BY_ID}/${id}`
    )
    return response.data
  },

  /**
   * Fetches a user by their email
   */
  getUserByEmail: async (email: string): Promise<UserResponseModel> => {
    const response = await axiosInstance.get<UserResponseModel>(
      `${API_ROUTES.GET_USER_BY_EMAIL}/${email}`
    )
    return response.data
  },

  /**
   * Creates a new user
   */
  createUser: async (user: UserRequestModel): Promise<void> => {
    await axiosInstance.put(API_ROUTES.CREATE_USER, user)
  },

  /**
   * Updates an existing user
   */
  updateUser: async (
    id: number,
    user: UserRequestModel
  ): Promise<void> => {
    await axiosInstance.post(`${API_ROUTES.UPDATE_USER}/${id}`, user)
  },

  /**
   * Toggles user deletion status (soft delete/restore)
   */
  toggleUser: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${API_ROUTES.TOGGLE_USER}/${id}`)
  },

  /**
   * Fetches users in paginated batches with filtering and sorting
   * This is the main endpoint for the DataGrid
   */
  fetchUsersInCarrierInBatches: async (
    requestModel: UserRequestModel
  ): Promise<PaginationBaseResponseModel<UserResponseModel>> => {
    const response = await axiosInstance.post<
      PaginationBaseResponseModel<UserResponseModel>
    >(API_ROUTES.GET_USERS_IN_CARRIER_IN_BATCHES, requestModel)
    return response.data
  },

  /**
   * Confirms user email
   */
  confirmEmail: async (userId: number, token: string): Promise<void> => {
    await axiosInstance.post(
      `${API_ROUTES.CONFIRM_EMAIL}/${userId}?token=${encodeURIComponent(
        token
      )}`
    )
  },
}