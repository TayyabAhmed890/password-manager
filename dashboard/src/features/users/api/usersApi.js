import { requestApi } from '../../../shared/lib/apiClient.js'

export const getUsers = ({ page = 1, limit = 10 } = {}) =>
  requestApi(`/api/admin/users?page=${page}&limit=${limit}`)

export const deleteUser = (userId) =>
  requestApi(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
