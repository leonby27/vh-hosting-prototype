import { createContext, useEffect } from 'react'
import successIcon from './assets/dashboard/status-ok.svg'

export const HostingToastContext = createContext(() => {})

export function HostingToast({ toast, setToast }) {
  useEffect(() => {
    if (!toast) return
    const timeout = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timeout)
  }, [toast, setToast])

  return (
    <div className="hosting-toast" role="status">
      {toast?.success && <img src={successIcon} alt="" width="24" height="24" />}
      {toast?.message}
    </div>
  )
}
