import { useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Button, Chip, Choice, Dialog, Dropdown, PageAlert, SearchField, SortHeader, Surface, TableFrame, TextField } from './ui/index.js'
import { daysLabel, daysLeft, money } from './integrator-data.js'

const terms = [['30', 'До месяца'], ['180', 'До полугода'], ['365', 'До года'], ['custom', 'Своя сумма']]
const reserves = ['7', '14', '30'].map(days => [days, daysLabel(Number(days))])
const filters = [
  ['all', 'Все', () => true],
  ['week', 'Хватит ≤ 7 дней', client => client.balance > 0 && daysLeft(client) <= 7],
  ['blocked', 'Заблокированы', client => client.balance === 0],
  ['automatic', 'С автопополнением', client => client.automatic],
]

export function IntegratorChips({ label, options, value, onChange }) {
  return <div className="integrator-chips" role="group" aria-label={label}>
    {options.map(([id, text]) => <Chip key={id} selected={id === value} onSelect={() => onChange(id)}>{text}</Chip>)}
  </div>
}

export function IntegratorTable({ label, children, className = '' }) {
  return <TableFrame className="integrator-table-scroll" label={label}>
    <table className={`integrator-table ${className}`.trim()}>{children}</table>
  </TableFrame>
}

function Remaining({ client }) {
  return client.balance === 0 ? <span className="integrator-blocked">Заблокирован</span> : daysLabel(daysLeft(client))
}

function useClientSort(initialKey) {
  const [sort, setSort] = useState({ key: initialKey, direction: initialKey ? 'ascending' : 'none' })
  const fields = [['balance', 'Баланс'], ['days', 'Осталось']]

  function sortClients(clients) {
    if (sort.direction === 'none') return clients
    const getValue = sort.key === 'balance' ? client => client.balance : daysLeft
    const direction = sort.direction === 'ascending' ? 1 : -1
    return [...clients].sort((first, second) => direction * (getValue(first) - getValue(second)))
  }

  const sortHeaders = fields.map(([key, label]) => <SortHeader className="integrator-client-columns" key={key}
    direction={sort.key === key ? sort.direction : 'none'} onChange={direction => setSort({ key, direction })}>{label}</SortHeader>)
  return { sortClients, sortHeaders }
}

export function IntegratorClients({ clients, balance, updateDemo, onTopUp, onInspect }) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showTariff, setShowTariff] = useState(true)
  const [create, setCreate] = useState(false)
  const [login, setLogin] = useState('')
  const [name, setName] = useState('')
  const { sortClients, sortHeaders } = useClientSort()
  const filterOptions = filters.map(([id, title, matches]) => [id, `${title} ${clients.filter(matches).length}`])
  const matches = filters.find(([id]) => id === filter)[2]
  const needle = search.trim().toLowerCase()
  const rows = sortClients(clients.filter(client => matches(client) && `${client.id} ${client.name}`.toLowerCase().includes(needle)))
  const blocked = clients.filter(filters[2][2]).length
  const warning = clients.filter(filters[1][2]).length
  const id = login.trim().toLowerCase()
  const duplicate = clients.some(client => client.id === id)

  function createClient(event) {
    event.preventDefault()
    if (!id || duplicate || !name.trim()) return
    updateDemo(current => ({
      ...current, clients: [...current.clients, { id, name: name.trim(), tariff: 'Optimo', rate: 12.5, balance: 0, automatic: false }],
    }))
    setFilter('all')
    setSearch('')
    closeCreate()
  }

  function closeCreate() {
    setCreate(false)
    setLogin('')
    setName('')
  }

  return <>
    <AnimatedBlock open={warning > 0 || blocked > 0}>
      <div className="integrator-warning">
        <PageAlert title="Проверьте баланс клиентов"
          description={`До недели осталось у ${warning} · Заблокированы ${blocked} · На балансе для клиентов ${money(balance)}`}
          action={{ label: 'Показать', onClick: () => setFilter(warning ? 'week' : 'blocked') }} />
      </div>
    </AnimatedBlock>
    <Surface as="section" elevation="card" className="integrator-card">
      <div className="integrator-toolbar">
        <SearchField label="Поиск по клиентам" placeholder="Логин или название" value={search} onChange={event => setSearch(event.target.value)} />
        <Button onClick={() => setCreate(true)}>Создать аккаунт</Button>
        <Dropdown className="integrator-client-columns" trigger="Колонки" selection items={[{ value: 'tariff', label: 'Тариф', selected: showTariff }]}
          onSelect={() => setShowTariff(current => !current)} />
      </div>
      <IntegratorChips label="Клиенты" options={filterOptions} value={filter} onChange={setFilter} />
      <AnimatedBlock>
        <IntegratorTable label="Список клиентов" className="integrator-client-table">
          <thead><tr><th scope="col">Клиент</th>{showTariff && <th className="integrator-client-columns" scope="col">Тариф</th>}{sortHeaders}<th scope="col">Действия</th></tr></thead>
          <tbody>
            {rows.map(client => <tr key={client.id}>
              <th scope="row"><Button appearance="text" pressable={false} type="button" className="integrator-link" onClick={() => onInspect(client.id)}>{client.id}</Button>
                <small>{client.name}</small>
                <small className="integrator-mobile-details">{client.tariff} · {money(client.balance)} · <Remaining client={client} /></small></th>
              {showTariff && <td className="integrator-client-columns">{client.tariff}</td>}
              <td className="integrator-client-columns">{money(client.balance)}</td><td className="integrator-client-columns"><Remaining client={client} /></td>
              <td><Button variant="neutral" size={32} aria-label={`Пополнить ${client.id}`} onClick={() => onTopUp(client.id)}>Пополнить</Button></td>
            </tr>)}
            {!rows.length && <tr><td colSpan={showTariff ? 5 : 4}>Клиенты не найдены</td></tr>}
          </tbody>
        </IntegratorTable>
      </AnimatedBlock>
    </Surface>
    <Dialog open={create} title="Создать аккаунт" onClose={closeCreate}>
      <form className="integrator-form" onSubmit={createClient}>
        <TextField label="Логин" required pattern="[A-Za-z0-9\x2D]+" value={login}
          error={duplicate ? 'Такой логин уже есть' : ''} onChange={event => setLogin(event.target.value)} />
        <TextField label="Название" required value={name} onChange={event => setName(event.target.value)} />
        <Button type="submit" disabled={duplicate}>Создать аккаунт</Button>
      </form>
    </Dialog>
  </>
}

function availableAmount(client, term) {
  return Math.max(0, Math.ceil(client.rate * Number(term) - client.balance))
}

export function IntegratorTopUp({ demo, updateDemo, draft, setDraft }) {
  const [confirm, setConfirm] = useState(false)
  const { sortClients, sortHeaders } = useClientSort('days')
  const { term, selected, amounts } = draft
  const { clients, balance, reserve = '14' } = demo
  const rows = sortClients(clients)
  const allSelected = clients.length > 0 && clients.every(client => selected.has(client.id))
  const amountFor = client => amounts[client.id] ?? (term === 'custom' ? '' : availableAmount(client, term))
  const transfers = clients.filter(client => selected.has(client.id) && Number(amountFor(client)) > 0)
    .map(client => ({ id: client.id, amount: Number(amountFor(client)) }))
  const total = transfers.reduce((sum, item) => sum + item.amount, 0)
  const canTransfer = total > 0 && total <= balance
  const automatic = clients.filter(client => client.automatic)
  const monthly = Math.round(automatic.reduce((sum, client) => sum + client.rate, 0) * 30)

  function setSelection(ids, checked) {
    setDraft(current => {
      const next = new Set(current.selected)
      ids.forEach(id => checked ? next.add(id) : next.delete(id))
      return { ...current, selected: next }
    })
  }

  function changeTerm(value) {
    setDraft(current => ({ ...current, term: value, amounts: {} }))
  }

  function changeAmount(id, value) {
    if (!/^\d{0,9}$/.test(value)) return
    setDraft(current => ({ ...current, amounts: { ...current.amounts, [id]: value },
      selected: value ? new Set([...current.selected, id]) : current.selected }))
  }

  function transfer() {
    if (!canTransfer) return
    const byId = new Map(transfers.map(item => [item.id, item.amount]))
    const operation = { id: crypto.randomUUID(), date: new Date().toLocaleDateString('sv-SE'), type: 'Перевод клиентам',
      description: `Пополнение счетов · ${transfers.length}`, amount: -total }
    updateDemo(current => {
      if (current.balance < total) return current
      return {
        ...current, balance: current.balance - total,
        clients: current.clients.map(client => byId.has(client.id) ? { ...client, balance: client.balance + byId.get(client.id) } : client),
        operations: [operation, ...current.operations],
      }
    })
    setDraft(current => ({ ...current, selected: new Set(), amounts: {} }))
    setConfirm(false)
  }

  return <>
    <Surface as="section" elevation="card" className="integrator-card" aria-label="Пополнение клиентов">
      <ol className="integrator-steps"><li>Отметьте клиентов</li><li>Выберите срок</li><li>Проверьте итог</li></ol>
      <div className="integrator-stack">
        <strong>Срок для отмеченных</strong>
        <IntegratorChips label="Срок для отмеченных" options={terms} value={term} onChange={changeTerm} />
      </div>
      <div className="integrator-toolbar integrator-toolbar-between">
        <span className="integrator-muted">Всего клиентов · {clients.length}</span>
        {clients.length > 0 && <Button appearance="text" pressable={false} className="integrator-link" type="button"
          onClick={() => setSelection(clients.filter(client => daysLeft(client) <= 30).map(client => client.id), true)}>
          Отметить всех, у кого ≤ 30 дней, и заблокированных
        </Button>}
      </div>
      <div className="integrator-total" aria-label="Итог пополнения">
        <div aria-live="polite"><strong>{money(total)}</strong>
          <small>{total > balance ? `Не хватает ${money(total - balance)}` :
            `${transfers.length ? `Клиентов: ${transfers.length}` : 'Отметьте клиентов'} · останется ${money(balance - total)}`}</small></div>
        <Button disabled={!canTransfer} onClick={() => setConfirm(true)}>Пополнить</Button>
      </div>
      <IntegratorTable label="Клиенты для пополнения" className="integrator-client-table">
        <thead><tr><th scope="col"><Choice aria-label="Выбрать всех на странице" checked={allSelected}
          indeterminate={!allSelected && selected.size > 0} disabled={!clients.length}
          onChange={event => setSelection(clients.map(client => client.id), event.target.checked)} /></th>
          <th scope="col">Клиент</th>{sortHeaders}<th scope="col">Добавить, ₽</th><th className="integrator-client-columns" scope="col">Хватит на</th></tr></thead>
        <tbody>
          {rows.map(client => {
            const checked = selected.has(client.id)
            const amount = amountFor(client)
            const projection = checked && Number(amount) > 0 ? daysLabel(daysLeft(client, Number(amount))) : null
            return <tr key={client.id}>
              <td><Choice aria-label={`Выбрать ${client.id}`} checked={checked} onChange={event => setSelection([client.id], event.target.checked)} /></td>
              <th scope="row">{client.id}<small>{client.tariff} · {money(client.rate)} в день</small>
                <small className="integrator-mobile-details">{money(client.balance)} · <Remaining client={client} /></small></th>
              <td className="integrator-client-columns">{money(client.balance)}</td><td className="integrator-client-columns"><Remaining client={client} /></td>
              <td><TextField className="integrator-amount" label={`Сколько добавить клиенту ${client.id}, ₽`} hideLabel
                size={36} inputMode="numeric" placeholder="0" value={checked ? amount : ''} onChange={event => changeAmount(client.id, event.target.value)} />
                {projection && <small className="integrator-mobile-details">На {projection}</small>}</td>
              <td className="integrator-client-columns">{projection ?? '—'}</td>
            </tr>
          })}
          {!rows.length && <tr><td colSpan={6}>Нет клиентов для пополнения</td></tr>}
        </tbody>
      </IntegratorTable>
    </Surface>
    <Surface as="section" elevation="card" className="integrator-card" aria-labelledby="integrator-auto">
      <h2 id="integrator-auto">Автопополнение</h2>
      <p>Каждую ночь пополняем счета клиентов с баланса для клиентов. Если средств не хватит, отправим письмо.</p>
      <div className="integrator-stack"><strong>Держать запас на</strong>
        <IntegratorChips label="Запас, дней" options={reserves} value={reserve}
          onChange={value => updateDemo(current => ({ ...current, reserve: value }))} /></div>
      <dl className="integrator-metrics">
        <div><dt>Расход в месяц · {automatic.length} на автопополнении</dt><dd>{money(monthly)}</dd></div>
        {monthly > 0 && <div><dt>Баланс для клиентов хватит на</dt><dd>{daysLabel(Math.floor(balance * 30 / monthly))}</dd></div>}
      </dl>
      <ul className="integrator-rows">
        {clients.map(client => <li key={client.id}>
          <div><strong>{client.id}</strong><small>{client.tariff} · {money(client.rate)} в день</small></div>
          <Choice kind="switch" aria-label={`Автопополнение для ${client.id}`} checked={client.automatic}
            onChange={event => {
              const checked = event.target.checked
              updateDemo(current => ({ ...current, clients: current.clients.map(row => row.id === client.id ? { ...row, automatic: checked } : row) }))
            }} />
        </li>)}
        {!clients.length && <li>Нет клиентов для автопополнения</li>}
      </ul>
    </Surface>
    <Dialog open={confirm} title="Подтвердите пополнение" description={`С баланса для клиентов спишется ${money(total)}.`}
      onClose={() => setConfirm(false)} actions={<><Button variant="neutral" onClick={() => setConfirm(false)}>Отмена</Button>
        <Button disabled={!canTransfer} onClick={transfer}>Пополнить</Button></>} />
  </>
}
