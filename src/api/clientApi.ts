import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Client'

/**
 * Client Request Model
 */
export interface ClientRequestModel {
  clientId?: number
  name: string
  description: string
  brevoApiKey?: string
  brevoEmailAddress?: string
  supportEmail: string
  website: string
  brevoSenderName?: string
  razorpayApiKey?: string
  razorpayApiSecret?: string
  imgbbApiKey?: string
  logoBase64?: string
  logoUrl?: string
  logoDeleteHash?: string
  shipRocketEmail?: string
  shipRocketPassword?: string
  jiraUserName?: string
  jiraPassword?: string
  jiraProjectUrl?: string
  jiraProjectKey?: string
  issueTypes?: string
  googleCredId?: number
  notes?: string
}

/**
 * Client Response Model
 */
export interface ClientResponseModel {
  clientId: number
  name: string
  description: string
  brevoApiKey?: string
  brevoEmailAddress?: string
  isDeleted: boolean
  supportEmail: string
  website: string
  brevoSenderName?: string
  razorpayApiKey?: string
  razorpayApiSecret?: string
  imgbbApiKey?: string
  logoUrl?: string
  logoDeleteHash?: string
  shipRocketEmail?: string
  shipRocketPassword?: string
  jiraUserName?: string
  jiraPassword?: string
  jiraProjectUrl?: string
  jiraProjectKey?: string
  issueTypes?: string
  googleCredId?: number
  createdAt: string
  createdUser: string
  updatedAt: string
  modifiedUser: string
  notes?: string
}

/**
 * Client API Service
 * Handles all client-related API calls
 */
export const clientApi = {
  /**
   * Get client by ID
   */
  getClientById: async (clientId: number): Promise<ClientResponseModel> => {
    const response = await axiosInstance.get<ClientResponseModel>(`${API_BASE_URL}/getClientById/${clientId}`)
    return response.data
  },

  /**
   * Get all clients mapped to the current user
   */
  getClientsByUser: async (): Promise<ClientResponseModel[]> => {
    const response = await axiosInstance.get<ClientResponseModel[]>(`${API_BASE_URL}/getClientsByUser`)
    return response.data
  },

  /**
   * Create new client
   */
  createClient: async (request: ClientRequestModel): Promise<void> => {
    await axiosInstance.put(`${API_BASE_URL}/createClient`, request)
  },

  /**
   * Update existing client
   */
  updateClient: async (clientId: number, request: ClientRequestModel): Promise<void> => {
    await axiosInstance.post(`${API_BASE_URL}/updateClient/${clientId}`, request)
  },

  /**
   * Toggle client deletion status
   */
  toggleClient: async (clientId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/toggleClient/${clientId}`)
  },
}
