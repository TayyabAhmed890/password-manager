import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetAdminPassword } from '../api/authApi.js'
import { validatePasswordReset } from '../passwordValidation.js'

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(newRecoveryCode)
      setCopyMessage('Recovery code copied.')
    } catch {
      setCopyMessage('Could not copy the recovery code. Please select and copy it manually.')
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
        recoveryCode,
        newPassword,
      })
      setNewRecoveryCode(result.newRecoveryCode)
    } catch (error) {
      setErrorMessage(error.message || 'Could not reset the password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <Link to="/login" aria-label="Back to admin login" className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white">
          <KeyRound size={20} aria-hidden="true" />
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
          Reset admin password
        </h1>

        {newRecoveryCode ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="text-sm leading-6 text-slate-600">
              Your password was reset. Save this new recovery code now; the previous code
              can no longer be used.
            </p>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="select-all break-all font-mono text-sm text-amber-950">
                {newRecoveryCode}
              </p>
              <button
                type="button"
                onClick={copyRecoveryCode}
                className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-amber-300 bg-white px-3 text-sm font-medium text-amber-950 hover:bg-amber-100"
              >
                Copy recovery code
              </button>
              {copyMessage && <p role="status" className="mt-2 text-xs text-amber-950">{copyMessage}</p>}
            </div>
            <Link
              to="/login"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the email and recovery code for your admin account.
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="admin-reset-email" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Admin email
                </label>
                <input
                  id="admin-reset-email"
                  type="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </div>
              <div>
                <label htmlFor="admin-recovery-code" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Recovery code
                </label>
                <input
                  id="admin-recovery-code"
                  type="text"
                  autoComplete="off"
                  required
                  value={recoveryCode}
                  onChange={(event) => setRecoveryCode(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </div>
              <div>
                <label htmlFor="admin-new-password" className="mb-1.5 block text-sm font-medium text-slate-800">
                  New password
                </label>
                <input
                  id="admin-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
                <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>
              </div>
              <div>
                <label htmlFor="admin-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-800">
                  Confirm new password
                </label>
                <input
                  id="admin-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </div>
              {errorMessage && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                  {errorMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Resetting password…' : 'Reset password'}
              </button>
            </form>
            <Link to="/login" className="mt-4 inline-flex min-h-10 items-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
              Back to sign in
            </Link>
          </>
        )}
      </section>
    </main>
  )
}

export default AdminForgotPasswordPage
