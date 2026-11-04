import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, Search, Trash2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth.js'
import { deleteUser, getUsers } from '../api/usersApi.js'
import { filterUsersOnPage, formatAccountDate, getPaginationState } from '../utils/userList.js'
import { ApiError } from '../../../shared/lib/apiClient.js'
import { useToast } from '../../../shared/components/useToast.js'
import Dialog from '../../../shared/components/Dialog.jsx'

const PAGE_SIZE = 10

const UsersPage = () => {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [deletingId, setDeletingId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const { clearAdmin } = useAdminAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const handleExpiredSession = useCallback((error) => {
    if (!(error instanceof ApiError)) return false
    if (error.status !== 401 && error.status !== 403) return false

    clearAdmin()
    navigate(error.status === 403 ? '/access-denied' : '/login', { replace: true })
    return true
  }, [clearAdmin, navigate])

  useEffect(() => {
    let active = true
    let keepLoading = false

    getUsers({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return
        const nextTotalPages = result.pagination.totalPages
        if (page > Math.max(1, nextTotalPages)) {
          keepLoading = true
          setIsLoading(true)
          setPage(Math.max(1, nextTotalPages))
          return
        }

        setErrorMessage('')
        setUsers(result.data)
        setTotalUsers(result.pagination.totalUsers)
        setTotalPages(nextTotalPages)
      })
      .catch((error) => {
        if (!active || handleExpiredSession(error)) return
        const message = error.message || 'Could not load users. Please try again.'
        setErrorMessage(message)
      })
      .finally(() => {
        if (!active) return
        if (!keepLoading) setIsLoading(false)
        setIsRefreshing(false)
      })

    return () => {
      active = false
    }
  }, [handleExpiredSession, page, refreshVersion])

  const visibleUsers = filterUsersOnPage(users, query)
  const pagination = getPaginationState({ page, totalPages })
  const firstItem = totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastItem = Math.min(page * PAGE_SIZE, totalUsers)

  const refreshCurrentPage = () => {
    setIsRefreshing(true)
    setRefreshVersion((current) => current + 1)
  }

  const changePage = (nextPage) => {
    setIsLoading(true)
    setPage(nextPage)
  }

  const confirmDelete = async () => {
    if (!selectedUser || deletingId) return
    setDeletingId(selectedUser.id)
    try {
      await deleteUser(selectedUser.id)
      showToast(`Deleted ${selectedUser.email} and their vault data.`)
      setSelectedUser(null)
      setIsRefreshing(true)
      setRefreshVersion((current) => current + 1)
    } catch (error) {
      if (handleExpiredSession(error)) return
      showToast(error.message || 'Could not delete this user. Please try again.', 'error')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Users</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review account details and remove accounts when necessary.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshCurrentPage}
          disabled={isLoading || isRefreshing}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          {isRefreshing && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
          Refresh
        </button>
      </header>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-500" aria-hidden="true" />
            <h2 className="font-semibold text-slate-950">All users</h2>
            {!isLoading && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{totalUsers.toLocaleString()}</span>}
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter this page by email"
              aria-label="Filter this page by email"
              className="min-h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </label>
        </div>

        {errorMessage && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-3">
            <p role="alert" className="text-sm text-red-800">{errorMessage}</p>
            <button type="button" onClick={refreshCurrentPage} className="text-sm font-semibold text-red-900 underline underline-offset-2">
              Try again
            </button>
          </div>
        )}

        {isLoading ? (
          <div role="status" className="space-y-3 p-5">
            <span className="sr-only">Loading users</span>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} aria-hidden="true" className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : users.length === 0 && !errorMessage ? (
          <div className="px-5 py-14 text-center">
            <Users size={24} className="mx-auto text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-slate-800">No user accounts yet</p>
            <p className="mt-1 text-sm text-slate-500">Newly registered users will appear here.</p>
          </div>
        ) : errorMessage ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            User records are unavailable until the request succeeds.
          </p>
        ) : visibleUsers.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No users on this page match that email.</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-100 md:hidden">
              {visibleUsers.map((user) => (
                <li key={user.id} className="flex items-start justify-between gap-3 px-4 py-4">
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium text-slate-900">{user.email}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Joined {formatAccountDate(user.createdAt)} · {user.passwordCount.toLocaleString()} vault entries
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    aria-label={`Delete ${user.email}`}
                    className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">Email</th>
                    <th scope="col" className="px-5 py-3">Joined</th>
                    <th scope="col" className="px-5 py-3">Vault entries</th>
                    <th scope="col" className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/70">
                      <td className="max-w-xs break-all px-5 py-4 font-medium text-slate-800">{user.email}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatAccountDate(user.createdAt)}</td>
                      <td className="px-5 py-4 text-slate-600">{user.passwordCount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          aria-label={`Delete ${user.email}`}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-slate-500">
                Showing {firstItem}–{lastItem} of {totalUsers.toLocaleString()} users
                {query.trim() && ' · Filter applies to this page'}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!pagination.canGoPrevious || isLoading}
                  onClick={() => changePage(Math.max(1, page - 1))}
                  className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-1 text-xs text-slate-500">
                  Page {page} of {Math.max(totalPages, 1)}
                </span>
                <button
                  type="button"
                  disabled={!pagination.canGoNext || isLoading}
                  onClick={() => changePage(page + 1)}
                  className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {selectedUser && (
        <Dialog
          labelledBy="delete-user-title"
          onClose={() => {
            if (!deletingId) setSelectedUser(null)
          }}
          className="max-w-md border border-slate-200 p-5 sm:p-6"
        >
            <h2 id="delete-user-title" className="text-lg font-semibold text-slate-950">Delete this account?</h2>
            <p className="mt-2 break-all text-sm leading-6 text-slate-600">
              This permanently deletes <span className="font-medium text-slate-900">{selectedUser.email}</span> and all their saved vault entries.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setSelectedUser(null)}
                className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={confirmDelete}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
              >
                {deletingId && <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />}
                {deletingId ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
        </Dialog>
      )}
    </div>
  )
}

export default UsersPage
