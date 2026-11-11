import { useState } from 'react'
import { Check, Copy, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { changeAdminPassword } from '../api/authApi.js'
import { validatePasswordChange } from '../passwordValidation.js'
import { useAdminAuth } from '../useAdminAuth.js'
import { isExpiredSessionError } from '../../../shared/lib/authErrors.js'

// Reusable PasswordInput — ek jagah likho, teen jagah use karo
// Props: id, label, value, onChange, autoComplete, visible, onToggle
const PasswordInput = ({ id, label, value, onChange, autoComplete, visible, onToggle }) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-800">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={onChange}
        className="min-h-11 w-full rounded-lg border border-slate-300 py-2 pl-3 pr-12 text-sm outline-none focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-slate-950"
      >
        {visible
          ? <EyeOff size={18} aria-hidden="true" />
          : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  </div>
)

const AdminChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [newRecoveryCode, setNewRecoveryCode] = useState('')
  // isCopied — Copy icon ko Check icon mein badlta hai, text feedback ki zaroorat nahi
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
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
    setCopyError('')
    try {
      await navigator.clipboard.writeText(newRecoveryCode)
      setIsCopied(true)
    } catch {
      setIsCopied(false)
      setCopyError('Could not copy the recovery code. Please select and copy it manually.')
    }
  }

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  // ── Success state: naya recovery code ─────────────────────────
  if (newRecoveryCode) {
    return (
      <section className="mx-auto w-full max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Change password</h1>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-semibold text-slate-950">Password changed</h2>
          <p role="status" className="mt-2 text-sm leading-6 text-slate-600">
            Save this new recovery code somewhere safe. Your previous code can no longer be used.
          </p>

          {/* Recovery code display — monospace, select-all pe full code select hoga */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="select-all break-all font-mono text-sm font-semibold tracking-wide text-slate-900">
              {newRecoveryCode}
            </p>
          </div>

          {/* Copy button — isCopied state se icon aur text dono change hote hain */}
          <button
            type="button"
            onClick={copyRecoveryCode}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {isCopied
              ? <Check size={15} aria-hidden="true" />
              : <Copy size={15} aria-hidden="true" />}
            {isCopied ? 'Copied' : 'Copy recovery code'}
          </button>

          {/* Sirf error dikhao — success feedback button pe hi hai */}
          {copyError && (
            <p role="alert" className="mt-2 text-xs text-red-700">{copyError}</p>
          )}

          <button
            type="button"
            onClick={finishPasswordChange}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Continue to sign in
          </button>
        </div>
      </section>
    )
  }

  // ── Password change form ───────────────────────────────────────
  return (
    <section className="mx-auto w-full max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Change password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Verify your current password before setting a new one.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <PasswordInput
          id="admin-current-password"
          label="Current password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value)
            setErrorMessage('')
          }}
          autoComplete="current-password"
          visible={visiblePasswords.current}
          onToggle={() => togglePasswordVisibility('current')}
        />

        <div>
          <PasswordInput
            id="admin-new-password"
            label="New password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value)
              setErrorMessage('')
            }}
            autoComplete="new-password"
            visible={visiblePasswords.new}
            onToggle={() => togglePasswordVisibility('new')}
          />
          <p className="mt-1.5 text-xs text-slate-500">Use at least 8 characters.</p>
        </div>

        <PasswordInput
          id="admin-confirm-password"
          label="Confirm new password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setErrorMessage('')
          }}
          autoComplete="new-password"
          visible={visiblePasswords.confirm}
          onToggle={() => togglePasswordVisibility('confirm')}
        />

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
            {errorMessage}
          </p>
        )}

        {/* LoaderCircle spinner — login/forgot pages ke saath consistent */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
          {isSubmitting ? 'Changing password…' : 'Change password'}
        </button>
        {isSubmitting && <p role="status" className="sr-only">Changing admin password</p>}

        <Link
          to="/"
          className="inline-flex min-h-10 items-center text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
        >
          Cancel
        </Link>
      </form>
    </section>
  )
}

export default AdminChangePasswordPage
