import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import VaultToastContext from './vaultToastContext.js'

const VaultToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null)
  const [isToastVisible, setIsToastVisible] = useState(false)
  const timerRef = useRef(null)
  const exitTimerRef = useRef(null)

  const dismissToast = useCallback(() => {
    window.clearTimeout(timerRef.current)
    window.clearTimeout(exitTimerRef.current)
    setIsToastVisible(false)
    exitTimerRef.current = window.setTimeout(() => setToast(null), 200)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    window.clearTimeout(timerRef.current)
    window.clearTimeout(exitTimerRef.current)
    setToast({ message, type })
    setIsToastVisible(true)
    timerRef.current = window.setTimeout(() => {
      setIsToastVisible(false)
      exitTimerRef.current = window.setTimeout(() => setToast(null), 200)
    }, 3500)
  }, [])

  useEffect(() => () => {
    window.clearTimeout(timerRef.current)
    window.clearTimeout(exitTimerRef.current)
  }, [])

  return (
    <VaultToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="vault-toast pointer-events-none fixed bottom-5 right-4 z-60 w-[calc(100%-2rem)] max-w-sm sm:bottom-6 sm:right-6">
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none ${
              isToastVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            } ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-green-200 bg-white text-neutral-900'
            }`}
          >
            {toast.type === 'error'
              ? <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
              : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-green-700" aria-hidden="true" />}
            <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-current opacity-70 hover:opacity-100"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </VaultToastContext.Provider>
  )
}

export default VaultToastProvider
