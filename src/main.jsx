import { lazy, Suspense, useCallback, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { designSystemSection } from './design-system-section.js'
import './styles.css'
import HostingShell from './HostingShell.jsx'
import Dashboard from './Dashboard.jsx'
import DashboardConcept from './DashboardConcept.jsx'
import { dashboardConceptSection, dashboardStates, isDashboardSection, typicalDashboard } from './dashboard-variants.js'
import TariffSettings from './TariffSettings.jsx'
import { tariffStates, tariffServiceStates } from './tariff-states.js'
import { topUpStates } from './balance-top-up-states.js'
import PlanChangesPreview from './PlanChangesPreview.jsx'
import { planChangeScenarios } from './PlanChangesScenarios.jsx'
import SitesSection from './SitesSection.jsx'
import DnsEditorPreview from './DnsEditorPreview.jsx'
import ApiAgents, { apiTabs } from './ApiAgents.jsx'
import { apiAgentsSection, apiKeysPreset, apiJournalEmptyPreset } from './api-agents-data.js'
import { antivirusStates } from './antivirus-states.js'
import { getNetworkProtectionPreset, isNetworkDomainProtected, networkAttackStates, networkProtectionStates } from './network-protection-states.js'
import IntegratorPanel from './IntegratorPanel.jsx'
import Login from './Login.jsx'
import { loginSection, loginScenarios } from './login-scenarios.js'
import { getIntegratorDemo, integratorPages, integratorSection, integratorStates, money } from './integrator-data.js'

const DesignSystemCatalog = lazy(() => import('./DesignSystemCatalog.jsx'))
const query = new URLSearchParams(window.location.search)
const hostingBalanceKey = 'vh-hosting-balance'
const planChangesSection = 'Что изменится'
const sitesSection = 'Сайты'
const domainsSection = 'Домены и SSL'
const tariffSection = 'Настройки тарифа'
const planChangesStates = [
  { id: 'saved-card', label: 'Динамический блок с сохранённой картой' },
  { id: 'sufficient-balance', label: 'Достаточно средств на балансе', requiresPreset: true },
  ...planChangeScenarios.map(scenario => ({ id: `scenario-${scenario.id}`, label: scenario.title })),
]

const dashboardAttackStates = networkAttackStates.filter(({ id }) =>
  id === 'protection-attack-multiple' || id === 'protection-attack-unadded')

function getAttackStates(section) {
  if (isDashboardSection(section)) return dashboardAttackStates
  return section === sitesSection ? networkAttackStates : []
}

function getPrototypeStates(section, tab) {
  if (section === loginSection) return loginScenarios
  if (Object.values(integratorPages).includes(section)) return integratorStates
  if (isDashboardSection(section)) return [...dashboardStates, ...topUpStates, ...dashboardAttackStates]
  if (section === planChangesSection) return planChangesStates
  if (section === tariffSection) {
    if (!tab) return [...tariffStates, ...tariffServiceStates]
    return tab === 'tariff' ? tariffStates : tariffServiceStates
  }
  if (section === apiAgentsSection) {
    if (!tab) return [apiKeysPreset, apiJournalEmptyPreset]
    if (tab === 'keys') return [apiKeysPreset]
    if (tab === 'journal') return [apiJournalEmptyPreset]
  }
  if (section === sitesSection) {
    if (!tab) return [...antivirusStates, ...networkProtectionStates]
    if (tab === 'antivirus') return antivirusStates
    if (tab === 'network-protection') return networkProtectionStates
    if (tab === 'mine') return networkAttackStates
  }
  return []
}

function replacePrototypeUrl(url) {
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

function syncPrototypeLocation(section, tab = 'mine', keepState = true) {
  const url = new URL(window.location.href)
  if (section === loginSection) url.searchParams.set('login', '')
  else url.searchParams.delete('login')
  if (section === designSystemSection) url.searchParams.set('catalog', '')
  else if (url.searchParams.has('catalog')) {
    url.searchParams.delete('catalog')
    if (url.hash.startsWith('#component=') || ['#colors', '#typography'].includes(url.hash)) url.hash = ''
  }
  if (section === planChangesSection) url.searchParams.set('changes', '')
  else url.searchParams.delete('changes')
  if (section === tariffSection) url.searchParams.set('tariff', tab === 'services' ? tab : '')
  else url.searchParams.delete('tariff')
  if (section === sitesSection) url.searchParams.set('sites', tab)
  else url.searchParams.delete('sites')
  if (section === domainsSection) url.searchParams.set('dns-editor', '')
  else url.searchParams.delete('dns-editor')
  if (section === apiAgentsSection) url.searchParams.set('api', tab === 'mine' ? 'connection' : tab)
  else url.searchParams.delete('api')
  if (section === dashboardConceptSection) url.searchParams.set('concept', 'dashboard')
  else url.searchParams.delete('concept')
  const integratorPage = Object.keys(integratorPages).find(page => integratorPages[page] === section)
  if (integratorPage) url.searchParams.set('integrator', integratorPage)
  else url.searchParams.delete('integrator')
  url.searchParams.delete('ptab')
  url.searchParams.delete('settings-tab')
  if (!keepState) url.searchParams.delete('state')
  replacePrototypeUrl(url)
}

function syncPrototypeState(id, section) {
  const url = new URL(window.location.href)
  const dashboardHome = isDashboardSection(section) && id === typicalDashboard.id
  const loginHome = section === loginSection && id === 'initial'
  if (!dashboardHome && !loginHome && getPrototypeStates(section).length) url.searchParams.set('state', id)
  else url.searchParams.delete('state')
  replacePrototypeUrl(url)
}

function HostingApp() {
  const requestedTab = query.get('sites')
  const [sitesTab, setSitesTab] = useState(['antivirus', 'network-protection'].includes(requestedTab) ? requestedTab : 'mine')
  const [tariffTab, setTariffTab] = useState(query.get('tariff') === 'services' ? 'services' : 'tariff')
  const requestedApiTab = query.get('api')
  const [apiTab, setApiTab] = useState(apiTabs.some(([id]) => id === requestedApiTab) ? requestedApiTab : 'connection')
  const [apiKeys, setApiKeys] = useState([])
  const [integratorDemos, setIntegratorDemos] = useState({})
  const [integratorPayment, setIntegratorPayment] = useState(null)
  const [hostingBalance, setHostingBalance] = useState(() => {
    try {
      const saved = sessionStorage.getItem(hostingBalanceKey)
      const balance = Number(saved)
      if (saved !== null && Number.isFinite(balance) && balance >= 0) return balance
    } catch {
      // The balance remains available in this page when storage is blocked.
    }
    return 3990
  })
  const currentHostingBalance = useRef(hostingBalance)
  const requestedIntegratorPage = query.get('integrator')
  const legacyIntegratorTab = query.get('ptab')
  const integratorPage = requestedIntegratorPage === 'program' && ['operations', 'documents', 'details'].includes(legacyIntegratorTab)
    ? legacyIntegratorTab : requestedIntegratorPage
  const initialSection = query.has('login') ? loginSection : query.has('integrator') ? (integratorPage === 'details' ? integratorPages.documents : integratorPage === 'notifications' ? integratorPages.settings : Object.hasOwn(integratorPages, integratorPage) ? integratorPages[integratorPage] : integratorSection) :
    query.has('catalog') ? designSystemSection : query.has('changes') ? planChangesSection : query.has('sites') ? sitesSection :
      query.has('tariff') ? tariffSection : query.has('api') ? apiAgentsSection : query.has('dns-editor') ? domainsSection :
        query.get('concept') === 'dashboard' ? dashboardConceptSection : 'Дашборд'
  const requestedState = query.get('state')
  const initialScreenState = requestedState === 'initial' || getPrototypeStates(initialSection).some(state => state.id === requestedState)
    ? requestedState : null
  const [incidentRun, setIncidentRun] = useState(() => ({
    token: {}, statuses: getNetworkProtectionPreset(initialScreenState).statuses, dismissed: false,
  }))
  const incidentToken = incidentRun.token
  const setIncidentStatuses = useCallback(update => {
    setIncidentRun(current => current.token === incidentToken
      ? { ...current, statuses: update(current.statuses) } : current)
  }, [incidentToken])

  function debitHostingBalance(amount) {
    if (currentHostingBalance.current < amount) return false
    const remaining = currentHostingBalance.current - amount
    currentHostingBalance.current = remaining
    setHostingBalance(remaining)
    try {
      sessionStorage.setItem(hostingBalanceKey, String(remaining))
    } catch {
      // The updated balance is still visible in this page.
    }
    return true
  }

  function chooseScreenState(id, section) {
    if (getAttackStates(section).some(state => state.id === id)) {
      setIncidentRun({ token: {}, statuses: getNetworkProtectionPreset(id).statuses, dismissed: false })
    }
    syncPrototypeState(id, section)
  }

  function selectSection(section, tab = 'mine', keepState) {
    if (section === sitesSection) setSitesTab(tab)
    if (section === apiAgentsSection) setApiTab('connection')
    if (section === tariffSection) setTariffTab(tab === 'services' ? tab : 'tariff')
    syncPrototypeLocation(section, tab, keepState)
  }

  function selectTariffTab(tab) {
    setTariffTab(tab)
    syncPrototypeLocation(tariffSection, tab)
  }

  function selectSitesTab(tab) {
    setSitesTab(tab)
    syncPrototypeLocation(sitesSection, tab)
  }

  function getPageStates(section) {
    const tabs = { [tariffSection]: tariffTab, [sitesSection]: sitesTab, [apiAgentsSection]: apiTab }
    return getPrototypeStates(section, tabs[section])
  }

  function renderSection(section, onSelect, dark, screenState, compact, dashboardLoading, onChangeState) {
    if (section === loginSection) {
      return <Login scenario={screenState} compact={compact} onScenarioChange={onChangeState}
        onSignIn={tab => onSelect(tab === 'mail' ? 'Почта' : 'Дашборд')} />
    }
    const incident = getAttackStates(section).some(state => state.id === screenState)
      ? getNetworkProtectionPreset(screenState) : null
    const attackedDomains = incident?.attackedDomains.filter(name => !isNetworkDomainProtected(incidentRun.statuses[name]))
    const addToProtection = Object.keys(incidentRun.statuses).length > 0
    const bannerDomains = attackedDomains?.filter(name =>
      (!addToProtection || !Object.hasOwn(incidentRun.statuses, name)) &&
      !incident.domains.some(domain => domain.name === name && domain.parentDomain))
    const attackNotice = incident && {
      domains: attackedDomains,
      bannerDomains,
      addToProtection,
      onRequestAdd: () => setIncidentRun(current => ({ ...current, requestedDomains: bannerDomains })),
      dismissed: incidentRun.dismissed,
      onDismiss: () => setIncidentRun(current => ({ ...current, dismissed: true })),
    }
    if (Object.values(integratorPages).includes(section)) {
      const scenario = integratorScenario(screenState)
      return <IntegratorPanel section={section} compact={compact}
        payment={integratorPayment} setPayment={setIntegratorPayment}
        demo={integratorDemos[scenario] ?? getIntegratorDemo(scenario)}
        updateDemo={update => setIntegratorDemos(current => ({
          ...current, [scenario]: update(current[scenario] ?? getIntegratorDemo(scenario)),
        }))} />
    }
    if (section === designSystemSection) {
      return (
        <Suspense fallback={<p role="status">Загрузка дизайн-системы…</p>}>
          <DesignSystemCatalog compact={compact} />
        </Suspense>
      )
    }
    if (section === apiAgentsSection) {
      return <ApiAgents tab={apiTab} keys={apiKeys} setKeys={setApiKeys} compact={compact}
        emptyJournal={screenState === apiJournalEmptyPreset.id} showDemoKeys={screenState === apiKeysPreset.id} onTabChange={tab => {
        setApiTab(tab)
        syncPrototypeLocation(apiAgentsSection, tab)
      }} />
    }
    if (isDashboardSection(section)) {
      const DashboardPage = section === dashboardConceptSection ? DashboardConcept : Dashboard
      return <DashboardPage onSelect={onSelect} compact={compact} screenState={screenState}
        attackNotice={attackNotice} refreshing={dashboardLoading} />
    }
    if (section === planChangesSection) {
      const scenario = planChangeScenarios.find(entry => screenState === `scenario-${entry.id}`)
      return <PlanChangesPreview startsWithSavedCard={screenState === 'saved-card'}
        startsWithSufficientBalance={screenState === 'sufficient-balance'} scenario={scenario} />
    }
    if (section === tariffSection) {
      const scenario = getPrototypeStates(section).find(state => state.id === screenState)
      return <TariffSettings compact={compact} tab={tariffTab} scenario={scenario}
        onTabChange={selectTariffTab} onSecurity={tab => onSelect(sitesSection, tab)} />
    }
    if (section === domainsSection) return <DnsEditorPreview />
    if (section === sitesSection) {
      return <SitesSection tab={sitesTab} onTabChange={selectSitesTab} onOpenTariff={() => onSelect(tariffSection)} screenState={screenState} compact={compact}
        availableBalance={hostingBalance} onDebitBalance={debitHostingBalance}
        attackNotice={attackNotice} incidentStatuses={incidentRun.statuses} setIncidentStatuses={setIncidentStatuses}
        requestedAttackDomains={attackNotice && incidentRun.requestedDomains}
        onAttackRequestHandled={() => setIncidentRun(current => ({ ...current, requestedDomains: null }))} />
    }
    return null
  }

  return (
    <HostingShell
      hostingBalance={money(hostingBalance)}
      initialSection={initialSection}
      initialScreenState={initialScreenState}
      onSectionChange={selectSection}
      onScreenStateChange={chooseScreenState}
      keepScreenStateOnNavigation={(id, section) => getAttackStates(section).some(state => state.id === id)}
      isCurrentSection={(section, tab) => section === sitesSection ? sitesTab === (tab ?? 'mine')
        : section === tariffSection ? tariffTab === (tab === 'services' ? tab : 'tariff')
          : section === apiAgentsSection ? !tab || apiTab === tab
            : true}
      getPageStates={getPageStates}
      renderSection={renderSection}
      onIntegratorDeposit={() => setIntegratorPayment('deposit')}
      getIntegratorBalance={state => {
        const scenario = integratorScenario(state)
        return money((integratorDemos[scenario] ?? getIntegratorDemo(scenario)).balance)
      }}
    />
  )
}

function readTab(tabs, id) {
  return tabs.find(tab => tab.id === id)?.id ?? tabs[0].id
}

function integratorScenario(state) {
  return integratorStates.some(option => option.id === state) ? state : 'default'
}

createRoot(document.getElementById('root')).render(<HostingApp />)
