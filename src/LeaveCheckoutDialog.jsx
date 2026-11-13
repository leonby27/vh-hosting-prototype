import { useId, useLayoutEffect, useRef } from 'react'
import basket from './assets/checkout/shopping-basket.png'
import closeIcon from './assets/checkout/close.svg'
import './leave-checkout-dialog.css'

export default function LeaveCheckoutDialog({ title, description, onClose }) {
  const id = useId()
  const dialog = useRef(null)

  useLayoutEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="hosting-dialog hosting-leave-checkout"
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
          <button type="submit" value="checkout" autoFocus>Перейти к оплате</button>
          <button type="submit" value="leave">Прервать оплату</button>
        </div>
      </form>
      <button type="button" className="hosting-leave-close" aria-label="Закрыть" onClick={() => dialog.current.close('stay')}>
        <img src={closeIcon} width="20" height="20" alt="" />
      </button>
    </dialog>
  )
}
