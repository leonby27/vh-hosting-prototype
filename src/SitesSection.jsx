import { useContext, useEffect, useRef, useState } from 'react'
import { TabIndicator } from './hosting-motion.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import PlanChanges from './PlanChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import Antivirus from './Antivirus.jsx'
import { getAntivirusPreset } from './antivirus-states.js'
import { getNetworkProtectionPreset, networkProtectionMonthlyRate as monthlyRate, saveNetworkProtection } from './network-protection-states.js'
import domainsIcon from './assets/hosting/domains.svg'
import disableIcon from './assets/plan-changes/disable.svg'
import renewalIcon from './assets/plan-changes/retry.svg'
import {
  addMonths, asset, formatDate, formatDomainCount, formatPrice, ProtectionAlert, ProtectionCheckout, protectionRenewalTerm,
  ProtectionFaq, revealProtectionCheckout, SitesDropdown, SitesIcon, SitesTable, useSitesScrollSpace,
} from './SitesProtectionUI.jsx'
import './sites-section.css'

const tabs = [
  { id: 'mine', label: 'Мои сайты' },
  { id: 'antivirus', label: 'Антивирус' },
  { id: 'accelerator', label: 'Ускоритель', disabled: true },
  { id: 'network-protection', label: 'Сетевая защита' },
  { id: 'cms', label: 'Установка CMS', disabled: true },
]
const availableTabs = tabs.filter(tab => !tab.disabled)

const tabStatusLabels = {
  connected: 'Подключено',
  threat: 'Обнаружены угрозы',
  attack: 'Обнаружена атака',
}

const features = [
  { icon: 'visitors', title: 'Фильтрует запросы', description: 'Пропускает людей,\nотсекает ботов' },
  { icon: 'attacks', title: 'Отражает атаки', description: 'Флуд, атаки на HTTPS\nи медленные запросы' },
  { icon: 'hidden-ip', title: 'Скрывает IP', description: 'Атаку не направить\nв обход фильтра' },
]

const statusLabels = {
  available: 'Не подключён',
  protected: 'Под защитой',
  connecting: 'Подключаем',
  dns: 'Ждём DNS',
  action: 'Требуется действие',
}
const demoDnsAddress = '192.0.2.17'
const demoOriginalAddress = '192.0.2.10'
const applyDomainChanges = { id: 'apply', label: 'Применить изменения', icon: 'apply' }
const disableProtectionAction = { id: 'disable', label: 'Отключить', icon: 'disable', tone: 'danger' }
const disableProtectionNotices = [{
  id: 'protection-warning',
  tone: 'warning',
  icon: 'alert',
  description: 'После отключения трафик сайтов перестанет проходить через фильтры DDoS-Guard.',
}]

const questions = [
  { id: 'how', title: 'Как работает защита?', answer: 'Во время атаки тысячи запросов от ботов могут перегрузить сервер, и сайт перестанет открываться. С защитой запросы к выбранным доменам проходят через фильтры DDoS-Guard, которые отсекают ботов и пропускают посетителей.' },
  { id: 'domain', title: 'Что сделать с доменом?', answer: 'Может потребоваться обновить DNS-запись или разрешить выпуск сертификата. Нажмите «Как сделать» рядом со статусом домена.' },
  { id: 'antivirus', title: 'Отличие от антивируса', answer: 'Сетевая защита фильтрует входящий трафик. Антивирус проверяет файлы сайта на вредоносный код.' },
]

const availabilityNotices = {
  'no-sites': ['На аккаунте пока нет сайтов', 'Добавьте сайт и привяжите к нему домен, чтобы подключить защиту.'],
  'no-domains': ['К сайтам пока не привязаны домены', 'Привяжите домен, чтобы подключить сетевую защиту.'],
  server: ['На сервере вашего аккаунта защита от DDoS пока недоступна', 'Напишите нам для переноса аккаунта на другой сервер.'],
  region: ['На сервере вашего аккаунта в Казахстане защита от DDoS пока недоступна', 'Напишите нам для переноса аккаунта на сервер с поддержкой защиты.'],
  plan: ['Сетевая защита недоступна на вашем тарифе', 'Чтобы подключить защиту, выберите тариф с поддержкой услуги.'],
  blocked: ['Аккаунт заблокирован', 'После разблокировки аккаунта вы сможете подключить сетевую защиту.'],
  trial: ['Идёт тестовый период хостинга', 'Чтобы подключить сетевую защиту, оплатите хостинг.'],
  integrator: ['Защиту подключает интегратор', 'Обратитесь к интегратору, который обслуживает ваш аккаунт.'],
}

function SiteTabs({ selected, onSelect, statuses, compact }) {
  const list = useRef(null)

  useEffect(() => {
    if (compact) return
    const track = list.current
    const tab = track.querySelector('[aria-selected="true"]')
    function revealTab() {
      track.scrollLeft = Math.max(0, tab.offsetLeft + tab.offsetWidth / 2 - track.clientWidth * 0.68)
    }
    const observer = new ResizeObserver(revealTab)
    observer.observe(track)
    revealTab()
    return () => observer.disconnect()
  }, [selected, compact])

  function moveFocus(event) {
    const index = availableTabs.findIndex(tab => tab.id === selected)
    const last = availableTabs.length - 1
    const nextIndex = {
      ArrowLeft: (index + last) % availableTabs.length,
      ArrowRight: (index + 1) % availableTabs.length,
      Home: 0,
      End: last,
    }[event.key]
    if (nextIndex === undefined) return
    event.preventDefault()
    const id = availableTabs[nextIndex].id
    onSelect(id)
    list.current?.querySelector(`#sites-tab-${id}`)?.focus({ preventScroll: compact })
  }

  return (
    <div ref={list} role="tablist" aria-label="Разделы сайтов" className="sites-tabs hosting-indicator-track" onKeyDown={moveFocus}>
      <TabIndicator selected={selected} />
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`sites-tab-${tab.id}`}
          aria-selected={selected === tab.id}
          aria-controls={tab.disabled ? undefined : `sites-panel-${tab.id}`}
          aria-label={statuses[tab.id] ? `${tab.label} — ${tabStatusLabels[statuses[tab.id]]}` : undefined}
          disabled={tab.disabled}
          tabIndex={selected === tab.id ? 0 : -1}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
          {statuses[tab.id] && <span className="sites-tab-status" data-status={statuses[tab.id]} aria-hidden="true" />}
        </button>
      ))}
    </div>
  )
}

function ProtectionIntro({ compact }) {
  return (
    <section className="sites-promo hosting-reveal" aria-labelledby="sites-promo-title">
      <div className="sites-promo-art">
        <img src={asset(compact ? 'protection-mobile' : 'protection', 'png')} alt="" />
      </div>
      <div className="sites-promo-content">
        <div className="sites-promo-copy">
          <h2 id="sites-promo-title">
            Сайты работают во время DDoS-атак.{' '}
            <span className="sites-promo-price">{formatPrice(monthlyRate)} / мес. за аккаунт</span>
          </h2>
          <p>Запросы к выбранным доменам проходят через фильтры DDoS-Guard. Фильтры отсекают ботов и флуд, до сайта доходят посетители.</p>
        </div>
        <ul className="sites-features">
          {features.map(feature => (
            <li key={feature.icon}>
              <SitesIcon name={feature.icon} color="icon-success" />
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProtectionBanner({ compact, protectedCount, total, renew, showRenewSwitch, paidThrough, canEdit, onPay, onToggleRenew, onEdit, onRequestDisable }) {
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)

  function requestRenewalChange() {
    if (renew) setRenewDialogOpen(true)
    else onToggleRenew()
  }

  return (
    <section className="sites-active-banner hosting-reveal" aria-labelledby="sites-active-title">
      <img className="sites-active-background" src={asset(compact ? 'active-background-mobile' : 'active-background', 'png')} alt="" />
      <div className="sites-active-copy">
        <p className="sites-active-caption">{formatPrice(monthlyRate)} / мес. за аккаунт</p>
        <h2 id="sites-active-title" tabIndex={-1}>Защита <br className="sites-mobile-copy" />от DDoS включена</h2>
        <p className="sites-active-count" aria-live="polite">Под защитой {formatDomainCount(protectedCount)} из {total}</p>
      </div>
      <img className="sites-active-shield" src={asset('active-gateway', 'png')} alt="" />
      <div className="sites-active-actions">
        <div className="sites-active-buttons">
          <button type="button" className="sites-active-pay hosting-pressable" onClick={onPay}>
            {renew ? 'Оплатить наперёд' : 'Внести оплату'}
          </button>
          {showRenewSwitch && (
            <button type="button" className="sites-active-renew" role="switch" aria-checked={renew} onClick={requestRenewalChange}>
              <span className="hosting-switch" aria-hidden="true" />Автопродление
            </button>
          )}
          <SitesDropdown label="Управление защитой">
            {closeMenu => <>
              {canEdit && (
                <button type="button" onClick={() => { closeMenu(); onEdit() }}>
                  <SitesIcon src={domainsIcon} color="icon-secondary" />
                  Изменить список доменов
                </button>
              )}
              <button type="button" onClick={() => { closeMenu(); requestRenewalChange() }}>
                <SitesIcon src={renewalIcon} color="icon-secondary" />
                {renew ? 'Выключить' : 'Включить'} автопродление
              </button>
              <button type="button" onClick={() => { closeMenu(); onRequestDisable() }}>
                <SitesIcon src={disableIcon} color="icon-secondary" />
                Отключить сетевую защиту
              </button>
            </>}
          </SitesDropdown>
        </div>
        <p className="sites-active-caption" aria-live="polite">{renew ? `Автопродление ${formatDate(paidThrough)}` : `Оплачено до ${formatDate(paidThrough)} · автопродление выключено`}</p>
      </div>
      {renewDialogOpen && (
        <WarningDialog
          title="Выключить автопродление?"
          description={`Защита от DDoS будет действовать до ${formatDate(paidThrough)}. Чтобы продлить её, оплатите следующий период вручную.`}
          confirmLabel="Выключить"
          onClose={confirmed => {
            setRenewDialogOpen(false)
            if (confirmed) onToggleRenew()
          }}
        />
      )}
    </section>
  )
}

function DomainNote({ domain, status, onInstructions, onCopyAddress, onRetry }) {
  if (status === 'failed') {
    return (
      <div className="sites-domain-note">
        <span>Не удалось подключить защиту</span>
        <button type="button" className="sites-text-button" onClick={() => onRetry(domain.name)}>Повторить</button>
      </div>
    )
  }

  const waitingForDns = status === 'dns'
  if (!waitingForDns && status !== 'action') return null

  return (
    <div className="sites-domain-note">
      {waitingForDns ? (
        <>
          <span>Пропишите A-запись:</span>
          <span className="sites-domain-address">
            {demoDnsAddress}
            <button type="button" aria-label={`Скопировать IP для ${domain.name}`} onClick={onCopyAddress}><SitesIcon name="copy-dns" color="network-warning" /></button>
          </span>
        </>
      ) : <span>Разрешите Let’s Encrypt в CAA-записи</span>}
      <button type="button" className="sites-text-button" aria-label={`Как сделать для ${domain.name}`} onClick={() => onInstructions(domain.name)}>Как сделать</button>
    </div>
  )
}

function DomainInstructions({ name, status, onVerify, onClose }) {
  const dialog = useRef(null)
  const waitingForDns = status === 'dns'

  useEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="hosting-dialog sites-dialog" aria-labelledby="sites-instructions-title" onClose={onClose}>
      <h3 className="hosting-dialog-title" id="sites-instructions-title">{waitingForDns ? 'Проверка DNS' : 'Проверка CAA'}</h3>
      <p>{waitingForDns
        ? <>В демо для <strong>{name}</strong> нужна A-запись со значением <strong>{demoDnsAddress}</strong>.</>
        : <>Чтобы выпустить сертификат для <strong>{name}</strong>, разрешите Let’s Encrypt в CAA-записи домена.</>}</p>
      <div className="sites-payment-buttons">
        <button type="button" className="sites-payment-primary" onClick={() => { dialog.current.close(); onVerify(name) }}>Имитировать проверку</button>
        <button type="button" className="sites-payment-cancel" onClick={() => dialog.current.close()}>Закрыть</button>
      </div>
    </dialog>
  )
}

function NetworkProtection({ dark, screenState, compact, preset, statuses, setStatuses, showAttack, setShowAttack }) {
  const [selected, setSelected] = useState(() => new Set(preset.editingDomains
    ? Object.keys(preset.statuses).filter(name => name !== preset.removedDomain)
    : preset.domains.filter(domain => domain.name !== 'myreviews.ru')
      .slice(0, preset.selected).map(domain => domain.name)))
  const [editingDomains, setEditingDomains] = useState(preset.editingDomains)
  const [extending, setExtending] = useState(false)
  const [renewalMonths, setRenewalMonths] = useState(1)
  const [disabling, setDisabling] = useState(false)
  const [dialog, setDialog] = useState(preset.dialog ?? null)
  const [instructions, setInstructions] = useState(null)
  const [payment, setPayment] = useState(null)
  const showToast = useContext(HostingToastContext)
  const [renew, setRenew] = useState(preset.renew)
  const [showRenewSwitch, setShowRenewSwitch] = useState(screenState !== null || !preset.renew)
  const [saveState, setSaveState] = useState(screenState === null || screenState === 'initial')
  const [hasSavedCard, setHasSavedCard] = useState(preset.hasSavedCard)
  const [paidThrough, setPaidThrough] = useState(() => {
    if (preset.paidThrough !== undefined) return new Date(preset.paidThrough)
    return Object.keys(preset.statuses).length ? addMonths(new Date()) : null
  })
  const timers = useRef(new Map())
  const hasProtection = paidThrough !== null
  const { availability } = preset
  const requiresTransfer = availability === 'server' || availability === 'region'
  const enrolled = Object.keys(statuses)
  const connectionStatuses = Object.values(statuses)
  const additions = [...selected].filter(name => !statuses[name])
  const removals = editingDomains ? enrolled.filter(name => !selected.has(name)) : []
  const hasPaidCheckout = !availability && (extending || (!hasProtection && additions.length > 0))
  const checkoutTotal = monthlyRate * (extending ? renewalMonths : 1)
  const hasCheckout = !availability && (disabling || hasPaidCheckout || additions.length > 0 || removals.length > 0)
  const { checkoutSlot, filterSpace, setFilterSpace, preserveCheckoutSpace, scrollSpacer } = useSitesScrollSpace(hasCheckout)
  const domainChanges = [
    ...additions.map(name => ({ id: name, title: name, description: 'Подключение защиты от DDoS' })),
    ...removals.map(name => ({ id: name, title: name, description: 'Отключение защиты от DDoS' })),
  ]
  const protectedCount = enrolled.filter(name => statuses[name] === 'protected').length
  const disconnectingService = dialog === 'disconnect-service'
  const disconnectingDomains = dialog === 'disconnect-domains'
  const externalDns = dialog && (disconnectingService || disconnectingDomains)
    ? preset.domains.filter(domain => domain.dns !== 'DNS Timeweb' && (disconnectingService ? enrolled : removals).includes(domain.name))
    : []

  useEffect(() => {
    if (disabling) revealProtectionCheckout(document.getElementById('sites-checkout-title'))
  }, [disabling])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(({ timeout }) => clearTimeout(timeout))
  }, [])

  useEffect(() => {
    if (!saveState) return
    // Use the result of any demo check that is still running when the page reloads.
    const savedStatuses = Object.fromEntries(Object.entries(statuses)
      .map(([name, status]) => [name, timers.current.get(name)?.status ?? status]))
    saveNetworkProtection({ domains: preset.domains, statuses: savedStatuses, renew, hasSavedCard, paidThrough })
  }, [saveState, preset.domains, statuses, renew, hasSavedCard, paidThrough])

  function simulateActivation(names, next) {
    const connecting = Object.fromEntries(names.map(name => [name, 'connecting']))
    setStatuses(current => ({ ...current, ...connecting }))
    for (const name of names) {
      clearTimeout(timers.current.get(name)?.timeout)
      const timeout = setTimeout(() => {
        timers.current.delete(name)
        setStatuses(current => ({ ...current, [name]: next[name] }))
      }, 1800)
      timers.current.set(name, { timeout, status: next[name] })
    }
  }

  function connectDomains(names) {
    if (!names.length) return
    const targets = preset.domains.filter(domain => names.includes(domain.name))
    const next = Object.fromEntries(targets.map(domain => [
      domain.name,
      domain.requiresCaa ? 'action' : domain.dns === 'DNS Timeweb' ? 'protected' : 'dns',
    ]))
    simulateActivation(names, next)
  }

  function retryConnection(name) {
    connectDomains([name])
    showToast({ message: 'Повторяем подключение защиты.' })
  }

  function removeDomains(names) {
    if (!names.length) return
    for (const name of names) {
      clearTimeout(timers.current.get(name)?.timeout)
      timers.current.delete(name)
    }
    setStatuses(current => {
      const next = { ...current }
      for (const name of names) delete next[name]
      return next
    })
  }

  async function copyDnsAddress() {
    try {
      await navigator.clipboard.writeText(demoDnsAddress)
      showToast({ message: 'IP скопирован' })
    } catch {
      showToast({ message: 'Не удалось скопировать IP' })
    }
  }

  function updateSelection(next, { preserveSpace = false, editing = editingDomains } = {}) {
    const hasNextCheckout = extending || [...next].some(name => !statuses[name]) ||
      (editing && enrolled.some(name => !next.has(name)))
    preserveCheckoutSpace(preserveSpace && !hasNextCheckout)
    setSelected(next)
    setPayment(null)
  }

  function startPayment(action, { autoRenew, saveCard }) {
    if (!hasPaidCheckout || payment) return false
    const transaction = { action, names: extending ? enrolled : additions, total: checkoutTotal, months: extending ? renewalMonths : 1, autoRenew, saveCard }
    if (action.document) setPayment({ ...transaction, step: 'confirm' })
    else completePayment(transaction)
    return true
  }

  function closeExtension() {
    setExtending(false)
    setPayment(null)
    document.getElementById('sites-active-title')?.focus()
  }

  function confirmPayment() {
    if (!payment) return
    if (payment.step === 'confirm') {
      setPayment({ ...payment, step: 'document' })
      return
    }
    completePayment(payment)
  }

  function completePayment(transaction) {
    setSaveState(true)
    if (transaction.saveCard) setHasSavedCard(true)
    if (extending) {
      setPaidThrough(current => addMonths(new Date(Math.max(current.getTime(), Date.now())), transaction.months))
      if (transaction.action.document) {
        showToast({ message: `Оплата прошла. Срок защиты в демо продлён на ${transaction.months} мес.`, success: true })
      }
      closeExtension()
      return
    }

    setRenew(transaction.autoRenew)
    setShowRenewSwitch(true)
    setPaidThrough(addMonths(new Date()))
    connectDomains(transaction.names)
    setSelected(new Set())
    setEditingDomains(false)
    setPayment(null)
    if (transaction.action.document) {
      showToast({ message: 'Оплата прошла. Подключаем защиту для выбранных доменов.', success: true })
    }
    document.getElementById('sites-domains-title')?.focus({ preventScroll: true })
  }

  function resetSelection({ preserveSpace = true } = {}) {
    updateSelection(new Set(), { preserveSpace, editing: false })
    setEditingDomains(false)
    document.getElementById('sites-domains-title')?.focus({ preventScroll: preserveSpace })
  }

  function confirmDomainChanges() {
    setSaveState(true)
    removeDomains(removals)
    connectDomains(additions)
    resetSelection({ preserveSpace: false })
    showToast({ message: 'Список доменов изменён.', success: true })
  }

  function openDisableCheckout() {
    if (disabling) {
      revealProtectionCheckout(document.getElementById('sites-checkout-title'))
      return
    }
    setExtending(false)
    setEditingDomains(false)
    updateSelection(new Set())
    setDisabling(true)
  }

  function cancelDisableCheckout() {
    setDisabling(false)
    resetSelection()
  }

  function disableProtection() {
    setSaveState(true)
    setPaidThrough(null)
    setRenew(false)
    setExtending(false)
    setDisabling(false)
    setFilterSpace(0)
    removeDomains(enrolled)
    resetSelection({ preserveSpace: false })
    showToast({ message: 'Сетевая защита отключена.', success: true })
  }

  function closeDialog(confirmed) {
    setDialog(null)
    if (!confirmed) return
    if (disconnectingService) disableProtection()
    if (disconnectingDomains) confirmDomainChanges()
    if (dialog === 'transfer') showToast({ message: 'Демо-обращение на перенос создано.', success: true })
  }

  return (
    <>
      {availability && (
        <ProtectionAlert
          title={availabilityNotices[availability][0]}
          description={availabilityNotices[availability][1]}
          tone={availability === 'blocked' ? 'error' : 'warning'}
          action={requiresTransfer
            ? { label: 'Написать в поддержку', onClick: () => setDialog('transfer') }
            : availability === 'integrator'
              ? { label: 'Обратитесь к интегратору', onClick: () => setDialog('integrator') }
              : undefined}
        />
      )}
      {showAttack && hasProtection && (
        <ProtectionAlert
          title="Обнаружена атака на сайт"
          description="Фильтры DDoS-Guard отсекают вредоносные запросы. Сетевая защита продолжает работать."
          onDismiss={() => setShowAttack(false)}
        />
      )}
      {connectionStatuses.includes('failed') ? (
        <ProtectionAlert
          title="Не удалось подключить защиту"
          description="Нажмите «Повторить» в строке домена, где возник сбой."
          tone="error"
        />
      ) : connectionStatuses.includes('connecting') && (
        <ProtectionAlert
          title="Подключаем сетевую защиту"
          description="Статусы доменов обновятся в списке после подключения."
        />
      )}
      {hasProtection ? (
        <ProtectionBanner
          compact={compact}
          protectedCount={protectedCount}
          total={preset.domains.length}
          renew={renew}
          showRenewSwitch={showRenewSwitch}
          paidThrough={paidThrough}
          canEdit={!editingDomains}
          onRequestDisable={openDisableCheckout}
          onToggleRenew={() => {
            setRenew(value => !value)
            setShowRenewSwitch(true)
            setSaveState(true)
          }}
          onPay={() => {
            if (extending) {
              revealProtectionCheckout(document.getElementById('sites-checkout-title'))
              return
            }
            setDisabling(false)
            setEditingDomains(false)
            updateSelection(new Set())
            setRenewalMonths(1)
            setExtending(true)
          }}
          onEdit={() => {
            setDisabling(false)
            setExtending(false)
            setFilterSpace(0)
            updateSelection(new Set(enrolled))
            setEditingDomains(true)
            document.getElementById('sites-domains-title')?.focus()
          }}
        />
      ) : <ProtectionIntro compact={compact} />}
      {!availability && (
        <SitesTable
          compact={compact}
          domains={preset.domains}
          statuses={statuses}
          statusLabels={statusLabels}
          selected={selected}
          hasProtection={hasProtection}
          selecting={!hasProtection || editingDomains}
          filterSpace={filterSpace}
          onFilterSpaceChange={setFilterSpace}
          dark={dark}
          onSelection={next => updateSelection(next, { preserveSpace: true })}
          onReset={() => resetSelection()}
          renderNote={(domain, status) => (
            <DomainNote domain={domain} status={status} onInstructions={setInstructions} onCopyAddress={copyDnsAddress} onRetry={retryConnection} />
          )}
        />
      )}
      {hasCheckout && (
        <div className="sites-checkout-slot" ref={checkoutSlot}>
          {hasPaidCheckout ? (
            <ProtectionCheckout
              key={extending ? 'extend' : 'connect'}
              title={extending ? 'Продление защиты' : compact ? 'Подключение' : 'Что изменится'}
              items={[{
                id: 'network-protection',
                title: 'Защита от DDoS',
                accessibleName: extending ? 'продление защиты' : 'подключение защиты',
                description: extending ? 'Продление' : formatDomainCount(additions.length),
                amount: `${formatPrice(monthlyRate)} / мес.`,
                term: extending ? protectionRenewalTerm(renewalMonths) : undefined,
                removable: true,
              }]}
              total={checkoutTotal}
              paymentDescription={extending ? `Продление на ${renewalMonths} мес.` : formatDomainCount(additions.length)}
              payment={payment}
              paymentContext={JSON.stringify(extending ? [enrolled, renewalMonths] : additions)}
              hasSavedCard={hasSavedCard}
              reveal={extending}
              allowAutoRenew={!hasProtection}
              onTermChange={months => {
                setRenewalMonths(months)
                setPayment(null)
              }}
              onStart={startPayment}
              onConfirm={confirmPayment}
              onCancel={() => setPayment(null)}
              onClose={extending ? closeExtension : resetSelection}
              onUnlinkCard={() => setHasSavedCard(false)}
            />
          ) : (
            <div className="sites-checkout hosting-reveal">
              <h2 id="sites-checkout-title" tabIndex={-1}>Что изменится</h2>
              <PlanChanges
                items={disabling ? [{
                  id: 'network-protection',
                  title: 'Сетевая защита',
                  description: 'Отключение для всех доменов аккаунта',
                  accessibleName: 'отключение сетевой защиты',
                  amount: formatPrice(0),
                  removable: true,
                }] : domainChanges}
                notices={disabling ? disableProtectionNotices : undefined}
                totals={[{ label: 'Доплачивать не нужно', amount: formatPrice(0) }]}
                actions={[disabling ? disableProtectionAction : applyDomainChanges]}
                onChange={disabling ? cancelDisableCheckout : undefined}
                onAction={() => {
                  if (disabling) setDialog('disconnect-service')
                  else if (removals.length) setDialog('disconnect-domains')
                  else confirmDomainChanges()
                }}
              />
            </div>
          )}
        </div>
      )}
      <ProtectionFaq questions={questions} />
      {scrollSpacer}
      {instructions && <DomainInstructions
        name={instructions}
        status={statuses[instructions]}
        onClose={() => setInstructions(null)}
        onVerify={name => simulateActivation([name], { [name]: 'protected' })}
      />}
      {(disconnectingService || disconnectingDomains) && (
        <WarningDialog
          title={disconnectingService ? 'Отключить сетевую защиту?' : 'Отключить защиту для выбранных доменов?'}
          description={`Защита будет снята сразу ${disconnectingService ? 'со всех доменов аккаунта' : 'с выбранных доменов'}. Деньги за оставшиеся дни оплаченного месяца не возвращаются.${externalDns.length ? ` Для доменов со сторонним DNS (${externalDns.map(domain => domain.name).join(', ')}) верните A-запись на ${demoOriginalAddress}.` : ''}`}
          confirmLabel="Отключить"
          onClose={closeDialog}
        />
      )}
      {dialog === 'integrator' && (
        <WarningDialog
          title="Обратитесь к интегратору"
          description="Интегратор, который обслуживает ваш аккаунт, поможет подключить сетевую защиту."
          onClose={closeDialog}
        />
      )}
      {dialog === 'transfer' && (
        <WarningDialog
          title="Обращение на перенос аккаунта"
          description="Создайте демо-обращение в поддержку о переносе на сервер, который поддерживает защиту от DDoS."
          confirmLabel="Создать обращение"
          onClose={closeDialog}
        />
      )}
    </>
  )
}

export default function SitesSection({ tab, onTabChange, dark, screenState, compact }) {
  const antivirusScreenState = tab === 'antivirus' ? screenState : null
  const networkScreenState = tab === 'network-protection' ? screenState : null
  const [antivirusPreset] = useState(() => getAntivirusPreset(antivirusScreenState))
  const [networkPreset] = useState(() => getNetworkProtectionPreset(networkScreenState))
  const [plan, setPlan] = useState(antivirusPreset.plan)
  const [antivirusStatuses, setAntivirusStatuses] = useState(antivirusPreset.statuses)
  const [networkStatuses, setNetworkStatuses] = useState(networkPreset.statuses)
  const [showAttack, setShowAttack] = useState(Boolean(networkPreset.attack))
  const antivirusThreats = Object.values(antivirusStatuses).includes('threat')
  const networkConnected = Object.values(networkStatuses).includes('protected')
  const tabStatuses = {
    antivirus: plan && (antivirusThreats ? 'threat' : 'connected'),
    'network-protection': networkConnected && (showAttack ? 'attack' : 'connected'),
  }

  return (
    <div className="sites-page">
      <header className="sites-heading">
        <h1>Сайты</h1>
        <SiteTabs selected={tab} onSelect={onTabChange} statuses={tabStatuses} compact={compact} />
      </header>
      <div id="sites-panel-mine" className="hosting-sheet" role="tabpanel" aria-labelledby="sites-tab-mine" hidden={tab !== 'mine'} />
      <div id="sites-panel-antivirus" className="sites-protection sites-antivirus" role="tabpanel" aria-labelledby="sites-tab-antivirus" hidden={tab !== 'antivirus'}>
        <Antivirus dark={dark} screenState={antivirusScreenState} compact={compact} preset={antivirusPreset}
          plan={plan} setPlan={setPlan} statuses={antivirusStatuses} setStatuses={setAntivirusStatuses} threats={antivirusThreats} />
      </div>
      <div id="sites-panel-network-protection" className="sites-protection" role="tabpanel" aria-labelledby="sites-tab-network-protection" hidden={tab !== 'network-protection'}>
        <NetworkProtection dark={dark} screenState={networkScreenState} compact={compact} preset={networkPreset}
          statuses={networkStatuses} setStatuses={setNetworkStatuses} showAttack={showAttack} setShowAttack={setShowAttack} />
      </div>
    </div>
  )
}
