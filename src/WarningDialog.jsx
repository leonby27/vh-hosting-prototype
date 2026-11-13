import { useId, useLayoutEffect, useRef } from 'react'
import alertIcon from './assets/plan-changes/unlink-alert.svg'
import closeIcon from './assets/plan-changes/unlink-close.svg'
import './warning-dialog.css'

export default function WarningDialog({ title, description, confirmLabel, onClose }) {
  const id = useId()
  const dialog = useRef(null)

  useLayoutEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog
      ref={dialog}
      className="hosting-dialog hosting-dialog--sheet hosting-warning-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onClose={event => onClose(event.currentTarget.returnValue === 'confirm')}
      onKeyDown={event => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
    >
      <form method="dialog">
        <div className="hosting-warning-copy">
          <span className="hosting-warning-icon"><img src={alertIcon} alt="" /></span>
          <div>
            <h3 className="hosting-dialog-title" id={`${id}-title`}>{title}</h3>
            <p id={`${id}-description`}>{description}</p>
          </div>
        </div>
        <div className="hosting-warning-actions">
          <button type="submit" value="cancel">{confirmLabel ? 'Отменить' : 'Понятно'}</button>
          {confirmLabel && <button type="submit" value="confirm" className="hosting-warning-confirm">{confirmLabel}</button>}
        </div>
      </form>
      <button type="button" className="hosting-warning-close" aria-label="Закрыть" onClick={() => dialog.current.close('cancel')}>
        <span className="hosting-warning-close-icon" style={{ '--hosting-warning-close-icon': `url("${closeIcon}")` }}>
          <img src={closeIcon} alt="" />
        </span>
      </button>
    </dialog>
  )
}
