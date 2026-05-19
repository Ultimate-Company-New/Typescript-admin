import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

interface AuthContextValue {
  isAuthenticated: boolean
  setAuthToken: (token: string) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  setAuthToken: () => undefined,
  clearAuth: () => undefined,
})

const readStoredAuth = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }
  return localStorage.getItem('authToken') != null
}

export const AuthProvider = ({ children }: { children: ReactNode }): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(readStoredAuth)

  const setAuthToken = useCallback((token: string) => {
    localStorage.setItem('authToken', token)
    setIsAuthenticated(true)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('authToken')
    setIsAuthenticated(false)
  }, [])

  useEffect(() => {
    const handleAuthChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<{ isAuthenticated?: boolean; token?: string | null }>
      if (customEvent.detail?.token) {
        setAuthToken(customEvent.detail.token)
        return
      }
      if (customEvent.detail?.isAuthenticated === false) {
        clearAuth()
        return
      }
      setIsAuthenticated(readStoredAuth())
    }

    window.addEventListener('admin-auth-changed', handleAuthChanged)
    return () => {
      window.removeEventListener('admin-auth-changed', handleAuthChanged)
    }
  }, [clearAuth, setAuthToken])

  const value = useMemo(
    () => ({
      isAuthenticated,
      setAuthToken,
      clearAuth,
    }),
    [clearAuth, isAuthenticated, setAuthToken],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => useContext(AuthContext)
