import { ApiError } from './apiClient.js'

export const isExpiredSessionError = (error, expectedUnauthorizedMessages = []) =>
  error instanceof ApiError &&
  error.status === 401 &&
  !expectedUnauthorizedMessages.includes(error.message)
