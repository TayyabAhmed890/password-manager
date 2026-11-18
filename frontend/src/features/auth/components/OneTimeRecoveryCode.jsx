import { useState } from 'react'
import { Check, Copy, Download } from 'lucide-react'
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
  const [isDownloaded, setIsDownloaded] = useState(false)
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

  const downloadCode = () => {
    const fileContent = [
      'Keynest — One-Time Account Recovery Code',
      '========================================',
      '',
      'Recovery Code:',
      code,
      '',
      'Important:',
      '- Store this file somewhere safe and private.',
      '- This code is shown only once and is required if you forget your password.',
      '- Using this code to reset your password will replace it with a new one.',
      '',
    ].join('\r\n')

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'keynest-recovery-code.txt'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setIsDownloaded(true)
  }

  return (
    <section aria-labelledby="recovery-code-title">
      
      <h2
        id="recovery-code-title"
        className="mt-6 text-3xl font-bold tracking-[-0.04em] text-neutral-950 font-space"
      >
        {title}
      </h2>
      {successMessage && (
        <p
          role="status"
          className="font-space mt-3 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium leading-5 text-green-900"
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={copyCode}
          className="font-space font-bold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          {isCopied ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Copy size={17} aria-hidden="true" />
          )}
          {isCopied ? registerContent.recoveryCopied : registerContent.recoveryCopy}
        </button>

        <button
          type="button"
          onClick={downloadCode}
          className="font-space font-bold inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 text-sm text-neutral-800 transition hover:border-neutral-500 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
        >
          {isDownloaded ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Download size={17} aria-hidden="true" />
          )}
          {isDownloaded ? registerContent.recoveryDownloaded : registerContent.recoveryDownload}
        </button>
      </div>

      {copyError && (
        <p role="alert" className="mt-3 text-sm leading-5 text-red-700">
          {copyError}
        </p>
      )}

      <Link
        to="/login"
        onClick={onContinue}
        className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-5 text-center text-sm font-semibold text-white transition hover:border-neutral-700 hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 font-space"
      >
        {continueLabel}
      </Link>
    </section>
  )
}

export default OneTimeRecoveryCode
