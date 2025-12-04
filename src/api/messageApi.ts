import { type MessageRequestModel, type MessageResponseModel } from '../models/api-models'
import { type PaginationBaseRequestModel, type PaginationBaseResponseModel } from '../types/grid.types'

import axiosInstance from './axiosConfig'

const API_BASE_URL = '/Message'

const messageApi = {
  /**
   * Get paginated messages for admin grid (all messages)
   */
  getMessagesInBatches: async (
    params: PaginationBaseRequestModel,
  ): Promise<PaginationBaseResponseModel<MessageResponseModel>> => {
    const response = await axiosInstance.post<PaginationBaseResponseModel<MessageResponseModel>>(
      `${API_BASE_URL}/getMessagesInBatches`,
      params,
    )
    return response.data
  },

  /**
   * Get paginated messages for the current user
   */
  getMessagesByUserId: async (
    userId: number,
    start: number = 0,
    end: number = 25,
  ): Promise<{ data: MessageResponseModel[]; totalItems: number }> => {
    const response = await axiosInstance.post<{ data: MessageResponseModel[]; totalDataCount: number }>(
      `${API_BASE_URL}/getMessagesByUserId`,
      {
        id: userId,
        start,
        end,
      },
    )

    // The API returns { data: [...], totalDataCount: number }
    return {
      data: response.data.data,
      totalItems: response.data.totalDataCount,
    }
  },

  /**
   * Get message details by ID
   */
  getMessageDetailsById: async (messageId: number): Promise<MessageResponseModel> => {
    const response = await axiosInstance.post<MessageResponseModel>(`${API_BASE_URL}/getMessageDetailsById`, {
      id: messageId,
    })
    return response.data
  },

  /**
   * Mark message as read
   */
  setMessageReadByUserIdAndMessageId: async (userId: number, messageId: number): Promise<void> => {
    await axiosInstance.post(`${API_BASE_URL}/setMessageReadByUserIdAndMessageId/${userId}/${messageId}`)
  },

  /**
   * Create a new message
   */
  createMessage: async (message: MessageRequestModel): Promise<void> => {
    await axiosInstance.post(`${API_BASE_URL}/createMessage`, message)
  },

  /**
   * Update an existing message
   */
  updateMessage: async (message: MessageRequestModel): Promise<void> => {
    await axiosInstance.post(`${API_BASE_URL}/editMessage`, message)
  },

  /**
   * Delete a message
   */
  deleteMessage: async (messageId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/deleteMessage/${messageId}`)
  },

  /**
   * Toggle message deleted status
   */
  toggleMessage: async (messageId: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE_URL}/toggleMessage/${messageId}`)
  },

  /**
   * Get unread message count for the current user
   */
  getUnreadMessageCount: async (): Promise<number> => {
    const response = await axiosInstance.get<number>(`${API_BASE_URL}/getUnreadMessageCount`)
    return response.data
  },
}

export default messageApi
