import { requestApi } from '../../auth/api/authApi.js'

export const getVaultEntries = () => requestApi('/api/store')

export const createVaultEntry = (entry) =>
  requestApi('/api/store/create', { method: 'POST', payload: entry })

export const updateVaultEntryPassword = (id, password) =>
  requestApi(`/api/store/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    payload: { password },
  })

export const revealVaultEntry = (id) =>
  requestApi(`/api/store/${encodeURIComponent(id)}/password`)

export const deleteVaultEntry = (id) =>
  requestApi(`/api/store/${encodeURIComponent(id)}`, { method: 'DELETE' })
