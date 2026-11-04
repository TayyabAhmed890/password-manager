import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth.js'
import { getUsers } from '../../users/api/usersApi.js'
import { formatAccountDate } from '../../users/utils/userList.js'
import { ApiError } from '../../../shared/lib/apiClient.js'

const AdminDashboardPage = () => {
  const [data, setData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [retryToken, setRetryToken] = useState(0)
  const { clearAdmin } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      try {
        const result = await getUsers({ page: 1, limit: 5 })
        if (active) setData(result)
      } catch (error) {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          clearAdmin()
          navigate('/login', { replace: true })
          return
        }
        if (error instanceof ApiError && error.status === 403) {
          clearAdmin()
          navigate('/access-denied', { replace: true })
          return
        }
        setErrorMessage(error.message || 'Could not load the dashboard.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadOverview()
    return () => {
      active = false
    }
  }, [clearAdmin, navigate, retryToken])

  const recentUsers = data?.data || []
  const totalUsers = data?.pagination?.totalUsers ?? 0
  const retryOverview = () => {
    setIsLoading(true)
    setErrorMessage('')
    setRetryToken((current) => current + 1)
  }

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            Admin dashboard
          </h1>
        </div>
        <Link
          to="/users"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Manage users
        </Link>
      </header>

      {errorMessage && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p role="alert" className="text-sm text-red-800">{errorMessage}</p>
          <button
            type="button"
            onClick={retryOverview}
            className="text-sm font-semibold text-red-900 underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <section aria-label="Account overview" className="mt-5">
        <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm sm:max-w-xs">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <Users size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Registered users</p>
            {isLoading
              ? <div className="mt-1.5 h-7 w-20 animate-pulse rounded bg-slate-100" aria-label="Loading user count" />
              : <p className="mt-0.5 text-2xl font-semibold leading-7 tracking-tight text-slate-950">{totalUsers.toLocaleString()}</p>}
          </div>
        </article>
      </section>

      <section aria-labelledby="recent-users-title" className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="recent-users-title" className="font-semibold text-slate-950">Recent users</h2>
          </div>
          <Link to="/users" className="text-sm font-semibold text-slate-700 hover:text-slate-950">
            View all
          </Link>
        </div>
        {isLoading ? (
          <div className="space-y-3 p-5" role="status">
            <span className="sr-only">Loading recent users</span>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" aria-hidden="true" />
            ))}
          </div>
        ) : errorMessage ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">
            Recent users are unavailable until the request succeeds.
          </p>
        ) : recentUsers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No user accounts to show yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <span className="min-w-0 break-all text-sm font-medium text-slate-800">{user.email}</span>
                <span className="shrink-0 text-xs text-slate-500">{formatAccountDate(user.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdminDashboardPage
