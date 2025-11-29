import { type Permission } from '../components/users/components/UserPermissions'
import { type UserRequestModel, type UserResponseModel, type PaginationBaseResponseModel } from '../models/UserModels'

import axiosInstance from './axiosConfig'

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
  GET_ALL_PERMISSIONS: '/User/getAllPermissions',
}

export interface UserApi {
  getUserById: (id: number) => Promise<UserResponseModel>
  getUserByEmail: (email: string) => Promise<UserResponseModel>
  createUser: (user: UserRequestModel) => Promise<void>
  updateUser: (id: number, user: UserRequestModel) => Promise<void>
  toggleUser: (id: number) => Promise<void>
  fetchUsersInCarrierInBatches: (
    requestModel: UserRequestModel,
  ) => Promise<PaginationBaseResponseModel<UserResponseModel>>
  confirmEmail: (userId: number, token: string) => Promise<void>
  getAllPermissions: () => Promise<Permission[]>
}

/**
 * User API Service
 * Handles all user-related API calls
 */
/**
 * Fetches a user by their ID
 */
export const getUserById = async (id: number): Promise<UserResponseModel> => {
  const response = await axiosInstance.get<UserResponseModel>(`${API_ROUTES.GET_USER_BY_ID}/${id}`)
  return response.data
}

/**
 * Fetches a user by their email
 */
export const getUserByEmail = async (email: string): Promise<UserResponseModel> => {
  const response = await axiosInstance.get<UserResponseModel>(`${API_ROUTES.GET_USER_BY_EMAIL}/${email}`)
  return response.data
}

/**
 * Creates a new user
 */
export const createUser = async (user: UserRequestModel): Promise<void> => {
  await axiosInstance.put(API_ROUTES.CREATE_USER, user)
}

/**
 * Updates an existing user
 */
export const updateUser = async (id: number, user: UserRequestModel): Promise<void> => {
  await axiosInstance.post(`${API_ROUTES.UPDATE_USER}/${id}`, user)
}

/**
 * Toggles user deletion status (soft delete/restore)
 */
export const toggleUser = async (id: number): Promise<void> => {
  await axiosInstance.delete(`${API_ROUTES.TOGGLE_USER}/${id}`)
}

/**
 * Fetches users in paginated batches with filtering and sorting
 * This is the main endpoint for the DataGrid
 */
export const fetchUsersInCarrierInBatches = async (
  requestModel: UserRequestModel,
): Promise<PaginationBaseResponseModel<UserResponseModel>> => {
  const response = await axiosInstance.post<PaginationBaseResponseModel<UserResponseModel>>(
    API_ROUTES.GET_USERS_IN_CARRIER_IN_BATCHES,
    requestModel,
  )
  return response.data
}

/**
 * Confirms user email
 */
export const confirmEmail = async (userId: number, token: string): Promise<void> => {
  await axiosInstance.post(`${API_ROUTES.CONFIRM_EMAIL}/${userId}?token=${encodeURIComponent(token)}`)
}

/**
 * Fetches all permissions available in the system
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  const response = await axiosInstance.get<Permission[]>(API_ROUTES.GET_ALL_PERMISSIONS)
  return response.data
}

export const userApi: UserApi = {
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  toggleUser,
  fetchUsersInCarrierInBatches,
  confirmEmail,
  getAllPermissions,
}
