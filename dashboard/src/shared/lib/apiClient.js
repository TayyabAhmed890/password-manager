export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const requestApi = async (path, { method = 'GET', body } = {}) => {
  const headers = {}
  const options = {
    method,
    credentials: 'include',
    cache: 'no-store',
    headers,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(path, options)
  } catch {
    throw new ApiError(null, 'Could not reach the service. Check your connection and try again.')
  }

  let result
  try {
    result = await response.json()
  } catch {
    throw new ApiError(response.status, 'The service returned an unexpected response.')
  }

  if (!response.ok || result?.success !== true) {
    throw new ApiError(response.status, result?.message || 'The request could not be completed.')
  }

  return result
}
