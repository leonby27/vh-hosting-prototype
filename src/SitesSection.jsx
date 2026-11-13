import { useContext, useEffect, useRef, useState } from 'react'
import { TabIndicator } from './hosting-motion.jsx'
import { PendingChangesContext, usePendingChanges } from './pending-changes.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import { removesAllServiceTargets } from './ServiceChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import Antivirus from './Antivirus.jsx'
import { getAntivirusPreset } from './antivirus-states.js'
import { getNetworkProtectionPreset, networkProtectionMonthlyRate as monthlyRate, saveNetworkProtection } from './network-protection-states.js'
import domainsIcon from './assets/hosting/domains.svg'
import chevronIcon from './assets/hosting/mobile-more-chevron.svg'
import walletIcon from './assets/hosting/wallet.svg'
import disableIcon from './assets/plan-changes/disable.svg'
import renewalIcon from './assets/plan-changes/retry.svg'
import {
  ActiveProtectionBanner, addMonths, asset, formatDate, formatDomainCount, formatPrice, ProtectionAlert, ProtectionCheckout,
  ProtectionCheckoutSlot, ProtectionFaq, revealProtectionCheckout, SitesIcon, SitesTable, useSitesFilterSpace,
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

const questions = [
  { id: 'how', title: 'Как работает защита?', answer: 'Во время атаки тысячи запросов от ботов могут перегрузить сервер, и сайт перестанет открываться. С защитой запросы к выбранным доменам проходят через фильтры DDoS-Guard, которые отсекают ботов и пропускают посетителей.' },
  { id: 'domain', title: 'Что сделать с доменом?', answer: 'Может потребоваться обновить DNS-запись или разрешить выпуск сертификата. Нажмите «Как сделать» рядом со статусом домена.' },
  { id: 'antivirus', title: 'Отличие от антивируса', answer: 'Сетевая защита фильтрует входящий трафик. Антивирус проверяет файлы сайта на вредоносный код.' },
]

const availabilityNotices = {
  server: ['На сервере вашего аккаунта защита от DDoS пока недоступна', 'Напишите нам для переноса аккаунта на другой сервер.'],
  region: ['На сервере вашего аккаунта в Казахстане защита от DDoS пока недоступна', 'Напишите нам для переноса аккаунта на сервер с поддержкой защиты.'],
  plan: ['Сетевая защита недоступна на вашем тарифе', 'Чтобы подключить защиту, выберите тариф с поддержкой услуги.'],
  blocked: ['Аккаунт заблокирован', 'После разблокировки аккаунта вы сможете подключить сетевую защиту.'],
  trial: ['Идёт тестовый период хостинга', 'Чтобы подключить сетевую защиту, оплатите хостинг.'],
  integrator: ['Защиту подключает интегратор', 'Обратитесь к интегратору, который обслуживает ваш аккаунт.'],
}

function SiteTabs({ selected, onSelect, statuses, compact }) {
  const list = useRef(null)
  const { navigate } = useContext(PendingChangesContext)

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
    if (id === selected) return
    navigate(() => {
      onSelect(id)
      list.current?.querySelector(`#sites-tab-${id}`)?.focus({ preventScroll: compact })
    })
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
          onClick={() => { if (tab.id !== selected) navigate(() => onSelect(tab.id)) }}
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

function ProtectionBanner({ compact, protectedCount, total, renew, showRenewSwitch, paidThrough, editing, onPay, onToggleRenew, onEdit, onCancelEdit, onRequestDisable }) {
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)

  function requestRenewalChange() {
    if (renew) setRenewDialogOpen(true)
    else onToggleRenew()
  }

  return (
    <ActiveProtectionBanner
      headingId="sites-active-title"
      eyebrow={`${formatPrice(monthlyRate)} / мес. за аккаунт`}
      title={<>Защита <br className="sites-mobile-copy" />от DDoS включена</>}
      status={`Под защитой ${formatDomainCount(protectedCount)} из ${total}`}
      background={asset(compact ? 'active-background-mobile' : 'active-background', 'png')}
      illustration={asset('active-gateway', 'png')}
      renew={renew}
      showRenewSwitch={showRenewSwitch}
      onToggleRenew={requestRenewalChange}
      editing={editing}
      onSettings={editing ? onCancelEdit : onEdit}
      paymentAction={
        <div className="sites-active-payment-slot" data-open={!renew} inert={renew}>
          <div>
            <button type="button" className="sites-active-manual-pay" onClick={onPay}>
              <SitesIcon src={walletIcon} color="light" />Оплатить
            </button>
          </div>
        </div>
      }
      menuLabel="Управление защитой"
      menuItems={closeMenu => <>
        {!editing && (
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
      caption={renew ? `Автопродление ${formatDate(paidThrough)}` : `Оплачено до ${formatDate(paidThrough)} · автопродление выключено`}
    >
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
    </ActiveProtectionBanner>
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
  const instruction = waitingForDns ? 'Пропишите A-запись:' : 'Разрешите Let’s Encrypt в CAA-записи'

  return (
    <div className="sites-domain-note">
      <div className="sites-domain-note-desktop">
        <span>{instruction}</span>
        {waitingForDns && (
          <span className="sites-domain-address">
            {demoDnsAddress}
            <button type="button" aria-label={`Скопировать IP для ${domain.name}`} onClick={onCopyAddress}><SitesIcon name="copy-dns" color="network-warning" /></button>
          </span>
        )}
        <button type="button" className="sites-text-button" aria-label={`Как сделать для ${domain.name}`} onClick={() => onInstructions(domain.name)}>Как сделать</button>
      </div>
      <button type="button" className="sites-domain-instruction" aria-haspopup="dialog" onClick={() => onInstructions(domain.name)}>
        <span>{instruction}{waitingForDns && ` ${demoDnsAddress}`}</span>
        <SitesIcon src={chevronIcon} color="network-warning" />
      </button>
      {waitingForDns && (
        <button type="button" className="sites-domain-copy" aria-label={`Скопировать IP для ${domain.name}`} onClick={onCopyAddress}>
          <SitesIcon name="copy-dns" color="icon-secondary" />
        </button>
      )}
    </div>
  )
}

function DomainInstructions({ name, status, onVerify, onClose, onCopyAddress }) {
  const dialog = useRef(null)
  const waitingForDns = status === 'dns'

  useEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="hosting-dialog sites-dialog" aria-labelledby="sites-instructions-title" onClose={onClose}>
      <h3 className="hosting-dialog-title" id="sites-instructions-title">{waitingForDns ? 'Проверка DNS' : 'Проверка CAA'}</h3>
      <p>{waitingForDns
        ? <>В демо для <strong>{name}</strong> нужна A-запись со значением <strong className="sites-domain-address">
          {demoDnsAddress}
          <button type="button" aria-label="Скопировать IP" onClick={onCopyAddress}><SitesIcon name="copy-dns" color="network-warning" /></button>
        </strong>.</>
        : <>Чтобы выпустить сертификат для <strong>{name}</strong>, разрешите Let’s Encrypt в CAA-записи домена.</>}</p>
      <div className="sites-payment-buttons">
        <button type="button" className="sites-payment-primary" onClick={() => { dialog.current.close(); onVerify(name) }}>Имитировать проверку</button>
        <button type="button" className="sites-payment-cancel" onClick={() => dialog.current.close()}>Закрыть</button>
      </div>
    </dialog>
  )
}

function NetworkProtection({ dark, screenState, compact, preset, statuses, setStatuses, showAttack, setShowAttack, active }) {
  const [selected, setSelected] = useState(() => new Set(preset.editingDomains
    ? Object.keys(preset.statuses).filter(name => name !== preset.removedDomain)
    : preset.domains.filter(domain => domain.name !== 'myreviews.ru')
      .slice(0, preset.selected).map(domain => domain.name)))
  const [editingDomains, setEditingDomains] = useState(preset.editingDomains)
  const [extending, setExtending] = useState(false)
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
  const emptyDomains = {
    title: availability === 'no-sites' ? 'На аккаунте пока нет сайтов' : 'К сайтам пока не привязаны домены',
    description: availability === 'no-sites'
      ? 'Добавьте сайт и привяжите к нему домен, чтобы подключить сетевую защиту.'
      : 'Привяжите домен к сайту, чтобы подключить сетевую защиту.',
    icon: domainsIcon,
    canAddSite: availability === 'no-sites',
  }
  const availabilityNotice = availabilityNotices[availability]
  const requiresTransfer = availability === 'server' || availability === 'region'
  const enrolled = Object.keys(statuses)
  const connectionStatuses = Object.values(statuses)
  const additions = [...selected].filter(name => !statuses[name])
  const removals = editingDomains ? enrolled.filter(name => !selected.has(name)) : []
  const removingAllDomains = removesAllServiceTargets(selected, removals)
  const hasPaidCheckout = !availability && (extending || (!hasProtection && additions.length > 0))
  const hasCheckout = !availability && (hasPaidCheckout || additions.length > 0 || removals.length > 0)
  const showEmptyCheckout = !availability && preset.domains.length > 0 && (!hasProtection || editingDomains)
  usePendingChanges(active && hasCheckout, {
    title: extending ? 'Прервать продление сетевой защиты?' : hasProtection ? 'Прервать изменение сетевой защиты?' : 'Прервать подключение сетевой защиты?',
    description: extending ? 'Продление сетевой защиты не будет оплачено.' : 'Выбранные изменения для доменов будут сброшены.',
    revealCheckout: () => revealProtectionCheckout(document.getElementById('sites-checkout-title')),
  }, () => {
    setExtending(false)
    setEditingDomains(false)
    setSelected(new Set())
    setPayment(null)
  })
  const { filterSpace, setFilterSpace, scrollSpacer } = useSitesFilterSpace()
  const domainChanges = [
    ...additions.map(name => ({ id: name, title: name, description: 'Подключение защиты от DDoS' })),
    ...removals.map(name => ({ id: name, title: name, description: 'Отключение защиты от DDoS' })),
  ]
  const protectedCount = enrolled.filter(name => statuses[name] === 'protected').length
  const disconnectingService = dialog === 'disconnect-service'
  const externalDns = preset.domains.filter(domain => domain.dns !== 'DNS Timeweb' &&
    (disconnectingService ? enrolled : removals).includes(domain.name))
  const dnsNotice = externalDns.length
    ? `Для доменов со сторонним DNS (${externalDns.map(domain => domain.name).join(', ')}) верните A-запись на ${demoOriginalAddress}.`
    : ''

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

  function updateSelection(next) {
    setSelected(next)
    setPayment(null)
  }

  function startPayment(action, { autoRenew, saveCard }) {
    if (!hasPaidCheckout || payment) return false
    const transaction = { action, names: extending ? enrolled : additions, total: monthlyRate, autoRenew, saveCard }
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
      setPaidThrough(current => addMonths(new Date(Math.max(current.getTime(), Date.now()))))
      if (transaction.action.document) {
        showToast({ message: 'Оплата прошла. Срок защиты в демо продлён на 1 месяц.', success: true })
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
    updateSelection(new Set())
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

  function disableProtection() {
    setSaveState(true)
    setPaidThrough(null)
    setRenew(false)
    setExtending(false)
    setFilterSpace(0)
    removeDomains(enrolled)
    resetSelection({ preserveSpace: false })
    showToast({ message: 'Сетевая защита отключена.', success: true })
  }

  function closeDialog(confirmed) {
    setDialog(null)
    if (!confirmed) return
    if (disconnectingService) disableProtection()
    if (dialog === 'transfer') showToast({ message: 'Демо-обращение на перенос создано.', success: true })
  }

  return (
    <>
      {availabilityNotice && (
        <ProtectionAlert
          title={availabilityNotice[0]}
          description={availabilityNotice[1]}
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
          editing={editingDomains}
          onCancelEdit={() => resetSelection()}
          onRequestDisable={() => setDialog('disconnect-service')}
          onToggleRenew={() => {
            setRenew(value => !value)
            setShowRenewSwitch(true)
            setSaveState(true)
            if (!renew && extending) closeExtension()
          }}
          onPay={() => {
            if (extending) {
              revealProtectionCheckout(document.getElementById('sites-checkout-title'))
              return
            }
            setEditingDomains(false)
            updateSelection(new Set())
            setExtending(true)
          }}
          onEdit={() => {
            setExtending(false)
            setFilterSpace(0)
            updateSelection(new Set(enrolled))
            setEditingDomains(true)
            document.getElementById('sites-domains-title')?.focus()
          }}
        />
      ) : <ProtectionIntro compact={compact} />}
      {(!availability || availability === 'no-sites' || availability === 'no-domains') && (
        <SitesTable
          compact={compact}
          domains={preset.domains}
          empty={emptyDomains}
          statuses={statuses}
          statusLabels={statusLabels}
          selected={selected}
          hasProtection={hasProtection}
          selecting={!hasProtection || editingDomains}
          filterSpace={filterSpace}
          onFilterSpaceChange={setFilterSpace}
          dark={dark}
          onSelection={updateSelection}
          renderNote={(domain, status) => (
            <DomainNote domain={domain} status={status} onInstructions={setInstructions} onCopyAddress={copyDnsAddress} onRetry={retryConnection} />
          )}
        />
      )}
      <ProtectionCheckoutSlot open={hasCheckout || showEmptyCheckout}>
        {(showEmptyCheckout || hasCheckout) && (
          <ProtectionCheckout
            key={extending ? 'extend' : 'connect'}
            title={extending ? 'Продление защиты' : hasProtection ? 'Что изменится' : !hasCheckout ? 'Оплата' : compact ? 'Подключение' : 'Что изменится'}
            empty={hasCheckout ? undefined : hasProtection ? {
              title: 'Внесите изменения',
              description: 'Здесь появятся изменения списка доменов под защитой.',
            } : {
              title: 'Выберите домены',
              description: 'Здесь появятся выбранные домены и стоимость подключения сетевой защиты.',
            }}
            items={hasPaidCheckout ? [{
              id: 'network-protection',
              title: 'Защита от DDoS',
              accessibleName: extending ? 'продление защиты' : 'подключение защиты',
              description: extending ? 'Продление на 1 месяц' : formatDomainCount(additions.length),
              amount: `${formatPrice(monthlyRate)} / мес.`,
              removable: true,
            }] : removingAllDomains ? [{
              id: 'network-protection',
              title: 'Сетевая защита',
              description: 'Отключение для всех доменов аккаунта',
            }] : domainChanges}
            notices={removals.length ? [{
              id: 'remove-protection-domains', tone: 'warning', icon: 'alert',
              description: [
                removingAllDomains ? 'Защита будет снята сразу со всех доменов аккаунта.' : 'Защита для выбранных доменов будет снята сразу.',
                'Деньги за оставшиеся дни оплаченного месяца не возвращаются.',
                dnsNotice,
              ].filter(Boolean).join(' '),
            }] : []}
            serviceChanges={hasCheckout && !hasPaidCheckout
              ? { disabling: removingAllDomains, onApply: confirmDomainChanges, onDisable: disableProtection }
              : undefined}
            total={monthlyRate}
            paymentDescription={extending ? 'Продление на 1 месяц' : formatDomainCount(additions.length)}
            payment={payment}
            paymentContext={JSON.stringify(extending ? enrolled : additions)}
            hasSavedCard={hasSavedCard}
            reveal={extending}
            allowAutoRenew={!hasProtection}
            onStart={startPayment}
            onConfirm={confirmPayment}
            onCancel={() => setPayment(null)}
            onClose={extending ? closeExtension : resetSelection}
            canDiscard={hasCheckout || editingDomains}
            onUnlinkCard={() => setHasSavedCard(false)}
          />
        )}
      </ProtectionCheckoutSlot>
      <ProtectionFaq questions={questions} />
      {scrollSpacer}
      {instructions && <DomainInstructions
        name={instructions}
        status={statuses[instructions]}
        onClose={() => setInstructions(null)}
        onCopyAddress={copyDnsAddress}
        onVerify={name => simulateActivation([name], { [name]: 'protected' })}
      />}
      {disconnectingService && (
        <WarningDialog
          title="Отключить сетевую защиту?"
          description={['Защита будет снята сразу со всех доменов аккаунта. Деньги за оставшиеся дни оплаченного месяца не возвращаются.', dnsNotice].filter(Boolean).join(' ')}
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
        <Antivirus dark={dark} screenState={antivirusScreenState} compact={compact} preset={antivirusPreset} active={tab === 'antivirus'}
          plan={plan} setPlan={setPlan} statuses={antivirusStatuses} setStatuses={setAntivirusStatuses} threats={antivirusThreats} />
      </div>
      <div id="sites-panel-network-protection" className="sites-protection" role="tabpanel" aria-labelledby="sites-tab-network-protection" hidden={tab !== 'network-protection'}>
        <NetworkProtection dark={dark} screenState={networkScreenState} compact={compact} preset={networkPreset} active={tab === 'network-protection'}
          statuses={networkStatuses} setStatuses={setNetworkStatuses} showAttack={showAttack} setShowAttack={setShowAttack} />
      </div>
    </div>
  )
}
