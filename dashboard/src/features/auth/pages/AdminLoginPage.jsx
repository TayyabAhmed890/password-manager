import { useState } from 'react'
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../useAdminAuth.js'
import { loginAdmin } from '../api/authApi.js'
import { useToast } from '../../../shared/components/useToast.js'

const AdminLoginPage = ({ accessDenied = false }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { status, acceptAdmin } = useAdminAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting || status === 'loading') return

    const errors = {}
    if (!email.trim()) errors.email = 'Enter your admin email.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address.'
    }
    if (!password) errors.password = 'Enter your password.'
    setFieldErrors(errors)
    setErrorMessage('')
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await loginAdmin({ email: email.trim(), password })
      if (!acceptAdmin(result.user)) {
        setErrorMessage('This account does not have admin access.')
        return
      }

      showToast('Signed in successfully.')
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath && requestedPath !== '/login' ? requestedPath : '/', {
        replace: true,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Could not sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:min-h-147.5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:min-h-full lg:p-10">
          <div className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -right-10 -top-10 size-44 rounded-full border border-white/10" aria-hidden="true" />
          <Link to="/login" aria-label="Keynest Admin sign in" className="relative inline-flex w-fit items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <KeyRound size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Keynest</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin console</span>
            </span>
          </Link>
          <div className="relative mt-8 lg:mt-auto lg:pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Administrator access</p>
            <h1 className="mt-3 max-w-sm text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Manage your platform with confidence.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              Sign in to review accounts and keep your admin tools up to date.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200">
              <ShieldCheck size={15} aria-hidden="true" />
              Protected admin session
            </div>
          </div>
        </aside>

        <section className="flex items-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-medium text-slate-500">Welcome back</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Sign in to continue
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your administrator account credentials.
            </p>

            {accessDenied && (
              <p role="alert" className="mt-5 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm leading-5 text-slate-800">
                This account does not have admin access. Sign in with an administrator account.
              </p>
            )}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-slate-800">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck="false"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)
                      setFieldErrors((current) => ({ ...current, email: '' }))
                    }}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
                    placeholder="admin@example.com"
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </div>
                {fieldErrors.email && (
                  <p id="admin-email-error" role="alert" className="mt-1.5 text-sm text-red-700">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="admin-password" className="block text-sm font-medium text-slate-800">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setFieldErrors((current) => ({ ...current, password: '' }))
                    }}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'admin-password-error' : undefined}
                    placeholder="Enter your password"
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-12 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={isPasswordVisible}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
                  >
                    {isPasswordVisible
                      ? <EyeOff size={18} aria-hidden="true" />
                      : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="admin-password-error" role="alert" className="mt-1.5 text-sm text-red-700">{fieldErrors.password}</p>
                )}
              </div>

              {errorMessage && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || status === 'loading'}
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  : <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
                {status === 'loading' ? 'Checking session…' : isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
              {status === 'loading' && <p role="status" className="sr-only">Checking for an existing admin session</p>}
              {isSubmitting && <p role="status" className="sr-only">Signing in to Keynest Admin</p>}
            </form>

            <p className="mt-6 flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-5 text-slate-500">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              Your session is protected and only available to admin accounts.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminLoginPage
