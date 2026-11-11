import { ApiError, requestApi } from '../../../shared/lib/apiClient.js'

const isNonNegativeInteger = (value) =>
  Number.isSafeInteger(value) && value >= 0

const isPositiveInteger = (value) =>
  Number.isSafeInteger(value) && value > 0

const validateUsersResponse = (result, requestedPage, requestedLimit) => {
  const pagination = result?.pagination
  const validUsers = Array.isArray(result?.data) && result.data.every((user) =>
    typeof user?.id === 'string' &&
    user.id.length > 0 &&
    typeof user.email === 'string' &&
    user.email.length > 0 &&
    isNonNegativeInteger(user.passwordCount)
  )
  const validPagination =
    pagination &&
    pagination.page === requestedPage &&
    pagination.limit === requestedLimit &&
    isNonNegativeInteger(pagination.totalUsers) &&
    isNonNegativeInteger(pagination.totalPages) &&
    isPositiveInteger(pagination.page) &&
    isPositiveInteger(pagination.limit) &&
    pagination.totalPages === Math.ceil(pagination.totalUsers / pagination.limit)

  if (!validUsers || !validPagination || result.data.length > requestedLimit) {
    throw new ApiError(200, 'The service returned an unexpected response.')
  }

  return result
}

export const getUsers = async ({ page = 1, limit = 10 } = {}) => {
  const result = await requestApi(`/api/admin/users?page=${page}&limit=${limit}`)
  return validateUsersResponse(result, page, limit)
}

export const deleteUser = (userId) =>
  requestApi(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
