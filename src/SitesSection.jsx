import { useContext, useEffect, useRef, useState } from 'react'
import { ModalFrame, PageAlert } from './ui/feedback.jsx'
import { Button, IconButton, Link } from './ui/controls.jsx'
import { Icon } from './ui/Icon.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { TabList, MenuItem } from './ui/navigation.jsx'
import { PendingChangesContext, usePendingChanges } from './pending-changes.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import { removesAllServiceTargets } from './ServiceChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import Antivirus from './Antivirus.jsx'
import NetworkAttackNotice from './NetworkAttackNotice.jsx'
import { antivirusStates, getAntivirusPreset } from './antivirus-states.js'
import { getNetworkProtectionPreset, isNetworkDomainProtected, networkProtectionMonthlyRate as monthlyRate, networkProtectionStates, networkProtectionStatusLabels, saveNetworkProtection } from './network-protection-states.js'
import domainsIcon from './assets/hosting/domains.svg'
import walletIcon from './assets/hosting/wallet.svg'
import disableIcon from './assets/plan-changes/disable.svg'
import renewalIcon from './assets/plan-changes/retry.svg'
import {
  ActiveProtectionBanner, addMonths, asset, formatDate, formatDomainCount, formatPrice, ProtectionCheckout,
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

const demoDnsAddress = '192.0.2.17'
const demoOriginalAddress = '192.0.2.10'
const sslPanelUrl = 'https://hosting.timeweb.ru/ssl'
const supportUrl = 'https://timeweb.com/ru/contacts/'
const sslFallbackNote = { text: 'Ваш SSL не подключён, работает бесплатный', label: 'Написать в поддержку', href: supportUrl }

const domainNotes = {
  dns: { text: 'Укажите A-запись:', showAddress: true },
  'dns-aaaa': { text: 'Укажите A-запись', showAddress: true, suffix: 'и удалите AAAA' },
  action: { text: 'Разрешите Let’s Encrypt в CAA-записи' },
  cdn: { text: 'Укажите в CDN IP сервера:', showAddress: true },
  'ssl-upload': sslFallbackNote,
  'ssl-timeweb': sslFallbackNote,
  'ssl-expired': { text: 'Ваш SSL истёк, работает бесплатный', label: 'Продлить / Купить', href: sslPanelUrl },
  'ssl-renewal-failed': { text: 'Не удалось продлить бесплатный SSL', label: 'Написать в поддержку', href: supportUrl },
  failed: { text: 'Не удалось подключить защиту', label: 'Написать в поддержку', href: supportUrl },
}

const domainInstructions = {
  dns: 'Откройте DNS-настройки у провайдера домена и укажите защищённый IP в A-записи.',
  'dns-aaaa': 'Откройте DNS-настройки у провайдера домена, укажите защищённый IP в A-записи и удалите AAAA-запись.',
  action: 'Чтобы выпустить бесплатный сертификат, добавьте значение issue “letsencrypt.org” в CAA-записи домена.',
  cdn: 'Откройте настройки стороннего CDN и укажите защищённый IP в качестве адреса исходного сервера.',
}

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

  return <TabList ref={list} size={compact ? 'compact' : undefined} idPrefix="sites" label="Разделы сайтов" value={selected} onChange={onSelect}
    navigate={navigate} preventScroll={compact} tabs={tabs.map(tab => ({
      ...tab,
      accessibleLabel: statuses[tab.id] ? `${tab.label} — ${tabStatusLabels[statuses[tab.id]]}` : undefined,
      suffix: statuses[tab.id] && <span className="sites-tab-status" data-status={statuses[tab.id]} aria-hidden="true" />,
    }))} />
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
  const paidThroughDate = formatDate(paidThrough)
  const renewalCaption = renew
    ? `Автопродление ${paidThroughDate}`
    : `Оплачено до ${paidThroughDate} · автопродление выключено`

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
            <Button variant="inverse" appearance="banner-outline" size={44} className="sites-active-manual-pay" onClick={onPay}>
              <SitesIcon src={walletIcon} color="light" />Оплатить
            </Button>
          </div>
        </div>
      }
      menuLabel="Управление защитой"
      menuItems={closeMenu => <>
        {!editing && (
          <MenuItem onClick={() => { closeMenu(); onEdit() }}>
            <SitesIcon src={domainsIcon} color="icon-secondary" />
            Изменить список доменов
          </MenuItem>
        )}
        <MenuItem onClick={() => { closeMenu(); requestRenewalChange() }}>
          <SitesIcon src={renewalIcon} color="icon-secondary" />
          {renew ? 'Выключить' : 'Включить'} автопродление
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); onRequestDisable() }}>
          <SitesIcon src={disableIcon} color="icon-secondary" />
          Отключить сетевую защиту
        </MenuItem>
      </>}
      caption={`${renewalCaption} · Защищённый IP ${demoDnsAddress}`}
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

function ProtectedAddress({ copyLabel, onCopy }) {
  return (
    <span className="sites-domain-address">
      {demoDnsAddress}
      <IconButton size={24} type="button" aria-label={copyLabel} onClick={onCopy}>
        <SitesIcon name="copy-dns" color="network-warning" />
      </IconButton>
    </span>
  )
}

function DomainNote({ domain, status, onInstructions, onCopyAddress }) {
  const note = domainNotes[status]
  if (!note) return null
  return (
    <div className="sites-domain-note">
      <span>
        {note.text}
        {note.showAddress && <> <ProtectedAddress copyLabel={`Скопировать IP для ${domain.name}`} onCopy={onCopyAddress} /></>}
        {note.suffix && ` ${note.suffix}`}
      </span>
      {note.href ? (
        <Link className="sites-text-button" href={note.href} target="_blank" rel="noopener"
          aria-label={`${note.label} для ${domain.name}`}>{note.label}</Link>
      ) : (
        <Button appearance="text" pressable={false} type="button" className="sites-text-button" aria-haspopup="dialog" aria-label={`Как сделать для ${domain.name}`}
          onClick={() => onInstructions({ name: domain.name, status })}>Как сделать</Button>
      )}
    </div>
  )
}

function DomainInstructions({ name, status, onVerify, onClose, onCopyAddress }) {
  const dialog = useRef(null)

  return (
    <ModalFrame ref={dialog} className="hosting-dialog sites-dialog" aria-labelledby="sites-instructions-title" onClose={onClose}>
      <h3 className="hosting-dialog-title" id="sites-instructions-title">Что делать, если домену требуется действие?</h3>
      <p><strong>{name}</strong></p>
      <p>{domainInstructions[status]}</p>
      {domainNotes[status].showAddress && (
        <p>Защищённый IP <ProtectedAddress copyLabel="Скопировать IP" onCopy={onCopyAddress} /></p>
      )}
      <div className="sites-payment-buttons">
        <Button type="button" appearance="site-payment" pressable={false} onClick={() => { dialog.current.close(); onVerify(name) }}>Имитировать проверку</Button>
        <Button type="button" appearance="site-payment" variant="neutral" pressable={false} onClick={() => dialog.current.close()}>Закрыть</Button>
      </div>
    </ModalFrame>
  )
}

function AttackMark() {
  return <span className="sites-attack-mark" title="Атака"><Icon name="alert-outline" size={16} label="Атака" /></span>
}

function NetworkProtection({ screenState, compact, preset, statuses, setStatuses, attackedDomains, active }) {
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
    return Object.keys(statuses).length ? addMonths(new Date()) : null
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
  const failedDomains = enrolled.filter(name => statuses[name] === 'failed')
  const connectingDomains = connectionStatuses.includes('connecting')
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
  const protectedCount = connectionStatuses.filter(isNetworkDomainProtected).length
  const removingLastDomains = dialog === 'remove-last-domains'
  const disconnectingService = dialog === 'disconnect-service' || removingLastDomains
  const externalDns = preset.domains.filter(domain => domain.dns !== 'DNS Timeweb' &&
    (disconnectingService ? enrolled : removals).includes(domain.name))
  const dnsNotice = externalDns.length
    ? `Для доменов со сторонним DNS (${externalDns.map(domain => domain.name).join(', ')}) верните A-запись на ${demoOriginalAddress}.`
    : ''

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(({ timeout }) => clearTimeout(timeout))
      if (preset.attackedDomains && pending.size) {
        const completed = Object.fromEntries([...pending].map(([name, { status }]) => [name, status]))
        setStatuses(current => ({ ...current, ...completed }))
      }
    }
  }, [preset.attackedDomains, setStatuses])

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
      {preset.trial && <PageAlert title="Идёт тестовый период хостинга" />}
      {availabilityNotice && (
        <PageAlert
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
      <div>
        <AnimatedBlock open={failedDomains.length > 0 || connectingDomains}>
          <div className="sites-connection-alert-content">
            {failedDomains.length > 0 ? (
              <PageAlert
                title="Не удалось подключить защиту"
                description="В списке доменов отмечено, где возникла ошибка."
                tone="error"
                action={<Button as="a" href={supportUrl} target="_blank" rel="noopener" variant="neutral"
                  appearance="alert-action" pressable={false} className="sites-page-alert-button">Написать в поддержку</Button>}
              />
            ) : (
              <PageAlert
                title="Подключаем сетевую защиту"
                description="Статусы доменов обновятся в списке после подключения."
              />
            )}
          </div>
        </AnimatedBlock>
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
      </div>
      {(!availability || availability === 'no-sites' || availability === 'no-domains') && (
        <SitesTable
          compact={compact}
          domains={preset.domains}
          empty={emptyDomains}
          statuses={statuses}
          statusLabels={networkProtectionStatusLabels}
          isProtected={isNetworkDomainProtected}
          selected={selected}
          hasProtection={hasProtection}
          selecting={!hasProtection || editingDomains}
          filterSpace={filterSpace}
          onFilterSpaceChange={setFilterSpace}
          onSelection={updateSelection}
          renderNameSuffix={domain => attackedDomains.includes(domain.name) && <AttackMark />}
          renderNote={(domain, status) => domainNotes[status] && (
            <DomainNote domain={domain} status={status} onInstructions={setInstructions} onCopyAddress={copyDnsAddress} />
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
                removingAllDomains ? 'При удалении всех доменов услуга «Сетевая защита» отключится.' : 'Защита для выбранных доменов будет снята сразу.',
                'Деньги за оставшиеся дни оплаченного месяца не возвращаются.',
                dnsNotice,
              ].filter(Boolean).join(' '),
            }] : []}
            serviceChanges={hasCheckout && !hasPaidCheckout
              ? { disabling: removingAllDomains, onApply: confirmDomainChanges, onDisable: () => setDialog('remove-last-domains') }
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
        name={instructions.name}
        status={instructions.status}
        onClose={() => setInstructions(null)}
        onCopyAddress={copyDnsAddress}
        onVerify={name => simulateActivation([name], { [name]: 'protected' })}
      />}
      {disconnectingService && (
        <WarningDialog
          title="Отключить сетевую защиту?"
          description={[
            removingLastDomains ? 'После удаления последнего домена услуга «Сетевая защита» отключится.' : 'Защита будет снята сразу со всех доменов аккаунта.',
            'Деньги за оставшиеся дни оплаченного месяца не возвращаются.',
            dnsNotice,
          ].filter(Boolean).join(' ')}
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

export default function SitesSection({ tab, onTabChange, screenState, compact, attackNotice, incidentStatuses, setIncidentStatuses }) {
  const antivirusScreenState = antivirusStates.some(({ id }) => id === screenState) || (screenState === 'initial' && tab === 'antivirus')
    ? screenState : null
  const networkScreenState = networkProtectionStates.some(({ id }) => id === screenState) || (screenState === 'initial' && tab === 'network-protection')
    ? screenState : null
  const [antivirusPreset] = useState(() => getAntivirusPreset(antivirusScreenState))
  const [networkPreset] = useState(() => getNetworkProtectionPreset(networkScreenState))
  const [plan, setPlan] = useState(antivirusPreset.plan)
  const [antivirusStatuses, setAntivirusStatuses] = useState(antivirusPreset.statuses)
  const [localNetworkStatuses, setLocalNetworkStatuses] = useState(networkPreset.statuses)
  const networkStatuses = attackNotice ? incidentStatuses : localNetworkStatuses
  const setNetworkStatuses = attackNotice ? setIncidentStatuses : setLocalNetworkStatuses
  const antivirusThreats = Object.values(antivirusStatuses).includes('threat')
  const networkConnected = Object.values(networkStatuses).some(isNetworkDomainProtected)
  const tabStatuses = {
    antivirus: plan && (antivirusThreats ? 'threat' : 'connected'),
    'network-protection': attackNotice ? 'attack' : networkConnected && 'connected',
  }

  return (
    <div className="sites-page">
      <header className="sites-heading">
        <h1>Сайты</h1>
        <SiteTabs selected={tab} onSelect={onTabChange} statuses={tabStatuses} compact={compact} />
      </header>
      <div id="sites-panel-mine" className={attackNotice ? 'sites-my-sites' : 'hosting-sheet'} role="tabpanel" aria-labelledby="sites-tab-mine" hidden={tab !== 'mine'}>
        {attackNotice && <>
          <NetworkAttackNotice {...attackNotice} onConnect={() => onTabChange('network-protection')} />
          <ul className="sites-my-domain-list hosting-sheet" aria-label="Домены моих сайтов">
            {networkPreset.domains.map(domain => (
              <li key={domain.name}>
                <span>{domain.name}</span>
                {attackNotice.domains.includes(domain.name) && <AttackMark />}
              </li>
            ))}
          </ul>
        </>}
      </div>
      <div id="sites-panel-antivirus" className="sites-protection sites-antivirus" role="tabpanel" aria-labelledby="sites-tab-antivirus" hidden={tab !== 'antivirus'}>
        <Antivirus screenState={antivirusScreenState} compact={compact} preset={antivirusPreset} active={tab === 'antivirus'}
          plan={plan} setPlan={setPlan} statuses={antivirusStatuses} setStatuses={setAntivirusStatuses} threats={antivirusThreats} />
      </div>
      <div id="sites-panel-network-protection" className="sites-protection" role="tabpanel" aria-labelledby="sites-tab-network-protection" hidden={tab !== 'network-protection'}>
        <NetworkProtection screenState={networkScreenState} compact={compact} preset={networkPreset} active={tab === 'network-protection'}
          statuses={networkStatuses} setStatuses={setNetworkStatuses} attackedDomains={attackNotice?.domains ?? []} />
      </div>
    </div>
  )
}
