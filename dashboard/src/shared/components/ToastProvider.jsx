import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert, X } from 'lucide-react'
import ToastContext from './ToastContext.js'

const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    window.clearTimeout(timer.current)
    setToast({ message, type })
    timer.current = window.setTimeout(() => setToast(null), 3500)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-5 right-4 z-50 w-[calc(100%-2rem)] max-w-sm sm:right-6">
          <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-white text-slate-900'
            }`}
          >
            {toast.type === 'error'
              ? <CircleAlert size={18} className="mt-0.5 shrink-0 text-red-700" aria-hidden="true" />
              : <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />}
            <p className="min-w-0 flex-1 text-sm leading-5">{toast.message}</p>
            <button type="button" onClick={dismiss} aria-label="Dismiss notification">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export default ToastProvider
