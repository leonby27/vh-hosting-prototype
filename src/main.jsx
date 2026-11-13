import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import colors from '../colors.json'
import colorsUrl from '../colors.json?url'
import typography from '../typography.json'
import typographyUrl from '../typography.json?url'
import './styles.css'
import HostingShell from './HostingShell.jsx'
import Dashboard from './Dashboard.jsx'
import TariffSettings from './TariffSettings.jsx'
import { topUpStates } from './balance-top-up-states.js'
import PlanChangesPreview from './PlanChangesPreview.jsx'
import { planChangeScenarios } from './PlanChangesScenarios.jsx'
import SitesSection from './SitesSection.jsx'
import { antivirusStates } from './antivirus-states.js'
import { networkProtectionStates } from './network-protection-states.js'

const { collection, paintStyles, source } = colors
const { textStyles } = typography
const colorGroups = new Map()
for (const variable of collection.variables) {
  const group = variable.name.split('/')[0]
  if (!colorGroups.has(group)) colorGroups.set(group, [])
  colorGroups.get(group).push(variable)
}
const variablesById = new Map(collection.variables.map(variable => [variable.id, variable]))
const exportDate = new Intl.DateTimeFormat('ru', {
  dateStyle: 'long',
  timeZone: 'UTC',
}).format(new Date(source.readDate))

function Table({ headings, children }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Swatch({ value }) {
  if (value?.type === 'VARIABLE_ALIAS') {
    return <code>{variablesById.get(value.id)?.name ?? value.id}</code>
  }

  if (!value?.hex) return <span aria-label="Нет значения">—</span>

  return (
    <span className="swatch">
      <span className="swatch-sample" style={{ backgroundColor: value.hex }} aria-hidden="true" />
      <code>{value.hex}</code>
    </span>
  )
}

function Colors() {
  return (
    <section id="colors" aria-labelledby="colors-title">
      <h2 id="colors-title">Цвета</h2>
      <p className="section-meta">
        {collection.variables.length} переменных · {collection.modes.map(mode => mode.name).join(' и ')}
        {' · '}<a href={colorsUrl} download="colors.json">Скачать JSON</a>
      </p>
      {[...colorGroups].map(([group, variables]) => (
        <details key={group} open={group === 'Base' || undefined}>
          <summary>{group} <span>{variables.length}</span></summary>
          <Table headings={['Переменная', ...collection.modes.map(mode => mode.name)]}>
            {variables.map(variable => (
              <tr key={variable.id}>
                <th scope="row">{variable.name}</th>
                {collection.modes.map(mode => (
                  <td key={mode.modeId}><Swatch value={variable.valuesByMode[mode.modeId]} /></td>
                ))}
              </tr>
            ))}
          </Table>
        </details>
      ))}
      <details>
        <summary>Стили заливки <span>{paintStyles.length}</span></summary>
        <Table headings={['Стиль', 'Цвет']}>
          {paintStyles.map(style => (
            <tr key={style.id}>
              <th scope="row">{style.name}</th>
              <td>
                <div className="paint-list">
                  {style.paints.map((paint, index) => (
                    <Swatch key={index} value={paint} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </details>
    </section>
  )
}

function formatMeasure({ unit, value }) {
  if (unit === 'AUTO') return 'Auto'
  return unit === 'PERCENT' ? `${value}%` : `${value} px`
}

function Typography() {
  const families = [...new Set(textStyles.map(style => style.fontName.family))]
  return (
    <section id="typography" aria-labelledby="typography-title">
      <h2 id="typography-title">Типографика</h2>
      <p className="section-meta">
        {families.join(', ')} · Стили ({textStyles.length})
        {' · '}<a href={typographyUrl} download="typography.json">Скачать JSON</a>
      </p>
      <Table headings={['Стиль', 'Начертание', 'Размер', 'Высота строки', 'Межбуквенный интервал']}>
        {textStyles.map(style => (
          <tr key={style.id}>
            <th scope="row">{style.name}</th>
            <td>{style.fontName.style}</td>
            <td>{style.fontSize} px</td>
            <td>{formatMeasure(style.lineHeight)}</td>
            <td>{formatMeasure(style.letterSpacing)}</td>
          </tr>
        ))}
      </Table>
    </section>
  )
}

function DesignSystemCatalog() {
  return (
    <main className="catalog">
      <header>
        <h1>VH Design System</h1>
        <p className="section-meta">
          Выгрузка из Figma от <time dateTime={source.readDate}>{exportDate}</time>
        </p>
        <nav aria-label="Разделы">
          <a href="./">К дашборду</a>
          <a href="#colors">Цвета</a>
          <a href="#typography">Типографика</a>
          <a href={source.url}>Библиотека в Figma</a>
        </nav>
      </header>
      <Colors />
      <Typography />
    </main>
  )
}

const query = new URLSearchParams(window.location.search)
const showCatalog = query.has('catalog')
const planChangesSection = 'Что изменится'
const sitesSection = 'Сайты'
const tariffSection = 'Настройки тарифа'
const planChangesStates = [
  { id: 'saved-card', label: 'Динамический блок с сохранённой картой' },
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

function syncPrototypeLocation(section, tab = 'mine') {
  const url = new URL(window.location.href)
  if (section !== planChangesSection) url.searchParams.delete('changes')
  if (section === tariffSection) url.searchParams.set('tariff', tab === 'services' ? tab : '')
  else url.searchParams.delete('tariff')
  if (section === sitesSection) url.searchParams.set('sites', tab)
  else url.searchParams.delete('sites')
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url)
}

function HostingApp() {
  const requestedTab = query.get('sites')
  const [sitesTab, setSitesTab] = useState(['antivirus', 'network-protection'].includes(requestedTab) ? requestedTab : 'mine')
  const [tariffTab, setTariffTab] = useState(query.get('tariff') === 'services' ? 'services' : 'tariff')
  const initialSection = query.has('changes') ? planChangesSection : query.has('sites') ? sitesSection : query.has('tariff') ? tariffSection : 'Дашборд'

  function selectSection(section, tab = 'mine') {
    if (section === sitesSection) setSitesTab(tab)
    if (section === tariffSection) setTariffTab(tab === 'services' ? tab : 'tariff')
    syncPrototypeLocation(section, tab)
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
    if (section === 'Дашборд') return topUpStates
    if (section === planChangesSection) return planChangesStates
    if (section === tariffSection && tariffTab === 'services') return tariffServiceStates
    if (section === sitesSection && sitesTab === 'antivirus') return antivirusStates
    if (section === sitesSection && sitesTab === 'network-protection') return networkProtectionStates
    return []
  }

  function renderSection(section, onSelect, dark, screenState, compact) {
    if (section === 'Дашборд') return <Dashboard onSelect={onSelect} dark={dark} compact={compact} screenState={screenState} />
    if (section === planChangesSection) {
      const scenario = planChangeScenarios.find(entry => screenState === `scenario-${entry.id}`)
      return <PlanChangesPreview startsWithSavedCard={screenState === 'saved-card'} scenario={scenario} />
    }
    if (section === tariffSection) {
      const scenario = tariffServiceStates.find(state => state.id === screenState)
      return <TariffSettings compact={compact} tab={tariffTab} scenario={scenario}
        onTabChange={selectTariffTab} onSecurity={tab => {
          onSelect(sitesSection, tab)
          window.scrollTo(0, 0)
        }} />
    }
    if (section === sitesSection) {
      return <SitesSection tab={sitesTab} onTabChange={selectSitesTab} dark={dark} screenState={screenState} compact={compact} />
    }
    return null
  }

  return (
    <HostingShell
      initialSection={initialSection}
      onSectionChange={selectSection}
      getPageStates={getPageStates}
      renderSection={renderSection}
    />
  )
}

createRoot(document.getElementById('root')).render(showCatalog ? <DesignSystemCatalog /> : <HostingApp />)
