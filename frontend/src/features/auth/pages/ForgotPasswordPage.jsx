import { useState } from 'react'
import { KeyRound, LoaderCircle, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OneTimeRecoveryCode from '../components/OneTimeRecoveryCode'
import PasswordField from '../components/PasswordField'
import { getAuthErrorMessage, resetPassword } from '../api/authApi'
import { forgotPasswordContent } from '../data/authContent'
import {
  getPasswordValidationError,
  isValidEmail,
  passwordsMatch,
} from '../utils/authValidation'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [recoveryCodeMissing, setRecoveryCodeMissing] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }

    setErrorMessage('')

    const nextFieldErrors = {}
    if (!email.trim()) {
      nextFieldErrors.email = forgotPasswordContent.emailRequired
    } else if (!isValidEmail(email.trim())) {
      nextFieldErrors.email = forgotPasswordContent.emailInvalid
    }

    if (!recoveryCode.trim()) {
      nextFieldErrors.recoveryCode = forgotPasswordContent.recoveryCodeRequired
    }

    const passwordError = getPasswordValidationError(newPassword)
    if (passwordError) {
      const messageKey =
        `password${passwordError[0].toUpperCase()}${passwordError.slice(1)}`
      nextFieldErrors.newPassword =
        forgotPasswordContent[messageKey] || forgotPasswordContent.passwordTooLong
    }

    if (!confirmation) {
      nextFieldErrors.confirmation = forgotPasswordContent.confirmationRequired
    } else if (!passwordsMatch(newPassword, confirmation)) {
      nextFieldErrors.confirmation = forgotPasswordContent.passwordMismatch
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await resetPassword({
        email: email.trim(),
        recoveryCode,
        newPassword,
      })

      if (!result.newRecoveryCode) {
        setRecoveryCodeMissing(true)
        setNewPassword('')
        setConfirmation('')
        return
      }

      setNewRecoveryCode(result.newRecoveryCode)
      setNewPassword('')
      setConfirmation('')
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(
        error,
        'We could not reset your password. Check your details and try again.',
        {
          400: forgotPasswordContent.resetDetailsInvalid,
          401: forgotPasswordContent.invalidRecoveryCode,
          409: forgotPasswordContent.recoveryCodeConflict,
          500: forgotPasswordContent.resetServerError,
          503: 'Password reset is temporarily unavailable. Please try again shortly.',
        }
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (newRecoveryCode) {
    return (
      <AuthLayout>
        <OneTimeRecoveryCode
          code={newRecoveryCode}
          title={forgotPasswordContent.recoverySuccessTitle}
          description={forgotPasswordContent.recoverySuccessDescription}
          continueLabel={forgotPasswordContent.recoverySuccessContinue}
        />
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div>
        <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
          <KeyRound size={21} aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-neutral-500">
          {forgotPasswordContent.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
          {forgotPasswordContent.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {forgotPasswordContent.description}
        </p>
      </div>

      {recoveryCodeMissing ? (
        <div className="mt-8 space-y-5">
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            {forgotPasswordContent.missingNewRecoveryCode}
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {forgotPasswordContent.loginAction}
          </Link>
        </div>
      ) : (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-sm font-medium text-neutral-800">
              {forgotPasswordContent.emailLabel}
            </label>
            <div className="relative">
              <Mail
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id="recovery-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                placeholder={forgotPasswordContent.emailPlaceholder}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrorMessage('')
                  setFieldErrors((errors) => ({ ...errors, email: '' }))
                }}
                required
                maxLength={254}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'recovery-email-error' : undefined}
                className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
              />
            </div>
            {fieldErrors.email && (
              <p id="recovery-email-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="recovery-code" className="mb-2 block text-sm font-medium text-neutral-800">
              {forgotPasswordContent.recoveryCodeLabel}
            </label>
            <div className="relative">
              <KeyRound
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id="recovery-code"
                name="recoveryCode"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                placeholder={forgotPasswordContent.recoveryCodePlaceholder}
                value={recoveryCode}
                onChange={(event) => {
                  setRecoveryCode(event.target.value)
                  setErrorMessage('')
                  setFieldErrors((errors) => ({ ...errors, recoveryCode: '' }))
                }}
                required
                aria-invalid={Boolean(fieldErrors.recoveryCode)}
                aria-describedby={fieldErrors.recoveryCode ? 'recovery-code-error' : undefined}
                className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 font-mono text-xs tracking-wide text-neutral-950 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10 sm:text-sm"
              />
            </div>
            {fieldErrors.recoveryCode && (
              <p id="recovery-code-error" role="alert" className="mt-2 text-sm leading-5 text-red-700">
                {fieldErrors.recoveryCode}
              </p>
            )}
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {forgotPasswordContent.recoveryCodeHint}
            </p>
          </div>

          <PasswordField
            id="new-password"
            label={forgotPasswordContent.newPasswordLabel}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setErrorMessage('')
              setFieldErrors((errors) => ({ ...errors, newPassword: '' }))
            }}
            placeholder={forgotPasswordContent.newPasswordPlaceholder}
            autoComplete="new-password"
            minLength={8}
            describedBy="new-password-hint"
            error={fieldErrors.newPassword}
          />
          <p id="new-password-hint" className="-mt-3 text-xs leading-5 text-neutral-500">
            {forgotPasswordContent.passwordHint}
          </p>

          <PasswordField
            id="confirm-new-password"
            label={forgotPasswordContent.confirmPasswordLabel}
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value)
              setErrorMessage('')
              setFieldErrors((errors) => ({ ...errors, confirmation: '' }))
            }}
            placeholder={forgotPasswordContent.confirmPasswordPlaceholder}
            autoComplete="new-password"
            minLength={8}
            error={fieldErrors.confirmation}
          />

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
            {isSubmitting ? forgotPasswordContent.submitting : forgotPasswordContent.submit}
          </button>
          {isSubmitting && <p className="sr-only" role="status">Updating your password</p>}
        </form>
      )}

      <p className="mt-7 text-center text-sm text-neutral-600">
        {forgotPasswordContent.loginPrompt}{' '}
        <Link
          to="/login"
          className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-950"
        >
          {forgotPasswordContent.loginAction}
        </Link>
      </p>
    </AuthLayout>
  )
}

export default ForgotPasswordPage
