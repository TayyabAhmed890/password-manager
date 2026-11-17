import { useState } from 'react'
import { LoaderCircle, WifiOff } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

// Simple loading spinner and text
const SessionLoading = () => (
  <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-5 text-center">
    <LoaderCircle size={24} className="animate-spin text-neutral-800" aria-hidden="true" />
    <p role="status" className="text-sm text-neutral-600">
      loading...
    </p>
  </main>
)

// Not-Found layout style: minimal, centered, no card box, with realistic retry spinner
const SessionErrorScreen = ({ message, onRetry }) => {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (isRetrying) return
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 text-center">
      <section className="max-w-md">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-800">
          <WifiOff size={30} strokeWidth={1.8} aria-hidden="true" />
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Connection lost
        </h1>

        <p className="mt-2.5 text-sm leading-6 text-neutral-600">
          {message || 'Could not reach the server. Please check your internet and try again.'}
        </p>

        <button
          type="button"
          disabled={isRetrying}
          onClick={handleRetry}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRetrying && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
          {isRetrying ? 'Connecting...' : 'Try again'}
        </button>
      </section>
    </main>
  )
}

export const RequireAuth = ({ children }) => {
  const { status, sessionError, refreshSession } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <SessionLoading />
  }

  if (status === 'error') {
    return <SessionErrorScreen message={sessionError} onRetry={refreshSession} />
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export const GuestOnly = ({ children }) => {
  const { status, sessionError, refreshSession } = useAuth()

  if (status === 'loading') {
    return <SessionLoading />
  }

  if (status === 'error') {
    return <SessionErrorScreen message={sessionError} onRetry={refreshSession} />
  }

  if (status === 'authenticated') {
    return <Navigate to="/passwords" replace />
  }

  return children
}
