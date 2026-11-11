import { useState } from 'react'
import {
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { resetAdminPassword } from '../api/authApi.js'
import { validatePasswordReset } from '../passwordValidation.js'
import AuthLayout from '../components/AuthLayout.jsx'

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyRecoveryCode = async () => {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(newRecoveryCode)
      setIsCopied(true)
    } catch {
      setIsCopied(false)
      setCopyError('Could not copy the recovery code. Select and copy it manually.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const validationMessage = validatePasswordReset({
      email,
      recoveryCode,
      newPassword,
      confirmPassword,
    })
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const result = await resetAdminPassword({
        email: email.trim(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      })
      setNewRecoveryCode(result.newRecoveryCode)
    } catch (error) {
      setErrorMessage(error.message || 'Could not reset the password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  // ── Success state ────────────────────────────────────────────
  if (newRecoveryCode) {
    return (
      <AuthLayout>
        <section aria-labelledby="recovery-code-title">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
            <KeyRound size={21} aria-hidden="true" />
          </div>
          <h2
            id="recovery-code-title"
            className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950"
          >
            Password updated
          </h2>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Save this new recovery code. Your previous code can no longer be used.
          </p>

          <div className="mt-6 rounded-2xl border border-neutral-300 bg-white p-4 sm:p-5">
            <p className="break-all text-center font-mono text-base font-semibold tracking-[0.12em] text-neutral-950 sm:text-lg">
              {newRecoveryCode}
            </p>
          </div>

          <button
            type="button"
            onClick={copyRecoveryCode}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {isCopied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
            {isCopied ? 'Copied' : 'Copy recovery code'}
          </button>

          {copyError && (
            <p role="alert" className="mt-3 text-sm leading-5 text-red-700">{copyError}</p>
          )}

          <Link
            to="/login"
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-center text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            I saved my code. Continue to sign in
          </Link>
        </section>
      </AuthLayout>
    )
  }

  // ── Reset form ───────────────────────────────────────────────
  return (
    <AuthLayout>
      <div>
        
        <p className="text-sm font-medium text-neutral-500">Account recovery</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
          Reset your password
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Enter your admin email and recovery code to set a new password.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div>
          <label htmlFor="admin-reset-email" className="mb-2 block text-sm font-medium text-neutral-800">
            Admin email
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="admin-reset-email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              autoFocus
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setErrorMessage('')
              }}
              placeholder="admin@example.com"
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
        </div>

        {/* Recovery code */}
        <div>
          <label htmlFor="admin-recovery-code" className="mb-2 block text-sm font-medium text-neutral-800">
            Recovery code
          </label>
          <div className="relative">
            <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="admin-recovery-code"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              required
              value={recoveryCode}
              onChange={(event) => {
                setRecoveryCode(event.target.value)
                setErrorMessage('')
              }}
              placeholder="Enter your recovery code"
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 font-mono text-xs tracking-wide text-neutral-950 outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10 sm:text-sm"
            />
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">Use the latest recovery code issued for your account.</p>
        </div>

        {/* New password */}
        <div>
          <label htmlFor="admin-new-password" className="mb-2 block text-sm font-medium text-neutral-800">
            New password
          </label>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="admin-new-password"
              type={visiblePasswords.new ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => {
                setNewPassword(event.target.value)
                setErrorMessage('')
              }}
              placeholder="At least 8 characters"
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              aria-label={visiblePasswords.new ? 'Hide new password' : 'Show new password'}
              aria-pressed={Boolean(visiblePasswords.new)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-neutral-950"
            >
              {visiblePasswords.new
                ? <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-neutral-500">Use at least 8 characters.</p>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="admin-confirm-password" className="mb-2 block text-sm font-medium text-neutral-800">
            Confirm new password
          </label>
          <div className="relative">
            <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="admin-confirm-password"
              type={visiblePasswords.confirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setErrorMessage('')
              }}
              placeholder="Re-enter your new password"
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white py-2 pl-10 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              aria-label={visiblePasswords.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
              aria-pressed={Boolean(visiblePasswords.confirm)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-neutral-500 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-neutral-950"
            >
              {visiblePasswords.confirm
                ? <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
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
          {isSubmitting ? 'Resetting password…' : 'Reset password'}
        </button>
        {isSubmitting && <p role="status" className="sr-only">Resetting admin password</p>}
      </form>

      <p className="mt-7 text-center text-sm text-neutral-600">
        Remembered your password?{' '}
        <Link
          to="/login"
          className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-950"
        >
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  )
}

export default AdminForgotPasswordPage
