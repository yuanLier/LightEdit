import type { ToastState } from '../types'

type ToastProps = {
  toast: ToastState | null
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{toast.message}</span>
      {toast.action && (
        <button className="toastAction" type="button" onClick={toast.action.onSelect}>
          {toast.action.label}
        </button>
      )}
    </div>
  )
}
