import { useId, useLayoutEffect, useRef, useState } from 'react'
import { CheckLine, PaymentOptionLabel } from './PlanChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import { DropdownPanel } from './hosting-motion.jsx'
import { newCard, paymentActions, paymentMethods, savedCard, savedSbp, securePaymentNote } from './plan-payment-options.js'
import { formatTopUpAmount } from './balance-top-up-states.js'
import closeIcon from './assets/plan-changes/unlink-close.svg'
import cardIcon from './assets/plan-changes/pay-card-24.svg'
import checkedIcon from './assets/plan-changes/checked.svg'
import uncheckedIcon from './assets/plan-changes/unchecked.svg'
import checkedDarkIcon from './assets/plan-changes/checked-dark.svg'
import uncheckedDarkIcon from './assets/plan-changes/unchecked-dark.svg'
import divider from './assets/plan-changes/payment-list-divider.svg'
import lockIcon from './assets/balance-top-up/lock.svg'
import sbpIcon from './assets/balance-top-up/sbp.svg'
import sberIcon from './assets/balance-top-up/sber.svg'
import './balance-top-up.css'

const periods = [
  { amount: 729, label: '1 месяц' },
  { amount: 1578, label: '3 месяца' },
  { amount: 2757, label: '6 месяцев' },
  { amount: 6120, label: '1 год · 510 ₽/мес', annual: true },
]
const otherMethods = { label: 'Другие способы', hint: 'Выберите тип оплаты', icon: 'more', tone: 'neutral' }
const extraMethods = ['sbp', 'yoomoney', 'sber', 'foreign', 'invoice']
  .map(id => paymentMethods.find(method => method.id === id))
const icons = { sbp: sbpIcon, sber: sberIcon }
const checkboxArtwork = {
  '--plan-checked': `url("${checkedIcon}")`,
  '--plan-unchecked': `url("${uncheckedIcon}")`,
  '--plan-checked-dark': `url("${checkedDarkIcon}")`,
  '--plan-unchecked-dark': `url("${uncheckedDarkIcon}")`,
}

function CloseButton({ onClick, label = 'Закрыть', buttonRef }) {
  return (
    <button ref={buttonRef} className="top-up-close" type="button" aria-label={label} onClick={onClick}>
      <span aria-hidden="true" style={{ '--top-up-icon': `url("${closeIcon}")` }} />
    </button>
  )
}

function PeriodOptions({ annualPlan, selected, highlightYear, onSelect }) {
  const options = annualPlan ? [periods.at(-1)] : periods

  return (
    <div className="top-up-periods" role="group" aria-label="Сумма за период">
      {options.map(({ amount, label, annual }) => (
        <button key={amount} type="button" className="top-up-period" data-highlighted={annual && highlightYear} aria-pressed={selected === amount} onClick={() => onSelect(amount)}>
          <strong>{formatTopUpAmount(amount)} ₽</strong>
          <span>{label}</span>
          {annual && (
            <>
              <span className="top-up-discount">− 30%</span>
              <span className="top-up-savings">экономия 2 628 ₽<br />+ домен .RU/.РФ в подарок</span>
            </>
          )}
        </button>
      ))}
      {annualPlan && (
        <button type="button" className="top-up-period" aria-pressed={selected === 'custom'} onClick={() => onSelect('custom')}>
          <strong>Своя сумма</strong>
          <span>Пополнить баланс на любую сумму</span>
        </button>
      )}
    </div>
  )
}

export default function BalanceTopUp({ preset, compact, savedMethods, onUnlink, onPay, onClose }) {
  const id = useId()
  const dialog = useRef(null)
  const title = useRef(null)
  const scrollArea = useRef(null)
  const input = useRef(null)
  const methodTrigger = useRef(null)
  const menu = useRef(null)
  const menuClose = useRef(null)
  const restoreTriggerFocus = useRef(false)
  const [amount, setAmount] = useState(formatTopUpAmount(preset?.amount ?? 1578))
  const [selectedPeriod, setSelectedPeriod] = useState(preset?.annualPlan || preset?.saved ? null : preset?.amount ?? 1578)
  const [method, setMethod] = useState(preset?.method ?? savedMethods[0]?.id ?? 'bank')
  const [save, setSave] = useState(true)
  const [methodsOpen, setMethodsOpen] = useState(Boolean(preset?.methodsOpen && savedMethods.length))
  const [unlinkChoice, setUnlinkChoice] = useState(null)
  const [documentAction, setDocumentAction] = useState(null)
  const [canScrollDown, setCanScrollDown] = useState(false)

  const hasSaved = savedMethods.length > 0
  const visibleMethods = hasSaved
    ? [savedMethods[0], (compact && preset?.id === 'top-up-yoomoney' ? newCard : savedMethods[1]) ?? newCard]
    : paymentMethods
  const currentSaved = savedMethods.find(option => option.id === method)
  const action = currentSaved?.icon === 'bank-card'
    ? { ...paymentActions.bank, label: `Оплатить картой ${currentSaved.label}` }
    : paymentActions[method]
  const numericAmount = Number(amount.replace(/\s/g, '').replace(',', '.'))
  const valid = Number.isFinite(numericAmount) && numericAmount > 0
  const formattedAmount = formatTopUpAmount(numericAmount)
  const otherSelected = !visibleMethods.some(option => option.id === method)

  useLayoutEffect(() => {
    dialog.current.showModal()
    title.current.focus({ preventScroll: true })
  }, [])

  useLayoutEffect(() => {
    const area = scrollArea.current

    function updateScrollPosition() {
      // scrollTop can be fractional even though scrollHeight and clientHeight are rounded.
      setCanScrollDown(area.scrollHeight - area.clientHeight - area.scrollTop > 1)
    }

    updateScrollPosition()
    area.addEventListener('scroll', updateScrollPosition, { passive: true })
    const observer = new ResizeObserver(updateScrollPosition)
    observer.observe(area)
    for (const child of area.children) observer.observe(child)
    return () => {
      area.removeEventListener('scroll', updateScrollPosition)
      observer.disconnect()
    }
  }, [])

  useLayoutEffect(() => {
    if (!methodsOpen) {
      if (restoreTriggerFocus.current) methodTrigger.current?.focus({ preventScroll: true })
      restoreTriggerFocus.current = false
      return
    }

    const panel = menu.current
    if (compact) {
      menuClose.current.focus({ preventScroll: true })
      return
    }

    function positionMenu() {
      const { top, bottom, right } = methodTrigger.current.getBoundingClientRect()
      const above = top - 14
      const below = window.innerHeight - bottom - 14
      const opensAbove = below < panel.scrollHeight && above > below
      const height = Math.min(panel.scrollHeight, opensAbove ? above : below)
      panel.style.setProperty('--top-up-menu-top', `${opensAbove ? top - 6 - height : bottom + 6}px`)
      panel.style.setProperty('--top-up-menu-left', `${Math.max(8, Math.min(right - 212, window.innerWidth - 288))}px`)
      panel.style.setProperty('--top-up-menu-height', `${Math.max(0, height)}px`)
      panel.parentElement.style.setProperty('--hosting-menu-offset', opensAbove ? '8px' : '-8px')
    }

    methodTrigger.current.scrollIntoView({ block: 'nearest' })
    positionMenu()
    const active = panel.querySelector('[aria-pressed="true"]') ?? panel.querySelector('button')
    active?.focus()
    window.addEventListener('resize', positionMenu)
    return () => window.removeEventListener('resize', positionMenu)
  }, [compact, methodsOpen])

  function closeMethods() {
    restoreTriggerFocus.current = true
    setMethodsOpen(false)
  }

  function selectPeriod(value) {
    setSelectedPeriod(value)
    if (value === 'custom') {
      input.current.focus()
      input.current.select()
    } else {
      setAmount(formatTopUpAmount(value))
    }
  }

  function editAmount(event) {
    const value = event.target.value.replace(/\s/g, '')
    if (!/^\d{0,9}(?:[,.]\d{0,2})?$/.test(value)) return
    const parsed = Number(value.replace(',', '.'))
    const options = preset?.annualPlan ? [periods.at(-1)] : periods
    setAmount(value)
    setSelectedPeriod(options.some(period => period.amount === parsed) ? parsed : 'custom')
  }

  function finishUnlink(confirmed) {
    setUnlinkChoice(null)
    if (!confirmed) {
      methodTrigger.current?.focus({ preventScroll: true })
      return
    }

    if (method === unlinkChoice.id) {
      setMethod(savedMethods.find(option => option.id !== method)?.id ?? 'bank')
    } else if (savedMethods.length === 1 && method === 'new-card') {
      setMethod('bank')
    }
    const focusTarget = savedMethods.length === 1 ? title : methodTrigger
    focusTarget.current?.focus({ preventScroll: true })
    onUnlink(unlinkChoice.id)
  }

  function submit(event) {
    event.preventDefault()
    if (!valid || methodsOpen || documentAction) return

    if (!action.demoPayment) {
      setDocumentAction({ label: action.label, amount: formattedAmount })
      return
    }

    const saved = { bank: savedCard, 'new-card': savedCard, sbp: savedSbp }[method]
    onPay(numericAmount, save ? saved : undefined)
    dialog.current.close()
  }

  return (
    <dialog
      ref={dialog}
      className="hosting-dialog top-up-dialog"
      aria-labelledby={`${id}-title`}
      onClose={event => { if (event.target === event.currentTarget) onClose() }}
      onCancel={event => {
        if (event.target !== event.currentTarget || !methodsOpen) return
        event.preventDefault()
        closeMethods()
      }}
      onKeyDown={event => {
        if (event.key === 'Escape') event.stopPropagation()
      }}
      onClick={event => {
        if (event.target === event.currentTarget) dialog.current.close()
      }}
    >
      <form className="top-up-form" onSubmit={submit} style={checkboxArtwork} inert={methodsOpen}>
        <div ref={scrollArea} className="top-up-scroll">
          <header className="top-up-header">
            <h2 className="hosting-dialog-title" ref={title} id={`${id}-title`} tabIndex={-1}>Пополнить баланс</h2>
            <CloseButton onClick={() => dialog.current.close()} />
          </header>
          <div className="top-up-body">
            <p className="top-up-description">Для оплаты хостинга, доменов, SSL и других сервисов</p>
            <p className="top-up-notice">Не хватает 309 ₽ для продления 14 ноября</p>
            <div>
              <label className="top-up-amount">
                <input ref={input} aria-label="Сумма пополнения в рублях" inputMode="decimal" value={amount} onChange={editAmount}
                  onBlur={() => { if (valid) setAmount(formattedAmount) }} />
                <span aria-hidden="true">₽</span>
              </label>
              <p className="top-up-estimate">Хватит примерно на 9 месяцев — до 2 сентября 2027</p>
            </div>
            <PeriodOptions
              annualPlan={preset?.annualPlan}
              selected={selectedPeriod}
              highlightYear={selectedPeriod === 6120 || (preset?.annualPlan && selectedPeriod === null)}
              onSelect={selectPeriod}
            />
            <fieldset className="plan-payment-group top-up-payment">
              <legend>Способ оплаты</legend>
              <div className="plan-payment-options">
                {visibleMethods.map(option => (
                  <label key={option.id} className="plan-payment-option">
                    <input type="radio" name={`${id}-payment`} value={option.id} checked={method === option.id}
                      onChange={() => setMethod(option.id)} />
                    <PaymentOptionLabel option={option} icon={icons[option.icon] && <img src={icons[option.icon]} alt="" />} />
                  </label>
                ))}
                {hasSaved && (
                  <button ref={methodTrigger} type="button" className="plan-payment-option plan-payment-trigger top-up-other-methods"
                    data-selected={otherSelected} aria-expanded={methodsOpen} aria-controls={`${id}-methods`}
                    onClick={() => setMethodsOpen(true)}>
                    <PaymentOptionLabel option={otherMethods} />
                  </button>
                )}
              </div>
            </fieldset>
            <CheckLine option={{ label: 'Сохранить — оплата в один клик и автопродление', checked: save }} onChange={setSave} />
          </div>
        </div>
        <footer className="top-up-footer" data-can-scroll-down={canScrollDown}>
          {documentAction ? (
            <>
              <p role="status">Документ сформирован в деморежиме</p>
              <a className="top-up-pay" href={`data:text/plain;charset=utf-8,${encodeURIComponent(`Демо-документ\nСумма к оплате: ${documentAction.amount} ₽`)}`}
                download={documentAction.label === 'Получить счёт' ? 'demo-invoice.txt' : 'demo-receipt.txt'}>Скачать документ</a>
              <button type="button" onClick={() => setDocumentAction(null)}>Вернуться к оплате</button>
            </>
          ) : (
            <button className="top-up-pay hosting-pressable" type="submit" disabled={!valid}>
              {action.icon === 'pay-card' && <img src={cardIcon} alt="" />}
              {action.label}
            </button>
          )}
          <p className="top-up-security"><img src={lockIcon} alt="" />{securePaymentNote.mobile}</p>
        </footer>
      </form>
      {hasSaved && (
        <DropdownPanel id={`${id}-methods`} className="top-up-method-overlay" open={methodsOpen}
          onClick={event => { if (event.target === event.currentTarget) closeMethods() }}>
          <section ref={menu} className="plan-payment-panel top-up-method-list" aria-label="Способы оплаты">
            {compact && (
              <header>
                <h3>Способы оплаты</h3>
                <CloseButton onClick={closeMethods} label="Закрыть способы оплаты" buttonRef={menuClose} />
              </header>
            )}
            <ul>
              {[...savedMethods, newCard, ...extraMethods].map(option => (
                <li key={option.id}>
                  <button type="button" aria-pressed={method === option.id} onClick={() => {
                    setMethod(option.id)
                    closeMethods()
                  }}>
                    <span>{option.listLabel ?? option.label}</span>
                    {option.unlinkLabel && <small>сохранён</small>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="plan-payment-panel-divider" aria-hidden="true"><img src={divider} alt="" /></div>
            <ul className="plan-payment-unlink">
              {savedMethods.map(option => (
                <li key={option.id}>
                  <button type="button" onClick={() => {
                    setMethodsOpen(false)
                    setUnlinkChoice(option)
                  }}>
                    {option.unlinkLabel}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </DropdownPanel>
      )}
      {unlinkChoice && (
        <WarningDialog title={`${unlinkChoice.unlinkLabel}?`} description="Вы не сможете больше оплачивать в один клик этим способом."
          confirmLabel="Отвязать" onClose={finishUnlink} />
      )}
    </dialog>
  )
}
