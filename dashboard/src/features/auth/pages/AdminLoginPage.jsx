import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../useAdminAuth.js'
import { loginAdmin } from '../api/authApi.js'
import { useToast } from '../../../shared/components/useToast.js'

const AdminLoginPage = ({ accessDenied = false }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
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
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const result = await loginAdmin({ email: email.trim(), password })
      if (!acceptAdmin(result.user)) {
        showToast('This account does not have admin access.', 'error')
        return
      }

      showToast('Signed in successfully.')
      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath && requestedPath !== '/login' ? requestedPath : '/', {
        replace: true,
      })
    } catch (error) {
      showToast(error.message || 'Could not sign in. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" aria-label="Keynest Admin" className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white">
          <KeyRound size={20} aria-hidden="true" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Admin login
        </h1>

        {accessDenied && (
          <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
            This account does not have admin access.
          </p>
        )}

        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-800">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setFieldErrors((current) => ({ ...current, email: '' }))
              }}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'admin-email-error' : undefined}
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
            {fieldErrors.email && (
              <p id="admin-email-error" role="alert" className="mt-1.5 text-sm text-red-700">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-800">
              Password
            </label>
            <div className="relative">
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
                className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
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

          <button
            type="submit"
            disabled={isSubmitting || status === 'loading'}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {status === 'loading' ? 'Checking session…' : isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
          {status === 'loading' && <p role="status" className="sr-only">Checking for an existing admin session</p>}
          {isSubmitting && <p role="status" className="sr-only">Signing in to Keynest Admin</p>}
        </form>
        <Link
          to="/forgot-password"
          className="mt-5 inline-flex min-h-10 items-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          Forgot password?
        </Link>
      </section>
    </main>
  )
}

export default AdminLoginPage
