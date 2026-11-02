import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthApiError, getCurrentUser } from '../features/auth/api/authApi'
import { AuthContext } from './auth-context'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [sessionError, setSessionError] = useState('')

  const setAuthenticatedUser = useCallback((authenticatedUser) => {
    setUser(authenticatedUser)
    setSessionError('')
    setStatus('authenticated')
  }, [])

  const clearAuthenticatedUser = useCallback(() => {
    setUser(null)
    setSessionError('')
    setStatus('unauthenticated')
  }, [])

  const refreshSession = useCallback(async () => {
    setStatus('loading')
    setSessionError('')

    try {
      const result = await getCurrentUser()
      setUser(result.user)
      setStatus('authenticated')
      return result.user
    } catch (error) {
      setUser(null)
      if (error instanceof AuthApiError && error.status === 401) {
        setStatus('unauthenticated')
        return null
      }

      setStatus('error')
      setSessionError(
        'We could not check your session. Check your connection and try again.'
      )
      return null
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      try {
        const result = await getCurrentUser()
        if (active) {
          setUser(result.user)
          setStatus('authenticated')
        }
      } catch (error) {
        if (!active) {
          return
        }

        setUser(null)
        if (error instanceof AuthApiError && error.status === 401) {
          setStatus('unauthenticated')
        } else {
          setStatus('error')
          setSessionError(
            'We could not check your session. Check your connection and try again.'
          )
        }
      }
    }

    loadSession()
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(() => ({
    user,
    status,
    sessionError,
    setAuthenticatedUser,
    clearAuthenticatedUser,
    refreshSession,
  }), [
    user,
    status,
    sessionError,
    setAuthenticatedUser,
    clearAuthenticatedUser,
    refreshSession,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
