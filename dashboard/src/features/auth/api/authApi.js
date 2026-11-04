import { requestApi } from '../../../shared/lib/apiClient.js'

export const loginAdmin = (credentials) =>
  requestApi('/api/auth/login', { method: 'POST', body: credentials })

export const getAdminSession = () => requestApi('/api/auth/me')

export const logoutAdmin = () =>
  requestApi('/api/auth/logout', { method: 'POST' })

export const resetAdminPassword = (details) =>
  requestApi('/api/auth/admin/forgot-password', { method: 'POST', body: details })

export const changeAdminPassword = (details) =>
  requestApi('/api/auth/admin/change-password', { method: 'POST', body: details })

export const deleteAdminProfile = (currentPassword) =>
  requestApi('/api/auth/admin/profile', {
    method: 'DELETE',
    body: { currentPassword },
  })
