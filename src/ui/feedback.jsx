import { isValidElement, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Button, IconButton } from './Button.jsx'
import { AssetIcon, Icon } from './Icon.jsx'
import closeGlyph from '../assets/plan-changes/unlink-close.svg'
import pageAlertWarning from '../assets/network-protection/page-alert-warning.svg'
import pageAlertError from '../assets/network-protection/page-alert-error.svg'
import pageAlertClose from '../assets/network-protection/page-alert-close.svg'

const pageAlertIcons = { warning: pageAlertWarning, error: pageAlertError }

export function Spinner({ size = 24, label = 'Загрузка' }) {
  return <span className="vh-spinner" role="status" aria-label={label} style={{ '--vh-spinner-size': `${size}px` }} />
}

export function Progress({ label, value, max = 100, warning = false }) {
  const id = useId()
  return <div className="vh-progress" data-warning={warning || undefined}>
    <div><label id={id}>{label}</label><span>{value} / {max}</span></div>
    <ProgressBar aria-labelledby={id} value={value} max={max} />
  </div>
}

export function Alert({ tone = 'info', children, ...props }) {
  return <PageAlert actionPosition="below" {...props} tone={tone === 'danger' ? 'error' : tone} description={children} />
}

export function Toast({ children, icon, action, onDismiss, announce = true }) {
  return <div className="vh-toast">
    <div role={announce ? 'status' : undefined}>{icon}{children}</div>
    {action}
    {onDismiss && <ModalClose label="Закрыть уведомление" onClick={onDismiss} />}
  </div>
}

export function PageAlert({ title, description, tone = 'warning', action, onDismiss, icon, actionPosition = 'side' }) {
  const actionBelow = actionPosition === 'below'
  const actionButton = !action || isValidElement(action) ? action : <Button variant="neutral" appearance="alert-action"
    pressable={false} className="sites-page-alert-button" onClick={action.onClick}>{action.label}</Button>
  return (
    <div className="vh-alert-container">
      <section className="sites-page-alert hosting-reveal" data-tone={tone} aria-label={title}>
        {icon ? <span className="sites-page-alert-icon sites-page-alert-custom-icon">{icon}</span> :
          pageAlertIcons[tone] ? <img className="sites-page-alert-icon" src={pageAlertIcons[tone]} width="28" height="28" alt="" />
          : <Icon name={tone === 'success' ? 'success-solid' : 'info-solid'} size={28} className="sites-page-alert-icon" />}
        <div className="sites-page-alert-copy">
          {title && <h2>{title}</h2>}
          {description && <p>{description}</p>}
        </div>
        {actionBelow && actionButton && <div className="sites-page-alert-action-below">{actionButton}</div>}
        {((!actionBelow && actionButton) || onDismiss) && (
          <div className="sites-page-alert-actions">
            {!actionBelow && actionButton}
            {onDismiss && (
              <Button variant="neutral" appearance="alert-action" pressable={false}
                className="sites-page-alert-close" aria-label="Закрыть уведомление" onClick={onDismiss}>
                <img src={pageAlertClose} width="20" height="20" alt="" />
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export function Badge({ tone = 'neutral', className = '', children, ...props }) {
  return <span {...props} className={`vh-badge ${className}`.trim()} data-tone={tone}>{children}</span>
}

export function StatusBadge({ tone = 'success', code, children }) {
  return <Badge tone={tone === 'error' ? 'danger' : tone} className="api-status" data-error={tone === 'error'}>
    <span className="api-status-dot" aria-hidden="true" />
    <span>{children}</span>
    {code != null && <span className="api-status-code">{code}</span>}
  </Badge>
}

export function TooltipBubble({ children, size = 'small', variant = 'default', className = '', ...props }) {
  return <span {...props} className={`vh-tooltip-bubble ${className}`.trim()} data-size={size} data-variant={variant}>{children}</span>
}

export function Tooltip({ children, content, size, variant, placement = 'top', className = '', contentClassName = '', pressable = false }) {
  const id = useId()
  const root = useRef(null)
  const bubble = useRef(null)
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    if (!open || placement !== 'top') return
    const trigger = root.current
    const panel = bubble.current

    function positionTooltip() {
      const { left, top, bottom, width } = trigger.getBoundingClientRect()
      const { width: panelWidth, height: panelHeight } = panel.getBoundingClientRect()
      const { clientWidth, clientHeight } = document.documentElement
      const edge = 8
      const centeredLeft = left + (width - panelWidth) / 2
      const fittedLeft = Math.max(edge, Math.min(centeredLeft, clientWidth - panelWidth - edge))
      const spaceBelow = clientHeight - bottom
      const placeBelow = top < panelHeight + 2 * edge && spaceBelow > top

      panel.style.setProperty('--vh-tooltip-offset', `${fittedLeft - centeredLeft}px`)
      panel.toggleAttribute('data-below', placeBelow)
    }

    positionTooltip()
    const observer = new ResizeObserver(positionTooltip)
    observer.observe(trigger)
    observer.observe(panel)
    window.addEventListener('resize', positionTooltip)
    window.addEventListener('scroll', positionTooltip, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', positionTooltip)
      window.removeEventListener('scroll', positionTooltip, true)
    }
  }, [open, placement])

  useEffect(() => {
    if (!open || !pressable) return
    function dismiss(event) {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, pressable])

  return <span ref={root} className={`vh-tooltip ${className}`.trim()} data-open={open} data-placement={placement}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true) }}
    onPointerLeave={event => { if (event.pointerType === 'mouse') setOpen(false) }}
    onFocus={event => { if (event.target.matches(':focus-visible')) setOpen(true) }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onClick={pressable ? event => {
      const pointer = event.nativeEvent.pointerType
      if (pointer === 'touch' || pointer === 'pen') setOpen(current => !current)
      else setOpen(true)
    } : undefined}
    onKeyDown={event => {
      if (event.key === 'Escape' && open && !event.target.closest('[aria-expanded="true"]')) {
        setOpen(false)
        event.stopPropagation()
      }
    }}>
    {children(id)}
    <TooltipBubble ref={bubble} className={`vh-tooltip-content ${contentClassName}`.trim()} id={id} role="tooltip"
      aria-hidden={!open} size={size} variant={variant}>{content}</TooltipBubble>
  </span>
}

export function FeatureHint({ open = true, title, children, action, onDismiss, width = 240, arrow }) {
  return <AnimatedBlock open={open}>
    <aside className="vh-hint" aria-label={title} data-arrow={arrow} style={{ '--vh-hint-width': `${width}px` }}>
      {onDismiss && <ModalClose className="vh-hint-close" label="Закрыть подсказку" onClick={onDismiss} />}
      <div className="vh-hint-copy">
        <strong>{title}</strong>
        <div className="vh-hint-description">{children}</div>
      </div>
      {action}
    </aside>
  </AnimatedBlock>
}

export function ModalClose({ label = 'Закрыть окно', icon = <AssetIcon src={closeGlyph} monochrome size={20} tone="icon-secondary" />, ...props }) {
  return <IconButton size={32} label={label} icon={icon} {...props} />
}

export function ModalFrame({ open = true, ref, className = '', ...props }) {
  const dialog = useRef(null)
  useImperativeHandle(ref, () => dialog.current, [])
  useLayoutEffect(() => {
    const node = dialog.current
    if (open && !node.open) node.showModal()
    if (!open && node.open) node.close()
  }, [open])
  return <dialog {...props} className={`vh-modal ${className}`.trim()} ref={dialog} />
}

export function ProgressBar({ label, className = '', ...props }) {
  return <progress {...props} aria-label={label} className={`vh-progress-bar ${className}`.trim()} />
}

export function Dialog({ open, title, description, onClose, children, actions }) {
  const id = useId()

  return <ModalFrame className="vh-dialog" open={Boolean(open)} aria-labelledby={`${id}-title`}
    aria-describedby={description ? `${id}-description` : undefined}
    onCancel={event => {
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }}>
    <ModalClose className="vh-dialog-close" onClick={onClose} />
    <h2 className="hosting-dialog-title" id={`${id}-title`}>{title}</h2>
    {description && <p id={`${id}-description`}>{description}</p>}
    {children}
    <div className="vh-dialog-actions">{actions ?? <Button variant="secondary" onClick={onClose}>Закрыть</Button>}</div>
  </ModalFrame>
}
