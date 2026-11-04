import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { changeAdminPassword } from '../api/authApi.js'
import { validatePasswordChange } from '../passwordValidation.js'
import { useAdminAuth } from '../useAdminAuth.js'
import { isExpiredSessionError } from '../../../shared/lib/authErrors.js'

const AdminChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  const [copyMessage, setCopyMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { clearAdmin } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const validationMessage = validatePasswordChange({
      currentPassword,
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
      const result = await changeAdminPassword({ currentPassword, newPassword })
      setNewRecoveryCode(result.newRecoveryCode)
    } catch (error) {
      if (isExpiredSessionError(error, ['Current password is incorrect.'])) {
        clearAdmin()
        navigate('/login', { replace: true })
        return
      }
      setErrorMessage(error.message || 'Could not change the password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const finishPasswordChange = () => {
    clearAdmin()
    navigate('/login', { replace: true })
  }

  const copyRecoveryCode = async () => {
    try {
      await navigator.clipboard.writeText(newRecoveryCode)
      setCopyMessage('Recovery code copied.')
    } catch {
      setCopyMessage('Could not copy the recovery code. Please select and copy it manually.')
    }
  }

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Change password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Verify your current password before setting a new one.
      </p>

      {newRecoveryCode ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold text-slate-950">Password changed</h2>
          <p role="status" className="mt-2 text-sm leading-6 text-slate-600">
            Save this new recovery code somewhere safe. Your previous code can no longer be used.
          </p>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
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
          <button
            type="button"
            onClick={finishPasswordChange}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Continue to sign in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <label htmlFor="admin-current-password" className="mb-1.5 block text-sm font-medium text-slate-800">
              Current password
            </label>
            <div className="relative">
              <input
                id="admin-current-password"
                type={visiblePasswords.current ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={visiblePasswords.current ? 'Hide current password' : 'Show current password'}
                aria-pressed={Boolean(visiblePasswords.current)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
              >
                {visiblePasswords.current
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="admin-new-password" className="mb-1.5 block text-sm font-medium text-slate-800">
              New password
            </label>
            <div className="relative">
              <input
                id="admin-new-password"
                type={visiblePasswords.new ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={visiblePasswords.new ? 'Hide new password' : 'Show new password'}
                aria-pressed={Boolean(visiblePasswords.new)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
              >
                {visiblePasswords.new
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="admin-confirm-password" className="mb-1.5 block text-sm font-medium text-slate-800">
              Confirm new password
            </label>
            <div className="relative">
              <input
                id="admin-confirm-password"
                type={visiblePasswords.confirm ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={visiblePasswords.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                aria-pressed={Boolean(visiblePasswords.confirm)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
              >
                {visiblePasswords.confirm
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye size={18} aria-hidden="true" />}
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Changing password…' : 'Change password'}
          </button>
          <Link to="/" className="inline-flex min-h-10 items-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline">
            Cancel
          </Link>
        </form>
      )}
    </section>
  )
}

export default AdminChangePasswordPage
