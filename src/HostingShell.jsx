import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Button, Switch } from './ui/controls.jsx'
import { darkTokens } from './ui/hosting-theme.js'
import { AssetIcon } from './ui/Icon.jsx'
import { SidebarNav } from './ui/layout.jsx'
import { MenuItem, PopoverMenu, SegmentedOptions } from './ui/navigation.jsx'
import logo from './assets/hosting/logo.svg'
import darkLogo from './assets/hosting/logo-dark.svg'
import mobileLogo from './assets/hosting/mobile-logo.svg?no-inline'
import mobileBalanceAdd from './assets/hosting/mobile-balance-add.svg?no-inline'
import { HostingToast, HostingToastContext } from './hosting-toast.jsx'
import LeaveCheckoutDialog from './LeaveCheckoutDialog.jsx'
import { PendingChangesContext } from './pending-changes.jsx'
import { vhThemes } from './ui/theme.jsx'
import { designSystemSection } from './design-system-section.js'
import { apiAgentsSection } from './api-agents-data.js'
import { integratorKnowledge, integratorNews, integratorPages, integratorProgramSections, integratorSection, integratorSettings, integratorSupport } from './integrator-data.js'
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
    ['api', apiAgentsSection],
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
const integratorSidebarGroups = [
  [
    ['partner', integratorSection],
    ['logs', integratorPages.operations],
    ['files', integratorPages.documents],
    ['balance', integratorPages.details],
    ['mail', integratorPages.notifications],
  ],
  [['plan', integratorSettings, 'Настройки'], ['knowledge', integratorKnowledge, 'База знаний']],
]
const integratorMobileSections = [
  ['mobile-dashboard', integratorSection, integratorSection],
  ['plan', 'Настройки', integratorSettings],
  ['knowledge', 'База знаний', integratorKnowledge],
]
const supportLinks = [
  ['support-message', 'Написать в поддержку'],
  ['support-telegram', 'Написать в Telegram'],
  ['support-help', 'База знаний'],
  ['support-phone', '8 (800) 700-1081'],
  ['support-tickets', 'Тикеты'],
]
const integratorSupportLinks = [
  ['support-tickets', 'Поддержка', integratorSupport],
  ['support-help', 'База знаний', integratorKnowledge],
]
const demoAccounts = [
  ['demo002', 'Партнёрский аккаунт'],
  ['demo003', 'Тестовый аккаунт'],
  ['demo004', 'Личный аккаунт'],
  ['demo005', 'Cloud'],
  ['demo006', 'Почтовый тариф'],
]
const darkBannerTokens = {
  '--hosting-dark-banner-back': darkTokens['--hosting-background'],
  '--hosting-dark-banner-title': darkTokens['--hosting-title'],
  '--hosting-dark-banner-text': darkTokens['--hosting-text'],
  '--hosting-dark-banner-button': darkTokens['--hosting-primary-back'],
  '--hosting-dark-banner-button-hover': darkTokens['--hosting-primary-hover'],
  '--hosting-dark-banner-focus': darkTokens['--hosting-focus'],
}
const themeStorageKey = 'vh-hosting-theme'
const viewStorageKey = 'vh-hosting-preview-view'
const compactViewport = '(max-width: 700px)'
const previewViews = [
  ['mobile', 'Mobile'],
  ['desktop', 'Desktop'],
  ['desktop-wide', 'Широкий экран'],
]
const previewViewOptions = previewViews.map(([value, accessibleLabel]) => ({ value, accessibleLabel, icon: <Icon name={value} /> }))

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
  return <AssetIcon src={icons[`./assets/hosting/${name}.svg`]} monochrome size={24}
    className={`hosting-icon hosting-icon--${name}`} />
}

function QuickLinks({ selected, onSelect }) {
  return (
    <nav className="hosting-quick-links" aria-label="Ссылки в шапке">
      {quickLinks.map(([label, count]) => (
        <Button appearance="nav-action" pressable={false} type="button" key={label} aria-current={selected === label ? 'page' : undefined} onClick={() => onSelect(label)}>
          {label}
          {count && <span className="hosting-count">{count}</span>}
        </Button>
      ))}
    </nav>
  )
}

function HeaderMenu({ label, icon, open, onOpenChange, trigger, children, className = '', listLabel, placement }) {
  const toolbar = icon === 'prototype' || icon === 'page-states'
  return (
    <PopoverMenu className={`hosting-dropdown ${className}`.trim()} open={open} onOpenChange={onOpenChange}
      placement={placement} panelAs="ul" panelLabel={listLabel} panelClassName="hosting-dropdown-list"
      optionSize={44} triggerProps={{ 'aria-label': label }}
      renderTrigger={props => <Button appearance={toolbar ? 'toolbar-icon' : 'nav-action'} size={toolbar ? 36 : undefined}
        pressable={false} {...props} className="hosting-menu-trigger">
        {trigger ?? <>
          {icon === 'support' && <Icon name={icon} />}
          <span className="hosting-action-label">{label}</span>
          {icon === 'account' && <Icon name={icon} />}
          <Icon name="caret" />
        </>}
      </Button>}>
      {close => typeof children === 'function' ? children(close) : children}
    </PopoverMenu>
  )
}

function HostingHeader({ compact, menuOpen, onToggleMenu, menuToggleRef, selected, onSelect, dark, onToggleTheme, states, activeState, onChooseState, previewView, onPreviewChange, integrator, integratorBalance, onDeposit }) {
  const [dropdown, setDropdown] = useState(null)
  const [account, setAccount] = useState('demo001')

  function select(label, tab) {
    setDropdown(null)
    onSelect(label, tab)
  }

  function followLink(event, label, tab) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    select(label, tab)
  }

  function changeDropdown(name, open) {
    setDropdown(current => open ? name : current === name ? null : current)
  }

  function openBalance() {
    if (!integrator) {
      select('Оплата')
      return
    }
    setDropdown(null)
    onDeposit()
  }

  const previewViewName = useId()
  function selectPreviewView(view) {
    setDropdown(null)
    onPreviewChange(view)
  }
  const accountMenu = (
    <HeaderMenu
      label={compact ? 'Профиль' : integrator ? 'cu203223' : account}
      icon="account"
      open={dropdown === 'account'}
      onOpenChange={open => changeDropdown('account', open)}
      placement={compact ? 'top' : 'bottom'}
      trigger={compact ? <><Icon name="mobile-profile" /><span>Профиль</span></> : undefined}
    >
      {close => <>
        <li><MenuItem onClick={() => { close(); select(integrator ? integratorSettings : 'Настройка аккаунта') }}>Настройка аккаунта</MenuItem></li>
        <li><MenuItem onClick={() => { close(); integrator ? select(integratorSettings, 'security') : select('Безопасность') }}>Безопасность</MenuItem></li>
        <li>
          <MenuItem as={Switch} checked={dark} aria-label="Тёмная тема" onClick={onToggleTheme} trackAfter>
            Тёмная тема <span className="hosting-beta">Бета</span>
          </MenuItem>
        </li>
        {!integrator && <li><MenuItem tone="muted" onClick={close}>Выйти</MenuItem></li>}
        {!integrator && demoAccounts.map(([id, description], index) => (
          <li key={id} className={index === 0 ? 'hosting-menu-divider' : undefined}>
            <MenuItem icon={<Icon name="account" />} onClick={() => {
              close()
              setAccount(id)
              select('Дашборд')
            }}>
              <span className="vh-list-item-copy">{id}<small>{description}</small></span>
            </MenuItem>
          </li>
        ))}
        {!integrator && <li><MenuItem tone="muted"
          onClick={() => { close(); select('Добавить аккаунт') }}>Добавить аккаунт</MenuItem></li>}
      </>}
    </HeaderMenu>
  )

  return (
    <header className="hosting-header">
      <div className="hosting-preview-controls">
        <HeaderMenu
          label="Навигация прототипа"
          icon="prototype"
          className="hosting-prototype-menu"
          listLabel="Экраны прототипа"
          open={dropdown === 'prototype'}
          onOpenChange={open => changeDropdown('prototype', open)}
          trigger={<Icon name="menu" />}
        >
          <li className="hosting-prototype-heading">Страницы</li>
          <li><MenuItem as="a" href="./" icon={<Icon name="dashboard" />}
            onClick={event => followLink(event, 'Дашборд')}>Дашборд</MenuItem></li>
          <li><MenuItem as="a" href="?sites=antivirus" icon={<Icon name="domains" />}
            onClick={event => followLink(event, 'Сайты', 'antivirus')}>Антивирус</MenuItem></li>
          <li><MenuItem as="a" href="?sites=network-protection" icon={<Icon name="vps" />}
            onClick={event => followLink(event, 'Сайты', 'network-protection')}>Сетевая защита</MenuItem></li>
          <li><MenuItem as="a" href="?tariff=services" icon={<Icon name="plan" />}
            onClick={event => followLink(event, 'Настройки тарифа', 'services')}>Другие сервисы</MenuItem></li>
          <li><MenuItem as="a" href="?api=connection" icon={<Icon name="api" />}
            aria-current={selected === apiAgentsSection ? 'page' : undefined}
            onClick={event => followLink(event, apiAgentsSection, 'connection')}>{apiAgentsSection}</MenuItem></li>
          <li className="hosting-prototype-heading hosting-menu-divider">Компоненты</li>
          <li><MenuItem as="a" href="?changes" icon={<Icon name="logs" />}
            onClick={event => followLink(event, 'Что изменится')}>Что изменится</MenuItem></li>
          <li>
            <MenuItem as="a" href="?catalog" icon={<Icon name="plan" />}
              aria-current={selected === designSystemSection ? 'page' : undefined}
              onClick={event => followLink(event, designSystemSection)}>
              {designSystemSection}
            </MenuItem>
          </li>
          <li className="hosting-prototype-heading hosting-menu-divider">Панели</li>
          <li><MenuItem as="a" href="?integrator=program" icon={<Icon name="partner" />}
            aria-current={integrator ? 'page' : undefined}
            onClick={event => followLink(event, integratorSection)}>Панель интегратора</MenuItem></li>
        </HeaderMenu>
        <SegmentedOptions name={previewViewName} label="Режим просмотра" className="hosting-preview-switch"
          options={previewViewOptions} value={previewView} onChange={selectPreviewView} onReselect={selectPreviewView} />
      </div>
      <div className="hosting-product-header">
        <div className="hosting-frame hosting-header-inner">
          <div className="hosting-brand">
            <a href={integrator ? '?integrator=program' : './'} aria-label="Timeweb Hosting"
              onClick={event => followLink(event, integrator ? integratorSection : 'Дашборд')}>
              {compact ? <img src={mobileLogo} width="96" height="20" alt="Timeweb" />
                : <img src={dark ? darkLogo : logo} width="186" height="26" alt="timeweb hosting" />}
            </a>
          </div>
          {compact ? (
            <Button appearance="nav-action" pressable={false} type="button" className="hosting-mobile-balance" aria-label={`Пополнить баланс, ${integrator ? integratorBalance : '2 784 ₽'}`}
              onClick={openBalance}>
              {integrator ? integratorBalance : '2 784 ₽'} <span><img src={mobileBalanceAdd} width="24" height="24" alt="" /></span>
            </Button>
          ) : <>
            {integrator ? <nav className="hosting-quick-links" aria-label="Ссылки в шапке">
              <Button appearance="nav-action" pressable={false} type="button" aria-current={selected === integratorNews ? 'page' : undefined} onClick={() => select(integratorNews)}>
                Новости <span className="hosting-count">1</span>
              </Button>
            </nav> : <QuickLinks selected={selected} onSelect={select} />}
            <div className="hosting-header-actions">
              <Button appearance="nav-action" pressable={false} type="button" className="hosting-balance" onClick={openBalance}>
                <Icon name="wallet" />
                <span>{integrator ? integratorBalance : '3 990 ₽'}</span>
                {!integrator && <span className="hosting-expiration">до 6 дек. 2026</span>}
              </Button>
              <HeaderMenu label="Поддержка" icon="support" open={dropdown === 'support'} onOpenChange={open => changeDropdown('support', open)}>
                {close => (integrator ? integratorSupportLinks : supportLinks).map(([icon, label, section = label]) => (
                  <li key={icon} className={!integrator && icon === 'support-tickets' ? 'hosting-menu-divider' : undefined}>
                    <MenuItem icon={<Icon name={icon} />} onClick={() => { close(); select(section) }}>{label}</MenuItem>
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
        onOpenChange={open => changeDropdown('states', open)}
        trigger={<Icon name="menu" />}
      >
        {close => [{ id: 'initial', label: 'Исходное состояние' }, ...states].map(state => (
          <li key={state.id}>
            <MenuItem selected={activeState === state.id} onClick={() => {
              if (integrator) close()
              onChooseState(state.id)
            }}>
              {state.label}
            </MenuItem>
          </li>
        ))}
      </HeaderMenu>
      {compact && (
        <nav className="hosting-mobile-nav" aria-label={integrator ? 'Разделы панели интегратора' : 'Разделы хостинга'}>
          {(integrator ? integratorMobileSections : mobileSections).map(([icon, label, section]) => (
            <Button appearance="nav-action" pressable={false} type="button" key={icon} aria-current={!menuOpen && selected === section ? 'page' : undefined} onClick={() => {
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
            </Button>
          ))}
          {accountMenu}
          <Button appearance="nav-action" pressable={false} type="button" ref={menuToggleRef} aria-current={menuOpen ? 'page' : undefined} aria-expanded={menuOpen} aria-controls="hosting-more" onClick={() => {
            setDropdown(null)
            onToggleMenu()
            window.scrollTo(0, 0)
          }}>
            <Icon name="mobile-more" />Ещё
          </Button>
        </nav>
      )}
    </header>
  )
}

const toSidebarNavigation = groups => groups.map(group =>
  group.map(([icon, id, label = id]) => ({ id, label, icon: <Icon name={icon} /> })))
const sidebarNavigation = toSidebarNavigation(sidebarGroups)
const integratorSidebarNavigation = toSidebarNavigation([integratorSidebarGroups.flat()])

function Sidebar({ selected, onSelect, integrator }) {
  return (
    <aside className="hosting-sidebar">
      <div className="hosting-sidebar-inner">
        {!integrator && <div className="hosting-mobile-links"><QuickLinks selected={selected} onSelect={onSelect} /></div>}
        <SidebarNav label={integrator ? 'Панель интегратора' : 'Боковое меню хостинга'}
          groups={integrator ? integratorSidebarNavigation : sidebarNavigation} value={selected} onChange={onSelect} />
      </div>
    </aside>
  )
}

function MoreIcon({ name, size = 20 }) {
  return <img src={moreIcons[`./assets/hosting/mobile-more-${name}.svg`]} width={size} height={size} alt="" />
}

const integratorMoreGroups = [
  ...integratorSidebarGroups,
  [['news', integratorNews, 'Новости'], ['knowledge', integratorSupport, 'Поддержка']],
]

function MobileMore({ open, onSelect, integrator }) {
  return (
    <main id="hosting-more" aria-label="Ещё" hidden={!open}>
      <nav className="hosting-more-nav" aria-label={integrator ? 'Дополнительные разделы панели интегратора' : 'Дополнительные разделы хостинга'}>
        {(integrator ? integratorMoreGroups : moreGroups).map(group => (
          <ul className="hosting-more-group" key={group[0][0]}>
            {group.map(([icon, section, label = section]) => (
              <li key={icon}>
                <MenuItem layout="mobile-navigation" onClick={() => onSelect(section)}>
                  <span className="hosting-more-icon"><MoreIcon name={icon} /></span>
                  <span className="hosting-more-row">
                    <span>{label}</span>
                    <span className="hosting-more-details">
                      {!integrator && icon === 'files' && (
                        <>
                          <span className="hosting-more-new">NEW</span>
                          <MoreIcon name="file-notice" size={16} />
                          <MoreIcon name="file-dot" size={16} />
                        </>
                      )}
                      <MoreIcon name="chevron" />
                    </span>
                  </span>
                </MenuItem>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </main>
  )
}

export default function HostingShell({
  children, renderSection, initialSection = 'Дашборд', initialScreenState = null,
  onSectionChange, onScreenStateChange, getPageStates, keepScreenStateOnNavigation,
  isCurrentSection, getIntegratorBalance, onIntegratorDeposit,
}) {
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(initialSection)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dark, setDark] = useState(readDarkTheme)
  const [screenState, setScreenState] = useState({ id: initialScreenState, version: 0 })
  const [previewView, setPreviewView] = useState(readPreviewView)
  const [narrowViewport, setNarrowViewport] = useState(() => window.matchMedia(compactViewport).matches)
  const menuToggleRef = useRef(null)
  const pending = useRef(null)
  const [leaveDialog, setLeaveDialog] = useState(null)
  const compact = previewView === 'mobile' || narrowViewport
  const moreOpen = compact && menuOpen
  const integrator = Object.values(integratorPages).includes(selected)

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
      const integratorNavigation = integrator && Object.values(integratorPages).includes(label)
      const keepState = label === selected || integratorNavigation || keepScreenStateOnNavigation?.(screenState.id, label)
      if (!keepState) setScreenState(current => ({ ...current, id: null }))
      setSelected(label)
      setMenuOpen(false)
      onSectionChange?.(label, tab, keepState)
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
    <div className="hosting-shell" data-theme={dark ? 'dark' : 'light'} data-view={previewView} data-compact={compact}
      data-integrator={integrator || undefined}
      style={{ ...vhThemes[dark ? 'dark' : 'light'], ...darkBannerTokens }}>
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
          onScreenStateChange?.(id, selected)
          window.scrollTo(0, 0)
        }}
        previewView={previewView}
        onPreviewChange={changePreview}
        integrator={integrator}
        integratorBalance={integrator ? getIntegratorBalance?.(screenState.id) : undefined}
        onDeposit={() => {
          setMenuOpen(false)
          if (!integratorProgramSections.includes(selected)) selectSection(integratorSection)
          onIntegratorDeposit?.()
        }}
      />
      <div className="hosting-workspace-viewport">
        <div className="hosting-workspace-content">
          <div className="hosting-frame hosting-layout" data-section={moreOpen ? undefined : selected}>
            {!compact && selected !== designSystemSection && <Sidebar selected={selected} onSelect={selectSection} integrator={integrator} />}
            {compact && <MobileMore open={moreOpen} onSelect={selectSection} integrator={integrator} />}
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
