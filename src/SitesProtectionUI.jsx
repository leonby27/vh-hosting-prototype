import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Surface, TableFrame } from './ui/layout.jsx'
import { AssetIcon } from './ui/Icon.jsx'
import { Badge, Tooltip } from './ui/feedback.jsx'
import { PopoverMenu } from './ui/navigation.jsx'
import { Button, Choice, SearchField, Switch } from './ui/controls.jsx'
import PlanChanges, { PlanChangesEmpty } from './PlanChanges.jsx'
import { serviceChangesPayment } from './ServiceChanges.jsx'
import { canSaveCard, getPaymentGroup, paymentActions, renewalOption, saveCardOption, securePaymentNote } from './plan-payment-options.js'
import settingsIcon from './assets/tariff-settings/settings.svg'
import closeIcon from './assets/checkout/close.svg'

const pageSize = 20
const statusTones = { protected: 'success', connecting: 'info', failed: 'danger', missing: 'warning', threat: 'critical' }

export function protectionStatusTone(status, hasNote) {
  return statusTones[status] ?? (hasNote ? 'warning' : undefined)
}
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
  return <AssetIcon src={src} monochrome intrinsic tone={color} className="sites-icon" />
}

function ProtectionSettingsButton({ editing, iconOnly = false, onClick }) {
  const label = editing ? 'Отменить' : 'Настроить'
  const renderButton = id => (
    <Button variant="inverse" appearance="banner-outline" className="sites-active-settings" size={44}
      data-icon-only={iconOnly || undefined} aria-label={label} aria-describedby={id} onClick={onClick}>
      <SitesIcon src={editing ? closeIcon : settingsIcon} color="light" />
      {!iconOnly && (
        <span className="sites-active-settings-label">
          <span>{label}</span>
          <span aria-hidden="true">{editing ? 'Настроить' : 'Отменить'}</span>
        </span>
      )}
    </Button>
  )
  return iconOnly ? <Tooltip placement="top" content={label}>{renderButton}</Tooltip> : renderButton()
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
            <Switch appearance="banner" className="sites-active-renew" checked={renew} onClick={onToggleRenew}>Автопродление</Switch>
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

function DomainCheckbox({ label, ...props }) {
  return <Choice as="span" size={20} {...props} className="sites-domain-checkbox" aria-label={label} />
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
  onSelection, compact, labels = domainLabels,
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
        <Surface appearance="card" padding="none" className="plan-changes-card">
          <PlanChangesEmpty {...empty}>
            {empty.canAddSite && <Button size={36} className="sites-empty-add">Добавить сайт</Button>}
          </PlanChangesEmpty>
        </Surface>
      </section>
    )
  }

  return (
    <section className="sites-domains hosting-reveal" aria-labelledby={headingId} data-many={domains.length > pageSize}>
      <div className="sites-domain-heading">
        <h2 id={headingId} tabIndex={-1}>{labels.title}{showCount && <>. <span aria-live="polite">{selected.size} из {domains.length}</span></>}</h2>
        {!selecting && hasProtection && (
          <label className="sites-domain-filter">
            <DomainCheckbox checked={protectedOnly} onChange={event => changeProtectionFilter(event.target.checked)} />
            {compact ? 'Только подключённые' : labels.filter}
          </label>
        )}
      </div>
      <SearchField icon={<SitesIcon name="search" color="icon-secondary" />} placeholder="Поиск …"
        label={labels.search} value={search} onChange={event => changeSearch(event.target.value)} />
      <div className="sites-domain-results">
        <AnimatedBlock>
          <div className="sites-domain-results-content" ref={resultsContent}>
            <TableFrame className="sites-table-card" scrollable={false}>
              <table className="sites-domain-table" role="table" aria-label={labels.table} data-selecting={selecting}>
                <colgroup>{selecting && <col className="sites-check-column" />}<col /><col className="sites-dns-column" /><col className="sites-status-column" /></colgroup>
                <thead>
                  <tr>
                    {selecting && <th scope="col">
                      <DomainCheckbox label={labels.selectAll} checked={allSelected} indeterminate={selectedMatches > 0 && !allSelected} disabled={!filtered.length} onChange={selectMatches} />
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
                    const note = renderNote?.(domain, status)
                    const tone = protectionStatusTone(status, Boolean(note))
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
                          if (!event.target.closest('.vh-choice, input, button, a')) selectDomain(domain.name)
                        } : undefined}
                      >
                        {selecting && <td role="cell" className="sites-domain-check"><DomainCheckbox label={`Выбрать ${domain.name}`} checked={checked} onChange={() => selectDomain(domain.name)} /></td>}
                        <th role="rowheader" scope="row" className="sites-domain-name">
                          <span className="sites-domain-label" title={domain.name}>{domain.name}</span>
                          <div className="sites-mobile-dns">{renderDetails ? renderDetails(domain, true) : domain.dns}</div>
                          {note}
                        </th>
                        <td role="cell" className="sites-domain-dns">{renderDetails ? renderDetails(domain) : <Badge className="sites-domain-badge">{domain.dns}</Badge>}</td>
                        <td role="cell" className="sites-domain-status">
                          {statusLabel && <Badge className="sites-domain-badge" tone={tone} title={statusLabel}>{statusLabel}</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                  {visible.length === 0 && <tr><td className="sites-table-empty" colSpan={selecting ? 4 : 3}>{labels.noResults}</td></tr>}
                </tbody>
              </table>
            </TableFrame>
            {filtered.length > limit && (
              <Button variant="neutral" className="sites-load-more" onClick={() => setLimit(current => current + pageSize)}>
                Показать ещё {Math.min(pageSize, filtered.length - limit)}
              </Button>
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
        <Button type="button" appearance="site-payment" onClick={onConfirm}>
          {documentReady ? 'Имитировать оплату' : document.confirm}
        </Button>
        <Button type="button" appearance="site-payment" variant="neutral" onClick={onCancel}>Отменить</Button>
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
  const [selection, setSelection] = useState(null)

  function toggleQuestion(questionId) {
    setSelection(current => ({
      id: questionId,
      expanded: current?.id !== questionId || !current.expanded,
    }))
  }

  return (
    <aside className="sites-faq hosting-reveal" aria-label="Частые вопросы">
      <div className="sites-faq-bar">
        <p><SitesIcon name="faq" color="icon-secondary" />Частые вопросы</p>
        <div>
          {questions.map(question => (
            <Button appearance="text" pressable={false} type="button" key={question.id} aria-expanded={selection?.id === question.id && selection.expanded} aria-controls={`${id}-${question.id}`} onClick={() => toggleQuestion(question.id)}>
              {question.title}
            </Button>
          ))}
        </div>
      </div>
      <AnimatedBlock open={selection?.expanded ?? false}>
        {questions.map(question => <p className="sites-faq-answer" key={question.id} id={`${id}-${question.id}`} hidden={selection?.id !== question.id}>{question.answer}</p>)}
      </AnimatedBlock>
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
  return <PopoverMenu className="sites-active-menu" panelClassName="sites-active-menu-panel" preventScroll triggerProps={{ 'aria-label': label }}
    renderTrigger={props => <Tooltip placement="top" content="Меню действий">
      {id => <Button {...props} variant="inverse" appearance="banner-outline" size={44}
        className="sites-active-menu-trigger" aria-describedby={id}>
        <img src={asset('banner-more')} alt="" />
      </Button>}
    </Tooltip>}>
    {children}
  </PopoverMenu>
}
