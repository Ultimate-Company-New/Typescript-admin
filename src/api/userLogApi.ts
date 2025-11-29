import { type PaginatedGridInterface } from '../types/grid.types'

import axiosInstance from './axiosConfig'

/**
 * User Log Response Model
 */
export interface UserLogResponseModel {
  logId: number
  userId: number
  clientId: number | null
  action: string
  description: string | null
  ipAddress: string | null
  userAgent: string | null
  sessionId: string | null
  logLevel: string | null
  createdAt: string
  createdUser: string | null
  updatedAt: string | null
  modifiedUser: string | null
  notes: string | null
  isDeleted?: boolean
  // Legacy fields
  auditUserId: number | null
  change: string | null
  newValue: string | null
  oldValue: string | null
}

/**
 * User Log Request Model
 */
export interface UserLogRequestModel extends PaginatedGridInterface {
  userId: number
  carrierId: number
}

/**
 * Pagination Response
 */
export interface UserLogPaginationResponse {
  data: UserLogResponseModel[]
  totalDataCount: number
}

/**
 * Fetch user logs in batches
 */
export const getUserLogsInBatches = async (request: UserLogRequestModel): Promise<UserLogPaginationResponse> => {
  const response = await axiosInstance.post<UserLogPaginationResponse>(
    '/UserLog/getUserLogsInBatchesByUserId',
    request,
  )
  return response.data
}
