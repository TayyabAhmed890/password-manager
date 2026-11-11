import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth.js'
import { getUsers } from '../../users/api/usersApi.js'
import { formatAccountDate } from '../../users/utils/userList.js'
import { ApiError } from '../../../shared/lib/apiClient.js'

const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const getAdminName = (admin) => {
  const name = typeof admin?.name === 'string' ? admin.name.trim() : ''
  if (name) return name.split(/\s+/)[0]
  return admin?.email?.split('@')[0] || 'Admin'
}

const getInitials = (email) => {
  const name = email?.split('@')[0] || ''
  const parts = name.split(/[._-]+/).filter(Boolean)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase() || 'U'
}

const AdminDashboardPage = () => {
  const [data, setData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [retryToken, setRetryToken] = useState(0)
  const { admin, clearAdmin } = useAdminAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadOverview = async () => {
      try {
        const result = await getUsers({ page: 1, limit: 5 })
        if (active) {
          setData(result)
          setErrorMessage('')
        }
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

  const recentUsers = data?.data ?? []
  const retryOverview = () => {
    setIsLoading(true)
    setErrorMessage('')
    setRetryToken((current) => current + 1)
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            <ShieldCheck size={14} aria-hidden="true" />
            Admin workspace
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            {getGreeting()}, {getAdminName(admin)}
          </h1>
          
        </div>
        <Link
          to="/users"
          className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
        >
          <Users size={16} aria-hidden="true" />
          Manage users
          <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </header>

      {errorMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
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

      <section aria-label="Account overview">
        <article className="flex min-h-36 w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:max-w-sm sm:p-6">
          <div>
            <p className="text-sm font-medium text-slate-500">Registered users</p>
            {isLoading ? (
              <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-slate-100" aria-label="Loading user count" />
            ) : (
              <>
                <p className="mt-2 text-3xl font-semibold leading-none tracking-tight text-slate-950">
                  {errorMessage || !data ? '—' : data.pagination.totalUsers.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {errorMessage ? 'Count unavailable' : 'Accounts registered'}
                </p>
              </>
            )}
          </div>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Users size={21} aria-hidden="true" />
          </span>
        </article>
      </section>

      <section aria-labelledby="recent-users-title" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 id="recent-users-title" className="font-semibold text-slate-950">Recently registered</h2>
            <p className="mt-1 text-xs text-slate-500">The latest accounts created on Keynest</p>
          </div>
          <Link
            to="/users"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
          >
            View all users
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5 sm:p-6" role="status">
            <span className="sr-only">Loading recent users</span>
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />
            ))}
          </div>
        ) : errorMessage ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm font-medium text-slate-700">Recent users couldn’t be loaded.</p>
            <p className="mt-1 text-sm text-slate-500">Try again to refresh the account overview.</p>
          </div>
        ) : recentUsers.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <Users size={19} aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-800">No accounts yet</p>
            <p className="mt-1 text-sm text-slate-500">New registrations will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex min-w-0 items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-slate-50/70 sm:px-6">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold uppercase text-slate-600"
                  >
                    {getInitials(user.email)}
                  </span>
                  <span className="min-w-0">
                    <span className="block break-all text-sm font-medium text-slate-800">{user.email}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">User account</span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">Joined</span>
                  <span className="mt-1 block text-xs font-medium text-slate-600">{formatAccountDate(user.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdminDashboardPage
