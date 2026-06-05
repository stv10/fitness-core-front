import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'


export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'USER' | 'ADMIN'
}

interface AuthContextType {
  user: UserResponse | null
  token: string | null
  loading: boolean
  login: (token: string, user: UserResponse) => void
  logout: () => void
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'fitness_auth_token_v1'

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const checkSession = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        logout()
        return
      }

      const userData: UserResponse = await response.json()
      setToken(storedToken)
      setUser(userData)
    } catch (error) {
      console.error('Session check failed:', error)
      // On network failure, we don't necessarily log out, but we might set loading to false.
      // However, for this implementation, we will keep the token state if we can't verify,
      // or we can log them out if it's an auth failure. Since status isn't 401 (it's network),
      // we'll keep the loading false.
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  const login = (newToken: string, newUser: UserResponse) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    login,
    logout,
    checkSession
  }), [user, token, loading])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
