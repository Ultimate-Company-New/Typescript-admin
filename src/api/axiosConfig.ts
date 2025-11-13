import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { toast } from 'react-toastify'

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
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:4433/api'
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

// Request interceptor - Add auth token if available
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response) {
      const { status, data } = error.response
      
      // Extract error message from response if available
      const errorMessage = data?.message || 'An error occurred'
      
      // Handle specific status codes
      switch (status) {
        case 401:
          toast.error(errorMessage || 'Unauthorized. Please log in again.')
          localStorage.removeItem('authToken')
          window.location.href = '/login'
          break
        case 403:
          toast.error(errorMessage || 'Access forbidden.')
          break
        case 404:
          // Show specific message from API (e.g., "Invalid User Email")
          toast.error(errorMessage)
          break
        case 500:
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
  }
)

export default axiosInstance

