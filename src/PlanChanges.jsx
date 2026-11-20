import { MenuItem, MenuPanel, SegmentedOptions, moveMenuFocus } from './ui/navigation.jsx'
import { Fragment, useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { Surface } from './ui/layout.jsx'
import { PageAlert } from './ui/feedback.jsx'
import { useMenuDisclosure } from './ui/menu-disclosure.js'
import { Button, Choice, IconButton, Link, Stepper } from './ui/controls.jsx'
import { SelectionCard } from './ui/selection.jsx'
import { useAnimatedHeight } from './hosting-motion.jsx'
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
  '--plan-leader-art': `url("${asset('leader')}")`,
}

export function CheckLine({ option, onChange }) {
  return (
    <label className="plan-check-line">
      <Choice as="span" size={20} checked={option.checked} onChange={event => onChange(event.target.checked)} />
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

function PlanIconButton({ icon, label, onClick, disabled }) {
  return (
    <IconButton size={24} appearance="icon-solid" className="plan-icon-button" label={label} onClick={onClick} disabled={disabled}>
      <Art name={icon} />
    </IconButton>
  )
}

function TermPicker({ term, onChange }) {
  const name = useId()
  if (term.options) {
    return (
      <SegmentedOptions name={name} label="Срок оплаты" options={term.options}
        value={term.value} onChange={onChange} size={40} surface="page" />
    )
  }

  return <Stepper label="Срок в месяцах" value={`${term.value} мес.`}
    decreaseLabel="Уменьшить срок" increaseLabel="Увеличить срок"
    atMin={term.value <= term.min} atMax={term.value >= term.max}
    onDecrease={() => onChange(term.value - 1)} onIncrease={() => onChange(term.value + 1)} />
}

function ChangeItem({ item, onUpdate }) {
  return (
    <li className={item.removed ? 'plan-item plan-item--removed' : 'plan-item'}>
      <div className="plan-item-heading">
        <span className="plan-item-title">{item.title}</span>
        {item.removed ? (
          <Button appearance="text" pressable={false} type="button" className="plan-text-button" onClick={() => onUpdate({ removed: false })}>Вернуть</Button>
        ) : (
          <span className="plan-item-values">
            {item.previous && <del className="plan-money">{item.previous}</del>}
            {item.amount && <span className={item.credit ? 'plan-money plan-credit' : 'plan-money'}>{item.amount}</span>}
            {item.detail && <span className="plan-secondary">{item.detail}</span>}
            {item.removable && <PlanIconButton icon="remove" label={item.removeLabel ?? `Убрать ${item.accessibleName ?? item.title}`} onClick={() => onUpdate({ removed: true })} />}
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
  return <PageAlert appearance="inline" tone={notice.tone} title={notice.title}
    description={notice.description}
    icon={<Art name={notice.icon} extension={notice.tone === 'warning' ? 'svg' : 'png'} />}
    action={notice.action && { label: notice.action.label, onClick: () => onAction(notice.action) }} />
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
  const { id, open, close: closeMenu, setOpen, containerProps, triggerProps } = useMenuDisclosure({ preventScroll: true })
  const panel = useRef(null)
  const [unlinkChoice, setUnlinkChoice] = useState(null)
  const current = selected && option.choices.find(choice => choice.id === value)
  const saved = option.choices.filter(choice => choice.unlinkLabel)

  useLayoutEffect(() => {
    if (!open) return

    function positionPanel() {
      const menu = panel.current
      const { top, bottom } = triggerProps.ref.current.getBoundingClientRect()
      // Leave room for the 6px gap at the trigger and an 8px viewport inset.
      const above = top - 14
      const below = window.innerHeight - bottom - 14
      const opensAbove = below < menu.scrollHeight + 2 && above > below
      menu.dataset.side = opensAbove ? 'above' : 'below'
      menu.style.maxBlockSize = `${Math.max(0, opensAbove ? above : below)}px`
    }

    positionPanel()
    window.addEventListener('resize', positionPanel)
    return () => window.removeEventListener('resize', positionPanel)
  }, [open, triggerProps.ref])

  function finishUnlink(confirmed) {
    setUnlinkChoice(null)
    if (!confirmed) return

    if (saved.length === 1) containerProps.ref.current.closest('fieldset')?.focus({ preventScroll: true })
    onAction({ id: 'unlink-payment-method', method: unlinkChoice.id, label: unlinkChoice.unlinkLabel })
  }

  return (
    <div {...containerProps} onKeyDown={event => {
      containerProps.onKeyDown(event)
      moveMenuFocus(event, panel.current, open, () => setOpen(true))
    }} className="plan-payment-disclosure" data-wide={option.wide || undefined}>
      <Button {...triggerProps} appearance="choice-card" variant="neutral" pressable={false}
        className={`plan-payment-option plan-payment-trigger${option.wide ? ' plan-payment-option--wide' : ''}`}
        data-selected={Boolean(current)}>
        <PaymentOptionLabel option={option} hint={current?.listLabel ?? current?.label ?? option.hint} />
      </Button>
      <MenuPanel ref={panel} className="plan-payment-panel" id={id} open={open}>
        <ul>
          {option.choices.map(choice => (
            <li key={choice.id}>
              <MenuItem layout="split" selected={value === choice.id} onClick={() => {
                closeMenu()
                onChange(choice.id)
              }}>
                <span>{choice.listLabel ?? choice.label}</span>
                {choice.unlinkLabel && <small>сохранён</small>}
              </MenuItem>
            </li>
          ))}
        </ul>
        {saved.length > 0 && (
          <>
            <div className="plan-payment-panel-divider"><Art name="payment-list-divider" /></div>
            <ul className="plan-payment-unlink">
              {saved.map(choice => (
                <li key={choice.id}>
                  <MenuItem tone="muted" onClick={() => {
                    closeMenu()
                    setUnlinkChoice(choice)
                  }}>
                    {choice.unlinkLabel}
                  </MenuItem>
                </li>
              ))}
            </ul>
          </>
        )}
      </MenuPanel>
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
          <SelectionCard key={option.id} className={option.wide ? 'plan-payment-option plan-payment-option--wide' : 'plan-payment-option'}
            name={id} value={option.id} checked={group.value === option.id} onChange={() => onChange(option.id)}>
            <PaymentOptionLabel option={option} />
          </SelectionCard>
        ))}
      </div>
    </fieldset>
  )
}

function isPaymentAction(action) {
  return action.demoPayment || action.document || action.id === 'invoice'
}

function InvoiceAction({ label, amount = '', disabled, busy }) {
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
      <Button
        ref={trigger}
        type="button"
        appearance="checkout"
        disabled={disabled}
        aria-disabled={busy || undefined}
        onClick={() => { if (!busy) setOpen(true) }}
      >{label}</Button>
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
          <PlanIconButton icon="remove" label="Закрыть блок счёта" onClick={() => {
            restoreFocus.current = true
            setOpen(false)
          }} />
        </div>
        <p>Изменения применим сразу после зачисления. Заказ держим 5 дней, до этого тариф и ресурсы прежние.</p>
      </div>
      <Button as="a"
        href={`data:text/html;charset=utf-8,${encodeURIComponent(invoiceHtml)}`}
        download="demo-invoice.html"
      >Скачать счёт</Button>
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
  const consentId = useId()
  const paymentTimer = useRef(null)
  const [agreedToTerms, setAgreedToTerms] = useState(true)
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
            <Button appearance="quiet" size={24} pressable={false} type="button" className="plan-changes-cancel" onClick={() => {
              resetPaymentFeedback()
              onDiscard()
            }}>
              <span aria-hidden="true" style={{ '--plan-cancel-icon': `url("${closeIcon}")` }} />
              Отменить
            </Button>
          )}
        </div>
      )}
      <Surface appearance="card" padding="none" elevation={empty ? undefined : 'card'}
        className={!empty && summary && payment ? 'plan-changes-card plan-changes-card--split' : 'plan-changes-card'}>
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
                  {actions.some(isPaymentAction) && (
                    <div className="plan-check-line plan-payment-consent">
                      <Choice as="span" size={20}
                        id={consentId}
                        aria-labelledby={`${consentId}-label`}
                        checked={agreedToTerms}
                        disabled={Boolean(pendingAction)}
                        onChange={event => setAgreedToTerms(event.target.checked)}
                      />
                      <span className="plan-check-text">
                        <span id={`${consentId}-label`}>
                          <label htmlFor={consentId}>Согласен с</label>{' '}
                          <Link href="https://timeweb.com/ru/services/hosting/rules/" target="_blank" rel="noopener">правилами</Link>
                          {' и '}
                          <Link href="https://timeweb.com/ru/support/documents/" target="_blank" rel="noopener">условиями</Link>
                        </span>
                      </span>
                    </div>
                  )}
                  {actions.map(action => {
                    const disabled = !agreedToTerms && isPaymentAction(action)
                    if (action.id === 'invoice') {
                      return (
                        <InvoiceAction
                          key={JSON.stringify([action.id, paymentContext, totals[0]?.amount])}
                          label={action.label}
                          amount={totals[0]?.amount}
                          disabled={disabled}
                          busy={Boolean(pendingAction)}
                        />
                      )
                    }
                    const busy = pendingAction === action.id
                    const failed = failedAction === action.id
                    return (
                      <Fragment key={action.id}>
                        <Button
                          type="button"
                          appearance="checkout"
                          tone={action.tone}
                          disabled={disabled}
                          loading={busy}
                          aria-disabled={Boolean(pendingAction) || undefined}
                          icon={action.icon && <Art name={action.icon} className="plan-action-icon" />}
                          aria-describedby={failed ? paymentErrorId : undefined}
                          onClick={() => pressAction(action)}
                        >
                          {busy ? 'Оплачиваем…' : action.label}
                        </Button>
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
                  <span className="plan-note-desktop">{paymentNote.desktop}</span>
                  <span className="plan-note-mobile">{paymentNote.mobile ?? paymentNote.desktop}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </Surface>
    </section>
  )
}
