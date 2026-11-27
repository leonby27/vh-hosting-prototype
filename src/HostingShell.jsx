import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { Button, IconButton, Switch } from './ui/controls.jsx'
import { darkTokens } from './ui/hosting-theme.js'
import { AssetIcon } from './ui/Icon.jsx'
import { Tooltip } from './ui/feedback.jsx'
import { SidebarNav } from './ui/layout.jsx'
import { MenuItem, PopoverMenu, SegmentedOptions } from './ui/navigation.jsx'
import logo from './assets/hosting/logo.svg'
import darkLogo from './assets/hosting/logo-dark.svg'
import mobileLogo from './assets/hosting/mobile-logo.svg?no-inline'
import mobileBalanceAdd from './assets/hosting/mobile-balance-add.svg?no-inline'
import vkLogo from './assets/hosting/social-vk.svg'
import vkMonochrome from './assets/hosting/social-vk-monochrome.svg'
import maxLogo from './assets/hosting/social-max.svg'
import telegramLogo from './assets/hosting/social-telegram.svg'
import telegramMonochrome from './assets/hosting/social-telegram-monochrome.svg'
import { HostingToast, HostingToastContext } from './hosting-toast.jsx'
import LeaveCheckoutDialog from './LeaveCheckoutDialog.jsx'
import { PendingChangesContext } from './pending-changes.jsx'
import { vhThemes } from './ui/theme.jsx'
import { designSystemSection } from './design-system-section.js'
import { dashboardConceptHref, dashboardConceptSection, isDashboardSection, richDashboard, typicalDashboard } from './dashboard-variants.js'
import { apiAgentsSection } from './api-agents-data.js'
import { loginSection } from './login-scenarios.js'
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
    ['phpmyadmin', 'phpMyAdmin', 'PHPMyAdmin', 'https://vh354.timeweb.ru/pma/'],
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
  sidebarGroups[1].filter(([icon]) => icon !== 'ssh' && icon !== 'phpmyadmin'),
  sidebarGroups[2],
  sidebarGroups[3],
  quickLinks.map(([label, , icon]) => [icon, label]),
]
const mobileSections = [
  ['mobile-dashboard', 'Дашборд', 'Дашборд'],
  ['mobile-sites', 'Сайты', 'Сайты'],
  ['mobile-domains', 'Домены', 'Домены и SSL'],
]
const conceptMobileSections = mobileSections.map(([icon, label, section]) =>
  [icon, label, section === 'Дашборд' ? dashboardConceptSection : section])
const integratorSidebarGroups = [
  [
    ['partner', integratorSection],
    ['logs', integratorPages.operations],
    ['files', integratorPages.documents],
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
const dashboardLayoutIds = [null, typicalDashboard.id, richDashboard.id]
const previewViews = [
  ['mobile', 'Мобильный экран'],
  ['desktop', 'Обычный экран'],
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

function followLink(event, navigate) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigate()
}

function QuickLinks({ selected, onSelect, iconOnly = false }) {
  return (
    <nav className="hosting-quick-links" aria-label="Ссылки в шапке">
      {quickLinks.map(([label, count, icon]) => (
        <Button appearance="nav-action" pressable={false} type="button" key={label} aria-current={selected === label ? 'page' : undefined}
          aria-label={iconOnly ? (count ? `${label}, ${count}` : label) : undefined}
          title={iconOnly ? label : undefined} onClick={() => onSelect(label)}>
          {iconOnly ? <MoreIcon name={icon} /> : <>{label}{count && <span className="hosting-count">{count}</span>}</>}
        </Button>
      ))}
    </nav>
  )
}

function HeaderMenu({ label, icon, open, onOpenChange, trigger, children, className = '', placement, toolbar = false, active = false }) {
  return (
    <PopoverMenu className={`hosting-dropdown ${className}`.trim()} open={open} onOpenChange={onOpenChange}
      placement={placement} panelAs="ul" panelClassName="hosting-dropdown-list"
      optionSize={44} triggerProps={{ 'aria-label': label, 'data-active': active || undefined }}
      renderTrigger={props => <Button appearance={toolbar ? 'toolbar-icon' : 'nav-action'} size={toolbar ? 24 : undefined}
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

const prototypePages = {
  label: 'Страницы',
  items: [
    { label: 'Дашборд', href: './', icon: 'dashboard' },
    { label: 'Антивирус', href: '?sites=antivirus', icon: 'domains', section: 'Сайты', tab: 'antivirus' },
    { label: 'Сетевая защита', href: '?sites=network-protection', icon: 'vps', section: 'Сайты', tab: 'network-protection' },
    { label: 'Другие сервисы', href: '?tariff=services', icon: 'plan', section: 'Настройки тарифа', tab: 'services' },
    { label: apiAgentsSection, href: '?api=connection', icon: 'api', tab: 'connection' },
    { label: loginSection, href: '?login', icon: 'account' },
  ],
}

const prototypeGroups = [
  { label: 'Компоненты', items: [
    { label: 'Что изменится', href: '?changes', icon: 'logs' },
    { label: designSystemSection, href: '?catalog', icon: 'plan' },
  ] },
  { label: 'Панели', items: [
    { label: 'Панель интегратора', href: '?integrator=program', icon: 'partner', section: integratorSection },
  ] },
  { label: 'Концепты', items: [
    { label: 'Дашборд', href: dashboardConceptHref, icon: 'dashboard', section: dashboardConceptSection },
  ] },
]

function PrototypeToolbar({ selected, integrator, isCurrentSection, onSelect, states, activeState, onChooseState, previewView, onPreviewChange }) {
  const [dropdown, setDropdown] = useState(null)
  const previewViewName = useId()

  function changeDropdown(name, open) {
    setDropdown(current => open ? name : current === name ? null : current)
  }

  function selectView(view) {
    setDropdown(null)
    onPreviewChange(view)
  }

  function isCurrentPage(section, tab) {
    if (section === integratorSection) return integrator
    return section === selected && (!tab || (isCurrentSection?.(section, tab) ?? true))
  }

  const activeGroup = prototypeGroups.find(({ items }) =>
    items.some(({ label, section = label }) => isCurrentPage(section))) ?? prototypePages

  function renderGroup({ label, items }) {
    return (
      <HeaderMenu key={label} label={label} toolbar placement="top"
        active={label === activeGroup.label}
        open={dropdown === label} onOpenChange={open => changeDropdown(label, open)}
        trigger={<><span>{label}</span><Icon name="caret" /></>}>
        {items.map(({ label, href, icon, section = label, tab }) => (
          <li key={href}><MenuItem as="a" href={href} icon={<Icon name={icon} />}
            aria-current={isCurrentPage(section, tab) ? 'page' : undefined}
            onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              onSelect(section, tab)
            }}>{label}</MenuItem></li>
        ))}
      </HeaderMenu>
    )
  }

  return (
    <nav className="hosting-prototype-toolbar" aria-label="Управление прототипом">
      <div className="hosting-prototype-actions">
        <SegmentedOptions name={previewViewName} label="Режим просмотра" className="hosting-preview-switch"
          options={previewViewOptions} value={previewView} onChange={selectView} onReselect={selectView} />
        {renderGroup(prototypePages)}
        <HeaderMenu label="Сценарии" toolbar placement="top" className="hosting-scenarios-menu"
          active={activeState !== states[0].id}
          open={dropdown === 'states'} onOpenChange={open => changeDropdown('states', open)}
          trigger={<><span>Сценарии</span><Icon name="caret" /></>}>
          {states.map(state => (
            <li key={state.id}><MenuItem selected={activeState === state.id} onClick={() => {
              if (selected === loginSection) setDropdown(null)
              onChooseState(state.id)
            }}>
              {state.label}
            </MenuItem></li>
          ))}
        </HeaderMenu>
      </div>
      <div className="hosting-prototype-links">
        {prototypeGroups.map(renderGroup)}
      </div>
    </nav>
  )
}

function HostingHeader({ compact, conceptLayout, menuOpen, onToggleMenu, menuToggleRef, selected, onSelect, dark, onToggleTheme, integrator, integratorBalance, hostingBalance, onDeposit, onSignOut }) {
  const [dropdown, setDropdown] = useState(null)
  const [account, setAccount] = useState('demo001')
  const productNavigation = integrator ? integratorMobileSections
    : selected === dashboardConceptSection ? conceptMobileSections : mobileSections

  function select(label, tab) {
    setDropdown(null)
    onSelect(label, tab)
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
        {!integrator && <li><MenuItem onClick={() => { close(); select('Безопасность') }}>Безопасность</MenuItem></li>}
        <li>
          <MenuItem as={Switch} checked={dark} aria-label="Тёмная тема" onClick={onToggleTheme} trackAfter>
            Тёмная тема <span className="hosting-beta">Бета</span>
          </MenuItem>
        </li>
        {!integrator && <li><MenuItem tone="muted" onClick={() => { close(); onSignOut() }}>Выйти</MenuItem></li>}
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
      <div className="hosting-product-header">
        <div className="hosting-frame hosting-header-inner">
          {!conceptLayout && <div className="hosting-brand">
            <a href={integrator ? '?integrator=program' : './'} aria-label="Timeweb Hosting"
              onClick={event => followLink(event, () => select(integrator ? integratorSection : 'Дашборд'))}>
              {compact ? <img src={mobileLogo} width="96" height="20" alt="Timeweb" />
                : <img src={dark ? darkLogo : logo} width="186" height="26" alt="timeweb hosting" />}
            </a>
          </div>}
          {integrator && !compact && <span className="hosting-integrator-label">Панель интегратора</span>}
          {compact ? !integrator && (
            <Button appearance="nav-action" pressable={false} type="button" className="hosting-mobile-balance" aria-label={`Пополнить баланс, ${integrator ? integratorBalance : hostingBalance}`}
              onClick={openBalance}>
              {integrator ? integratorBalance : hostingBalance} <span><img src={mobileBalanceAdd} width="24" height="24" alt="" /></span>
            </Button>
          ) : <>
            {!integrator && <QuickLinks selected={selected} onSelect={select} />}
            <div className="hosting-header-actions">
              {!integrator && <Button appearance="nav-action" pressable={false} type="button" className="hosting-balance" onClick={openBalance}>
                {!integrator && <Icon name="wallet" />}
                <span>{integrator ? integratorBalance : hostingBalance}</span>
                {!integrator && <span className="hosting-expiration">до 6 дек. 2026</span>}
              </Button>}
              <HeaderMenu label="Поддержка" icon="support" open={dropdown === 'support'} onOpenChange={open => changeDropdown('support', open)}>
                {close => supportLinks.map(([icon, label, section = label]) => (
                  <li key={icon} className={icon === 'support-tickets' ? 'hosting-menu-divider' : undefined}>
                    <MenuItem icon={<Icon name={icon} />} onClick={() => { close(); select(section) }}>{label}</MenuItem>
                  </li>
                ))}
              </HeaderMenu>
              {accountMenu}
            </div>
          </>}
        </div>
      </div>
      {compact && (
        <nav className="hosting-mobile-nav" aria-label={integrator ? 'Разделы панели интегратора' : 'Разделы хостинга'}>
          {productNavigation.map(([icon, label, section]) => (
            <Button appearance="nav-action" pressable={false} type="button" key={icon} aria-current={!menuOpen && selected === section ? 'page' : undefined} onClick={() => {
              if (selected !== section || (isDashboardSection(section) && !menuOpen)) {
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
  group.map(([icon, id, label = id, href]) => ({ id, label, href, target: href ? '_blank' : undefined, icon: <Icon name={icon} /> })))
const sidebarNavigation = toSidebarNavigation(sidebarGroups)
const conceptSidebarNavigation = sidebarNavigation.map(group => group.map(item =>
  item.id === 'Дашборд' ? { ...item, id: dashboardConceptSection } : item))
const integratorSidebarNavigation = toSidebarNavigation(integratorSidebarGroups)

const sidebarSocialIconSize = 20
const socialLinks = [
  { label: 'ВКонтакте', tooltip: 'Подписывайтесь на\u00A0группу ВКонтакте', href: 'https://vk.ru/hosting_timeweb', logo: vkLogo, monochrome: vkMonochrome },
  { label: 'MAX', tooltip: 'Подписывайтесь на\u00A0канал в\u00A0MAX', href: 'https://max.ru/id7810353960_biz', logo: maxLogo },
  { label: 'Telegram', tooltip: 'Подписывайтесь на\u00A0канал в\u00A0Telegram', href: 'https://t.me/twhosting', logo: telegramLogo, monochrome: telegramMonochrome },
]

function Sidebar({ selected, onSelect, integrator, dark, collapsed = false, onToggle }) {
  const concept = Boolean(onToggle)
  const navigationId = useId()
  const toggleLabel = collapsed ? 'Развернуть боковое меню' : 'Свернуть боковое меню'
  const groups = integrator ? integratorSidebarNavigation
    : selected === dashboardConceptSection ? conceptSidebarNavigation : sidebarNavigation
  return (
    <aside className="hosting-sidebar">
      {concept && <div className="hosting-concept-sidebar-header">
        <div className="hosting-brand" inert={collapsed || undefined}>
          <a href={dashboardConceptHref} aria-label="Timeweb Hosting"
            onClick={event => followLink(event, () => onSelect(dashboardConceptSection))}>
            <img src={dark ? darkLogo : logo} width="152" height="21" alt="" />
          </a>
        </div>
        <IconButton className="hosting-concept-sidebar-toggle" label={toggleLabel} title={toggleLabel}
          iconOnly size={32} aria-expanded={!collapsed} aria-controls={navigationId} onClick={onToggle}
          icon={<AssetIcon src={icons['./assets/hosting/caret.svg']} monochrome size={16} />} />
      </div>}
      <div className="hosting-sidebar-inner" id={concept ? navigationId : undefined}>
        {!integrator && <div className="hosting-mobile-links"><QuickLinks selected={selected} onSelect={onSelect} iconOnly={collapsed} /></div>}
        <SidebarNav label={integrator ? 'Панель интегратора' : 'Боковое меню хостинга'}
          groups={groups} value={selected} onChange={onSelect} iconOnly={collapsed} />
        {!integrator && <nav className="hosting-sidebar-social-links" aria-label="Социальные сети">
          {socialLinks.map(({ label, tooltip, href, logo, monochrome = logo }) => {
            const renderLink = tooltipId => (
              <IconButton as="a" href={href} target="_blank" rel="noopener noreferrer"
                aria-describedby={tooltipId} title={concept ? tooltip : undefined}
                appearance="icon-solid" iconOnly label={label} icon={
                  <span className="hosting-sidebar-social-icon">
                    <AssetIcon src={monochrome} monochrome tone="icon-info" size={sidebarSocialIconSize} />
                    <AssetIcon src={logo} size={sidebarSocialIconSize} />
                  </span>
                } />
            )
            return concept ? <Fragment key={label}>{renderLink()}</Fragment>
              : <Tooltip key={label} content={tooltip} placement="top">{renderLink}</Tooltip>
          })}
        </nav>}
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
        {!integrator && <div className="hosting-more-social-links" role="group" aria-label="Социальные сети">
          {socialLinks.map(({ label, href, logo }) => (
            <IconButton key={label} as="a" href={href} target="_blank" rel="noopener noreferrer"
              appearance="icon-solid" size={44} iconOnly label={label} icon={<AssetIcon src={logo} size={22} />} />
          ))}
        </div>}
      </nav>
    </main>
  )
}

export default function HostingShell({
  children, renderSection, initialSection = 'Дашборд', initialScreenState = null,
  onSectionChange, onScreenStateChange, getPageStates, keepScreenStateOnNavigation,
  isCurrentSection, getIntegratorBalance, onIntegratorDeposit, hostingBalance,
}) {
  const [toast, setToast] = useState(null)
  const [selected, setSelected] = useState(initialSection)
  const [menuOpen, setMenuOpen] = useState(false)
  const [conceptSidebarCollapsed, setConceptSidebarCollapsed] = useState(false)
  const [dark, setDark] = useState(readDarkTheme)
  const [screenState, setScreenState] = useState({ id: initialScreenState, version: 0 })
  const [dashboardLoad, setDashboardLoad] = useState(() => isDashboardSection(initialSection) ? {} : null)
  const [previewView, setPreviewView] = useState(readPreviewView)
  const [narrowViewport, setNarrowViewport] = useState(() => window.matchMedia(compactViewport).matches)
  const menuToggleRef = useRef(null)
  const pending = useRef(null)
  const [leaveDialog, setLeaveDialog] = useState(null)
  const compact = previewView === 'mobile' || narrowViewport
  const loginSelected = selected === loginSection
  const conceptLayout = !compact && selected === dashboardConceptSection
  const moreOpen = compact && menuOpen
  const integrator = Object.values(integratorPages).includes(selected)
  const dashboardSelected = isDashboardSection(selected)

  useEffect(() => {
    if (!dashboardLoad) return
    const timer = window.setTimeout(() => setDashboardLoad(current => current === dashboardLoad ? null : current), 500)
    return () => window.clearTimeout(timer)
  }, [dashboardLoad])

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
    if (label === integratorKnowledge) return
    const opensDashboard = isDashboardSection(label)
    if (!opensDashboard && label === selected && (isCurrentSection?.(label, tab) ?? true)) {
      setMenuOpen(false)
      return
    }
    navigate(() => {
      if (moreOpen && document.activeElement?.closest('#hosting-more')) menuToggleRef.current?.focus({ preventScroll: true })
      const integratorNavigation = integrator && Object.values(integratorPages).includes(label)
      const keepState = !opensDashboard && (label === selected || integratorNavigation || keepScreenStateOnNavigation?.(screenState.id, label))
      if (!keepState) {
        const returningFromScenario = opensDashboard && label === selected && !dashboardLayoutIds.includes(screenState.id)
        setScreenState(current => ({ id: null, version: returningFromScenario ? current.version + 1 : current.version }))
      }
      setDashboardLoad(opensDashboard ? {} : null)
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

  function changeScreenState(id) {
    setScreenState(current => ({ ...current, id }))
    onScreenStateChange?.(id, selected)
  }

  const initialState = dashboardSelected && !moreOpen ? typicalDashboard
    : { id: 'initial', label: loginSelected ? 'Базовая форма' : 'Исходное состояние' }
  const presets = moreOpen ? [] : (getPageStates?.(selected) ?? []).filter(state => state.requiresPreset && state.id !== initialState.id)
  const states = [initialState, ...presets]
  const activeState = presets.some(state => state.id === screenState.id) ? screenState.id : initialState.id
  const content = renderSection ? renderSection(selected, selectSection, dark, screenState.id, compact, Boolean(dashboardLoad), changeScreenState) : children

  return (
    <div className="hosting-shell" data-theme={dark ? 'dark' : 'light'} data-view={previewView} data-compact={compact}
      data-integrator={integrator || undefined} data-dashboard-concept-layout={conceptLayout || undefined}
      data-concept-sidebar-collapsed={conceptLayout && conceptSidebarCollapsed || undefined}
      style={{ ...vhThemes[dark ? 'dark' : 'light'], ...darkBannerTokens }}>
      {conceptLayout && <Sidebar selected={selected} onSelect={selectSection} integrator={integrator} dark={dark}
        collapsed={conceptSidebarCollapsed} onToggle={() => setConceptSidebarCollapsed(current => !current)} />}
      {loginSelected ? <main aria-label={loginSection}>
        <Fragment key={screenState.version}>{content}</Fragment>
      </main> : <>
        <div data-dashboard-header-notice="" />
        <HostingHeader
          compact={compact}
          conceptLayout={conceptLayout}
          menuOpen={moreOpen}
          onToggleMenu={() => setMenuOpen(open => !open)}
          menuToggleRef={menuToggleRef}
          selected={selected}
          onSelect={selectSection}
          dark={dark}
          onToggleTheme={() => setDark(value => !value)}
          onSignOut={() => selectSection(loginSection)}
          integrator={integrator}
          integratorBalance={integrator ? getIntegratorBalance?.(screenState.id) : undefined}
          hostingBalance={hostingBalance}
          onDeposit={() => {
            setMenuOpen(false)
            if (!integratorProgramSections.includes(selected)) selectSection(integratorSection)
            onIntegratorDeposit?.()
          }}
        />
        <div className="hosting-workspace-viewport">
          <div className="hosting-workspace-content">
            <div className="hosting-frame hosting-layout" data-section={moreOpen ? undefined : selected}>
              {!compact && !conceptLayout && selected !== designSystemSection && <Sidebar selected={selected} onSelect={selectSection} integrator={integrator} />}
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
      </>}
      <PrototypeToolbar selected={selected} integrator={integrator} isCurrentSection={isCurrentSection} onSelect={selectSection}
        states={states} activeState={activeState}
        onChooseState={id => {
          const switchingLayout = dashboardSelected && !moreOpen && dashboardLayoutIds.includes(id) && dashboardLayoutIds.includes(screenState.id)
          setMenuOpen(false)
          setDashboardLoad(null)
          setScreenState(current => ({ id, version: switchingLayout ? current.version : current.version + 1 }))
          onScreenStateChange?.(id, selected)
          if (!switchingLayout) window.scrollTo(0, 0)
        }}
        previewView={previewView} onPreviewChange={changePreview} />
      <HostingToast toast={toast} setToast={setToast} />
      {leaveDialog && <LeaveCheckoutDialog title={leaveDialog.title} description={leaveDialog.description}
        checkoutLabel={leaveDialog.checkoutLabel} leaveLabel={leaveDialog.leaveLabel} onClose={action => {
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
