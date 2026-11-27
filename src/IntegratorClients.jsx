import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import BalanceTopUp from './BalanceTopUp.jsx'
import { PlanChangesEmpty } from './PlanChanges.jsx'
import clientsIcon from './assets/hosting/partner.svg'
import createAccountIcon from './assets/integrator/create-account.png'
import { Button, Chip, Choice, Dialog, DropdownItems, Icon, IconButton, MultiSelect, PopoverMenu, SearchField, SortHeader, Surface, TableFrame, TextField } from './ui/index.js'
import { daysLabel, daysLeft, money } from './integrator-data.js'

const terms = [['30', 'До месяца'], ['180', 'До полугода'], ['365', 'До года'], ['custom', 'Своя сумма']]
const reserves = ['7', '14', '30'].map(value => ({ value, label: `Пополнять на ${daysLabel(Number(value))}` }))
// Временно скрыто; оставляем настройки для возможного возвращения.
const showAutoTopUpSettings = false
const clientCountPlural = new Intl.PluralRules('ru-RU')
const clientCountWords = { one: 'клиент', few: 'клиента', many: 'клиентов', other: 'клиента' }
const filters = {
  week: { label: 'Меньше 7 дней', matches: client => client.balance > 0 && daysLeft(client) <= 7 },
  low: { label: 'Меньше 100 ₽', matches: client => client.balance > 0 && client.balance < 100 },
  blocked: { label: 'Заблокированные', matches: client => client.balance === 0 },
}
const filterOptions = Object.entries(filters).map(([value, { label }]) => ({ value, label }))
const periodOptions = [
  { value: 'month', label: 'Месячный' },
  { value: 'year', label: 'Годовой' },
]

function clientBalancePriority(client) {
  if (filters.blocked.matches(client)) return 0
  return filters.week.matches(client) ? 1 : 2
}

function IntegratorChips({ label, options, value, onChange, children }) {
  return <div className="integrator-chips" role="group" aria-label={label}>
    {options.map(([id, text]) => (
      <Chip key={id} size={40} selected={id === value} onSelect={() => onChange(id)}>{text}</Chip>
    ))}
    {children}
  </div>
}

export function IntegratorTable({ label, children, className = '', empty }) {
  if (empty) return <Surface appearance="card" padding="none" className="plan-changes-card" aria-label={label}>
    <PlanChangesEmpty {...empty} />
  </Surface>
  return <TableFrame className="integrator-table-scroll" label={label} appearance="surface">
    <table className={`integrator-table ${className}`.trim()}>{children}</table>
  </TableFrame>
}

function Remaining({ client, prefix = '' }) {
  return client.balance === 0
    ? <span className="integrator-blocked">Заблокирован</span>
    : prefix + daysLabel(daysLeft(client))
}

function availableAmount(client, term) {
  return Math.max(0, Math.ceil(client.rate * Number(term) - client.balance))
}

function AutoTopUpSettings({ reserve, onChange }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)

  useLayoutEffect(() => {
    if (!open) return
    const anchor = root.current
    const trigger = anchor.querySelector('button')
    const menu = anchor.querySelector('.integrator-auto-menu')

    function positionMenu() {
      const { left, top, bottom } = trigger.getBoundingClientRect()
      const spaceBelow = window.innerHeight - bottom
      const opensAbove = spaceBelow < menu.offsetHeight + 6 && top > spaceBelow
      const x = Math.max(8, Math.min(left, window.innerWidth - menu.offsetWidth - 8))
      anchor.dataset.side = opensAbove ? 'top' : 'bottom'
      anchor.style.setProperty('--integrator-auto-menu-x', `${x}px`)
      anchor.style.setProperty('--integrator-auto-menu-y', `${opensAbove ? top - menu.offsetHeight - 6 : bottom + 6}px`)
    }

    positionMenu()
    window.addEventListener('scroll', positionMenu, true)
    window.addEventListener('resize', positionMenu)
    return () => {
      window.removeEventListener('scroll', positionMenu, true)
      window.removeEventListener('resize', positionMenu)
    }
  }, [open])

  return <div ref={root} className="integrator-auto-settings">
    <PopoverMenu open={open} onOpenChange={setOpen} optionSize={40} panelClassName="integrator-auto-menu" panelLabel="Запас автопополнения"
      renderTrigger={props => <IconButton {...props} label="Настройки автопополнения" size={24} data-hover-as-pressed
        icon={<Icon name="adjust2-outline" size={16} className="integrator-auto-settings-icon" />} />}>
      {close => <DropdownItems selection items={reserves.map(option => ({ ...option, selected: option.value === reserve }))}
        onSelect={value => { onChange(value); close() }} />}
    </PopoverMenu>
  </div>
}

export function IntegratorClients({ demo, compact, createOpen, onCloseCreate, onTopUp, onCreateInvoice, updateDemo, draft, setDraft }) {
  const [search, setSearch] = useState('')
  const [selectedTariffs, setSelectedTariffs] = useState([])
  const [selectedPeriods, setSelectedPeriods] = useState([])
  const [selectedBalanceFilters, setSelectedBalanceFilters] = useState([])
  const [balanceOrder, setBalanceOrder] = useState('none')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [clientName, setClientName] = useState('')
  const [confirm, setConfirm] = useState(false)
  const customAmountInput = useRef(null)
  const { clients, balance, reserve = '14' } = demo
  const tariffs = [...new Set(clients.map(client => client.tariff))].sort((first, second) => first.localeCompare(second, 'ru'))
  const tariffOptions = tariffs.map(value => ({ value, label: value }))
  const { term, selected, customAmount } = draft
  const needle = search.trim().toLowerCase()
  const rows = clients.filter(client => (!selectedBalanceFilters.length || selectedBalanceFilters.some(filter => filters[filter].matches(client)))
    && (!selectedTariffs.length || selectedTariffs.includes(client.tariff))
    && (!selectedPeriods.length || selectedPeriods.includes(client.billingPeriod))
    && `${client.id} ${client.name}`.toLowerCase().includes(needle))
  if (balanceOrder === 'none') {
    rows.sort((first, second) => clientBalancePriority(first) - clientBalancePriority(second))
  } else {
    const direction = balanceOrder === 'ascending' ? 1 : -1
    rows.sort((first, second) => direction * (first.balance - second.balance))
  }
  const emailAddress = email.trim().toLowerCase()
  const duplicate = clients.some(client => client.email?.toLowerCase() === emailAddress)
  const selectedInList = rows.filter(client => selected.has(client.id)).length
  const allSelected = rows.length > 0 && selectedInList === rows.length
  const hasSelection = selected.size > 0
  useEffect(() => {
    if (term === 'custom' && hasSelection) customAmountInput.current?.focus()
  }, [term, hasSelection])
  const transfers = clients.filter(client => selected.has(client.id))
    .map(client => ({ id: client.id, amount: term === 'custom' ? customAmount : availableAmount(client, term) }))
    .filter(item => item.amount > 0)
  const total = transfers.reduce((sum, item) => sum + item.amount, 0)
  const canTransfer = total > 0 && total <= 10000000
  const balanceAfterTransfer = total > balance
    ? `Не хватает ${money(total - balance)}`
    : `Останется ${money(balance - total)}`

  function createClient(event) {
    event.preventDefault()
    if (!emailAddress || !clientName.trim() || duplicate || !event.currentTarget.reportValidity()) return
    const baseId = emailAddress.split('@')[0].replace(/[^a-z0-9-]/g, '-') || 'client'
    let id = baseId
    for (let suffix = 2; clients.some(client => client.id === id); suffix++) id = `${baseId}-${suffix}`
    const createdAt = Date.now()
    updateDemo(current => ({
      ...current, clients: [...current.clients, {
        id, name: clientName.trim(), fullName: fullName.trim(), email: emailAddress,
        tariff: 'Optimo', billingPeriod: 'month', rate: 12.5, balance: 0, automatic: false, createdAt,
      }],
    }))
    setSelectedBalanceFilters([])
    setSelectedTariffs([])
    setSelectedPeriods([])
    setSearch('')
    closeCreate()
  }

  function closeCreate() {
    onCloseCreate()
    setEmail('')
    setFullName('')
    setClientName('')
  }

  function setSelection(ids, checked) {
    setDraft(current => {
      const next = new Set(current.selected)
      ids.forEach(id => checked ? next.add(id) : next.delete(id))
      return { ...current, selected: next }
    })
  }

  function changeTerm(value) {
    setDraft(current => ({ ...current, term: value, customAmount: value === 'custom' ? current.customAmount : 0 }))
    if (value === 'custom') customAmountInput.current?.focus()
  }

  function transfer(amount, savedMethod, balanceAmount) {
    if (!canTransfer || amount !== total || balanceAmount > balance) return
    const byId = new Map(transfers.map(item => [item.id, item.amount]))
    const id = crypto.randomUUID()
    const date = new Date().toLocaleDateString('sv-SE')
    const description = `Пополнение счетов · ${transfers.length}`
    const operations = []
    const externalAmount = Math.round((amount - balanceAmount) * 100) / 100
    if (externalAmount > 0) operations.push({ id, date, type: 'Пополнение', description, amount: externalAmount })
    if (balanceAmount > 0) operations.push({ id: id + '-transfer', date, type: 'Перевод клиентам', description, amount: -balanceAmount })
    updateDemo(current => {
      if (current.balance < balanceAmount) return current
      return {
        ...current, balance: Math.round((current.balance - balanceAmount) * 100) / 100,
        savedMethods: savedMethod && !(current.savedMethods ?? []).some(method => method.id === savedMethod.id)
          ? [...(current.savedMethods ?? []), savedMethod] : current.savedMethods,
        clients: current.clients.map(client => byId.has(client.id) ? { ...client, balance: client.balance + byId.get(client.id) } : client),
        operations: [...operations, ...current.operations],
      }
    })
    setDraft(current => ({ ...current, selected: new Set(), customAmount: 0 }))
    setConfirm(false)
  }

  function prepareTopUp(clientId) {
    onTopUp(clientId)
  }

  function setAutomatic(id, checked) {
    updateDemo(current => ({
      ...current, clients: current.clients.map(client => client.id === id ? { ...client, automatic: checked } : client),
    }))
  }

  return <>
    <section className="integrator-client-list">
      <div className="integrator-client-tools">
        <div className="integrator-filter-toolbar" inert={hasSelection}>
          <SearchField size={40} variant="toolbar" label="Поиск по клиентам" placeholder="Логин или название"
            value={search} onChange={event => setSearch(event.target.value)} />
          <MultiSelect size={40} variant="toolbar" label="Тариф" hideLabel placeholder="Все тарифы"
            options={tariffOptions} value={selectedTariffs} onChange={setSelectedTariffs} />
          <MultiSelect size={40} variant="toolbar" label="Период" hideLabel placeholder="Все периоды"
            options={periodOptions} value={selectedPeriods} onChange={setSelectedPeriods} />
          <MultiSelect size={40} variant="toolbar" label="Фильтр баланса" hideLabel placeholder="Любой баланс"
            options={filterOptions} value={selectedBalanceFilters} onChange={setSelectedBalanceFilters} />
        </div>
        <section className="integrator-total" aria-label="Итог пополнения" inert={!hasSelection}>
          <IntegratorChips label="Период пополнения" options={terms} value={term} onChange={changeTerm}>
            <div className="integrator-custom-amount-slot" data-open={term === 'custom'}
              inert={term !== 'custom'} aria-hidden={term !== 'custom' ? true : undefined}>
                <TextField className="integrator-custom-amount-field" ref={customAmountInput} size={40}
                  label="Сумма на каждого клиента" hideLabel caption="₽" placeholder="Сумма" inputMode="numeric"
                  value={customAmount || ''} onChange={event => {
                    if (/^\d{0,9}$/.test(event.target.value)) {
                      const amount = Number(event.target.value)
                      setDraft(current => ({ ...current, customAmount: amount }))
                    }
                  }} />
            </div>
          </IntegratorChips>
          <div className="integrator-total-summary">
            <div aria-live="polite">
              <strong>{money(total)}</strong>
              <small title={balanceAfterTransfer}>{balanceAfterTransfer}</small>
            </div>
            <Button size={40} disabled={!canTransfer} onClick={() => setConfirm(true)}>Пополнить</Button>
          </div>
        </section>
      </div>
      <div className="integrator-client-table-group">
        <AnimatedBlock>
          <IntegratorTable label="Список клиентов" className="integrator-client-table" empty={!rows.length && {
            icon: clientsIcon,
            title: clients.length ? 'Клиенты не найдены' : 'Клиентов пока нет',
            description: clients.length ? 'Измените запрос или параметры фильтров.' : 'Создайте аккаунт клиента, чтобы он появился в списке.',
          }}>
            <thead>
              <tr>
                <th scope="col" className="integrator-client-select"><Choice size={20} aria-label="Выбрать всех в списке" checked={allSelected}
                  indeterminate={!allSelected && selectedInList > 0} disabled={!rows.length}
                  onChange={event => setSelection(rows.map(client => client.id), event.target.checked)} /></th>
                <th scope="col">Клиент</th>
                <SortHeader sortType="number" className="integrator-client-columns" icon="arrowup-outline" iconButtonLabel="Сортировать по балансу"
                  direction={balanceOrder} onChange={setBalanceOrder}>Баланс</SortHeader>
                <th scope="col" className="integrator-client-auto">
                  <div className="integrator-client-auto-heading">
                    Автопополнение
                    {showAutoTopUpSettings && <AutoTopUpSettings reserve={reserve}
                      onChange={value => updateDemo(current => ({ ...current, reserve: value }))} />}
                  </div>
                </th>
                <th scope="col" className="integrator-table-action" aria-label="Действия" />
              </tr>
            </thead>
            <tbody>
              {rows.map(client => {
                const checked = selected.has(client.id)
                const balanceDetails = <div className="integrator-table-lines">
                  <span className="integrator-table-primary">{money(client.balance)}</span>
                  <small className="integrator-client-balance-period" data-low-days={filters.week.matches(client) || undefined}>
                    <Remaining client={client} prefix="Хватит ещё на " />
                  </small>
                </div>
                return <tr key={client.id} data-selectable data-selected={checked || undefined}
                  onClick={event => {
                    if (!event.target.closest('.vh-choice, input, button, a')) setSelection([client.id], !checked)
                  }}>
                  <td className="integrator-client-select"><Choice size={20} aria-label={`Выбрать ${client.id}`} checked={checked}
                    onChange={event => setSelection([client.id], event.target.checked)} /></td>
                  <th scope="row">
                    <div className="integrator-table-lines">
                      <Button appearance="text" pressable={false} className="integrator-link">{client.id}</Button>
                      <small>{client.tariff} · {client.billingPeriod === 'year' ? 'годовой' : 'месячный'}</small>
                    </div>
                    <div className="integrator-mobile-details integrator-muted">{balanceDetails}</div>
                  </th>
                  <td className="integrator-client-columns">{balanceDetails}</td>
                  <td className="integrator-client-auto"><Choice kind="switch" aria-label={`Автопополнение для ${client.id}`} checked={client.automatic}
                    onChange={event => setAutomatic(client.id, event.target.checked)} /></td>
                  <td className="integrator-table-action">
                    <Button variant="neutral-solid" size={36}
                      aria-label={`Пополнить счёт клиента ${client.id}`} onClick={() => prepareTopUp(client.id)}>Пополнить</Button>
                  </td>
                </tr>
              })}
            </tbody>
          </IntegratorTable>
        </AnimatedBlock>
      </div>
    </section>
    <Dialog open={createOpen} className="integrator-create-account" title="Создать аккаунт"
      description="Пароль для входа придёт на указанный email." closeOnBackdrop={!email && !clientName && !fullName} onClose={closeCreate}
      illustration={<img src={createAccountIcon} alt="" />}>
      <form className="integrator-create-account-form" onSubmit={createClient}>
        <TextField label="Email" type="email" autoComplete="email" required value={email}
          error={duplicate ? 'Аккаунт с таким email уже есть' : ''} onChange={event => setEmail(event.target.value)} />
        <TextField label="Название клиента" required value={clientName} onChange={event => setClientName(event.target.value)} />
        <TextField label="ФИО представителя клиента" autoComplete="name" placeholder="Необязательно" value={fullName}
          onChange={event => setFullName(event.target.value)} />
        <Button size={44} type="submit" disabled={duplicate || !emailAddress || !clientName.trim()}>Создать аккаунт</Button>
      </form>
    </Dialog>
    {confirm && <BalanceTopUp forClients compact={compact} title="Пополнить счёт выбранных клиентов"
      description={`${clientCountPlural.select(selected.size) === 'one' ? 'Выбран' : 'Выбрано'} ${selected.size} ${clientCountWords[clientCountPlural.select(selected.size)]}`}
      initialAmount={total} amountDisabled availableBalance={balance} savedMethods={demo.savedMethods ?? []}
      onUnlink={id => updateDemo(current => ({ ...current, savedMethods: (current.savedMethods ?? []).filter(method => method.id !== id) }))}
      onCreateInvoice={onCreateInvoice} onPay={transfer} onClose={() => setConfirm(false)} />}
  </>
}
