import { useState } from 'react'
import { LoaderCircle, LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../useAdminAuth.js'
import { loginAdmin } from '../api/authApi.js'
import { useToast } from '../../../shared/components/useToast.js'
import AuthLayout from '../components/AuthLayout.jsx'

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
    <AuthLayout>
      <div>
        <p className="text-sm font-medium text-neutral-500">Welcome back</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
          Sign in to continue
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Use your administrator account credentials.
        </p>
      </div>

      {accessDenied && (
        <p role="alert" className="mt-5 rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm leading-5 text-neutral-800">
          This account does not have admin access. Sign in with an administrator account.
        </p>
      )}

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-neutral-800">
            Email address
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
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
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
          {fieldErrors.email && (
            <p id="admin-email-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-800">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-950 hover:decoration-neutral-950">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
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
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
            <button
              type="button"
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-neutral-950"
            >
              {isPasswordVisible
                ? <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="admin-password-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">{fieldErrors.password}</p>
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
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
          {status === 'loading' ? 'Checking session…' : isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
        {status === 'loading' && <p role="status" className="sr-only">Checking for an existing admin session</p>}
        {isSubmitting && <p role="status" className="sr-only">Signing in to Keynest Admin</p>}
      </form>
    </AuthLayout>
  )
}

export default AdminLoginPage
