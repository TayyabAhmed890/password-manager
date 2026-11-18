import { useState } from 'react'
import { LoaderCircle, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../app/useAuth'
import OneTimeRecoveryCode from '../../auth/components/OneTimeRecoveryCode'
import PasswordField from '../../auth/components/PasswordField'
import {
  changeAccountPassword,
  deleteAccount,
  getAuthErrorMessage,
} from '../../auth/api/authApi'
import { getPasswordValidationError, passwordsMatch } from '../../auth/utils/authValidation'

const passwordMessages = {
  required: 'Password is required.',
  minLength: 'Use at least 8 characters.',
  uppercase: 'Add at least one uppercase letter.',
  specialCharacter: 'Add at least one special character.',
  tooLong: 'That password is too long. Please choose a shorter one.',
}

const AccountSettingsDialog = ({ mode, onClose }) => {
  const navigate = useNavigate()
  const { clearAuthenticatedUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const finishPasswordChange = () => {
    clearAuthenticatedUser()
    navigate('/login', { replace: true })
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const errors = {}
    if (!currentPassword) errors.currentPassword = 'Enter your current password.'
    const passwordError = getPasswordValidationError(newPassword)
    if (passwordError) errors.newPassword = passwordMessages[passwordError]
    if (!confirmation) {
      errors.confirmation = 'Confirm your new password.'
    } else if (!passwordsMatch(newPassword, confirmation)) {
      errors.confirmation = 'The passwords do not match.'
    }

    setFieldErrors(errors)
    setErrorMessage('')
    if (Object.keys(errors).length) return

    setIsSubmitting(true)
    try {
      const result = await changeAccountPassword({ currentPassword, newPassword })
      if (!result.newRecoveryCode) {
        setErrorMessage(
          'Your password changed, but the new recovery code could not be displayed. Contact support before continuing.'
        )
        return
      }
      setRecoveryCode(result.newRecoveryCode)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmation('')
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(
        error,
        'We could not change your password. Please try again.',
        {
          400: 'Check the password requirements and try again.',
          401: 'Your current password is incorrect.',
          409: 'Your account changed. Please try again.',
        }
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAccount = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const errors = {}
    if (!currentPassword) errors.currentPassword = 'Enter your current password.'
    if (!confirmDelete) errors.confirmDelete = 'Confirm that you understand this cannot be undone.'
    setFieldErrors(errors)
    setErrorMessage('')
    if (Object.keys(errors).length) return

    setIsSubmitting(true)
    try {
      await deleteAccount({ currentPassword })
      clearAuthenticatedUser()
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(
        error,
        'We could not delete your account. Please try again.',
        { 401: 'Your current password is incorrect.' }
      ))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isChangingPassword = mode === 'change-password'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-dialog-title"
        className="my-auto w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl sm:p-7"
      >
        {recoveryCode ? (
          <OneTimeRecoveryCode
            code={recoveryCode}
            title="Password changed"
            description="Save this new recovery code. Your previous code can no longer be used."
            continueLabel="I saved my code. Continue to log in"
            successMessage="Your password was changed successfully."
            onContinue={finishPasswordChange}
          />
        ) : (
          <>
            <header className="flex items-start justify-between gap-4 ">
              <div>
                <h2 id="account-dialog-title" className="text-xl font-bold tracking-tight text-neutral-950 font-rope ">
                  {isChangingPassword ? 'Change password' : 'Delete account'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-neutral-600">
                  {isChangingPassword
                    ? 'Confirm your current password and choose a new one.'
                    : 'This permanently deletes your account and every saved vault entry.'}
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

            <form
              className="mt-6 space-y-4 "
              onSubmit={isChangingPassword ? handlePasswordChange : handleDeleteAccount}
              noValidate
            >
              <PasswordField
                id="account-current-password"
                label="Current password"
                value={currentPassword}
                placeholder="Enter your current password"
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  setFieldErrors((errors) => ({ ...errors, currentPassword: '' }))
                }}
                autoComplete="current-password"
                error={fieldErrors.currentPassword}
                
              />

              {isChangingPassword ? (
                <>
                  <PasswordField
                    id="account-new-password"
                    label="New password"
                    value={newPassword}
                    onChange={(event) => {
                      setNewPassword(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, newPassword: '' }))
                    }}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    describedBy="account-password-hint"
                    error={fieldErrors.newPassword}
                  />
                  <p id="account-password-hint" className="-mt-2 text-xs leading-5 text-neutral-500">
                    Use at least 8 characters, one uppercase letter, and one special character.
                  </p>
                  <PasswordField
                    id="account-confirm-password"
                    label="Confirm new password"
                    placeholder="Re-enter your new password"
                    value={confirmation}
                    onChange={(event) => {
                      setConfirmation(event.target.value)
                      setFieldErrors((errors) => ({ ...errors, confirmation: '' }))
                    }}
                    autoComplete="new-password"
                    minLength={8}
                    error={fieldErrors.confirmation}
                  />
                </>
              ) : (
                <div>
                  <label className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-900">
                    <input
                      type="checkbox"
                      checked={confirmDelete}
                      onChange={(event) => {
                        setConfirmDelete(event.target.checked)
                        setFieldErrors((errors) => ({ ...errors, confirmDelete: '' }))
                      }}
                      className="mt-1 accent-red-700"
                    />
                    <span>I understand my account and saved passwords will be permanently deleted.</span>
                  </label>
                  {fieldErrors.confirmDelete && (
                    <p role="alert" className="mt-2 text-sm leading-5 text-red-700">
                      {fieldErrors.confirmDelete}
                    </p>
                  )}
                </div>
              )}

              {errorMessage && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end font-rope font-bold">
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
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60 ${
                    isChangingPassword ? 'bg-neutral-950 hover:bg-neutral-700' : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  {isSubmitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                  {isSubmitting
                    ? (isChangingPassword ? 'Changing password...' : 'Deleting account...')
                    : (isChangingPassword ? 'Update password' : 'Delete account')}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  )
}

export default AccountSettingsDialog
