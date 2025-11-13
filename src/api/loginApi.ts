import axiosInstance from './axiosConfig'
import {
  LoginRequestModel,
  ClientResponseModel,
  TokenResponseModel,
} from '../models/LoginModels'

/**
 * API routes matching Spring API controller
 * NOTE: Spring API uses camelCase and capital 'L' in Login
 */
const API_ROUTES = {
  LOGIN: {
    SIGN_IN: '/Login/signIn',
    RESET_PASSWORD: '/Login/resetPassword',
    CONFIRM_EMAIL: '/Login/confirmEmail',
    GET_TOKEN: '/Login/getToken',
  },
}

/**
 * Login API calls
 */
export const loginApi = {
  /**
   * Sign in user
   * @param data - Login credentials (loginName, password)
   * @returns List of clients user has access to
   */
  signIn: async (data: LoginRequestModel): Promise<ClientResponseModel[]> => {
    const response = await axiosInstance.post<ClientResponseModel[]>(
      API_ROUTES.LOGIN.SIGN_IN,
      data
    )
    return response.data
  },

  /**
   * Reset password
   * @param data - User's login name/email
   * @returns Boolean indicating success
   */
  resetPassword: async (data: LoginRequestModel): Promise<boolean> => {
    const response = await axiosInstance.post<boolean>(
      API_ROUTES.LOGIN.RESET_PASSWORD,
      data
    )
    return response.data
  },

  /**
   * Confirm email address
   * @param data - User ID and confirmation token
   * @returns Void on success
   */
  confirmEmail: async (data: LoginRequestModel): Promise<void> => {
    await axiosInstance.post(API_ROUTES.LOGIN.CONFIRM_EMAIL, data)
  },

  /**
   * Get JWT token
   * @param data - Login name and API key
   * @returns JWT token as a string
   */
  getToken: async (data: LoginRequestModel): Promise<string> => {
    const response = await axiosInstance.post<string>(
      API_ROUTES.LOGIN.GET_TOKEN,
      data
    )
    return response.data
  },
}

