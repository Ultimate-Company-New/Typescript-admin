import {
  type BulkLeadInsertResponseModel,
  type LeadDetailsResponseModel,
  type LeadRequestModel,
  type LeadResponseModel,
  type PaginationBaseResponseModel,
} from '../models/api-models'

import axiosInstance from './axiosConfig'

/**
 * API endpoints for lead operations
 * Matches: LeadController.java routes
 */
const API_ROUTES = {
  GET_LEADS_IN_BATCHES: '/Lead/getLeadsInBatches',
  GET_LEAD_DETAILS_BY_ID: '/Lead/getLeadDetailsById',
  GET_LEAD_DETAILS_BY_EMAIL: '/Lead/getLeadDetailsByEmail',
  CREATE_LEAD: '/Lead/createLead',
  UPDATE_LEAD: '/Lead/updateLead',
  TOGGLE_LEAD: '/Lead/toggleLead',
  BULK_CREATE_LEAD: '/Lead/bulkCreateLead',
}

/**
 * Lead API interface
 */
export interface LeadApi {
  getLeadsInBatches: (request: LeadRequestModel) => Promise<PaginationBaseResponseModel<LeadResponseModel>>
  getLeadById: (leadId: number) => Promise<LeadDetailsResponseModel>
  getLeadByEmail: (email: string) => Promise<LeadDetailsResponseModel>
  createLead: (request: LeadRequestModel) => Promise<void>
  updateLead: (leadId: number, request: LeadRequestModel) => Promise<void>
  toggleLead: (leadId: number) => Promise<void>
  bulkCreateLeads: (leads: LeadRequestModel[]) => Promise<BulkLeadInsertResponseModel>
}

/**
 * Get paginated leads with filtering and sorting
 *
 * @param request - Pagination and filter parameters
 * @returns Promise with paginated lead data
 */
export const getLeadsInBatches = async (
  request: LeadRequestModel,
): Promise<PaginationBaseResponseModel<LeadResponseModel>> => {
  const response = await axiosInstance.post<PaginationBaseResponseModel<LeadResponseModel>>(
    API_ROUTES.GET_LEADS_IN_BATCHES,
    request,
  )
  return response.data
}

/**
 * Get lead details by ID
 *
 * @param leadId - The unique identifier of the lead
 * @returns Promise with lead details
 */
export const getLeadById = async (leadId: number): Promise<LeadDetailsResponseModel> => {
  const response = await axiosInstance.get<LeadDetailsResponseModel>(
    `${API_ROUTES.GET_LEAD_DETAILS_BY_ID}/${leadId}`,
  )
  return response.data
}

/**
 * Get lead details by email
 *
 * @param email - The email address of the lead
 * @returns Promise with lead details
 */
export const getLeadByEmail = async (email: string): Promise<LeadDetailsResponseModel> => {
  const response = await axiosInstance.get<LeadDetailsResponseModel>(
    `${API_ROUTES.GET_LEAD_DETAILS_BY_EMAIL}/${email}`,
  )
  return response.data
}

/**
 * Create a new lead
 *
 * @param request - The lead data to create
 * @returns Promise that resolves when lead is created
 */
export const createLead = async (request: LeadRequestModel): Promise<void> => {
  await axiosInstance.put(API_ROUTES.CREATE_LEAD, request)
}

/**
 * Update an existing lead
 *
 * @param leadId - The unique identifier of the lead to update
 * @param request - The updated lead data
 * @returns Promise that resolves when lead is updated
 */
export const updateLead = async (leadId: number, request: LeadRequestModel): Promise<void> => {
  await axiosInstance.post(`${API_ROUTES.UPDATE_LEAD}/${leadId}`, request)
}

/**
 * Toggle lead status (activate/deactivate)
 *
 * @param leadId - The unique identifier of the lead to toggle
 * @returns Promise that resolves when lead is toggled
 */
export const toggleLead = async (leadId: number): Promise<void> => {
  await axiosInstance.delete(`${API_ROUTES.TOGGLE_LEAD}/${leadId}`)
}

/**
 * Bulk create multiple leads
 *
 * @param leads - Array of lead data to create
 * @returns Promise with bulk insert response containing success/failure details
 */
export const bulkCreateLeads = async (leads: LeadRequestModel[]): Promise<BulkLeadInsertResponseModel> => {
  const response = await axiosInstance.put<BulkLeadInsertResponseModel>(API_ROUTES.BULK_CREATE_LEAD, leads)
  return response.data
}

/**
 * Lead API Service
 * Handles all lead-related API calls
 */
export const leadApi: LeadApi = {
  getLeadsInBatches,
  getLeadById,
  getLeadByEmail,
  createLead,
  updateLead,
  toggleLead,
  bulkCreateLeads,
}

export default leadApi
