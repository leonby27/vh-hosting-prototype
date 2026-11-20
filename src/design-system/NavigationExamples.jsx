import { useId, useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Choice, DropdownItems, Icon, MenuPanel, Pagination, SearchField, Select, TabList } from '../ui/index.js'
import { defaultSegmentedSize, segmentedSizes } from '../ui/navigation.jsx'
import { Example } from './Preview.jsx'
import { OptionsSelect } from './OptionsSelect.jsx'

const tabDot = <span className="vh-tab-dot" aria-hidden="true" />
const disabledTab = { id: 'disabled', label: 'Недоступная', disabled: true }
const lineTabs = [
  { id: 'one', label: 'Вкладка 1' },
  { id: 'two', label: 'Вкладка 2' },
  { id: 'three', label: 'Вкладка 3', count: 2 },
  { id: 'four', label: 'Вкладка 4', suffix: tabDot },
  disabledTab,
]
const segmentedTabs = [
  { id: 'one', label: 'Вкладка 1', count: 2 },
  { id: 'two', label: 'Вкладка 2', suffix: tabDot },
  { id: 'three', label: 'Вкладка 3' },
  disabledTab,
]
const tabIcons = { one: 'globe-outline', two: 'settings-outline', three: 'cloud-outline', four: 'folder-outline' }
const tabViews = [
  { value: 'plain', label: 'Обычный' },
  { value: 'icons', label: 'С иконками' },
]
const segmentedSizeOptions = segmentedSizes.map(value => ({ value, label: `${value} px` }))

function TabsSample({ title, tabs, variant = 'line', size, surface }) {
  const id = useId()
  const [selected, setSelected] = useState(tabs[0].id)

  return <Example title={title} className="catalog-tab-frame" contrast={variant === 'line'}>
    <TabList tabs={tabs} variant={variant} size={size} surface={surface} controls={false}
      value={selected} onChange={setSelected} idPrefix={id} label={title} />
  </Example>
}

export function TabsExample() {
  const [size, setSize] = useState(defaultSegmentedSize)
  const [view, setView] = useState('plain')

  function tabsWithView(tabs) {
    return view === 'icons' ? tabs.map(tab => ({ ...tab, icon: tabIcons[tab.id] && <Icon name={tabIcons[tab.id]} size={16} /> })) : tabs
  }

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примеров вкладок">
      <Select label="Вид" options={tabViews} value={view} onChange={setView} />
      <Select label="Размер вкладок блоками" options={segmentedSizeOptions} value={size} onChange={setSize} />
    </div>
    <TabsSample title="С линией" tabs={tabsWithView(lineTabs)} />
    <TabsSample title="Блоками" tabs={tabsWithView(segmentedTabs)} variant="segmented" size={size} />
    <TabsSample title="Блоками 2" tabs={tabsWithView(segmentedTabs)} variant="segmented" size={size} surface="page" />
  </div>
}

const base = [
  { value: 'sites', label: 'Сайты', description: 'Управление сайтами', icon: 'globe-outline', shortcut: '⌘ 1' },
  { value: 'mail', label: 'Почта', description: 'Почтовые ящики', icon: 'email-outline', shortcut: '⌘ 2', previewState: 'hover' },
  { value: 'files', label: 'Файлы', description: 'Файловый менеджер', icon: 'folder-outline', shortcut: '⌘ 3' },
  { value: 'backup', label: 'Резервные копии', description: 'История копий', icon: 'cloud-outline', disabled: true },
  { value: 'select', label: 'Селекты', icon: 'list-outline', href: '?catalog#component=select' },
]
const longList = Array.from({ length: 12 }, (_, index) => ({
  value: index,
  label: `Сайт ${index + 1}`,
  description: `site${index + 1}.example`,
  icon: 'globe-outline',
  shortcut: index < 9 ? `⌘ ${index + 1}` : undefined,
}))
const listSizes = [44, 40].map(value => ({ value, label: `${value} px` }))
const menuOptions = [
  { value: 'icons', label: 'Иконки' },
  { value: 'descriptions', label: 'Описания' },
  { value: 'shortcuts', label: 'Сочетания клавиш' },
  { value: 'checkboxes', label: 'С чекбоксами' },
  { value: 'search', label: 'С поиском' },
]

function ListSample({ title, records, initial, size, options }) {
  const [selected, setSelected] = useState(initial)
  const [checked, setChecked] = useState([initial])
  const [query, setQuery] = useState('')
  const withSearch = options.includes('search')
  const withCheckboxes = options.includes('checkboxes')
  const filter = withSearch ? query.trim().toLowerCase() : ''
  const items = records.filter(item => (!withCheckboxes || !item.href) && item.label.toLowerCase().includes(filter)).map(({ icon, description, shortcut, ...item }) => ({
    ...item,
    icon: icon && options.includes('icons') ? <Icon name={icon} size={20} /> : undefined,
    description: options.includes('descriptions') ? description : undefined,
    shortcut: options.includes('shortcuts') ? shortcut : undefined,
    selected: item.value === selected,
  }))

  function changeChecked(value, next) {
    setChecked(current => next ? [...current, value] : current.filter(item => item !== value))
  }

  const rows = withCheckboxes
    ? items.map(item => <Choice key={item.value} size={20} disabled={item.disabled}
      previewState={item.previewState} checked={checked.includes(item.value)}
      onChange={event => changeChecked(item.value, event.target.checked)} label={<>
        {item.icon}
        <span className="vh-list-item-copy">{item.label}{item.description && <small>{item.description}</small>}</span>
        {item.shortcut && <kbd>{item.shortcut}</kbd>}
      </>} />)
    : <DropdownItems items={items} selection onSelect={setSelected} />

  return <Example title={title}>
    <AnimatedBlock>
      <MenuPanel className="catalog-open-list" data-option-size={size} open>
        <AnimatedBlock open={withSearch}>
          <div className="catalog-list-search">
            <SearchField label={`Поиск. ${title}`} placeholder="Поиск по списку" value={query}
              onChange={event => setQuery(event.target.value)} />
          </div>
        </AnimatedBlock>
        <AnimatedBlock>
          {items.length ? rows : <p className="catalog-list-empty" role="status">Ничего не найдено</p>}
        </AnimatedBlock>
      </MenuPanel>
    </AnimatedBlock>
  </Example>
}

export function MenuExample() {
  const [size, setSize] = useState(44)
  const [options, setOptions] = useState([])

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примеров списков">
      <Select label="Высота ячейки" options={listSizes} value={size} onChange={setSize} />
      <OptionsSelect options={menuOptions} value={options} onChange={setOptions} />
    </div>
    <ListSample title="Обычный список" records={base} initial="sites" size={size} options={options} />
    <ListSample title="С прокруткой" records={longList} initial={0} size={size} options={options} />
  </div>
}

export function PaginationExample() {
  const [page, setPage] = useState(1)
  return <Example contrast><div className="catalog-row catalog-centered">
    <Pagination page={page} count={12} onChange={setPage} />
  </div></Example>
}
