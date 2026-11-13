import { createContext, useContext, useLayoutEffect } from 'react'

export const PendingChangesContext = createContext(null)

export function usePendingChanges(active, dialog, discard) {
  const navigation = useContext(PendingChangesContext)

  useLayoutEffect(() => {
    if (!active || !navigation) return
    const pending = { ...dialog, discard }
    navigation.pending.current = pending

    function confirmUnload(event) {
      event.preventDefault()
      event.returnValue = true
    }

    window.addEventListener('beforeunload', confirmUnload)
    return () => {
      window.removeEventListener('beforeunload', confirmUnload)
      if (navigation.pending.current === pending) navigation.pending.current = null
    }
  })

  return navigation?.navigate
}
