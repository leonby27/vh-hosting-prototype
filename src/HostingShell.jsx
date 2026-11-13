import { Fragment, useEffect, useRef, useState } from 'react'
import colors from '../colors.json'
import typography from '../typography.json'
import logo from './assets/hosting/logo.svg'
import darkLogo from './assets/hosting/logo-dark.svg'
import mobileLogo from './assets/hosting/mobile-logo.svg?no-inline'
import mobileBalanceAdd from './assets/hosting/mobile-balance-add.svg?no-inline'
import { HostingToast, HostingToastContext } from './hosting-toast.jsx'
import { DropdownPanel } from './hosting-motion.jsx'
import LeaveCheckoutDialog from './LeaveCheckoutDialog.jsx'
import { PendingChangesContext } from './pending-changes.jsx'
import './hosting-shell.css'

const icons = {
  ...import.meta.glob(['./assets/hosting/*.svg', '!./assets/hosting/mobile-*.svg'], { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('./assets/hosting/mobile-{dashboard,sites,domains,profile,more}.svg', { eager: true, query: '?url&no-inline', import: 'default' }),
}

const moreIcons = import.meta.glob('./assets/hosting/mobile-more-*.svg', { eager: true, query: '?url&no-inline', import: 'default' })

const sidebarGroups = [
  [
    ['dashboard', 'Дашборд'],
    ['domains', 'Домены и SSL'],
    ['sites', 'Сайты'],
    ['files', 'Файловый менеджер'],
    ['databases', 'Базы данных'],
    ['mail', 'Почта'],
    ['crontab', 'Crontab'],
    ['backups', 'Резервные копии'],
  ],
  [
    ['ide', 'IDE'],
    ['api', 'API и AI-агенты'],
    ['ssh', 'SSH-консоль'],
    ['monitoring', 'Мониторинг нагрузки'],
    ['logs', 'Логи'],
    ['users', 'Пользователи ПУ/FTP'],
  ],
  [
    ['payment', 'Оплата'],
    ['plan', 'Настройки тарифа'],
    ['balance', 'Баланс и платежи'],
  ],
  [
    ['partner', 'Стать партнёром'],
    ['vps', 'VDS/VPS Серверы'],
    ['migration', 'Перенести к нам'],
    ['knowledge', 'База знаний'],
  ],
]

const quickLinks = [['Новости', 3, 'news'], ['Есть идея', 100, 'idea'], ['Пригласи друга', null, 'invite']]
const moreGroups = [
  sidebarGroups[0].slice(3),
  sidebarGroups[1].filter(([icon]) => icon !== 'ssh'),
  sidebarGroups[2],
  sidebarGroups[3],
  quickLinks.map(([label, , icon]) => [icon, label]),
]
const mobileSections = [
  ['mobile-dashboard', 'Дашборд', 'Дашборд'],
  ['mobile-sites', 'Сайты', 'Сайты'],
  ['mobile-domains', 'Домены', 'Домены и SSL'],
]
const supportLinks = [
  ['support-message', 'Написать в поддержку'],
  ['support-telegram', 'Написать в Telegram'],
  ['support-help', 'База знаний'],
  ['support-phone', '8 (800) 700-1081'],
  ['support-tickets', 'Тикеты'],
]
const demoAccounts = [
  ['demo002', 'Партнёрский аккаунт'],
  ['demo003', 'Тестовый аккаунт'],
  ['demo004', 'Личный аккаунт'],
  ['demo005', 'Cloud'],
  ['demo006', 'Почтовый тариф'],
]
const { collection } = colors
const menuText = typography.textStyles.find(style => style.name === 'Text Small 14px/Medium')

function themeTokens(modeId, dark = false) {
  const palette = new Map(collection.variables.map(variable => [variable.name, variable.valuesByMode[modeId]?.hex]))
  return {
    '--hosting-header': palette.get('Base/Header'),
    '--hosting-background': palette.get('Base/Background'),
    '--hosting-preview-backdrop': palette.get('Base/Under Background'),
    '--hosting-surface': palette.get('Base/On Background'),
    '--hosting-text': palette.get('Text/Secondary Dark'),
    '--hosting-muted': palette.get('Icons/Secondary'),
    '--hosting-title': palette.get('Text/Primary'),
    '--hosting-link': palette.get('Base/Accent'),
    '--hosting-accent-light': palette.get('Base/Accent Light'),
    '--hosting-link-text': palette.get(dark ? 'Base/Accent Bright Hover' : 'Text/Accent'),
    '--hosting-line': palette.get('Base/Line/Default Line'),
    '--hosting-list-back': palette.get('List/Back'),
    '--hosting-list-hover': palette.get('List/Item Hover'),
    '--hosting-chip': palette.get(dark ? 'Base/Surface 3' : 'Base/Surface 2'),
    '--hosting-menu-surface': palette.get(dark ? 'Base/Surface 2' : 'Base/On Background'),
    '--hosting-tooltip-back': palette.get('Tooltip/Back'),
    '--hosting-tooltip-content': palette.get('Tooltip/Content'),
    '--hosting-switch-off': palette.get('Form Controls/Switcher/Inactive'),
    '--hosting-switch-on': palette.get('Form Controls/Switcher/Active'),
    '--hosting-switch-thumb': palette.get('Form Controls/Switcher/Inverse'),
    '--hosting-focus': palette.get('Base/Accent Bright'),
    '--hosting-top-up-year-border': palette.get('Mono/Green'),
  '--hosting-surface-3': palette.get('Base/Surface 3'),
    '--hosting-card-surface': palette.get('Base/Surface'),
    '--hosting-on-surface': palette.get('Base/On Surface'),
    '--hosting-segment-surface': palette.get(dark ? 'Base/Surface' : 'Base/Under Background'),
    '--hosting-secondary': palette.get(dark ? 'Text/Secondary Dark' : 'Text/Secondary'),
    '--hosting-icon-primary': palette.get('Icons/Primary'),
    '--hosting-icon-secondary-light': palette.get('Icons/Secondary Light'),
    '--hosting-icon-secondary': palette.get(dark ? 'Icons/Secondary Dark' : 'Icons/Secondary'),
    '--hosting-icon-info': palette.get('Icons/Secondary Dark'),
    '--hosting-icon-success': palette.get('Icons/Green'),
    '--hosting-neutral-back': palette.get('Buttons/Neutral/Back'),
    '--hosting-neutral-hover': palette.get('Buttons/Neutral/Back Hover'),
    '--hosting-neutral-border': palette.get('Buttons/Neutral/Border'),
    '--hosting-primary-back': palette.get(dark ? 'Buttons/Primary Blue/Back Hover' : 'Buttons/Primary Blue/Back'),
    '--hosting-primary-hover': palette.get('Buttons/Primary Blue/Back Hover'),
    '--hosting-plan-info-back': palette.get('Alerts/Blue Back'),
    '--hosting-plan-success-back': palette.get('Alerts/Green Back'),
    '--hosting-plan-warning-back': palette.get('Mono/Orange 10'),
    '--hosting-alert-error-back': palette.get('Alerts/Red Back'),
    '--hosting-warning-light': palette.get('Base/Warning Light'),
    '--hosting-warning-text': palette.get('Text/Warning'),
    '--hosting-warning-text-emphasis': palette.get(dark ? 'Text/Warning Hover' : 'Text/Warning'),
    '--hosting-plan-warning': palette.get('Text/Orange Hover'),
    '--hosting-plan-credit': palette.get(dark ? 'Text/Green Hover' : 'Text/Green'),
    '--hosting-plan-branch-line': palette.get('Base/Line/Dark'),
    '--hosting-plan-leader-line': palette.get('Base/Line/Extra Dark'),
    '--hosting-plan-outline-border': palette.get('Buttons/Outline Blue/Border'),
    '--hosting-plan-outline-back': palette.get('Buttons/Outline Blue/Back'),
    '--hosting-plan-outline-hover': palette.get('Buttons/Outline Blue/Back Hover'),
    '--hosting-plan-selected-back': palette.get('Base/Accent Light 70%'),
    '--hosting-plan-selected-line': palette.get('Base/Line/Active'),
    '--hosting-plan-icon-orange': palette.get('Icons/Orange'),
    '--hosting-plan-icon-pink': palette.get('Mono/Pink'),
    '--hosting-plan-danger': palette.get(dark ? 'Buttons/Primary Red/Back Hover' : 'Buttons/Primary Red/Back'),
    '--hosting-plan-danger-hover': palette.get('Buttons/Primary Red/Back Hover'),
    '--hosting-plan-error-text': palette.get(dark ? 'Buttons/Primary Red/Back' : 'Buttons/Primary Red/Back Hover'),
    '--hosting-network-green': palette.get('Buttons/Primary Green/Back'),
    '--hosting-network-green-hover': palette.get('Buttons/Primary Green/Back Hover'),
    '--hosting-network-warning': palette.get(dark ? 'Text/Orange' : 'Text/Orange Hover'),
    '--hosting-network-progress-back': palette.get('Base/Accent Light'),
    '--hosting-font': `"${menuText.fontName.family}", Inter, system-ui, sans-serif`,
    '--hosting-font-size': `${menuText.fontSize}px`,
    '--hosting-line-height': `${menuText.lineHeight.value}px`,
  }
}

const lightTokens = themeTokens(collection.defaultModeId)
const darkTokens = themeTokens(collection.modes.find(mode => mode.name === 'Dark').modeId, true)
const themeStorageKey = 'vh-hosting-theme'
const viewStorageKey = 'vh-hosting-preview-view'
const compactViewport = '(max-width: 700px)'
const previewViews = [
  ['mobile', 'Mobile'],
  ['desktop', 'Desktop'],
  ['desktop-wide', 'Широкий экран'],
]

function readDarkTheme() {
  try {
    return localStorage.getItem(themeStorageKey) === 'dark'
  } catch {
    return false
  }
}

function readPreviewView() {
  try {
    const view = sessionStorage.getItem(viewStorageKey)
    if (previewViews.some(([id]) => id === view)) return view
  } catch {
    // Preview switching is still available when storage is unavailable.
  }
  return 'desktop'
}

function Icon({ name }) {
  return (
    <span
      aria-hidden="true"
      className={`hosting-icon hosting-icon--${name}`}
      style={{ '--hosting-icon-url': `url("${icons[`./assets/hosting/${name}.svg`]}")` }}
    />
  )
}

function QuickLinks({ selected, onSelect }) {
  return (
    <nav className="hosting-quick-links" aria-label="Ссылки в шапке">
      {quickLinks.map(([label, count]) => (
        <button type="button" key={label} aria-current={selected === label ? 'page' : undefined} onClick={() => onSelect(label)}>
          {label}
          {count && <span className="hosting-count">{count}</span>}
        </button>
      ))}
    </nav>
  )
}

function HeaderMenu({ label, icon, open, onToggle, trigger, children, className = '', listLabel }) {
  const menuId = `hosting-${icon}-menu`
  return (
    <div className={`hosting-dropdown ${className}`.trim()}>
      <button
        className="hosting-menu-trigger"
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onToggle}
      >
        {trigger ?? <>
          {icon === 'support' && <Icon name={icon} />}
          <span className="hosting-action-label">{label}</span>
          {icon === 'account' && <Icon name={icon} />}
          <Icon name="caret" />
        </>}
      </button>
      <DropdownPanel as="ul" id={menuId} className="hosting-dropdown-list" aria-label={listLabel} open={open}>
        {children}
      </DropdownPanel>
    </div>
  )
}

function HostingHeader({ compact, menuOpen, onToggleMenu, menuToggleRef, selected, onSelect, dark, onToggleTheme, states, activeState, onChooseState, previewView, onPreviewChange }) {
  const [dropdown, setDropdown] = useState(null)
  const [account, setAccount] = useState('demo001')
  const header = useRef(null)

  useEffect(() => {
    if (!dropdown) return

    function closeOnOutsideClick(event) {
      const clickedMenu = event.target instanceof Element && event.target.closest('.hosting-dropdown')
      if (!clickedMenu || !header.current?.contains(clickedMenu)) setDropdown(null)
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return
      header.current?.querySelector('.hosting-menu-trigger[aria-expanded="true"]')?.focus()
      setDropdown(null)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [dropdown])

  function select(label, tab) {
    setDropdown(null)
    onSelect(label, tab)
  }

  function followLink(event, label, tab) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    select(label, tab)
  }

  function toggleDropdown(name) {
    setDropdown(current => current === name ? null : name)
  }

  const accountMenu = (
    <HeaderMenu
      label={compact ? 'Профиль' : account}
      icon="account"
      open={dropdown === 'account'}
      onToggle={() => toggleDropdown('account')}
      trigger={compact ? <><Icon name="mobile-profile" /><span>Профиль</span></> : undefined}
    >
      <li><button type="button" onClick={() => select('Настройка аккаунта')}>Настройка аккаунта</button></li>
      <li><button type="button" onClick={() => select('Безопасность')}>Безопасность</button></li>
      <li>
        <button type="button" role="switch" aria-checked={dark} aria-label="Тёмная тема" onClick={onToggleTheme}>
          Темная тема <span className="hosting-beta">Бета</span>
          <span className="hosting-switch" aria-hidden="true" />
        </button>
      </li>
      <li><button className="hosting-menu-muted" type="button" onClick={() => setDropdown(null)}>Выйти</button></li>
      {demoAccounts.map(([id, description], index) => (
        <li key={id} className={index === 0 ? 'hosting-menu-divider' : undefined}>
          <button className="hosting-account-row" type="button" onClick={() => {
            setAccount(id)
            select('Дашборд')
          }}>
            <Icon name="account" />
            <span>{id}<small>{description}</small></span>
          </button>
        </li>
      ))}
      <li><button className="hosting-menu-muted" type="button" onClick={() => select('Добавить аккаунт')}>Добавить аккаунт</button></li>
    </HeaderMenu>
  )

  return (
    <header className="hosting-header" ref={header}>
      <div className="hosting-preview-controls">
        <HeaderMenu
          label="Навигация прототипа"
          icon="prototype"
          className="hosting-prototype-menu"
          listLabel="Экраны прототипа"
          open={dropdown === 'prototype'}
          onToggle={() => toggleDropdown('prototype')}
          trigger={<Icon name="menu" />}
        >
          <li className="hosting-prototype-heading">Страницы</li>
          <li>
            <button type="button" className="hosting-menu-item" onClick={() => {
              header.current?.querySelector('.hosting-prototype-menu > .hosting-menu-trigger')?.focus()
              select('Дашборд')
            }}><Icon name="dashboard" />Дашборд</button>
          </li>
          <li><a className="hosting-menu-item" href="?sites=antivirus" onClick={event => followLink(event, 'Сайты', 'antivirus')}><Icon name="domains" />Антивирус</a></li>
          <li><a className="hosting-menu-item" href="?sites=network-protection" onClick={event => followLink(event, 'Сайты', 'network-protection')}><Icon name="vps" />Сетевая защита</a></li>
          <li><a className="hosting-menu-item" href="?tariff=services" onClick={event => followLink(event, 'Настройки тарифа', 'services')}><Icon name="plan" />Другие сервисы</a></li>
          <li className="hosting-prototype-heading hosting-menu-divider">Компоненты</li>
          <li><a className="hosting-menu-item" href="?changes" onClick={event => followLink(event, 'Что изменится')}><Icon name="logs" />Что изменится</a></li>
        </HeaderMenu>
        <div className="hosting-preview-switch" role="group" aria-label="Режим просмотра">
          {previewViews.map(([view, label]) => (
            <button key={view} type="button" aria-label={label} title={label} aria-pressed={previewView === view} onClick={() => {
              setDropdown(null)
              onPreviewChange(view)
            }}>
              <Icon name={view} />
            </button>
          ))}
        </div>
      </div>
      <div className="hosting-product-header">
        <div className="hosting-frame hosting-header-inner">
          <div className="hosting-brand">
            <a href="./" aria-label="Timeweb Hosting" onClick={event => followLink(event, 'Дашборд')}>
              {compact ? <img src={mobileLogo} width="96" height="20" alt="Timeweb" />
                : <img src={dark ? darkLogo : logo} width="186" height="26" alt="timeweb hosting" />}
            </a>
          </div>
          {compact ? (
            <button type="button" className="hosting-mobile-balance" aria-label="Пополнить баланс, 2 784 ₽" onClick={() => select('Оплата')}>
              2 784 ₽ <span><img src={mobileBalanceAdd} width="24" height="24" alt="" /></span>
            </button>
          ) : <>
            <QuickLinks selected={selected} onSelect={select} />
            <div className="hosting-header-actions">
              <button type="button" className="hosting-balance" onClick={() => select('Оплата')}>
                <Icon name="wallet" />
                <span>3 990 ₽</span>
                <span className="hosting-expiration">до 6 дек. 2026</span>
              </button>
              <HeaderMenu label="Поддержка" icon="support" open={dropdown === 'support'} onToggle={() => toggleDropdown('support')}>
                {supportLinks.map(([icon, label]) => (
                  <li key={icon} className={icon === 'support-tickets' ? 'hosting-menu-divider' : undefined}>
                    <button type="button" onClick={() => select(label)}><Icon name={icon} />{label}</button>
                  </li>
                ))}
              </HeaderMenu>
              {accountMenu}
            </div>
          </>}
        </div>
      </div>
      <HeaderMenu
        label="Состояния страницы"
        icon="page-states"
        className="hosting-state-menu"
        listLabel="Состояния страницы"
        open={dropdown === 'states'}
        onToggle={() => toggleDropdown('states')}
        trigger={<Icon name="menu" />}
      >
        {[{ id: 'initial', label: 'Исходное состояние' }, ...states].map(state => (
          <li key={state.id}>
            <button type="button" className="hosting-menu-item" aria-pressed={activeState === state.id} onClick={() => onChooseState(state.id)}>
              {state.label}
            </button>
          </li>
        ))}
      </HeaderMenu>
      {compact && (
        <nav className="hosting-mobile-nav" aria-label="Разделы хостинга">
          {mobileSections.map(([icon, label, section]) => (
            <button type="button" key={icon} aria-current={!menuOpen && selected === section ? 'page' : undefined} onClick={() => {
              if (selected !== section) {
                select(section)
              } else if (menuOpen) onToggleMenu()
            }}>
              <span className="hosting-mobile-nav-icon">
                <Icon name={icon} />
                {section === 'Сайты' && (
                  <svg className="hosting-mobile-sites-dot" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="8" r="4.33333" fill="#D86962" strokeWidth="2" />
                  </svg>
                )}
              </span>
              {label}
            </button>
          ))}
          {accountMenu}
          <button type="button" ref={menuToggleRef} aria-current={menuOpen ? 'page' : undefined} aria-controls="hosting-more" onClick={() => {
            setDropdown(null)
            onToggleMenu()
            window.scrollTo(0, 0)
          }}>
            <Icon name="mobile-more" />Ещё
          </button>
        </nav>
      )}
    </header>
  )
}

function Sidebar({ selected, onSelect }) {
  return (
    <aside className="hosting-sidebar">
      <div className="hosting-sidebar-inner">
        <div className="hosting-mobile-links"><QuickLinks selected={selected} onSelect={onSelect} /></div>
        <nav aria-label="Боковое меню хостинга">
          {sidebarGroups.map(group => (
            <ul className="hosting-sidebar-group" key={group[0][0]}>
              {group.map(([icon, label]) => (
                <li key={icon}>
                  <button
                    type="button"
                    aria-current={selected === label ? 'page' : undefined}
                    onClick={() => onSelect(label)}
                  >
                    <Icon name={icon} />
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>
    </aside>
  )
}

function MoreIcon({ name, size = 20 }) {
  return <img src={moreIcons[`./assets/hosting/mobile-more-${name}.svg`]} width={size} height={size} alt="" />
}

function MobileMore({ open, onSelect }) {
  return (
    <main id="hosting-more" aria-label="Ещё" hidden={!open}>
      <nav className="hosting-more-nav" aria-label="Дополнительные разделы хостинга">
        {moreGroups.map(group => (
          <ul className="hosting-more-group" key={group[0][0]}>
            {group.map(([icon, label]) => (
              <li key={icon}>
                <button type="button" onClick={() => onSelect(label)}>
                  <span className="hosting-more-icon"><MoreIcon name={icon} /></span>
                  <span className="hosting-more-row">
                    <span>{label}</span>
                    <span className="hosting-more-details">
                      {icon === 'files' && (
                        <>
                          <span className="hosting-more-new">NEW</span>
                          <MoreIcon name="file-notice" size={16} />
                          <MoreIcon name="file-dot" size={16} />
                        </>
                      )}
                      <MoreIcon name="chevron" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </main>
  )
}

export default function HostingShell({ children, renderSection, initialSection = 'Дашборд', onSectionChange, getPageStates, isCurrentSection }) {
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(initialSection)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(readDarkTheme)
  const [screenState, setScreenState] = useState({ id: null, version: 0 })
  const [previewView, setPreviewView] = useState(readPreviewView)
  const [narrowViewport, setNarrowViewport] = useState(() => window.matchMedia(compactViewport).matches)
  const menuToggleRef = useRef(null)
  const pending = useRef(null)
  const [leaveDialog, setLeaveDialog] = useState(null)
  const compact = previewView === 'mobile' || narrowViewport
  const moreOpen = compact && menuOpen

  useEffect(() => {
    const media = window.matchMedia(compactViewport)
    function syncViewport() {
      setNarrowViewport(media.matches)
    }
    media.addEventListener('change', syncViewport)
    syncViewport()
    return () => media.removeEventListener('change', syncViewport)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(themeStorageKey, dark ? 'dark' : 'light')
    } catch {
      // The theme still works when storage is unavailable.
    }
  }, [dark])

  function navigate(proceed) {
    if (pending.current) {
      setLeaveDialog({ ...pending.current, proceed })
    } else {
      proceed()
    }
  }

  function selectSection(label, tab) {
    if (label === selected && (isCurrentSection?.(label, tab) ?? true)) {
      setMenuOpen(false)
      return
    }
    navigate(() => {
      if (moreOpen && document.activeElement?.closest('#hosting-more')) menuToggleRef.current?.focus({ preventScroll: true })
      if (label !== selected) setScreenState(current => ({ ...current, id: null }))
      setSelected(label)
      setMenuOpen(false)
      onSectionChange?.(label, tab)
      window.scrollTo(0, 0)
    })
  }

  function changePreview(view) {
    if (view !== 'mobile') setMenuOpen(false)
    setPreviewView(view)
    try {
      sessionStorage.setItem(viewStorageKey, view)
    } catch {
      // The selected view still applies until navigation.
    }
  }

  // The scenario menu is reserved for states that need data or events the page cannot produce.
  const states = moreOpen ? [] : (getPageStates?.(selected) ?? []).filter(state => state.requiresPreset)
  const activeState = states.some(state => state.id === screenState.id) ? screenState.id : 'initial'
  const content = renderSection ? renderSection(selected, selectSection, dark, screenState.id, compact) : children

  return (
    <div className="hosting-shell" data-theme={dark ? 'dark' : 'light'} data-view={previewView} data-compact={compact} style={dark ? darkTokens : lightTokens}>
      <HostingHeader
        compact={compact}
        menuOpen={moreOpen}
        onToggleMenu={() => setMenuOpen(open => !open)}
        menuToggleRef={menuToggleRef}
        selected={selected}
        onSelect={selectSection}
        dark={dark}
        onToggleTheme={() => setDark(value => !value)}
        states={states}
        activeState={activeState}
        onChooseState={id => {
          setMenuOpen(false)
          setScreenState(current => ({ id, version: current.version + 1 }))
          window.scrollTo(0, 0)
        }}
        previewView={previewView}
        onPreviewChange={changePreview}
      />
      <div className="hosting-workspace-viewport">
        <div className="hosting-workspace-content">
          <div className="hosting-frame hosting-layout" data-section={moreOpen ? undefined : selected}>
            {!compact && <Sidebar selected={selected} onSelect={selectSection} />}
            {compact && <MobileMore open={moreOpen} onSelect={selectSection} />}
            <main className={content ? 'hosting-content' : 'hosting-sheet'} aria-label={selected} hidden={moreOpen}>
              <PendingChangesContext value={{ pending, navigate }}>
                <HostingToastContext value={setToast}>
                  <Fragment key={screenState.version}>{content}</Fragment>
                </HostingToastContext>
              </PendingChangesContext>
            </main>
          </div>
        </div>
      </div>
      <HostingToast toast={toast} setToast={setToast} />
      {leaveDialog && <LeaveCheckoutDialog title={leaveDialog.title} description={leaveDialog.description} onClose={action => {
        setLeaveDialog(null)
        if (action === 'checkout') {
          setMenuOpen(false)
          requestAnimationFrame(leaveDialog.revealCheckout)
        }
        if (action === 'leave') {
          leaveDialog.discard()
          leaveDialog.proceed()
        }
      }} />}
    </div>
  )
}
