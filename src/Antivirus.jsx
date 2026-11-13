import { useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { HostingToastContext } from './hosting-toast.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { usePendingChanges } from './pending-changes.jsx'
import { removesAllServiceTargets } from './ServiceChanges.jsx'
import WarningDialog from './WarningDialog.jsx'
import {
  ActiveProtectionBanner, addMonths, asset, formatDate, formatPrice, plural, ProtectionAlert, ProtectionCheckout,
  ProtectionCheckoutSlot, ProtectionFaq, revealProtectionCheckout, SitesIcon, SitesTable, useSitesFilterSpace,
} from './SitesProtectionUI.jsx'
import { antivirusPlans, antivirusStatusLabels, saveAntivirus } from './antivirus-states.js'
import domainLinkIcon from './assets/dashboard/arrow-out.svg'
import walletIcon from './assets/hosting/wallet.svg'
import sitesIcon from './assets/hosting/sites.svg'
import './antivirus.css'

const assets = import.meta.glob('./assets/antivirus/*.{svg,png}', {
  eager: true, query: '?url', import: 'default',
})
const art = (name, extension = 'svg') => assets[`./assets/antivirus/${name}.${extension}`]
const planEntries = Object.entries(antivirusPlans)

const siteNouns = { one: 'сайт', few: 'сайта', many: 'сайтов' }
const formatSiteCount = count => `${count} ${siteNouns[plural.select(count)]}`
const tableHeading = 'antivirus-sites-title'
const checkoutHeading = 'antivirus-checkout-title'
const tableLabels = {
  title: 'Сайты',
  name: 'Сайт',
  details: 'Привязанные домены',
  table: 'Сайты для подключения антивируса',
  search: 'Поиск по сайтам и доменам',
  selectAll: 'Выбрать все найденные сайты',
  noResults: 'Сайты не найдены',
  filter: 'Только подключённые',
}
const features = [
  ['promo-search', 'Находит', 'в файлах и базе данных'],
  ['promo-treatment', 'Лечит', 'сам, даже если сайт уже заражён'],
  ['promo-shield', 'Не пускает снова', 'файрвол и закрытые уязвимости CMS'],
]
const questions = [
  { id: 'how', title: 'Как работает антивирус?', answer: 'Антивирус проверяет файлы сайта и ищет вредоносный код. Результаты проверки доступны в отчёте. Периодичность проверок и доступные инструменты зависят от уровня защиты.' },
  { id: 'threats', title: 'Что делать, если найдены угрозы?', answer: 'Откройте антивирус и проверьте отчёт по сайту. В нём видно, что удалось вылечить автоматически и какие файлы требуют внимания.' },
  { id: 'plans', title: 'Чем отличаются уровни?', answer: '«Лечение» проверяет и лечит файлы. «Защита» добавляет файрвол, защиту уязвимостей CMS и статистику атак. В «Полном доступе» есть редактор файлов, ручное лечение и список исключений.' },
]
const removalWarning = 'Деньги за оставшиеся дни оплаченного месяца не возвращаются.'

function AntivirusIntro({ onDetails }) {
  return (
    <section className="sites-promo antivirus-intro hosting-reveal" aria-labelledby="antivirus-intro-title">
      <div className="sites-promo-art">
        <img src={asset('protection-mobile', 'png')} alt="" />
      </div>
      <div className="sites-promo-content">
        <div className="sites-promo-copy">
          <h2 id="antivirus-intro-title">Антивирус замечает взлом раньше посетителей и поисковых систем</h2>
          <p>Проверяет сайты и лечит заражённые файлы и базы данных. Файрвол и защита уязвимостей CMS снижают риск повторного заражения.</p>
        </div>
        <ul className="sites-features">
          {features.map(([icon, title, description]) => (
            <li key={icon}>
              <SitesIcon src={art(icon)} color="icon-success" />
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ul>
      </div>
      <div className="antivirus-intro-note" hidden>
        <img src={art('promo-alert')} alt="" />
        <p>С заражением сайта каждый месяц сталкиваются около 900 наших клиентов.{' '}
          <button type="button" className="sites-text-button" onClick={onDetails}>Подробнее об услуге</button>
        </p>
      </div>
    </section>
  )
}

function AntivirusPlans({ selected, onSelect, compact }) {
  const selectedIndex = planEntries.findIndex(([id]) => id === selected)
  const [slide, setSlide] = useState(selectedIndex)
  const viewport = useRef(null)

  useLayoutEffect(() => {
    setSlide(selectedIndex)
    showSlide(selectedIndex, 'instant')
  }, [selectedIndex, compact])

  function showSlide(index, behavior) {
    const track = viewport.current
    if (track.scrollWidth <= track.clientWidth) return
    const card = track.firstElementChild.children[index]
    const left = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2
    track.scrollTo({ left, behavior })
  }

  function syncSlide(event) {
    const track = event.currentTarget
    if (track.scrollWidth <= track.clientWidth) return
    const cards = track.firstElementChild.children
    const step = cards[1].offsetLeft - cards[0].offsetLeft
    setSlide(Math.round(track.scrollLeft / step))
  }

  function selectSlide(index) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    showSlide(index, reducedMotion ? 'instant' : 'smooth')
  }

  return (
    <section className="antivirus-plans hosting-reveal" aria-labelledby="antivirus-plans-title">
      <div className="sites-domain-heading">
        <h2 id="antivirus-plans-title" tabIndex={-1}>Уровни защиты</h2>
      </div>
      <div className="antivirus-plan-viewport" ref={viewport} onScroll={syncSlide}>
        <div className="antivirus-plan-grid" role="radiogroup" aria-labelledby="antivirus-plans-title">
          {planEntries.map(([id, plan], index) => (
            <label className="antivirus-plan" key={id}>
              <div className="antivirus-plan-summary">
                <span className="antivirus-plan-heading">
                  <input
                    type="radio"
                    name="antivirus-plan"
                    aria-label={plan.title}
                    value={id}
                    checked={id === selected}
                    onFocus={event => {
                      if (event.currentTarget.matches(':focus-visible')) showSlide(index, 'instant')
                    }}
                    onChange={() => onSelect(id)}
                    style={{ '--antivirus-radio': `url("${art(id === selected ? 'radio-checked' : 'radio')}")` }}
                  />
                  <strong>{plan.title}</strong>
                </span>
                {id === 'protection' && <span className="antivirus-recommendation"><img src={art('plan-recommended')} alt="" />Рекомендуем</span>}
                <p><strong className="antivirus-rate">{formatPrice(plan.rate)}</strong> / мес. за сайт</p>
                <p className="antivirus-plan-description">{plan.description}</p>
              </div>
              <div className="antivirus-plan-details">
                <p>{id === 'treatment' ? 'Что входит' : 'Всё из «Лечения», плюс'}</p>
                <ul>
                  {plan.features.map(([title, description]) => (
                    <li key={title}>
                      <SitesIcon src={art('plan-feature')} color="link-text" />
                      <div>{title}<p>{description}</p></div>
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="antivirus-plan-dots" role="group" aria-label="Переключение карточек уровней">
        {planEntries.map(([id, plan], index) => (
          <button key={id} type="button" aria-label={`Показать уровень «${plan.title}»`} aria-current={slide === index || undefined} onClick={() => selectSlide(index)}>
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
}

function DesktopDomain({ name }) {
  const tooltipId = useId()
  const [tooltipDismissed, setTooltipDismissed] = useState(false)
  return (
    <div className="antivirus-domain-entry">
      <span title={name}>{name}</span>
      <a
        className="antivirus-domain-link"
        href={`https://${name}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Открыть ${name} в новой вкладке`}
        aria-describedby={tooltipId}
        onMouseLeave={() => setTooltipDismissed(false)}
        onBlur={() => setTooltipDismissed(false)}
        onKeyDown={event => {
          if (event.key === 'Escape') setTooltipDismissed(true)
        }}
      >
        <SitesIcon src={domainLinkIcon} color="icon-primary" />
        <span id={tooltipId} className="antivirus-domain-tooltip" role="tooltip" hidden={tooltipDismissed}>Перейти на сайт</span>
      </a>
    </div>
  )
}

function LinkedDomains({ site, mobile }) {
  const listId = useId()
  const list = useRef(null)
  const moreButton = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [first, ...others] = site.domains
  const more = others.length > 0 ? `и ещё +${others.length}` : null
  const label = first ?? 'Нет привязанных доменов'

  function expandDomains(event) {
    setExpanded(true)
    if (event.detail === 0) {
      requestAnimationFrame(() => list.current?.querySelector('a')?.focus({ preventScroll: true }))
    }
  }

  if (mobile) {
    return (
      <div className="antivirus-linked-domains antivirus-domains-summary">
        <span title={first}>{label}</span>
        {more && <span className="antivirus-domains-count">{more}</span>}
      </div>
    )
  }

  if (!more) {
    return <div className="antivirus-linked-domains">{first ? <DesktopDomain name={first} /> : label}</div>
  }

  return (
    <div className="antivirus-linked-domains antivirus-domain-disclosure" data-expanded={expanded}>
      <div className="antivirus-domains-summary">
        <DesktopDomain name={first} />
        <button
          type="button"
          ref={moreButton}
          className="antivirus-domains-trigger"
          aria-label={`${more} · показать домены сайта ${site.name}`}
          aria-controls={listId}
          aria-expanded={expanded}
          hidden={expanded}
          onClick={expandDomains}
        >{more}</button>
      </div>
      <AnimatedBlock open={expanded}>
        <div id={listId} ref={list} onClick={event => event.stopPropagation()}>
          <ul className="antivirus-domains-list">
            {others.map(name => <li key={name}><DesktopDomain name={name} /></li>)}
          </ul>
          <button type="button" className="antivirus-domains-collapse" onClick={() => {
            setExpanded(false)
            requestAnimationFrame(() => moreButton.current?.focus({ preventScroll: true }))
          }}>Свернуть список</button>
        </div>
      </AnimatedBlock>
    </div>
  )
}

function AntivirusBanner({ plan, nextPlan, count, threats, checking, missing, compact, paidThrough, renew, showRenewSwitch, editing, onCancelEdit, onOpen, onAction }) {
  const level = antivirusPlans[plan]
  const schedule = nextPlan && `С ${formatDate(nextPlan.startsAt)} — «${antivirusPlans[nextPlan.id].title}»`
  const caption = renew ? `Автопродление ${formatDate(paidThrough)}` : `Оплачено до ${formatDate(paidThrough)} · автопродление выключено`
  const status = threats ? 'Обнаружены угрозы' : checking ? 'Проверяем сайты' : missing ? 'Требуется действие' : 'Угроз не обнаружено'

  return (
    <ActiveProtectionBanner
      className="antivirus-active"
      threats={threats}
      headingId="antivirus-active-title"
      eyebrow="Подключён уровень"
      title={<>{level.title}<span className="sites-desktop-copy"> · </span><br className="sites-mobile-copy" />{formatPrice(level.rate)} / мес. за 1 сайт</>}
      status={<>{threats && <img src={art('threat-alert')} alt="" />}{status}</>}
      background={threats ? art('threat-background', 'png') : compact ? art('active-background-mobile', 'png') : asset('active-background', 'png')}
      illustration={threats ? art('threat-shield', 'png') : asset('active-shield', 'png')}
      renew={renew}
      showRenewSwitch={showRenewSwitch}
      onToggleRenew={() => onAction('renew')}
      editing={editing}
      iconOnly={compact || !renew || showRenewSwitch}
      onSettings={editing ? onCancelEdit : () => onAction('settings')}
      primaryAction={
        <button type="button" className="sites-active-pay hosting-pressable" onClick={onOpen}>
          <img src={art(threats ? 'open-antivirus-dark' : 'open-antivirus')} alt="" />Открыть антивирус
        </button>
      }
      paymentAction={!renew && !compact && (
        <button type="button" className="sites-active-manual-pay" onClick={() => onAction('extend')}>
          <SitesIcon src={walletIcon} color="light" />Оплатить
        </button>
      )}
      menuLabel="Управление антивирусом"
      menuItems={close => <>
        <button type="button" onClick={() => { close(); onAction('sites') }}>
          <SitesIcon src={art('edit-sites')} color="icon-secondary" />Изменить список сайтов
        </button>
        <button type="button" onClick={() => { close(); onAction('plan') }}>
          <SitesIcon src={art('edit-plan')} color="icon-secondary" />Изменить тариф
        </button>
        {!renew && (
          <button type="button" onClick={() => { close(); onAction('extend') }}>
            <SitesIcon src={walletIcon} color="icon-secondary" />Оплатить
          </button>
        )}
        <button type="button" onClick={() => { close(); onAction('renew') }}>
          <SitesIcon src={art('renewal')} color="icon-secondary" />
          {renew ? 'Выключить' : 'Включить'} автопродление
        </button>
        <button type="button" className="antivirus-disable-action" onClick={() => { close(); onAction('disable') }}>
          <SitesIcon src={art('disable')} color="plan-danger" />Отключить антивирус
        </button>
      </>}
      caption={<>{formatSiteCount(count)} · {formatPrice(level.rate * count)} / мес. · {caption}{schedule && ` · ${schedule}`}</>}
    />
  )
}

function AntivirusReport({ statuses, onClose }) {
  const dialog = useRef(null)

  useEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog className="hosting-dialog sites-dialog antivirus-report" ref={dialog} aria-labelledby="antivirus-report-title" onClose={onClose}>
      <h3 className="hosting-dialog-title" id="antivirus-report-title">Отчёт антивируса</h3>
      <p>Статусы проверок в демо-режиме.</p>
      <ul>
        {Object.entries(statuses).map(([name, status]) => (
          <li className="sites-domain-row" data-status={status} key={name}>
            <span>{name}</span><span className="sites-domain-status"><span className="sites-domain-badge">{antivirusStatusLabels[status]}</span></span>
          </li>
        ))}
      </ul>
      <div className="sites-payment-buttons">
        <button type="button" className="sites-payment-cancel" onClick={() => dialog.current.close()}>Закрыть</button>
      </div>
    </dialog>
  )
}

const day = 86_400_000

function getProratedAmount(rate, paidThrough) {
  const end = paidThrough.getTime()
  const previous = new Date(end)
  previous.setUTCDate(1)
  previous.setUTCMonth(previous.getUTCMonth() - 1)
  const lastDay = new Date(Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth() + 1, 0)).getUTCDate()
  previous.setUTCDate(Math.min(paidThrough.getUTCDate(), lastDay))
  const days = Math.round((end - previous.getTime()) / day)
  const remaining = Math.min(days, Math.max(0, Math.ceil((end - Date.now()) / day)))
  return Math.round(rate * remaining * 100 / days) / 100
}

function matchesSearch(site, query) {
  return [site.name, ...site.domains].some(name => name.toLowerCase().includes(query))
}

export default function Antivirus({ screenState, compact, dark, preset, plan, setPlan, statuses, setStatuses, threats, active }) {
  const { sites } = preset
  const [nextPlan, setNextPlan] = useState(preset.nextPlan)
  const [draftPlan, setDraftPlan] = useState(preset.draftPlan ?? preset.nextPlan?.id ?? preset.plan ?? 'protection')
  const [mode, setMode] = useState(preset.mode ?? null)
  const [selected, setSelected] = useState(() => new Set(preset.selected))
  const [renew, setRenew] = useState(preset.renew)
  const [showRenewSwitch, setShowRenewSwitch] = useState(screenState !== null || !preset.renew)
  const [paidThrough, setPaidThrough] = useState(() => preset.plan ? new Date(preset.paidThrough ?? addMonths(new Date())) : null)
  const [hasSavedCard, setHasSavedCard] = useState(preset.hasSavedCard)
  const [persist, setPersist] = useState(screenState === null || screenState === 'initial')
  const [payment, setPayment] = useState(null)
  const [dialog, setDialog] = useState(preset.dialog ?? null)
  const [missingSite, setMissingSite] = useState(null)
  const [suspicious, setSuspicious] = useState(Boolean(preset.suspicious))
  const timers = useRef(new Map())
  const showToast = useContext(HostingToastContext)
  const enrolled = Object.keys(statuses)
  const editingSites = mode === 'sites' || mode === 'settings'
  const editingPlan = mode === 'plan' || mode === 'settings'
  const extending = mode === 'extend'
  const additions = [...selected].filter(name => !statuses[name])
  const removals = editingSites ? enrolled.filter(name => !selected.has(name)) : []
  const disabling = removesAllServiceTargets(selected, removals)
  const changedPlan = editingPlan && draftPlan !== (nextPlan?.id ?? plan)
  const hasCheckout = Boolean(sites.length && (!plan ? selected.size : disabling || extending || additions.length || removals.length || changedPlan))
  const showEmptyCheckout = sites.length > 0 && (!plan || editingSites || editingPlan)
  usePendingChanges(active && hasCheckout, {
    title: extending ? 'Прервать продление антивируса?' : plan ? 'Прервать изменение антивируса?' : 'Прервать подключение антивируса?',
    description: extending ? 'Продление антивируса не будет оплачено.' : 'Выбранный уровень защиты и изменения списка сайтов будут сброшены.',
    revealCheckout: () => revealProtectionCheckout(document.getElementById(checkoutHeading)),
  }, () => closeCheckout({ focus: null }))
  const { filterSpace, setFilterSpace, scrollSpacer } = useSitesFilterSpace()
  const currentPlan = antivirusPlans[plan]
  const target = !plan || editingPlan ? antivirusPlans[draftPlan] : extending && nextPlan ? antivirusPlans[nextPlan.id] : currentPlan
  const count = !plan || editingSites ? selected.size : enrolled.length
  const monthPrice = target.rate * count
  const upgrading = changedPlan && target.rate > currentPlan.rate
  const downgrading = changedPlan && target.rate < currentPlan.rate
  const addedSitesPrice = additions.length * (downgrading ? currentPlan.rate : target.rate)
  const upgradePrice = upgrading ? (enrolled.length - removals.length) * (target.rate - currentPlan.rate) : 0
  const total = !hasCheckout || disabling ? 0 : !plan || extending
    ? monthPrice
    : getProratedAmount(upgradePrice + addedSitesPrice, paidThrough)
  const title = extending ? 'Продление антивируса' : compact && !plan ? 'Подключение' : 'Что изменится'
  const itemTitle = `Антивирус «${target.title}»`
  const itemDescription = disabling ? 'Отключение для всех сайтов аккаунта' : extending ? 'Продление на 1 месяц' : formatSiteCount(count)
  const actionDescription = downgrading
    ? `С ${formatDate(paidThrough)} — ${formatPrice(monthPrice)} в месяц.`
    : plan && !disabling && !extending && total > 0
      ? `Доплата за текущий период. Далее ${formatPrice(monthPrice)} в месяц.`
      : undefined

  useEffect(() => {
    const checks = timers.current
    return () => checks.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!persist) return
    const savedStatuses = Object.fromEntries(Object.entries(statuses)
      .map(([name, status]) => [name, timers.current.has(name) ? 'protected' : status]))
    saveAntivirus({ sites, statuses: savedStatuses, plan, nextPlan, paidThrough, renew, hasSavedCard })
  }, [persist, sites, statuses, plan, nextPlan, paidThrough, renew, hasSavedCard])

  function closeCheckout({ focus = tableHeading } = {}) {
    setMode(null)
    setSelected(new Set())
    setDraftPlan(nextPlan?.id ?? plan ?? 'protection')
    setPayment(null)
    if (focus) document.getElementById(focus)?.focus({ preventScroll: true })
  }

  function chooseMode(next) {
    if (next === 'renew') {
      if (renew) setDialog('renew')
      else {
        setPersist(true)
        setRenew(true)
        setShowRenewSwitch(true)
        if (extending) closeCheckout({ focus: 'antivirus-active-title' })
      }
      return
    }
    if (next === 'disable') {
      setDialog('disable')
      return
    }
    if (mode === next && next === 'extend') {
      revealProtectionCheckout(document.getElementById(checkoutHeading))
      return
    }

    setFilterSpace(0)
    setPayment(null)
    setSelected(new Set(next === 'sites' || next === 'settings' ? enrolled : []))
    setDraftPlan(nextPlan?.id ?? plan)
    setMode(next)
    if (next === 'sites') document.getElementById(tableHeading)?.focus()
    if (next === 'plan') requestAnimationFrame(() => document.getElementById('antivirus-plans-title')?.focus())
  }

  function selectSites(next) {
    setSelected(next)
    setPayment(null)
  }

  function connectSites(names) {
    if (!names.length) return
    setStatuses(current => ({ ...current, ...Object.fromEntries(names.map(name => [name, 'connecting'])) }))
    for (const name of names) {
      clearTimeout(timers.current.get(name))
      timers.current.set(name, setTimeout(() => {
        timers.current.delete(name)
        setStatuses(current => ({ ...current, [name]: 'protected' }))
      }, 1800))
    }
  }

  function removeSites(names) {
    if (!names.length) return
    for (const name of names) {
      clearTimeout(timers.current.get(name))
      timers.current.delete(name)
    }
    setStatuses(current => Object.fromEntries(Object.entries(current).filter(([name]) => !names.includes(name))))
  }

  function applyChanges({ autoRenew, saveCard } = {}) {
    setPersist(true)
    if (saveCard) setHasSavedCard(true)
    if (!plan) {
      setPlan(draftPlan)
      setPaidThrough(addMonths(new Date()))
      setRenew(autoRenew)
      setShowRenewSwitch(true)
      setSuspicious(false)
      connectSites(additions)
    } else if (extending) {
      setPaidThrough(current => addMonths(new Date(Math.max(current.getTime(), Date.now()))))
    } else {
      if (changedPlan) {
        if (downgrading) setNextPlan({ id: draftPlan, startsAt: nextPlan?.startsAt ?? paidThrough.getTime() })
        else {
          setPlan(draftPlan)
          setNextPlan(null)
        }
      }
      removeSites(removals)
      connectSites(additions)
    }
    closeCheckout({ focus: extending || editingPlan ? 'antivirus-active-title' : tableHeading })
  }

  function startPayment(action, options) {
    if (!hasCheckout || !total || payment) return false
    if (action.document) setPayment({ action, total, options, step: 'confirm' })
    else applyChanges(options)
    return true
  }

  function confirmPayment() {
    if (payment.step === 'confirm') setPayment({ ...payment, step: 'document' })
    else {
      applyChanges(payment.options)
      showToast({ message: 'Успешно оплачено', success: true })
    }
  }

  function requestApply() {
    applyChanges()
    showToast({ message: removals.length ? 'Список сайтов изменён.' : downgrading ? 'Уровень изменится в следующем периоде.' : 'Изменения применены.', success: true })
  }

  function disableAntivirus() {
    setPersist(true)
    removeSites(enrolled)
    setPlan(null)
    setNextPlan(null)
    setPaidThrough(null)
    setRenew(false)
    closeCheckout()
    setDraftPlan('protection')
    showToast({ message: 'Антивирус отключён.', success: true })
  }

  function closeDialog(confirmed) {
    setDialog(null)
    if (!confirmed) return
    if (dialog === 'disable') {
      disableAntivirus()
    } else if (dialog === 'renew') {
      setPersist(true)
      setRenew(false)
      setShowRenewSwitch(true)
    } else if (dialog === 'missing') {
      setPersist(true)
      connectSites([missingSite])
    }
  }

  const item = {
    id: 'antivirus',
    title: disabling ? 'Антивирус' : itemTitle,
    description: itemDescription,
    amount: disabling ? undefined : `${formatPrice(monthPrice)} / мес.`,
    removable: true,
  }
  const removalNotice = removals.length && !disabling ? [{
    id: 'remove-antivirus-sites',
    tone: 'warning',
    icon: 'alert',
    description: `Антивирус отключится для сайтов: ${removals.join(', ')}.`,
  }] : []
  const checking = Object.values(statuses).includes('connecting')
  const missing = Object.values(statuses).includes('missing')
  const confirmation = {
    disable: ['Отключить антивирус?', `Защита снимется со всех сайтов сразу. ${removalWarning}`, 'Отключить'],
    renew: ['Выключить автопродление?', paidThrough && `Антивирус будет работать до ${formatDate(paidThrough)}. Следующий период можно оплатить вручную.`, 'Выключить'],
    missing: ['Файл связи не найден', `Антивирус не нашёл файл связи сайта «${missingSite}». В демо можно повторить проверку.`, 'Имитировать проверку'],
    details: ['Как работает антивирус?', questions[0].answer],
  }[dialog]

  return (
    <>
      {suspicious && !plan && (
        <ProtectionAlert title="Фиксируем подозрительную активность" description="Подключите антивирус, чтобы проверить файлы сайтов."
          action={{ label: 'Выбрать уровень защиты', onClick: () => revealProtectionCheckout(document.getElementById('antivirus-plans-title')) }}
          onDismiss={() => setSuspicious(false)} />
      )}
      {plan ? (
        <AntivirusBanner {...{ plan, nextPlan, threats, checking, missing, compact, paidThrough, renew, showRenewSwitch }}
          count={enrolled.length} editing={editingSites || editingPlan}
          onCancelEdit={() => closeCheckout({ focus: null })}
          onOpen={() => setDialog('report')} onAction={chooseMode} />
      ) : <AntivirusIntro onDetails={() => setDialog('details')} />}
      {sites.length > 0 && (!plan || editingPlan) && (
        <AntivirusPlans selected={draftPlan} compact={compact} onSelect={id => {
          setDraftPlan(id)
          setPayment(null)
        }} />
      )}
      <SitesTable
        compact={compact}
        dark={dark}
        labels={tableLabels}
        headingId={tableHeading}
        domains={sites}
        empty={{ title: 'На аккаунте пока нет сайтов', description: 'Добавьте сайт, чтобы подключить антивирус.', icon: sitesIcon, canAddSite: true }}
        statuses={statuses}
        statusLabels={antivirusStatusLabels}
        selected={selected}
        hasProtection={Boolean(plan)}
        selecting={!plan || editingSites}
        filterSpace={filterSpace}
        onFilterSpaceChange={setFilterSpace}
        onSelection={selectSites}
        matchesSearch={matchesSearch}
        isProtected={Boolean}
        renderDetails={(site, mobile) => <LinkedDomains site={site} mobile={mobile} />}
        renderNote={(site, status) => status === 'missing' && (
          <div className="sites-domain-note">
            <button type="button" className="sites-text-button" aria-label={`Как сделать для ${site.name}`} onClick={() => {
              setMissingSite(site.name)
              setDialog('missing')
            }}>Как сделать</button>
          </div>
        )}
      />
      <ProtectionCheckoutSlot open={hasCheckout || showEmptyCheckout}>
        {(showEmptyCheckout || hasCheckout) && (
          <ProtectionCheckout
            key={mode ?? 'connect'}
            title={hasCheckout || plan ? title : 'Оплата'}
            empty={hasCheckout ? undefined : plan ? {
              title: 'Внесите изменения',
              description: 'Здесь появятся изменения списка сайтов или уровня защиты.',
            } : {
              title: 'Выберите сайты',
              description: 'Здесь появятся выбранные сайты и стоимость подключения антивируса.',
            }}
            headingId={checkoutHeading}
            items={[item]}
            notices={disabling ? [{ id: 'disable-antivirus', tone: 'warning', icon: 'alert', description: `После отключения антивирус перестанет проверять сайты. ${removalWarning}` }] : removalNotice}
            serviceChanges={hasCheckout && total === 0 ? { disabling, onApply: requestApply, onDisable: disableAntivirus } : undefined}
            total={total}
            totalLabel={plan && !extending ? 'К доплате' : 'К оплате'}
            actionDescription={actionDescription}
            paymentDescription={itemDescription}
            payment={payment}
            paymentContext={JSON.stringify([mode, draftPlan, [...selected], total])}
            hasSavedCard={hasSavedCard}
            reveal={extending}
            allowAutoRenew={!plan}
            onStart={startPayment}
            onConfirm={confirmPayment}
            onCancel={() => setPayment(null)}
            onClose={() => closeCheckout()}
            canDiscard={hasCheckout || editingSites || editingPlan}
            onUnlinkCard={() => { setHasSavedCard(false); setPersist(true) }}
          />
        )}
      </ProtectionCheckoutSlot>
      <ProtectionFaq questions={questions} />
      {scrollSpacer}
      {confirmation && <WarningDialog title={confirmation[0]} description={confirmation[1]} confirmLabel={confirmation[2]} onClose={closeDialog} />}
      {dialog === 'report' && <AntivirusReport statuses={statuses} onClose={() => setDialog(null)} />}
    </>
  )
}
