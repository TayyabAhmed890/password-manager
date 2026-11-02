import { useState } from 'react'
import { ArrowLeft, Globe2, LoaderCircle, Mail } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import PasswordField from '../../auth/components/PasswordField'
import { AuthApiError, getAuthErrorMessage } from '../../auth/api/authApi'
import { isValidEmail } from '../../auth/utils/authValidation'
import { createVaultEntry } from '../api/vaultApi'
import { useAuth } from '../../../app/useAuth'
import { useVaultToast } from '../components/useVaultToast'

const CreatePasswordPage = () => {
  const navigate = useNavigate()
  const { clearAuthenticatedUser } = useAuth()
  const { showToast } = useVaultToast()
  const [website, setWebsite] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (isSubmitting) return

    const errors = {}
    if (!website.trim()) {
      errors.website = 'Enter a website or service name.'
    } else if (website.trim().length > 255) {
      errors.website = 'The website or service name is too long.'
    }

    if (!email.trim()) {
      errors.email = 'Enter the sign-in email.'
    } else if (!isValidEmail(email.trim()) || email.trim().length > 254) {
      errors.email = 'Enter a valid sign-in email.'
    }

    if (!password) errors.password = 'Enter the password you want to save.'

    setFieldErrors(errors)
    setErrorMessage('')
    if (Object.keys(errors).length) return

    setIsSubmitting(true)
    try {
      await createVaultEntry({
        website: website.trim(),
        email: email.trim(),
        password,
      })
      navigate('/passwords', {
        replace: true,
        state: { notice: 'Password saved to your vault.' },
      })
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        clearAuthenticatedUser()
        navigate('/login', { replace: true })
        return
      }

      const message = getAuthErrorMessage(
        error,
        'We could not save this password. Please try again.',
        { 400: 'Check the entry details and try again.' }
      )
      setErrorMessage(message)
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/passwords"
        className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-950"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to passwords
      </Link>

      <div className="mt-5">
        <p className="text-sm font-medium text-neutral-500">Add to your vault</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
          Save a password
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Store the sign-in details together so they are easy to find next time.
        </p>
      </div>

      <form
        className="mt-7 space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7"
        onSubmit={handleSubmit}
        noValidate
      >
        <div>
          <label htmlFor="vault-website" className="mb-2 block text-sm font-medium text-neutral-800">
            Website or service
          </label>
          <div className="relative">
            <Globe2 size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="vault-website"
              name="website"
              type="text"
              autoComplete="url"
              placeholder="Example: example.com"
              value={website}
              onChange={(event) => {
                setWebsite(event.target.value)
                setFieldErrors((errors) => ({ ...errors, website: '' }))
              }}
              maxLength={255}
              aria-invalid={Boolean(fieldErrors.website)}
              aria-describedby={fieldErrors.website ? 'vault-website-error' : undefined}
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
          {fieldErrors.website && (
            <p id="vault-website-error" role="alert" className="mt-2 text-sm text-red-700">{fieldErrors.website}</p>
          )}
        </div>

        <div>
          <label htmlFor="vault-email" className="mb-2 block text-sm font-medium text-neutral-800">
            Sign-in email
          </label>
          <div className="relative">
            <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              id="vault-email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setFieldErrors((errors) => ({ ...errors, email: '' }))
              }}
              maxLength={254}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'vault-email-error' : undefined}
              className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
            />
          </div>
          {fieldErrors.email && (
            <p id="vault-email-error" role="alert" className="mt-2 text-sm text-red-700">{fieldErrors.email}</p>
          )}
        </div>

        <PasswordField
          id="vault-password"
          label="Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((errors) => ({ ...errors, password: '' }))
          }}
          placeholder="Enter the password to save"
          autoComplete="new-password"
          error={fieldErrors.password}
        />

        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-5 text-neutral-600">
          Your saved password is encrypted before it is stored and is only revealed when you ask to view it.
        </p>

        {errorMessage && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/passwords"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? 'Saving password...' : 'Save password'}
          </button>
        </div>
        {isSubmitting && <p className="sr-only" role="status">Saving this password</p>}
      </form>
    </div>
  )
}

export default CreatePasswordPage
