import { Button } from './ui/controls.jsx'
import { useId, useRef } from 'react'
import { ModalClose, ModalFrame } from './ui/feedback.jsx'
import alertIcon from './assets/plan-changes/unlink-alert.svg'
import './warning-dialog.css'

export default function WarningDialog({ title, description, confirmLabel, onClose }) {
  const id = useId()
  const dialog = useRef(null)

  return (
    <ModalFrame
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
          <Button variant="neutral" type="submit" value="cancel">{confirmLabel ? 'Отменить' : 'Понятно'}</Button>
          {confirmLabel && <Button tone="danger" type="submit" value="confirm">{confirmLabel}</Button>}
        </div>
      </form>
      <ModalClose className="hosting-warning-close" onClick={() => dialog.current.close('cancel')} />
    </ModalFrame>
  )
}
