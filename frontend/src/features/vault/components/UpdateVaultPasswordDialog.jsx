import { useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/useAuth'
import { AuthApiError, getAuthErrorMessage } from '../../auth/api/authApi'
import PasswordField from '../../auth/components/PasswordField'
import { updateVaultEntryPassword } from '../api/vaultApi'
import { useVaultToast } from './useVaultToast'

const UpdateVaultPasswordDialog = ({ entry, onClose, onUpdated }) => {
  const navigate = useNavigate()
  const { clearAuthenticatedUser } = useAuth()
  const { showToast } = useVaultToast()
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    if (!password) {
      setFieldError('Enter the new password for this sign-in.')
      return
    }

    if (password.length > 4096) {
      setFieldError('That password is too long.')
      return
    }

    setFieldError('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await updateVaultEntryPassword(entry.id, password)
      onUpdated()
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        clearAuthenticatedUser()
        navigate('/login', { replace: true })
        return
      }

      const message = getAuthErrorMessage(
        error,
        'We could not update this password. Please try again.',
        { 404: 'This saved sign-in is no longer available.' }
      )
      setErrorMessage(message)
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-vault-password-title"
        className="my-auto w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:p-7"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="update-vault-password-title" className="text-xl font-semibold text-neutral-950">
              Update saved password
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              Change the password saved for <span className="font-medium text-neutral-900">{entry.website}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <PasswordField
            id="updated-vault-password"
            label="New saved password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setFieldError('')
            }}
            placeholder="Enter the new password"
            autoComplete="new-password"
            error={fieldError}
          />
          <p className="-mt-2 text-xs leading-5 text-neutral-500">
            This updates only the saved sign-in. It does not change your Keynest account password.
          </p>

          {errorMessage && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
            >
              {isSubmitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default UpdateVaultPasswordDialog
