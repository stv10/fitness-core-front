import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { getDatabase, closeDatabase } from '../db/db'
import type { FitnessDatabase } from '../db/db'

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
  db: FitnessDatabase | null
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
  const [db, setDb] = useState<FitnessDatabase | null>(null)

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
      // On network failure, we still keep loading false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  // Handle local database lifecycle based on user session
  useEffect(() => {
    let active = true

    if (user) {
      getDatabase(user.id)
        .then((database) => {
          if (active) {
            setDb(database)
          }
        })
        .catch((err) => {
          console.error('Failed to initialize RxDB database:', err)
        })
    } else {
      setDb(null)
      closeDatabase().catch((err) => {
        console.error('Failed to close RxDB database:', err)
      })
    }

    return () => {
      active = false
    }
  }, [user])

  const login = (newToken: string, newUser: UserResponse) => {
    localStorage.setItem(TOKEN_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }

  const contextValue = useMemo(() => ({
    user,
    token,
    loading,
    db,
    login,
    logout,
    checkSession
  }), [user, token, loading, db])

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

