import { Button } from './ui/controls.jsx'
import { useId, useRef } from 'react'
import { ModalClose, ModalFrame } from './ui/feedback.jsx'
import basket from './assets/checkout/shopping-basket.png'
import './leave-checkout-dialog.css'

export default function LeaveCheckoutDialog({ title, description, onClose }) {
  const id = useId()
  const dialog = useRef(null)

  return (
    <ModalFrame ref={dialog} className="hosting-dialog hosting-leave-checkout"
      aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onClose={event => onClose(event.currentTarget.returnValue)}
      onKeyDown={event => { if (event.key === 'Escape') event.stopPropagation() }}>
      <form method="dialog">
        <div className="hosting-leave-copy">
          <span className="hosting-leave-basket"><img src={basket} alt="" /></span>
          <div>
            <h2 className="hosting-dialog-title" id={`${id}-title`}>{title}</h2>
            <p id={`${id}-description`}>{description}</p>
          </div>
        </div>
        <div className="hosting-leave-actions">
          <Button size={44} type="submit" value="checkout" autoFocus>Перейти к оплате</Button>
          <Button variant="outline" size={44} type="submit" value="leave">Прервать оплату</Button>
        </div>
      </form>
      <ModalClose className="hosting-leave-close" onClick={() => dialog.current.close('stay')} />
    </ModalFrame>
  )
}
