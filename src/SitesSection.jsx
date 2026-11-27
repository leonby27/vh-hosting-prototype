import { useContext, useEffect, useRef, useState } from 'react'
import { Dialog, PageAlert, Tooltip } from './ui/feedback.jsx'
import { Button, IconButton, Link } from './ui/controls.jsx'
import { Icon } from './ui/Icon.jsx'
import { Surface } from './ui/layout.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { TabList, MenuItem } from './ui/navigation.jsx'
import { PendingChangesContext, usePendingChanges } from './pending-changes.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import { removesAllServiceTargets } from './ServiceChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import { HostingTrialNotice } from './DashboardNotices.jsx'
import Antivirus from './Antivirus.jsx'
import NetworkAttackNotice from './NetworkAttackNotice.jsx'
import MySites from './MySites.jsx'
import { antivirusStates, getAntivirusPreset } from './antivirus-states.js'
import { getNetworkProtectionPreset, isNetworkDomainProtected, networkProtectionMonthlyRate as monthlyRate, networkProtectionStates, networkProtectionStatusLabels, saveNetworkProtection } from './network-protection-states.js'
import { payFromBalance } from './plan-payment-options.js'
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
const dnsNote = { text: 'Укажите A-запись' }

const domainNotes = {
  dns: dnsNote,
  'dns-aaaa': dnsNote,
  action: { text: 'Разрешите Let’s Encrypt в CAA-записи', instructionsTitle: 'Разрешите Let’s Encrypt' },
  cdn: { text: 'Укажите в CDN IP сервера' },
  'ssl-upload': sslFallbackNote,
  'ssl-timeweb': sslFallbackNote,
  'ssl-expired': { text: 'Ваш SSL истёк, работает бесплатный', label: 'Продлить / Купить', href: sslPanelUrl },
  'ssl-renewal-failed': { text: 'Не удалось продлить бесплатный SSL', label: 'Написать в поддержку', href: supportUrl },
  failed: { text: 'Не удалось подключить защиту', label: 'Написать в поддержку', href: supportUrl },
}

const domainInstructions = {
  action: name => `Укажите issue «letsencrypt.org» в CAA-записи домена ${name}.`,
  cdn: name => `В настройках CDN для домена ${name} укажите защищённый IP как адрес исходного сервера.`,
}

const questions = [
  { id: 'how', title: 'Как работает защита?', answer: 'Во время атаки тысячи запросов от ботов могут перегрузить сервер, и сайт перестанет открываться. С защитой запросы к выбранным доменам проходят через фильтры DDoS-Guard, которые отсекают ботов и пропускают посетителей.' },
  { id: 'domain', title: 'Что сделать с доменом?', answer: 'Может потребоваться обновить DNS-запись или разрешить выпуск сертификата. Нажмите «Подробнее» рядом со статусом домена.' },
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
      className={protectedCount ? undefined : 'sites-protection-inactive'}
      headingId="sites-active-title"
      eyebrow={`${formatPrice(monthlyRate)} / мес. за аккаунт`}
      title={protectedCount ? <>Защита <br className="sites-mobile-copy" />от DDoS включена</> : 'Защита не работает'}
      status={protectedCount ? `Под защитой ${formatDomainCount(protectedCount)} из ${total}` :
        'Ни один домен не под защитой. Выполните действия, указанные у доменов в списке.'}
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

function waitsForDns(status) {
  return status === 'dns' || status === 'dns-aaaa'
}

function wwwDnsTargets({ name, apexUsesProtectedIp }) {
  return apexUsesProtectedIp ? `www.${name}` : `${name} и www.${name}`
}

function DomainNote({ domain, status, onInstructions }) {
  const note = domainNotes[status]
  if (!note) return null
  return (
    <div className="sites-domain-note">
      <span>{note.text}</span>
      {note.href ? (
        <Link className="sites-text-button" href={note.href} target="_blank" rel="noopener"
          aria-label={`${note.label} для ${domain.name}`}>{note.label}</Link>
      ) : (
        <Button appearance="text" pressable={false} type="button" className="sites-text-button" aria-haspopup="dialog" aria-label={`Подробнее для ${domain.name}`}
          onClick={() => onInstructions({ domain, status })}>Подробнее</Button>
      )}
    </div>
  )
}

function DnsRecordRow({ label, address, onCopy, copyLabel = 'Скопировать IP-адрес' }) {
  return <div className="sites-instructions-row">
    <span className="sites-instructions-label">{label}</span>
    <span className="sites-instructions-leader" aria-hidden="true" />
    <span className="sites-instructions-value">
      <span className="sites-instructions-ip" title={address}>{address}</span>
      <Tooltip content={copyLabel}>
        {id => <IconButton size={24} className="sites-instructions-copy" label={copyLabel}
          aria-describedby={id} icon={<Icon name="copy-outline" size={16} />}
          onClick={() => onCopy(address)} />}
      </Tooltip>
    </span>
  </div>
}

function DomainInstructions({ domain, status, onClose, onCopyAddress }) {
  const [helpOpen, setHelpOpen] = useState(false)
  const { name, wwwOriginalAddress } = domain
  const note = domainNotes[status]
  const isDns = waitsForDns(status)
  const showAddress = isDns || status === 'cdn'
  const recordTarget = wwwOriginalAddress ? `для ${wwwDnsTargets(domain)}` : `домена ${name}`
  const instruction = isDns
    ? `Укажите защищённый IP в A-записи ${recordTarget}.${status === 'dns-aaaa' ? ' Удалите запись AAAA.' : ''}`
    : domainInstructions[status](name)

  if (helpOpen) return (
    <Dialog key="domain-help" open width={560} title="Что делать, если домену требуется действие?" onClose={onClose}
      actions={<Button variant="neutral" onClick={() => setHelpOpen(false)}>К инструкции для домена</Button>}>
      <article className="sites-domain-help">
        <section>
          <h3>Ждём DNS</h3>
          <p>Откройте DNS-настройки у провайдера домена. Укажите защищённый IP в A-записях для адресов из инструкции. Если указан только www, обновите только его запись. Удалите AAAA-запись, если об этом сказано в инструкции.</p>
          <p>DNS обычно обновляется за 24 часа. Статус домена изменится автоматически.</p>
          <Link href="https://timeweb.com/ru/docs/virtualnyj-hosting/zaschita-ot-ddos/zashchita-ot-ddos-atak/" target="_blank" rel="noopener noreferrer">Защита от DDoS-атак в справке Timeweb</Link>
        </section>
        <section>
          <h3>Требуется действие</h3>
          <p>Если нужно разрешить Let’s Encrypt, укажите issue «letsencrypt.org» в CAA-записи. Если сайт работает через сторонний CDN, укажите защищённый IP как адрес исходного сервера в настройках CDN.</p>
          <Link href="https://timeweb.com/ru/docs/domeny/resursnye-zapisi-domena-dns-zapisi/nastrojka-dns-zapisej/caa/" target="_blank" rel="noopener noreferrer">Настройка CAA-записи в справке Timeweb</Link>
        </section>
        <section>
          <h3>Сертификат SSL или ошибка подключения</h3>
          <p>Если платный сертификат истёк, продлите его или купите новый. Если сертификат не подключён, бесплатный SSL не продлился или защита не подключилась, обратитесь в поддержку.</p>
        </section>
      </article>
    </Dialog>
  )

  return (
    <Dialog
      open
      title={note.instructionsTitle ?? note.text}
      illustration={<img src={asset('domain-settings', 'png')} alt="" />}
      description={`${instruction} ${status !== 'cdn' ? 'DNS обычно обновляется за 24 часа. ' : ''}Статус изменится автоматически.`}
      onClose={onClose}
      actions={<Button variant="outline" onClick={() => setHelpOpen(true)}>Перейти к документации</Button>}
    >
      {showAddress && (
        <Surface level="panel" className="sites-instructions-address">
          <DnsRecordRow label="IP" address={demoDnsAddress} onCopy={onCopyAddress} />
        </Surface>
      )}
    </Dialog>
  )
}

function AttackMark({ summary = false }) {
  const content = summary ? 'Среди привязанных доменов есть атакованные' : 'На этот домен идёт DDoS-атака'
  return <Tooltip className="sites-attack-mark" placement="top" content={content} pressable={!summary}>
    {id => <span className="sites-attack-icon" role="img" aria-label="Атака" aria-describedby={id}
      tabIndex={summary ? undefined : 0}>
      <Icon name="alert-outline" size={16} />
    </span>}
  </Tooltip>
}

function DomainRestoreInstructions({ domains, onCopy, showDomainNames }) {
  if (!domains.length) return null

  return <Surface as="ul" level="panel" className="sites-restore-instructions" aria-label="Настройки после отключения защиты">
    {domains.map(({ domain, pendingDns }) => {
      const records = domain.externalCdn
        ? [{ label: 'Укажите IP в CDN', type: 'IP', address: demoOriginalAddress }]
        : [
          { label: 'Верните A', type: 'A', address: demoOriginalAddress },
          ...(domain.originalIpv6 ? [{ label: 'Верните AAAA', type: 'AAAA', address: domain.originalIpv6 }] : []),
          ...(domain.wwwOriginalAddress && !pendingDns ? [{ label: 'Верните A для www', type: 'A (www)', address: domain.wwwOriginalAddress }] : []),
        ]
      return <li key={domain.name}>
        {showDomainNames && <strong>{domain.name}</strong>}
        {records.map(({ label, type, address }) => (
          <DnsRecordRow key={type} label={label} address={address}
            copyLabel={`Скопировать ${type} для ${domain.name}`} onCopy={onCopy} />
        ))}
      </li>
    })}
  </Surface>
}

function NetworkProtection({ screenState, compact, preset, statuses, setStatuses, attackedDomains, active,
  requestedAttackDomains, onAttackRequestHandled, availableBalance, onDebitBalance }) {
  const [selected, setSelected] = useState(() => new Set(preset.editingDomains
    ? Object.keys(preset.statuses).filter(name => name !== preset.removedDomain)
    : preset.domains.filter(domain => !domain.parentDomain && domain.name !== 'myreviews.ru')
      .slice(0, preset.selected).map(domain => domain.name)))
  const [editingDomains, setEditingDomains] = useState(preset.editingDomains)
  const [extending, setExtending] = useState(false)
  const [dialog, setDialog] = useState(preset.dialog ?? null)
  const [instructions, setInstructions] = useState(null)
  const [payment, setPayment] = useState(null)
  const [dismissedFailures, setDismissedFailures] = useState([])
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
  const showFailure = failedDomains.some(name => !dismissedFailures.includes(name))
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
  const removalNames = disconnectingService ? enrolled : removals
  const restorationDomains = preset.domains.flatMap(domain => {
    if (!removalNames.includes(domain.name)) return []
    const status = statuses[domain.name]
    const pendingDns = waitsForDns(status)
    const restoreCdn = domain.externalCdn && !pendingDns
    const restoreDns = domain.dns !== 'DNS Timeweb' &&
      (domain.apexUsesProtectedIp || isNetworkDomainProtected(status))
    return (domain.externalCdn ? restoreCdn : restoreDns) ? [{ domain, pendingDns }] : []
  })

  useEffect(() => {
    if (!active || !hasProtection || !requestedAttackDomains?.length) return
    setExtending(false)
    setFilterSpace(0)
    setSelected(current => new Set([...(editingDomains ? current : Object.keys(statuses)), ...requestedAttackDomains]))
    setPayment(null)
    setEditingDomains(true)
    onAttackRequestHandled()
    revealProtectionCheckout(document.getElementById('sites-domains-title'))
  }, [active, hasProtection, requestedAttackDomains, editingDomains, statuses, setFilterSpace, onAttackRequestHandled])

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
    setDismissedFailures(current => current.filter(name => !names.includes(name)))
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

  async function copyDnsAddress(address) {
    try {
      await navigator.clipboard.writeText(address)
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
    if (action.id === payFromBalance.id && !onDebitBalance(monthlyRate)) {
      showToast({ message: 'На балансе недостаточно средств.' })
      return false
    }
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

  function applyDomainChanges() {
    if (removals.length) setDialog('remove-domains')
    else confirmDomainChanges()
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
    if (dialog === 'remove-domains') confirmDomainChanges()
    if (dialog === 'transfer') showToast({ message: 'Демо-обращение на перенос создано.', success: true })
  }

  return (
    <>
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
        <AnimatedBlock open={showFailure || connectingDomains}>
          <div className="sites-connection-alert-content">
            {failedDomains.length > 0 && (showFailure || !connectingDomains) ? (
              <PageAlert
                title="Не удалось подключить защиту"
                description="В списке доменов отмечено, где возникла ошибка."
                tone="error"
                onDismiss={() => setDismissedFailures(failedDomains)}
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
          matchesSearch={(domain, query) => domain.name.toLowerCase().includes(query) ||
            (!domain.parentDomain && query.startsWith('www.') && `www.${domain.name.toLowerCase()}`.startsWith(query))}
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
          renderNameSuffix={({ name }) => (attackedDomains.includes(name) ||
            (preset.attackedDomains?.includes(name) && isNetworkDomainProtected(preset.statuses[name]))) && <AttackMark />}
          renderNote={(domain, status) => domainNotes[status] && (
            <DomainNote domain={domain} status={status} onInstructions={setInstructions} />
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
            notices={removingAllDomains ? [{
              id: 'remove-protection-domains', tone: 'warning', icon: 'alert',
              description: 'При удалении всех доменов услуга «Сетевая защита» отключится. Деньги за оставшиеся дни оплаченного месяца не возвращаются.',
            }] : []}
            serviceChanges={hasCheckout && !hasPaidCheckout
              ? { disabling: removingAllDomains, onApply: applyDomainChanges, onDisable: () => setDialog('remove-last-domains') }
              : undefined}
            total={monthlyRate}
            paymentDescription={extending ? 'Продление на 1 месяц' : formatDomainCount(additions.length)}
            payment={payment}
            paymentContext={JSON.stringify(extending ? enrolled : additions)}
            hasSavedCard={hasSavedCard}
            availableBalance={availableBalance}
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
        domain={instructions.domain}
        status={instructions.status}
        onClose={() => setInstructions(null)}
        onCopyAddress={copyDnsAddress}
      />}
      {(disconnectingService || dialog === 'remove-domains') && (
        <WarningDialog
          width={restorationDomains.length ? 560 : undefined}
          autoFocusClose={restorationDomains.length > 0}
          title={disconnectingService ? 'Отключить сетевую защиту?' :
            removals.length === 1 ? 'Отключить защиту домена?' : 'Отключить защиту доменов?'}
          description={[
            removingLastDomains ? 'После удаления последнего домена услуга «Сетевая защита» отключится.' :
              disconnectingService ? 'Защита будет снята сразу со всех доменов аккаунта.' :
                `Защита будет отключена для ${removals.join(', ')}.`,
            disconnectingService && 'Деньги за оставшиеся дни оплаченного месяца не возвращаются.',
          ].filter(Boolean).join(' ')}
          confirmLabel="Отключить"
          onClose={closeDialog}
        >
          <DomainRestoreInstructions domains={restorationDomains} onCopy={copyDnsAddress}
            showDomainNames={disconnectingService || removals.length > 1} />
        </WarningDialog>
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

export default function SitesSection({ tab, onTabChange, onOpenTariff, screenState, compact, attackNotice, incidentStatuses, availableBalance, onDebitBalance,
  setIncidentStatuses, requestedAttackDomains, onAttackRequestHandled }) {
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
      <HostingTrialNotice open={tab === 'network-protection' && Boolean(networkPreset.trial)} compact={compact} onPay={onOpenTariff} />
      <header className="sites-heading">
        <h1>Сайты</h1>
        <SiteTabs selected={tab} onSelect={onTabChange} statuses={tabStatuses} compact={compact} />
      </header>
      <div id="sites-panel-mine" className="sites-my-sites" role="tabpanel" aria-labelledby="sites-tab-mine" hidden={tab !== 'mine'}>
        {attackNotice && <NetworkAttackNotice {...attackNotice} onConnect={() => onTabChange('network-protection')} />}
        <MySites attackedDomains={attackNotice?.domains} renderAttackMark={summary => <AttackMark summary={summary} />} />
      </div>
      <div id="sites-panel-antivirus" className="sites-protection sites-antivirus" role="tabpanel" aria-labelledby="sites-tab-antivirus" hidden={tab !== 'antivirus'}>
        <Antivirus screenState={antivirusScreenState} compact={compact} preset={antivirusPreset} active={tab === 'antivirus'}
          plan={plan} setPlan={setPlan} statuses={antivirusStatuses} setStatuses={setAntivirusStatuses} threats={antivirusThreats} />
      </div>
      <div id="sites-panel-network-protection" className="sites-protection" role="tabpanel" aria-labelledby="sites-tab-network-protection" hidden={tab !== 'network-protection'}>
        <NetworkProtection screenState={networkScreenState} compact={compact} preset={networkPreset} active={tab === 'network-protection'}
          availableBalance={availableBalance} onDebitBalance={onDebitBalance}
          statuses={networkStatuses} setStatuses={setNetworkStatuses} attackedDomains={attackNotice?.domains ?? []}
          requestedAttackDomains={requestedAttackDomains} onAttackRequestHandled={onAttackRequestHandled} />
      </div>
    </div>
  )
}
