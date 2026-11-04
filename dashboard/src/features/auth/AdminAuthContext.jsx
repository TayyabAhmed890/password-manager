import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '../../shared/lib/apiClient.js'
import { isAdminAccount } from './adminAccount.js'
import AdminAuthContext from './AdminAuthContext.js'
import { getAdminSession } from './api/authApi.js'

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [status, setStatus] = useState('loading')
  const [sessionError, setSessionError] = useState('')

  const acceptAdmin = useCallback((user) => {
    if (!isAdminAccount(user)) {
      setAdmin(null)
      setStatus('forbidden')
      return false
    }

    setAdmin(user)
    setSessionError('')
    setStatus('authenticated')
    return true
  }, [])

  const clearAdmin = useCallback(() => {
    setAdmin(null)
    setSessionError('')
    setStatus('unauthenticated')
  }, [])

  const applySessionCheck = useCallback((result) => {
    if (result.error) {
      const { error } = result
      setAdmin(null)
      if (error instanceof ApiError && error.status === 401) {
        setStatus('unauthenticated')
        return
      }

      setSessionError(error.message || 'Could not check the admin session.')
      setStatus('error')
      return
    }
    acceptAdmin(result.user)
  }, [acceptAdmin])

  const readSession = useCallback(async () => {
    try {
      const result = await getAdminSession()
      return { user: result.user }
    } catch (error) {
      return { error }
    }
  }, [])

  const refreshSession = useCallback(() => readSession().then(applySessionCheck), [
    applySessionCheck,
    readSession,
  ])

  const retrySession = useCallback(() => {
    setStatus('loading')
    setSessionError('')
    return refreshSession()
  }, [refreshSession])

  useEffect(() => {
    let active = true
    readSession().then((result) => {
      if (active) applySessionCheck(result)
    })
    return () => {
      active = false
    }
  }, [applySessionCheck, readSession])

  const value = useMemo(() => ({
    admin,
    status,
    sessionError,
    acceptAdmin,
    clearAdmin,
    refreshSession,
    retrySession,
  }), [admin, status, sessionError, acceptAdmin, clearAdmin, refreshSession, retrySession])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
