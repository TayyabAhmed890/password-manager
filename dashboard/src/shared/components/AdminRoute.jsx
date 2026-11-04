import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../features/auth/useAdminAuth.js'

const AdminRoute = () => {
  const { status, sessionError, retrySession } = useAdminAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600">
        <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
        <p role="status" className="text-sm">Checking admin session…</p>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
        <p role="alert" className="max-w-md text-sm leading-6 text-slate-700">{sessionError}</p>
        <button
          type="button"
          onClick={retrySession}
          className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Try again
        </button>
      </main>
    )
  }

  if (status === 'forbidden') {
    return <Navigate to="/access-denied" replace />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default AdminRoute
