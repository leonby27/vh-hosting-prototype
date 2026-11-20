import { lazy, Suspense, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { designSystemSection } from './design-system-section.js'
import './styles.css'
import HostingShell from './HostingShell.jsx'
import Dashboard from './Dashboard.jsx'
import TariffSettings from './TariffSettings.jsx'
import { topUpStates } from './balance-top-up-states.js'
import PlanChangesPreview from './PlanChangesPreview.jsx'
import { planChangeScenarios } from './PlanChangesScenarios.jsx'
import SitesSection from './SitesSection.jsx'
import ApiAgents, { apiTabs } from './ApiAgents.jsx'
import { apiAgentsSection, apiKeysPreset } from './api-agents-data.js'
import { antivirusStates } from './antivirus-states.js'
import { networkProtectionStates } from './network-protection-states.js'
import IntegratorPanel from './IntegratorPanel.jsx'
import { getIntegratorDemo, integratorPages, integratorSection, integratorSettings, integratorSettingsTabs, integratorStates, integratorTabs, money } from './integrator-data.js'

const DesignSystemCatalog = lazy(() => import('./DesignSystemCatalog.jsx'))
const query = new URLSearchParams(window.location.search)
const planChangesSection = 'Что изменится'
const sitesSection = 'Сайты'
const tariffSection = 'Настройки тарифа'
const planChangesStates = [
  { id: 'saved-card', label: 'Динамический блок с сохранённой картой' },
  { id: 'sufficient-balance', label: 'Достаточно средств на балансе', requiresPreset: true },
  ...planChangeScenarios.map(scenario => ({ id: `scenario-${scenario.id}`, label: scenario.title })),
]
const tariffServiceStates = [
  { id: 'services-plus', label: 'Подключён пакет «Плюс»', appliedPackage: 'plus' },
  { id: 'services-premium', label: 'Подключён пакет «Премиум»', appliedPackage: 'premium' },
  { id: 'services-checkout', label: 'Подключение пакета «Плюс»', packageId: 'plus' },
  { id: 'services-upgrade', label: 'Переход на «Премиум»', appliedPackage: 'plus', packageId: 'premium' },
  { id: 'services-downgrade', label: 'Переход на «Плюс»', appliedPackage: 'premium', packageId: 'plus' },
  { id: 'services-connected', label: 'Подключены дополнительные услуги', serviceIds: ['backups', 'builder'] },
]

function getPrototypeStates(section, tab) {
  if (Object.values(integratorPages).includes(section)) return integratorStates
  if (section === 'Дашборд') return topUpStates
  if (section === planChangesSection) return planChangesStates
  if (section === tariffSection && (!tab || tab === 'services')) return tariffServiceStates
  if (section === apiAgentsSection && (!tab || tab === 'keys')) return [apiKeysPreset]
  if (section === sitesSection) {
    if (!tab) return [...antivirusStates, ...networkProtectionStates]
    if (tab === 'antivirus') return antivirusStates
    if (tab === 'network-protection') return networkProtectionStates
  }
  return []
}

function replacePrototypeUrl(url) {
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

function syncPrototypeLocation(section, tab = 'mine', keepState = true) {
  const url = new URL(window.location.href)
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
  if (section === apiAgentsSection) url.searchParams.set('api', tab === 'mine' ? 'connection' : tab)
  else url.searchParams.delete('api')
  const integratorPage = Object.keys(integratorPages).find(page => integratorPages[page] === section)
  if (integratorPage) url.searchParams.set('integrator', integratorPage)
  else url.searchParams.delete('integrator')
  if (section === integratorSection && tab !== 'clients') url.searchParams.set('ptab', tab)
  else url.searchParams.delete('ptab')
  if (section === integratorSettings && tab !== 'account') url.searchParams.set('settings-tab', tab)
  else url.searchParams.delete('settings-tab')
  if (!keepState) url.searchParams.delete('state')
  replacePrototypeUrl(url)
}

function syncPrototypeState(id, section) {
  const url = new URL(window.location.href)
  if (getPrototypeStates(section).length) url.searchParams.set('state', id)
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
  const [integratorTab, setIntegratorTab] = useState(() => readTab(integratorTabs, query.get('ptab')))
  const [settingsTab, setSettingsTab] = useState(() => readTab(integratorSettingsTabs, query.get('settings-tab')))
  const [integratorDemos, setIntegratorDemos] = useState({})
  const [integratorPayment, setIntegratorPayment] = useState(null)
  const initialSection = query.has('integrator') ? (Object.hasOwn(integratorPages, query.get('integrator')) ? integratorPages[query.get('integrator')] : integratorSection) :
    query.has('catalog') ? designSystemSection : query.has('changes') ? planChangesSection : query.has('sites') ? sitesSection : query.has('tariff') ? tariffSection : query.has('api') ? apiAgentsSection : 'Дашборд'
  const requestedState = query.get('state')
  const initialScreenState = requestedState === 'initial' || getPrototypeStates(initialSection).some(state => state.id === requestedState)
    ? requestedState : null

  function selectSection(section, tab = 'mine', keepState) {
    if (section === sitesSection) setSitesTab(tab)
    if (section === apiAgentsSection) setApiTab('connection')
    if (section === tariffSection) setTariffTab(tab === 'services' ? tab : 'tariff')
    if (section === integratorSection) {
      tab = readTab(integratorTabs, tab)
      setIntegratorTab(tab)
    }
    if (section === integratorSettings) {
      tab = readTab(integratorSettingsTabs, tab)
      setSettingsTab(tab)
    }
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

  function renderSection(section, onSelect, dark, screenState, compact) {
    if (Object.values(integratorPages).includes(section)) {
      const scenario = integratorScenario(screenState)
      return <IntegratorPanel section={section} tab={section === integratorSettings ? settingsTab : integratorTab}
        scenario={scenario} onTabChange={tab => selectSection(section, tab, true)}
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
      return <ApiAgents tab={apiTab} keys={apiKeys} setKeys={setApiKeys} compact={compact} showDemoKeys={screenState === apiKeysPreset.id} onTabChange={tab => {
        setApiTab(tab)
        syncPrototypeLocation(apiAgentsSection, tab)
      }} />
    }
    if (section === 'Дашборд') return <Dashboard onSelect={onSelect} dark={dark} compact={compact} screenState={screenState} />
    if (section === planChangesSection) {
      const scenario = planChangeScenarios.find(entry => screenState === `scenario-${entry.id}`)
      return <PlanChangesPreview startsWithSavedCard={screenState === 'saved-card'}
        startsWithSufficientBalance={screenState === 'sufficient-balance'} scenario={scenario} />
    }
    if (section === tariffSection) {
      const scenario = tariffServiceStates.find(state => state.id === screenState)
      return <TariffSettings compact={compact} tab={tariffTab} scenario={scenario}
        onTabChange={selectTariffTab} onSecurity={tab => onSelect(sitesSection, tab)} />
    }
    if (section === sitesSection) {
      return <SitesSection tab={sitesTab} onTabChange={selectSitesTab} screenState={screenState} compact={compact} />
    }
    return null
  }

  return (
    <HostingShell
      initialSection={initialSection}
      initialScreenState={initialScreenState}
      onSectionChange={selectSection}
      onScreenStateChange={syncPrototypeState}
      isCurrentSection={(section, tab) => section === sitesSection ? sitesTab === (tab ?? 'mine')
        : section === tariffSection ? tariffTab === (tab === 'services' ? tab : 'tariff')
          : section === apiAgentsSection ? !tab || apiTab === tab
            : section === integratorSection ? integratorTab === readTab(integratorTabs, tab)
              : section === integratorSettings ? settingsTab === readTab(integratorSettingsTabs, tab) : true}
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
