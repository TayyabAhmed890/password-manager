import { useState } from 'react'
import { LoaderCircle, Mail } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import PasswordField from '../components/PasswordField'
import { getAuthErrorMessage, loginAccount } from '../api/authApi'
import { loginContent } from '../data/authContent'
import {
  getPasswordValidationError,
  isValidEmail,
} from '../utils/authValidation'
import { useAuth } from '../../../app/useAuth'
import { useVaultToast } from '../../vault/components/useVaultToast.js'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthenticatedUser } = useAuth()
  const { showToast } = useVaultToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setErrorMessage('')

    const nextFieldErrors = {}
    if (!email.trim()) {
      nextFieldErrors.email = loginContent.emailRequired
    } else if (!isValidEmail(email.trim())) {
      nextFieldErrors.email = loginContent.emailInvalid
    }
    const passwordError = getPasswordValidationError(password)
    if (passwordError) {
      nextFieldErrors.password = loginContent[
        `password${passwordError[0].toUpperCase()}${passwordError.slice(1)}`
      ] || loginContent.passwordTooLong
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await loginAccount({ email: email.trim(), password })
      setAuthenticatedUser(result.user)
      showToast('You are now logged in.')
      const destination = location.state?.from?.pathname || '/passwords'
      navigate(destination, { replace: true })
    } catch (error) {
      const message = getAuthErrorMessage(
        error,
        'We could not log you in. Check your details and try again.',
        {
          401: 'The email or password is incorrect.',
          403: 'Admin accounts must sign in through the admin dashboard.',
        }
      )
      setErrorMessage(message)
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <div>
        <p className="text-sm font-medium text-neutral-500">{loginContent.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
          {loginContent.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {loginContent.description}
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-neutral-800">
            {loginContent.emailLabel}
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              placeholder={loginContent.emailPlaceholder}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrorMessage('')
                setFieldErrors((errors) => ({ ...errors, email: '' }))
              }}
              required
              maxLength={254}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
          {fieldErrors.email && (
            <p id="login-email-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <PasswordField
          id="login-password"
          label={loginContent.passwordLabel}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setErrorMessage('')
            setFieldErrors((errors) => ({ ...errors, password: '' }))
          }}
          placeholder={loginContent.passwordPlaceholder}
          autoComplete="current-password"
          error={fieldErrors.password}
        />

        <div className="-mt-2 flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-950 hover:decoration-neutral-950"
          >
            {loginContent.forgotPassword}
          </Link>
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? loginContent.submitting : loginContent.submit}
        </button>
        {isSubmitting && <p className="sr-only" role="status">Logging in</p>}
      </form>

      <p className="mt-7 text-center text-sm text-neutral-600">
        {loginContent.switchPrompt}{' '}
        <Link to="/register" className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-950">
          {loginContent.switchAction}
        </Link>
      </p>
    </AuthLayout>
  )
}

export default LoginPage