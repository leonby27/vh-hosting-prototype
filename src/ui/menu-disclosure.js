import { useCallback, useEffect, useId, useRef, useState } from 'react'

export function useMenuDisclosure({ disabled = false, preventScroll = false, open: controlledOpen, defaultOpen = false, onOpenChange } = {}) {
  const id = useId()
  const [requestedOpen, setOpen] = useState(defaultOpen)
  const container = useRef(null)
  const trigger = useRef(null)
  const open = (controlledOpen ?? requestedOpen) && !disabled
  const updateOpen = useCallback(next => {
    if (controlledOpen === undefined) setOpen(next)
    onOpenChange?.(next)
  }, [controlledOpen, onOpenChange])

  useEffect(() => {
    if (!open) return

    function dismiss(event) {
      if (!container.current?.contains(event.target)) updateOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, updateOpen])

  function close() {
    updateOpen(false)
    trigger.current?.focus({ preventScroll })
  }

  function onBlur(event) {
    if (open && !event.currentTarget.contains(event.relatedTarget)) updateOpen(false)
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    event.stopPropagation()
    close()
  }

  return {
    id, open, close, setOpen: updateOpen,
    containerProps: { ref: container, onBlur, onKeyDown },
    triggerProps: {
      ref: trigger,
      type: 'button',
      'aria-expanded': open,
      'aria-controls': id,
      onClick: () => updateOpen(!open),
    },
  }
}
