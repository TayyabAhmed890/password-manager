import { useState } from 'react'
import { LoaderCircle, Mail, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OneTimeRecoveryCode from '../components/OneTimeRecoveryCode'
import PasswordField from '../components/PasswordField'
import { registerAccount, getAuthErrorMessage } from '../api/authApi'
import { registerContent } from '../data/authContent'
import {
  getPasswordValidationError,
  isValidEmail,
  isValidDisplayName,
} from '../utils/authValidation'

const RegisterPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recoveryCodeMissing, setRecoveryCodeMissing] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setErrorMessage('')

    const nextFieldErrors = {}
    if (!name.trim()) {
      nextFieldErrors.name = registerContent.nameRequired
    } else if (!isValidDisplayName(name)) {
      nextFieldErrors.name = registerContent.nameTooLong
    }

    if (!email.trim()) {
      nextFieldErrors.email = registerContent.emailRequired
    } else if (!isValidEmail(email.trim())) {
      nextFieldErrors.email = registerContent.emailInvalid
    }

    const passwordError = getPasswordValidationError(password)
    if (passwordError) {
      nextFieldErrors.password = registerContent[
        `password${passwordError[0].toUpperCase()}${passwordError.slice(1)}`
      ] || registerContent.passwordTooLong
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerAccount({ name: name.trim(), email: email.trim(), password })

      if (!result.recoveryCode) {
        setPassword('')
        setRecoveryCodeMissing(true)
        return
      }

      setRecoveryCode(result.recoveryCode)
      setPassword('')
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(
        error,
        'We could not create your account. Please try again.',
        {
          400: 'Check your email and password, then try again.',
          409: 'An account with this email already exists.',
        }
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      {recoveryCode ? (
        <OneTimeRecoveryCode
          code={recoveryCode}
          title={registerContent.recoveryTitle}
          description={registerContent.recoveryDescription}
          continueLabel={registerContent.recoveryContinue}
          successMessage={registerContent.successMessage}
        />
      ) : recoveryCodeMissing ? (
        <div>
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            {registerContent.missingRecoveryCode}
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {registerContent.switchAction}
          </Link>
        </div>
      ) : (
        <>
          <div className="font-space">
            <p className="text-sm font-medium text-neutral-500">{registerContent.eyebrow}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              {registerContent.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              {registerContent.description}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-neutral-800">
                {registerContent.nameLabel}
              </label>
              <div className="relative">
                <UserRound
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder={registerContent.namePlaceholder}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setErrorMessage('')
                    setFieldErrors((errors) => ({ ...errors, name: '' }))
                  }}
                  maxLength={80}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>
              {fieldErrors.name && (
                <p id="register-name-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">
                  {fieldErrors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-neutral-800">
                {registerContent.emailLabel}
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder={registerContent.emailPlaceholder}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setErrorMessage('')
                    setFieldErrors((errors) => ({ ...errors, email: '' }))
                  }}
                  required
                  maxLength={254}
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                  className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
                />
              </div>
              {fieldErrors.email && (
                <p id="register-email-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <PasswordField
              id="register-password"
              label={registerContent.passwordLabel}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setErrorMessage('')
                setFieldErrors((errors) => ({ ...errors, password: '' }))
              }}
              placeholder={registerContent.passwordPlaceholder}
              autoComplete="new-password"
              minLength={8}
              describedBy="register-password-hint"
              error={fieldErrors.password}
            />
            <p id="register-password-hint" className="-mt-3 text-xs leading-5 text-neutral-500">
              {registerContent.passwordHint}
            </p>

            {errorMessage && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:cursor-not-allowed disabled:opacity-60 font-space"
            >
              {isSubmitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? registerContent.submitting : registerContent.submit}
            </button>
            {isSubmitting && <p className="sr-only" role="status">Creating your account</p>}
          </form>

          <p className="mt-7 text-center text-sm text-neutral-600">
            {registerContent.switchPrompt}{' '}
            <Link to="/login" className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-950">
              {registerContent.switchAction}
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}

export default RegisterPage
