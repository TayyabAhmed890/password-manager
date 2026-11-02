import { LoaderCircle } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

const SessionStatus = ({ message, onRetry }) => (
  <main className={`flex min-h-screen items-center justify-center bg-neutral-50 px-5 ${onRetry ? '' : 'flex-col gap-3'}`}>
    {onRetry ? (
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 text-center shadow-sm">
        <>
          <p role="alert" className="text-sm leading-6 text-neutral-700">{message}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 min-h-11 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-700"
          >
            Try again
          </button>
        </>
      </div>
    ) : (
      <>
        <LoaderCircle size={23} className="animate-spin text-neutral-700" aria-hidden="true" />
        <p role="status" className="text-sm text-neutral-600">Checking your session...</p>
      </>
    )}
  </main>
)

export const RequireAuth = ({ children }) => {
  const { status, sessionError, refreshSession } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <SessionStatus />
  }

  if (status === 'error') {
    return <SessionStatus message={sessionError} onRetry={refreshSession} />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export const GuestOnly = ({ children }) => {
  const { status, sessionError, refreshSession } = useAuth()

  if (status === 'loading') {
    return <SessionStatus />
  }

  if (status === 'error') {
    return <SessionStatus message={sessionError} onRetry={refreshSession} />
  }

  if (status === 'authenticated') {
    return <Navigate to="/passwords" replace />
  }

  return children
}
