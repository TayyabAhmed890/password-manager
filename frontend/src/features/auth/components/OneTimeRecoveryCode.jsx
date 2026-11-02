import { useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { registerContent } from '../data/authContent'

const OneTimeRecoveryCode = ({
  code,
  title,
  description,
  continueLabel,
  successMessage,
  onContinue,
}) => {
  const [isCopied, setIsCopied] = useState(false)
  const [copyError, setCopyError] = useState('')

  const copyCode = async () => {
    setCopyError('')

    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
    } catch {
      setIsCopied(false)
      setCopyError(registerContent.recoveryCopyError)
    }
  }

  return (
    <section aria-labelledby="recovery-code-title">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
        <KeyRound size={21} aria-hidden="true" />
      </div>
      <h2
        id="recovery-code-title"
        className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950"
      >
        {title}
      </h2>
      {successMessage && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium leading-5 text-green-900"
        >
          {successMessage}
        </p>
      )}
      <p className="mt-3 text-sm leading-6 text-neutral-600">{description}</p>

      <div className="mt-6 rounded-2xl border border-neutral-300 bg-white p-4 sm:p-5">
        <p className="break-all text-center font-mono text-base font-semibold tracking-[0.12em] text-neutral-950 sm:text-lg">
          {code}
        </p>
      </div>

      <button
        type="button"
        onClick={copyCode}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
      >
        {isCopied ? (
          <Check size={17} aria-hidden="true" />
        ) : (
          <Copy size={17} aria-hidden="true" />
        )}
        {isCopied ? registerContent.recoveryCopied : registerContent.recoveryCopy}
      </button>

      {copyError && (
        <p role="alert" className="mt-3 text-sm leading-5 text-red-700">
          {copyError}
        </p>
      )}

      <Link
        to="/login"
        onClick={onContinue}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-center text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
      >
        {continueLabel}
      </Link>
    </section>
  )
}

export default OneTimeRecoveryCode
