import { requestApi } from '../../auth/api/authApi.js'

export const getVaultEntries = (search = '') => {
  const query = search.trim()
  const path = query
    ? `/api/store?search=${encodeURIComponent(query)}`
    : '/api/store'

  return requestApi(path)
}

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
