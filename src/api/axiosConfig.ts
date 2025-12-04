import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'

import type { ApiLog } from '../components/DevLogger'

/**
 * Dynamically determine API base URL based on environment
 * If running on localhost, use localhost API on port 4433
 * Otherwise use environment variable or default
 */
const getBaseUrl = (): string => {
  // Check if we're running on localhost
  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''

  if (isLocalhost) {
    return 'http://localhost:4433/api'
  }

  // Use environment variable or default for production
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:4433/api'
}

const BASE_URL = getBaseUrl()

/**
 * Axios instance with interceptors for request/response handling
 */
const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Helper function to generate cURL command from Axios config
 */
const generateCurlCommand = (config: InternalAxiosRequestConfig): string => {
  const method = (config.method ?? 'GET').toUpperCase()
  const url = `${config.baseURL ?? ''}${config.url ?? ''}`

  let curl = `curl -X ${method} '${url}'`

  // Add headers
  Object.entries(config.headers).forEach(([key, value]) => {
    if (
      value != null &&
      key !== 'common' &&
      key !== 'delete' &&
      key !== 'get' &&
      key !== 'head' &&
      key !== 'post' &&
      key !== 'put' &&
      key !== 'patch'
    ) {
      curl += ` \\\n  -H '${key}: ${value}'`
    }
  })

  // Add body data
  if (config.data) {
    const dataStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
    curl += ` \\\n  -d '${dataStr}'`
  }

  return curl
}

/**
 * Helper function to dispatch API log event to DevLogger
 */
const logApiRequest = (config: InternalAxiosRequestConfig): void => {
  try {
    const method = (config.method ?? 'GET').toUpperCase()
    const url = `${config.baseURL ?? ''}${config.url ?? ''}`
    const endpoint = `${method} ${config.url ?? ''}` // Unique identifier for deduplication

    const headers: Record<string, string> = {}
    Object.entries(config.headers).forEach(([key, value]) => {
      if (
        value != null &&
        typeof value === 'string' &&
        key !== 'common' &&
        key !== 'delete' &&
        key !== 'get' &&
        key !== 'head' &&
        key !== 'post' &&
        key !== 'put' &&
        key !== 'patch'
      ) {
        headers[key] = value
      }
    })

    const apiLog: ApiLog = {
      id: `${Date.now()}-${Math.random()}`,
      method,
      url,
      headers,
      body: config.data as unknown,
      timestamp: new Date(),
      curlCommand: generateCurlCommand(config),
      endpoint,
    }

    // Dispatch custom event for DevLogger
    const event = new CustomEvent('api-log', { detail: apiLog })
    window.dispatchEvent(event)
  } catch {
    // Silently fail - don't break the request
  }
}

// Request interceptor - Add auth token if available and log requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('authToken')
    if (token != null) {
      // Use AxiosHeaders methods to set header
      config.headers.set('Authorization', `Bearer ${token}`)
    }

    // Log the API request for DevLogger
    logApiRequest(config)

    return config
  },
  (error: AxiosError) => Promise.reject(error),
)

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  response => response,
  (error: AxiosError<{ error?: string; message?: string; status?: number }>) => {
    if (error.response) {
      const { status, data } = error.response

      // Extract error message from ErrorResponseModel structure
      // The API returns: { error: "ERROR_CODE", message: "Error description", status: 400 }
      const errorMessage = data.message ?? data.error ?? 'An error occurred'

      // Handle specific status codes
      switch (status) {
        case 400:
          // Bad Request - show specific validation errors
          toast.error(errorMessage)
          break
        case 401:
          // Unauthorized - could be invalid credentials or session expired
          toast.error(errorMessage)
          // Only redirect to login if it's a session expiration (not login failure)
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('authToken')
            sessionStorage.clear()
            window.location.href = '/login'
          }
          break
        case 403:
          // Forbidden - user doesn't have permission
          toast.error(errorMessage || 'Access forbidden.')
          break
        case 404:
          // Not Found - show specific message from API (e.g., "Invalid User Email")
          toast.error(errorMessage)
          break
        case 500:
          // Internal Server Error
          toast.error(errorMessage || 'Internal server error. Please try again later.')
          break
        default:
          toast.error(errorMessage)
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.')
    } else {
      toast.error('An unexpected error occurred.')
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
