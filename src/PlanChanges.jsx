import { Fragment, useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { DropdownPanel, TabIndicator, useAnimatedHeight } from './hosting-motion.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import WarningDialog from './WarningDialog.jsx'
import listIcon from './assets/hosting/logs.svg'
import closeIcon from './assets/checkout/close.svg'
import './plan-changes.css'

const assets = import.meta.glob('./assets/plan-changes/*.{svg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function asset(name, extension = 'svg') {
  return assets[`./assets/plan-changes/${name}.${extension}`]
}

const themedArtwork = {
  minus: 'icon-primary',
  plus: 'icon-primary',
  more: 'icon-primary',
  remove: 'icon-info',
  lock: 'icon-info',
  'payment-list-divider': 'line',
}

function Art({ name, extension, className }) {
  const url = asset(name, extension)
  const tone = themedArtwork[name]
  if (!tone) return <img className={className} src={url} alt="" />

  return (
    <span
      aria-hidden="true"
      className={className ? `plan-tinted-art ${className}` : 'plan-tinted-art'}
      style={{ '--plan-art-mask': `url("${url}")`, '--plan-art-color': `var(--hosting-${tone})` }}
    >
      <img src={url} alt="" />
    </span>
  )
}

const artwork = {
  '--plan-checked': `url("${asset('checked')}")`,
  '--plan-unchecked': `url("${asset('unchecked')}")`,
  '--plan-checked-dark': `url("${asset('checked-dark')}")`,
  '--plan-unchecked-dark': `url("${asset('unchecked-dark')}")`,
  '--plan-leader-art': `url("${asset('leader')}")`,
}

export function CheckLine({ option, onChange }) {
  return (
    <label className="plan-check-line">
      <input type="checkbox" checked={option.checked} onChange={event => onChange(event.target.checked)} />
      <span className="plan-check-text">
        <span>{option.label}</span>
        {option.hint && (
          <small className={option.warning ? 'plan-warning-text' : undefined}>{option.hint}</small>
        )}
      </span>
      {option.amount && <span className="plan-money">{option.amount}</span>}
    </label>
  )
}

function IconButton({ icon, label, onClick, disabled }) {
  return (
    <button type="button" className="plan-icon-button" aria-label={label} onClick={onClick} disabled={disabled}>
      <Art name={icon} />
    </button>
  )
}

function TermPicker({ term, onChange }) {
  if (term.options) {
    return (
      <div className="plan-segments hosting-indicator-track" role="group" aria-label="Срок оплаты">
        <TabIndicator selected={term.value} />
        {term.options.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={term.value === value} onClick={() => onChange(value)}>
            {label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="hosting-stepper" role="group" aria-label="Срок в месяцах">
      <IconButton icon="minus" label="Уменьшить срок" disabled={term.value <= term.min} onClick={() => onChange(term.value - 1)} />
      <output aria-live="polite">{term.value} мес.</output>
      <IconButton icon="plus" label="Увеличить срок" disabled={term.value >= term.max} onClick={() => onChange(term.value + 1)} />
    </div>
  )
}

function ChangeItem({ item, onUpdate }) {
  return (
    <li className={item.removed ? 'plan-item plan-item--removed' : 'plan-item'}>
      <div className="plan-item-heading">
        <span className="plan-item-title">{item.title}</span>
        {item.removed ? (
          <button type="button" className="plan-text-button" onClick={() => onUpdate({ removed: false })}>Вернуть</button>
        ) : (
          <span className="plan-item-values">
            {item.previous && <del className="plan-money">{item.previous}</del>}
            {item.amount && <span className={item.credit ? 'plan-money plan-credit' : 'plan-money'}>{item.amount}</span>}
            {item.detail && <span className="plan-secondary">{item.detail}</span>}
            {item.removable && <IconButton icon="remove" label={item.removeLabel ?? `Убрать ${item.accessibleName ?? item.title}`} onClick={() => onUpdate({ removed: true })} />}
          </span>
        )}
      </div>
      {item.description && <p className="plan-item-description">{item.description}</p>}
      {!item.removed && (item.term || item.addons?.length > 0) && (
        <div className="plan-branch">
          {item.term && (
            <div className="plan-term-row">
              <TermPicker term={item.term} onChange={value => onUpdate({ term: { ...item.term, value } })} />
              {item.term.hint && <span className="plan-secondary">{item.term.hint}</span>}
            </div>
          )}
          {item.addons?.map(addon => (
            <div className="plan-addon" key={addon.id}>
              <span>{addon.title}</span>
              <span className="plan-money">{addon.amount}</span>
              <IconButton
                icon="remove"
                label={`Убрать ${addon.title.toLowerCase()}`}
                onClick={() => onUpdate({ addons: item.addons.filter(entry => entry.id !== addon.id) })}
              />
            </div>
          ))}
        </div>
      )}
    </li>
  )
}

function Notice({ notice, onAction }) {
  const alert = notice.tone === 'warning'
  return (
    <div className={`plan-notice plan-notice--${notice.tone}`}>
      <span className="plan-notice-icon">
        <Art name={notice.icon} extension={alert ? 'svg' : 'png'} />
      </span>
      <div className="plan-notice-body">
        {notice.title && <p className="plan-notice-title">{notice.title}</p>}
        <p>{notice.description}</p>
        {notice.action && (
          <button type="button" className="plan-outline-button" onClick={() => onAction(notice.action)}>{notice.action.label}</button>
        )}
      </div>
    </div>
  )
}

export function PaymentOptionLabel({ option, hint = option.hint, icon }) {
  return (
    <>
      <span className="plan-payment-icon" data-tone={option.tone}>
        {icon ?? <Art name={option.icon} className={option.icon === 'pay-balance' ? 'plan-payment-balance-art' : undefined} />}
      </span>
      <span className="plan-payment-label">
        <strong>{option.label}</strong>
        {hint && <small>{hint}</small>}
      </span>
    </>
  )
}

function OtherPaymentMethods({ option, value, selected, onChange, onAction }) {
  const id = useId()
  const disclosure = useRef(null)
  const trigger = useRef(null)
  const panel = useRef(null)
  const [open, setOpen] = useState(false)
  const [unlinkChoice, setUnlinkChoice] = useState(null)
  const current = selected && option.choices.find(choice => choice.id === value)
  const saved = option.choices.filter(choice => choice.unlinkLabel)

  useLayoutEffect(() => {
    if (!open) return

    function positionPanel() {
      const menu = panel.current
      const { top, bottom } = trigger.current.getBoundingClientRect()
      // Leave room for the 6px gap at the trigger and an 8px viewport inset.
      const above = top - 14
      const below = window.innerHeight - bottom - 14
      const opensAbove = below < menu.scrollHeight + 2 && above > below
      menu.dataset.side = opensAbove ? 'above' : 'below'
      menu.style.maxBlockSize = `${Math.max(0, opensAbove ? above : below)}px`
    }

    function closeOnOutsideClick(event) {
      if (!disclosure.current.contains(event.target)) setOpen(false)
    }

    positionPanel()
    window.addEventListener('resize', positionPanel)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      window.removeEventListener('resize', positionPanel)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [open])

  function closeMenu() {
    trigger.current.focus({ preventScroll: true })
    setOpen(false)
  }

  function finishUnlink(confirmed) {
    setUnlinkChoice(null)
    if (!confirmed) return

    if (saved.length === 1) disclosure.current.closest('fieldset')?.focus({ preventScroll: true })
    onAction({ id: 'unlink-payment-method', method: unlinkChoice.id, label: unlinkChoice.unlinkLabel })
  }

  return (
    <div
      ref={disclosure}
      className="plan-payment-disclosure"
      data-wide={option.wide || undefined}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={event => {
        if (!open || event.key !== 'Escape') return
        event.preventDefault()
        event.stopPropagation()
        closeMenu()
      }}
    >
      <button
        ref={trigger}
        type="button"
        className={`plan-payment-option plan-payment-trigger${option.wide ? ' plan-payment-option--wide' : ''}`}
        data-selected={Boolean(current)}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(current => !current)}
      >
        <PaymentOptionLabel option={option} hint={current?.listLabel ?? current?.label ?? option.hint} />
      </button>
      <DropdownPanel ref={panel} className="plan-payment-panel" id={id} open={open}>
        <ul>
          {option.choices.map(choice => (
            <li key={choice.id}>
              <button type="button" aria-pressed={value === choice.id} onClick={() => {
                closeMenu()
                onChange(choice.id)
              }}>
                <span>{choice.listLabel ?? choice.label}</span>
                {choice.unlinkLabel && <small>сохранён</small>}
              </button>
            </li>
          ))}
        </ul>
        {saved.length > 0 && (
          <>
            <div className="plan-payment-panel-divider"><Art name="payment-list-divider" /></div>
            <ul className="plan-payment-unlink">
              {saved.map(choice => (
                <li key={choice.id}>
                  <button type="button" onClick={() => {
                    closeMenu()
                    setUnlinkChoice(choice)
                  }}>
                    {choice.unlinkLabel}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DropdownPanel>
      {unlinkChoice && (
        <WarningDialog
          title={`Вы уверены, что хотите ${unlinkChoice.unlinkLabel.replace(/^Отвязать /, 'отвязать ')}?`}
          description="Вы не сможете больше оплачивать в один клик этим способом."
          confirmLabel="Отвязать"
          onClose={finishUnlink}
        />
      )}
    </div>
  )
}

function PaymentGroup({ group, onChange, onAction }) {
  const id = useId()
  const selectedCard = group.options.some(option => option.id === group.value)
  return (
    <fieldset className="plan-payment-group" aria-label={group.accessibleName ?? group.label} tabIndex={-1}>
      <legend>{group.label}</legend>
      <div className="plan-payment-options">
        {group.options.map(option => option.choices ? (
          <OtherPaymentMethods
            key={option.id}
            option={option}
            value={group.value}
            selected={!selectedCard}
            onChange={onChange}
            onAction={onAction}
          />
        ) : (
          <label key={option.id} className={option.wide ? 'plan-payment-option plan-payment-option--wide' : 'plan-payment-option'}>
            <input
              type="radio"
              name={id}
              value={option.id}
              checked={group.value === option.id}
              onChange={() => onChange(option.id)}
            />
            <PaymentOptionLabel option={option} />
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function InvoiceAction({ label, amount = '', disabled }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef(null)
  const heading = useRef(null)
  const restoreFocus = useRef(false)

  useLayoutEffect(() => {
    if (open) {
      heading.current?.focus({ preventScroll: true })
    } else if (restoreFocus.current) {
      trigger.current?.focus({ preventScroll: true })
      restoreFocus.current = false
    }
  }, [open])

  if (!open) {
    return (
      <button
        ref={trigger}
        type="button"
        className="hosting-pressable"
        aria-disabled={disabled || undefined}
        onClick={() => { if (!disabled) setOpen(true) }}
      >{label}</button>
    )
  }

  const escapedAmount = String(amount).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const invoiceHtml = `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Демо-счёт для юридического лица</title>
<h1>Демо-счёт для юридического лица</h1>
<p>Сумма к оплате: <strong>${escapedAmount}</strong></p>
</html>`

  return (
    <div className="plan-invoice">
      <div className="plan-invoice-copy">
        <div className="plan-invoice-heading">
          <div>
            <h3 ref={heading} tabIndex={-1}>Ждём оплату по счёту</h3>
            <strong>{amount}</strong>
          </div>
          <IconButton icon="remove" label="Закрыть блок счёта" onClick={() => {
            restoreFocus.current = true
            setOpen(false)
          }} />
        </div>
        <p>Изменения применим сразу после зачисления. Заказ держим 5 дней, до этого тариф и ресурсы прежние.</p>
      </div>
      <a
        className="plan-invoice-download hosting-pressable"
        href={`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHtml)}`}
        download="demo-invoice.html"
      >Скачать счёт</a>
    </div>
  )
}

export function PlanChangesEmpty({ title = 'Добавьте услуги', description = 'Здесь появятся выбранные услуги и сумма к оплате.', icon = listIcon, children }) {
  return (
    <div className="plan-changes-empty">
      <span className="plan-changes-empty-icon" aria-hidden="true"
        style={{ '--plan-empty-icon': `url("${icon}")` }} />
      <strong>{title}</strong>
      <p>{description}</p>
      {children}
    </div>
  )
}

export default function PlanChanges({
  label = 'Что изменится',
  heading,
  onDiscard,
  empty,
  items = [],
  nextCharge,
  notices = [],
  renewalOptions = [],
  adjustments = [],
  totals = [],
  paymentGroups = [],
  saveOptions = [],
  actions = [],
  actionDescription,
  animateHeight = true,
  paymentNote,
  paymentContext,
  simulatePaymentFailure = false,
  onChange = () => {},
  onAction = () => {},
}) {
  const showToast = useContext(HostingToastContext)
  const content = useAnimatedHeight(undefined, animateHeight)
  const paymentErrorId = useId()
  const paymentTimer = useRef(null)
  const [pendingAction, setPendingAction] = useState(null)
  const [failedAction, setFailedAction] = useState(null)
  const summary = Boolean(items.length || nextCharge || notices.length || renewalOptions.length)
  const payment = Boolean(adjustments.length || totals.length || paymentGroups.length || saveOptions.length || actions.length || actionDescription || paymentNote)

  useLayoutEffect(() => {
    setPendingAction(null)
    setFailedAction(null)
    return () => {
      clearTimeout(paymentTimer.current)
      paymentTimer.current = null
    }
  }, [paymentContext])

  function resetPaymentFeedback() {
    setFailedAction(null)
    if (paymentTimer.current === null) return
    clearTimeout(paymentTimer.current)
    paymentTimer.current = null
    setPendingAction(null)
  }

  function change(group, id, patch) {
    resetPaymentFeedback()
    onChange(group, id, patch)
  }

  function performAction(action) {
    resetPaymentFeedback()
    onAction(action)
  }

  function pressAction(action) {
    if (paymentTimer.current !== null) return
    setFailedAction(null)
    if (!action.demoPayment) {
      onAction(action)
      return
    }

    setPendingAction(action.id)
    paymentTimer.current = setTimeout(() => {
      paymentTimer.current = null
      setPendingAction(null)
      if (simulatePaymentFailure) {
        setFailedAction(action.id)
      } else if (onAction(action) !== false) {
        showToast({ message: 'Успешно оплачено', success: true })
      }
    }, 900)
  }

  return (
    <section className="plan-changes" aria-label={label} style={artwork}>
      {heading && (
        <div className="plan-changes-heading">
          <h2 id={heading.id} ref={heading.ref} tabIndex={-1}>{label}</h2>
          {onDiscard && (
            <button type="button" className="plan-changes-cancel" onClick={() => {
              resetPaymentFeedback()
              onDiscard()
            }}>
              <span aria-hidden="true" style={{ '--plan-cancel-icon': `url("${closeIcon}")` }} />
              Отменить
            </button>
          )}
        </div>
      )}
      <div className={!empty && summary && payment ? 'plan-changes-card plan-changes-card--split' : 'plan-changes-card'}>
        <div className="plan-changes-card-content" ref={content}>
          {empty && <PlanChangesEmpty {...empty} />}
          {!empty && summary && (
            <div className="plan-changes-summary">
              {items.length > 0 && (
                <ul className="plan-items">
                  {items.map(item => (
                    <ChangeItem key={item.id} item={item} onUpdate={patch => change('items', item.id, patch)} />
                  ))}
                </ul>
              )}
              {nextCharge && (
                <div className="plan-next-charge"><span>{nextCharge.label}</span><span className="plan-money">{nextCharge.amount}</span></div>
              )}
              {notices.length > 0 && (
                <div className="plan-notices">
                  {notices.map(notice => <Notice key={notice.id} notice={notice} onAction={performAction} />)}
                </div>
              )}
              {renewalOptions.length > 0 && (
                <div className="plan-check-group">
                  {renewalOptions.map(option => <CheckLine key={option.id} option={option} onChange={checked => change('renewalOptions', option.id, { checked })} />)}
                </div>
              )}
            </div>
          )}
          {!empty && payment && (
            <div className="plan-changes-payment">
              {adjustments.length > 0 && (
                <div className="plan-check-group">
                  {adjustments.map(option => <CheckLine key={option.id} option={option} onChange={checked => change('adjustments', option.id, { checked })} />)}
                </div>
              )}
              {totals.length > 0 && (
                <dl className="plan-totals">
                  {totals.map(total => (
                    <div key={total.label}>
                      <dt>{total.label}</dt>
                      <dd className="plan-money" aria-live={total.live ? 'polite' : undefined}>{total.amount}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(paymentGroups.length > 0 || saveOptions.length > 0) && (
                <div className="plan-payment-methods">
                  {paymentGroups.map(group => (
                    <PaymentGroup key={group.id} group={group} onChange={value => change('paymentGroups', group.id, { value })} onAction={performAction} />
                  ))}
                  {saveOptions.length > 0 && (
                    <div className="plan-check-group">
                      {saveOptions.map(option => <CheckLine key={option.id} option={option} onChange={checked => change('saveOptions', option.id, { checked })} />)}
                    </div>
                  )}
                </div>
              )}
              {(actions.length > 0 || actionDescription) && (
                <div className="plan-actions">
                  {actions.map(action => {
                    if (action.id === 'invoice') {
                      return (
                        <InvoiceAction
                          key={JSON.stringify([action.id, paymentContext, totals[0]?.amount])}
                          label={action.label}
                          amount={totals[0]?.amount}
                          disabled={Boolean(pendingAction)}
                        />
                      )
                    }
                    const busy = pendingAction === action.id
                    const failed = failedAction === action.id
                    return (
                      <Fragment key={action.id}>
                        <button
                          type="button"
                          className="hosting-pressable"
                          data-tone={action.tone}
                          aria-busy={busy || undefined}
                          aria-disabled={Boolean(pendingAction) || undefined}
                          aria-describedby={failed ? paymentErrorId : undefined}
                          onClick={() => pressAction(action)}
                        >
                          {busy ? <span className="plan-action-spinner" aria-hidden="true" /> : action.icon && <Art name={action.icon} className="plan-action-icon" />}
                          {busy ? 'Оплачиваем…' : action.label}
                        </button>
                        {failed && (
                          <p id={paymentErrorId} className="plan-payment-error" role="alert">
                            Не удалось провести оплату. Попробуйте ещё раз позже.
                          </p>
                        )}
                      </Fragment>
                    )
                  })}
                  {actionDescription && <p>{actionDescription}</p>}
                </div>
              )}
              {paymentNote && (
                <p className="plan-payment-note">
                  <Art name="lock" />
                  <span className="plan-note-desktop">{paymentNote.desktop}</span>
                  <span className="plan-note-mobile">{paymentNote.mobile ?? paymentNote.desktop}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
