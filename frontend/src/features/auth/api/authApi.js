export class AuthApiError extends Error {
  constructor({ status = null, retryAfterSeconds = null } = {}) {
    super('Authentication request failed.')
    this.name = 'AuthApiError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }
}

const getRetryAfterSeconds = (headerValue) => {
  if (!headerValue) {
    return null
  }

  const seconds = Number(headerValue)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.ceil(seconds)
  }

  const retryAt = Date.parse(headerValue)
  return Number.isNaN(retryAt)
    ? null
    : Math.max(1, Math.ceil((retryAt - Date.now()) / 1000))
}

export const requestApi = async (path, { method = 'GET', payload } = {}) => {
  const headers = {}
  const options = {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers,
  }

  if (payload !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(payload)
  }

  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new AuthApiError()
  }

  let result
  try {
    result = await response.json()
  } catch {
    result = null
  }

  if (!response.ok || !result || result.success !== true) {
    throw new AuthApiError({
      status: response.status,
      retryAfterSeconds: getRetryAfterSeconds(
        response.headers.get('Retry-After')
      ),
    })
  }

  return result
}

export const getAuthErrorMessage = (
  error,
  fallback,
  statusMessages = {}
) => {
  if (!(error instanceof AuthApiError)) {
    return fallback
  }

  if (error.status === 429) {
    if (error.retryAfterSeconds) {
      const minutes = Math.max(1, Math.ceil(error.retryAfterSeconds / 60))
      return `Too many attempts. Please try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`
    }

    return 'Too many attempts. Please wait a little before trying again.'
  }

  if (error.status === 503) {
    return 'This service is temporarily unavailable. Please try again shortly.'
  }

  if (error.status === null) {
    return 'We could not reach the service. Check your connection and try again.'
  }

  return statusMessages[error.status] || fallback
}

export const registerAccount = (credentials) =>
  requestApi('/api/auth/register', { method: 'POST', payload: credentials })

export const loginAccount = (credentials) =>
  requestApi('/api/auth/login', { method: 'POST', payload: credentials })

export const resetPassword = (credentials) =>
  requestApi('/api/auth/forgot-password', {
    method: 'POST',
    payload: credentials,
  })

export const getCurrentUser = () => requestApi('/api/auth/me')

export const logoutAccount = () =>
  requestApi('/api/auth/logout', { method: 'POST' })

export const changeAccountPassword = (credentials) =>
  requestApi('/api/auth/change-password', {
    method: 'POST',
    payload: credentials,
  })

export const deleteAccount = (credentials) =>
  requestApi('/api/auth/account', {
    method: 'DELETE',
    payload: credentials,
  })
