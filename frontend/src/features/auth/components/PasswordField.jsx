import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { passwordVisibilityContent } from '../data/authContent'

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
  describedBy,
  error,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const errorId = `${id}-error`
  const inputDescribedBy = [describedBy, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="relative">
        <LockKeyhole
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
          aria-hidden="true"
        />
        <input
          id={id}
          name={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          minLength={minLength}
          aria-describedby={inputDescribedBy}
          aria-invalid={Boolean(error)}
          className="min-h-12 w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-12 text-sm text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-950 focus:ring-2 focus:ring-neutral-950/10"
        />
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? passwordVisibilityContent.hide : passwordVisibilityContent.show}
          aria-pressed={isVisible}
          className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-neutral-950"
        >
          {isVisible
            ? <EyeOff size={17} aria-hidden="true" />
            : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm leading-5 text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export default PasswordField
