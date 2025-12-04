/**
 * Login-related TypeScript interfaces matching the Spring API models
 */

// Request Models
export interface LoginRequestModel {
  loginName?: string
  password?: string
  userId?: number
  token?: string
  apiKey?: string
}

// Response Models
export interface ClientResponseModel {
  clientId: number
  name: string
  logoUrl?: string
  apiKey: string
}

export interface TokenResponseModel {
  token: string
  expiresIn: number
  permissions?: string[]
}

export interface ErrorResponseModel {
  error: string
  message: string
  statusCode: number
}
