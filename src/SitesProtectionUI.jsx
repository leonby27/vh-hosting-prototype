import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatedBlock, DropdownPanel } from './hosting-motion.jsx'
import PlanChanges, { PlanChangesEmpty } from './PlanChanges.jsx'
import { serviceChangesPayment } from './ServiceChanges.jsx'
import { canSaveCard, getPaymentGroup, paymentActions, renewalOption, saveCardOption, securePaymentNote } from './plan-payment-options.js'
import unchecked from './assets/plan-changes/unchecked.svg'
import darkUnchecked from './assets/plan-changes/unchecked-dark.svg'
import settingsIcon from './assets/tariff-settings/settings.svg'
import closeIcon from './assets/checkout/close.svg'

const pageSize = 20
const artwork = import.meta.glob('./assets/network-protection/*.{svg,png}', {
  eager: true, query: '?url', import: 'default',
})

const numberFormat = new Intl.NumberFormat('ru-RU')
export const plural = new Intl.PluralRules('ru-RU')
const domainNouns = { one: 'домен', few: 'домена', many: 'доменов' }
export const formatPrice = amount => `${numberFormat.format(amount)} ₽`
export const formatDomainCount = count => `${count} ${domainNouns[plural.select(count)]}`
export const formatDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format

export function addMonths(date, months = 1) {
  const end = new Date(date)
  end.setUTCMonth(end.getUTCMonth() + months, 1)
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
  end.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return end
}

export function asset(name, extension = 'svg') {
  return artwork[`./assets/network-protection/${name}.${extension}`]
}

export function SitesIcon({ name, src = asset(name), color }) {
  return (
    <span className="sites-icon" aria-hidden="true" style={{ '--sites-icon-mask': `url("${src}")`, '--sites-icon-color': `var(--hosting-${color})` }}>
      <img src={src} alt="" />
    </span>
  )
}

function ProtectionSettingsButton({ editing, iconOnly = false, onClick }) {
  const label = editing ? 'Отменить' : 'Настроить'
  return (
    <button type="button" className="sites-active-settings" data-icon-only={iconOnly || undefined}
      aria-label={label} onClick={onClick}>
      <SitesIcon src={editing ? closeIcon : settingsIcon} color="light" />
      {iconOnly ? <span className="sites-active-tooltip" aria-hidden="true">{label}</span> : (
        <span className="sites-active-settings-label">
          <span>{label}</span>
          <span aria-hidden="true">{editing ? 'Настроить' : 'Отменить'}</span>
        </span>
      )}
    </button>
  )
}

export function ActiveProtectionBanner({
  className, threats, headingId, eyebrow, title, status, background, illustration,
  renew, showRenewSwitch, onToggleRenew, editing, iconOnly, onSettings,
  primaryAction, paymentAction, menuLabel, menuItems, caption, children,
}) {
  return (
    <section className={['sites-active-banner', 'hosting-reveal', className].filter(Boolean).join(' ')}
      data-threats={threats || undefined} aria-labelledby={headingId}>
      <img className="sites-active-background" src={background} alt="" />
      <div className="sites-active-copy">
        <p className="sites-active-caption">{eyebrow}</p>
        <h2 id={headingId} tabIndex={-1}>{title}</h2>
        <p className="sites-active-count" aria-live="polite">{status}</p>
      </div>
      <img className="sites-active-shield" src={illustration} alt="" />
      <div className="sites-active-actions">
        <div className="sites-active-buttons">
          {primaryAction}
          {showRenewSwitch && (
            <button type="button" className="sites-active-renew" role="switch" aria-checked={renew} onClick={onToggleRenew}>
              <span className="hosting-switch" aria-hidden="true" />Автопродление
            </button>
          )}
          {paymentAction}
          <ProtectionSettingsButton editing={editing} iconOnly={iconOnly} onClick={onSettings} />
          <SitesDropdown label={menuLabel}>{menuItems}</SitesDropdown>
        </div>
        <p className="sites-active-caption" aria-live="polite">{caption}</p>
      </div>
      {children}
    </section>
  )
}

function DomainCheckbox({ checked, mixed = false, label, onChange, dark, disabled }) {
  const state = mixed ? 'mixed' : 'checked'
  const url = mixed || checked ? asset(dark ? `${state}-dark` : state) : dark ? darkUnchecked : unchecked
  return (
    <input
      ref={node => { if (node) node.indeterminate = mixed }}
      className="sites-domain-checkbox"
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={onChange}
      style={{ '--sites-check-image': `url("${url}")` }}
    />
  )
}

const domainLabels = {
  title: 'Домены',
  name: 'Домен',
  details: 'DNS',
  table: 'Домены для подключения сетевой защиты',
  search: 'Поиск по доменам',
  selectAll: 'Выбрать все найденные домены',
  noResults: 'Домены не найдены',
  filter: 'Только под защитой',
}

export function SitesTable({
  domains, statuses, statusLabels, selected, hasProtection, selecting, filterSpace, onFilterSpaceChange,
  onSelection, dark, compact, labels = domainLabels,
  headingId = 'sites-domains-title', matchesSearch = (domain, query) => domain.name.toLowerCase().includes(query),
  isProtected = status => status === 'protected', renderDetails, renderNote, empty,
}) {
  const [search, setSearch] = useState('')
  const [protectedOnly, setProtectedOnly] = useState(false)
  const [limit, setLimit] = useState(pageSize)
  const resultsContent = useRef(null)
  const heightBeforeResultsChange = useRef(0)
  const query = search.trim().toLowerCase()
  const filtered = domains.filter(domain => matchesSearch(domain, query) &&
    (selecting || !protectedOnly || isProtected(statuses[domain.name])))
  const visible = filtered.slice(0, limit)
  const selectedMatches = filtered.filter(domain => selected.has(domain.name)).length
  const allSelected = filtered.length > 0 && selectedMatches === filtered.length
  const showCount = selecting || !hasProtection

  useLayoutEffect(() => {
    const previousHeight = heightBeforeResultsChange.current
    if (!previousHeight || !resultsContent.current) return
    heightBeforeResultsChange.current = 0
    const height = resultsContent.current.getBoundingClientRect().height
    onFilterSpaceChange(Math.max(0, previousHeight - height))
  }, [search, protectedOnly, limit, onFilterSpaceChange])

  function reserveResultsSpace() {
    heightBeforeResultsChange.current = window.scrollY > 0
      ? resultsContent.current.getBoundingClientRect().height + filterSpace
      : 0
    // Reserve space in the same render as the results change, before the browser can clamp scrolling.
    onFilterSpaceChange(heightBeforeResultsChange.current)
  }

  function changeProtectionFilter(checked) {
    reserveResultsSpace()
    setProtectedOnly(checked)
    setLimit(pageSize)
  }

  function changeSearch(value) {
    reserveResultsSpace()
    setSearch(value)
    setLimit(pageSize)
  }

  function selectMatches() {
    const next = new Set(selected)
    for (const domain of filtered) {
      if (allSelected) next.delete(domain.name)
      else next.add(domain.name)
    }
    onSelection(next)
  }

  function selectDomain(name) {
    const next = new Set(selected)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    onSelection(next)
  }

  if (!domains.length && empty) {
    return (
      <section className="sites-domains hosting-reveal" aria-labelledby={headingId}>
        <h2 id={headingId} tabIndex={-1}>{labels.title}</h2>
        <div className="plan-changes-card">
          <PlanChangesEmpty {...empty}>
            {empty.canAddSite && <button type="button" className="sites-empty-add">Добавить сайт</button>}
          </PlanChangesEmpty>
        </div>
      </section>
    )
  }

  return (
    <section className="sites-domains hosting-reveal" aria-labelledby={headingId} data-many={domains.length > pageSize}>
      <div className="sites-domain-heading">
        <h2 id={headingId} tabIndex={-1}>{labels.title}{showCount && <>. <span aria-live="polite">{selected.size} из {domains.length}</span></>}</h2>
        {!selecting && hasProtection && (
          <label className="sites-domain-filter">
            <DomainCheckbox dark={dark} checked={protectedOnly} onChange={event => changeProtectionFilter(event.target.checked)} />
            {compact ? 'Только подключённые' : labels.filter}
          </label>
        )}
      </div>
      <label className="sites-domain-search">
        <SitesIcon name="search" color="icon-secondary" />
        <input type="search" placeholder="Поиск …" aria-label={labels.search} value={search} onChange={event => changeSearch(event.target.value)} />
      </label>
      <div className="sites-domain-results">
        <AnimatedBlock>
          <div className="sites-domain-results-content" ref={resultsContent}>
            <div className="sites-table-card">
              <table className="sites-domain-table" role="table" aria-label={labels.table} data-selecting={selecting}>
                <colgroup>{selecting && <col className="sites-check-column" />}<col /><col className="sites-dns-column" /><col className="sites-status-column" /></colgroup>
                <thead>
                  <tr>
                    {selecting && <th scope="col">
                      <DomainCheckbox label={labels.selectAll} dark={dark} checked={allSelected} mixed={selectedMatches > 0 && !allSelected} disabled={!filtered.length} onChange={selectMatches} />
                    </th>}
                    <th scope="col">{labels.name}</th>
                    <th scope="col">{labels.details}</th>
                    <th scope="col">Статус</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {visible.map(domain => {
                    const status = statuses[domain.name] ?? 'available'
                    const statusLabel = statusLabels[status]
                    const checked = selecting && selected.has(domain.name)
                    return (
                      <tr
                        role="row"
                        key={domain.name}
                        className="sites-domain-row"
                        data-status={status}
                        data-selectable={selecting || undefined}
                        data-selected={checked || undefined}
                        onClick={selecting ? event => {
                          if (!event.target.closest('input, button, a')) selectDomain(domain.name)
                        } : undefined}
                      >
                        {selecting && <td role="cell" className="sites-domain-check"><DomainCheckbox label={`Выбрать ${domain.name}`} dark={dark} checked={checked} onChange={() => selectDomain(domain.name)} /></td>}
                        <th role="rowheader" scope="row" className="sites-domain-name">
                          <span className="sites-domain-label" title={domain.name}>{domain.name}</span>
                          <div className="sites-mobile-dns">{renderDetails ? renderDetails(domain, true) : domain.dns}</div>
                          {renderNote?.(domain, status)}
                        </th>
                        <td role="cell" className="sites-domain-dns">{renderDetails ? renderDetails(domain) : <span className="sites-domain-badge">{domain.dns}</span>}</td>
                        <td role="cell" className="sites-domain-status">
                          {statusLabel && <span className="sites-domain-badge" title={statusLabel}>{statusLabel}</span>}
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && <tr><td className="sites-table-empty" colSpan={selecting ? 4 : 3}>{labels.noResults}</td></tr>}
                </tbody>
              </table>
            </div>
            {filtered.length > limit && (
              <button type="button" className="sites-load-more" onClick={() => setLimit(current => current + pageSize)}>
                Показать ещё {Math.min(pageSize, filtered.length - limit)}
              </button>
            )}
          </div>
        </AnimatedBlock>
      </div>
    </section>
  )
}

function PaymentConfirmation({ payment, description, onConfirm, onCancel }) {
  const id = useId()
  const documentReady = payment.step === 'document'
  const { document } = payment.action
  const title = useRef(null)

  useEffect(() => {
    title.current.focus()
  }, [payment.step])

  return (
    <section className="sites-payment-confirmation hosting-reveal" aria-labelledby={id}>
      <h3 id={id} ref={title} tabIndex={-1}>{documentReady ? document.title : payment.action.label}</h3>
      <p>{description} · {formatPrice(payment.total)}. Операция в демо-режиме.</p>
      <div className="sites-payment-buttons">
        <button type="button" className="sites-payment-primary hosting-pressable" onClick={onConfirm}>
          {documentReady ? 'Имитировать оплату' : document.confirm}
        </button>
        <button type="button" className="sites-payment-cancel hosting-pressable" onClick={onCancel}>Отменить</button>
      </div>
    </section>
  )
}

export function revealProtectionCheckout(heading) {
  if (!heading) return
  heading.focus({ preventScroll: true })
  heading.scrollIntoView({
    block: 'start',
    inline: 'nearest',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}

export function ProtectionCheckoutSlot({ open, children }) {
  return (
    <div className="sites-checkout-frame">
      <AnimatedBlock open={open}>
        <div className="sites-checkout-slot">{children}</div>
      </AnimatedBlock>
    </div>
  )
}

export function ProtectionCheckout({
  title, empty, items, notices, total, totalLabel = 'К оплате', actionDescription, reveal, paymentDescription, headingId = 'sites-checkout-title',
  payment, paymentContext, hasSavedCard, allowAutoRenew, onStart, onConfirm, onCancel, onClose, canDiscard, onUnlinkCard, serviceChanges,
}) {
  const [method, setMethod] = useState(hasSavedCard ? 'saved-card' : 'bank')
  const [renew, setRenew] = useState(true)
  const [save, setSave] = useState(true)
  const heading = useRef(null)
  const showSaveOption = canSaveCard(method)

  useEffect(() => {
    if (reveal) revealProtectionCheckout(heading.current)
  }, [reveal])

  function update(group, id, patch) {
    if (group === 'items') {
      if (patch.removed) onClose()
      return
    }

    onCancel()
    if (group === 'renewalOptions') setRenew(patch.checked)
    else if (group === 'saveOptions') setSave(patch.checked)
    else if (group === 'paymentGroups') setMethod(patch.value)
  }

  function performAction(action) {
    if (action.id === 'unlink-payment-method') {
      onCancel()
      onUnlinkCard()
      setMethod(getPaymentGroup(method, false).value)
      return
    }
    return onStart(action, { autoRenew: allowAutoRenew && renew, saveCard: showSaveOption && save })
  }

  const paymentProps = serviceChanges ? serviceChangesPayment(serviceChanges) : {
    renewalOptions: allowAutoRenew ? [renewalOption(renew)] : [],
    totals: [{ label: totalLabel, amount: formatPrice(total) }],
    paymentGroups: [getPaymentGroup(method, hasSavedCard)],
    saveOptions: showSaveOption ? [saveCardOption(save)] : [],
    actions: payment ? [] : [paymentActions[method]],
    paymentNote: securePaymentNote,
    onAction: performAction,
  }

  return (
    <div className="sites-checkout">
      <PlanChanges
        label={title}
        heading={{ id: headingId, ref: heading }}
        onDiscard={canDiscard ? onClose : undefined}
        empty={empty}
        animateHeight={false}
        items={items}
        notices={notices}
        {...paymentProps}
        actionDescription={actionDescription}
        paymentContext={paymentContext}
        onChange={update}
      />
      {!empty && payment && (
        <PaymentConfirmation
          payment={payment}
          description={paymentDescription}
          onConfirm={onConfirm}
          onCancel={() => {
            heading.current?.focus()
            onCancel()
          }}
        />
      )}
    </div>
  )
}

export function ProtectionFaq({ questions }) {
  const id = useId()
  const [open, setOpen] = useState(null)
  return (
    <aside className="sites-faq hosting-reveal" aria-label="Частые вопросы">
      <div className="sites-faq-bar">
        <p><SitesIcon name="faq" color="icon-secondary" />Частые вопросы</p>
        <div>
          {questions.map(question => (
            <button type="button" key={question.id} aria-expanded={open === question.id} aria-controls={`${id}-${question.id}`} onClick={() => setOpen(current => current === question.id ? null : question.id)}>
              {question.title}
            </button>
          ))}
        </div>
      </div>
      {questions.map(question => <p className="sites-faq-answer hosting-reveal" key={question.id} id={`${id}-${question.id}`} hidden={open !== question.id}>{question.answer}</p>)}
    </aside>
  )
}

export function ProtectionNotice({ description, children }) {
  return (
    <section className="sites-protection-notice hosting-reveal">
      <p>{description}</p>
      {children && <div className="sites-payment-buttons">{children}</div>}
    </section>
  )
}

export function ProtectionAlert({ title, description, tone = 'warning', action, onDismiss }) {
  return (
    <section className="sites-page-alert hosting-reveal" data-tone={tone} aria-label={title}>
      <img className="sites-page-alert-icon" src={asset(`page-alert-${tone}`)} width="28" height="28" alt="" />
      <div className="sites-page-alert-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {(action || onDismiss) && (
        <div className="sites-page-alert-actions">
          {action && <button className="sites-page-alert-button" type="button" onClick={action.onClick}>{action.label}</button>}
          {onDismiss && (
            <button type="button" className="sites-page-alert-close" aria-label="Закрыть уведомление" onClick={onDismiss}>
              <img src={asset('page-alert-close')} width="20" height="20" alt="" />
            </button>
          )}
        </div>
      )}
    </section>
  )
}

export function useSitesFilterSpace() {
  const [filterSpace, setFilterSpace] = useState(0)
  const spacerRef = useRef(null)

  useEffect(() => {
    if (!filterSpace) return

    function releaseSpace() {
      const spacer = spacerRef.current
      if (spacer && (window.scrollY <= 0 || spacer.getBoundingClientRect().top >= window.innerHeight)) {
        setFilterSpace(0)
      }
    }

    window.addEventListener('scroll', releaseSpace, { passive: true })
    window.addEventListener('resize', releaseSpace)
    releaseSpace()
    return () => {
      window.removeEventListener('scroll', releaseSpace)
      window.removeEventListener('resize', releaseSpace)
    }
  }, [filterSpace])

  return {
    filterSpace, setFilterSpace,
    scrollSpacer: filterSpace > 0 && (
      <div
        className="sites-scroll-spacer"
        ref={spacerRef}
        style={{ blockSize: filterSpace }}
        aria-hidden="true"
      />
    ),
  }
}

function SitesDropdown({ label, children }) {
  const id = useId()
  const menu = useRef(null)
  const trigger = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function closeOnOutsideClick(event) {
      if (!menu.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function closeMenu() {
    trigger.current.focus({ preventScroll: true })
    setOpen(false)
  }

  return (
    <div className="sites-active-menu" ref={menu} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }} onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        event.stopPropagation()
        closeMenu()
      }
    }}>
      <button
        ref={trigger}
        type="button"
        className="sites-active-menu-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(current => !current)}
      >
        <img src={asset('banner-more')} alt="" />
        <span className="sites-active-tooltip" aria-hidden="true">Меню действий</span>
      </button>
      <DropdownPanel id={id} className="sites-active-menu-panel" open={open}>
        {children(closeMenu)}
      </DropdownPanel>
    </div>
  )
}
