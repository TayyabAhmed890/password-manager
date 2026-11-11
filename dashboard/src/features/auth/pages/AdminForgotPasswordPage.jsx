import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { resetAdminPassword } from '../api/authApi.js'
import { validatePasswordReset } from '../passwordValidation.js'

const AdminForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const copyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(newRecoveryCode)
      setCopyMessage('Recovery code copied.')
    } catch {
      setCopyMessage('Could not copy the recovery code. Select and copy it manually.')
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 sm:py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:min-h-147.5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative flex min-h-48 flex-col justify-between overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:min-h-full lg:p-10">
          <div className="absolute -right-20 -top-20 size-64 rounded-full border border-white/10" aria-hidden="true" />
          <div className="absolute -right-10 -top-10 size-44 rounded-full border border-white/10" aria-hidden="true" />
          <Link to="/login" aria-label="Back to Keynest Admin sign in" className="relative inline-flex w-fit items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10">
              <KeyRound size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Keynest</span>
              <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Admin console</span>
            </span>
          </Link>
          <div className="relative mt-8 lg:mt-auto lg:pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Account recovery</p>
            <h1 className="mt-3 max-w-sm text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              Get back into your admin account.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              Verify your account with its recovery code, then choose a new password.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-200">
              <ShieldCheck size={15} aria-hidden="true" />
              Recovery code required
            </div>
          </div>
        </aside>

        <section className="flex items-center px-6 py-8 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link
              to="/login"
              className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to sign in
            </Link>

            {newRecoveryCode ? (
              <div className="mt-7">
                <span className="flex size-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Check size={20} aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                  Password reset
                </h2>
                <p role="status" className="mt-2 text-sm leading-6 text-slate-600">
                  Save this new recovery code now. Your previous code can no longer be used.
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    New recovery code
                  </p>
                  <p className="mt-3 select-all break-all rounded-lg border border-slate-200 bg-white px-3 py-3 font-mono text-sm font-semibold tracking-wide text-slate-900">
                    {newRecoveryCode}
                  </p>
                  <button
                    type="button"
                    onClick={copyRecoveryCode}
                    className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    <Copy size={15} aria-hidden="true" />
                    Copy recovery code
                  </button>
                  {copyMessage && <p role="status" className="mt-2 text-xs text-slate-600">{copyMessage}</p>}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">
                  Keep the code somewhere private. It is needed if you have to reset your password again.
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Continue to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-500">Admin account</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Reset your password
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Enter your admin email and recovery code to set a new password.
                  </p>
                </div>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                  <div>
                    <label htmlFor="admin-reset-email" className="mb-2 block text-sm font-medium text-slate-800">
                      Admin email
                    </label>
                    <div className="relative">
                      <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-recovery-code" className="mb-2 block text-sm font-medium text-slate-800">
                      Recovery code
                    </label>
                    <div className="relative">
                      <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="admin-new-password" className="mb-2 block text-sm font-medium text-slate-800">
                      New password
                    </label>
                    <div className="relative">
                      <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-12 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        aria-label={visiblePasswords.new ? 'Hide new password' : 'Show new password'}
                        aria-pressed={Boolean(visiblePasswords.new)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-950"
                      >
                        {visiblePasswords.new ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>
                  </div>

                  <div>
                    <label htmlFor="admin-confirm-password" className="mb-2 block text-sm font-medium text-slate-800">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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
                        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-12 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        aria-label={visiblePasswords.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                        aria-pressed={Boolean(visiblePasswords.confirm)}
                        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-slate-500 hover:text-slate-950"
                      >
                        {visiblePasswords.confirm ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
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
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                    {isSubmitting ? 'Resetting password…' : 'Reset password'}
                  </button>
                  {isSubmitting && <p role="status" className="sr-only">Resetting admin password</p>}
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default AdminForgotPasswordPage
