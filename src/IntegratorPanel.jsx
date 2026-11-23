import { useContext, useEffect, useState } from 'react'
import BalanceTopUp from './BalanceTopUp.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Button, Choice, Dialog, HostingToastContext, Icon, IconButton, Link, MultiSelect, PageHeader, SearchField, Select, SortHeader, Surface, TabList, TextField, TooltipBubble } from './ui/index.js'
import { IntegratorClients, IntegratorTable } from './IntegratorClients.jsx'
import { countRecentClients, dateLabel, daysLabel, daysLeft, integratorKnowledge, integratorNews, integratorPages, integratorProgramSections, integratorSection, integratorSettings,
  integratorSettingsTabs, integratorSupport, money, organization } from './integrator-data.js'
import './integrator.css'

const newDraft = () => ({ term: '365', selected: new Set(), customAmount: 0 })
const depositBonus = amount => Math.round(amount * 40) / 100
const clientTopUpPresets = [500, 1000, 3000]
const operationTypes = [['Пополнение', 'Пополнения'], ['Премия', 'Премии'],
  ['Перевод клиентам', 'Переводы клиентам'], ['Автопополнение', 'Автопополнение']]
  .map(([value, label]) => ({ value, label }))
const operationPeriods = [['30', '30 дней'], ['90', '3 месяца'], ['365', 'Год'], ['all', 'За всё время']]
  .map(([value, label]) => ({ value, label }))
const notifications = [
  { label: 'Клиенту хватит баланса меньше чем на 7 дней', icon: 'wallete-solid', channel: 'Письмо' },
  { label: 'Автопополнение не прошло: не хватило баланса', icon: 'alert-solid', channel: 'Письмо' },
  { label: 'Начислена премия', icon: 'present-solid', channel: 'Письмо' },
  { label: 'Выставлен счёт', icon: 'receipt-solid', channel: 'Письмо' },
  { label: 'Клиенту хватит баланса меньше чем на 3 дня', icon: 'wallete-solid', channel: 'SMS' },
]
const requisites = [
  ['Организация и плательщик', organization],
  ['Подписант', 'Смирнов Алексей Викторович'],
  ['Счёт для выплат', 'Уральский банк ПАО Сбербанк · •••• 4417'],
  ['ИНН', '6658123456'],
  ['КПП', '665801001'],
  ['БИК', '046577964'],
]

function normalizeSearch(value) {
  return value.trim().toLowerCase().replaceAll('ё', 'е').replace(/\s+/g, ' ')
}

function matchesTableSearch(query, row, ...labels) {
  return !query || normalizeSearch([...labels, dateLabel(row.date), money(row.amount), row.amount].join(' ')).includes(query)
}

function savePaymentMethod(methods = [], method) {
  return method && !methods.some(saved => saved.id === method.id) ? [...methods, method] : methods
}

function IntegratorOperations({ operations }) {
  const [search, setSearch] = useState('')
  const [types, setTypes] = useState([])
  const [period, setPeriod] = useState('90')
  const [sort, setSort] = useState({ key: 'date', direction: 'descending' })
  const cutoff = Date.now() - Number(period) * 86400000
  const query = normalizeSearch(search)
  const rows = operations.filter(row => (!types.length || types.includes(row.type))
    && (period === 'all' || new Date(row.date).getTime() >= cutoff)
    && matchesTableSearch(query, row, row.type, row.description))
  if (sort.direction !== 'none') {
    const direction = sort.direction === 'ascending' ? 1 : -1
    rows.sort((first, second) => direction * (sort.key === 'amount' ? first.amount - second.amount : first.date.localeCompare(second.date)))
  }

  return <div className="integrator-table-section">
    <div className="integrator-filter-toolbar">
      <SearchField label="Поиск по операциям" placeholder="Поиск по операциям" variant="toolbar" size={40}
        value={search} onChange={event => setSearch(event.target.value)} />
      <MultiSelect label="Тип операции" hideLabel placeholder="Все операции" variant="toolbar" size={40}
        options={operationTypes} value={types} onChange={setTypes} />
      <Select label="Период" hideLabel variant="toolbar" size={40}
        options={operationPeriods} value={period} onChange={setPeriod} />
    </div>
    <AnimatedBlock>
      <IntegratorTable label="Операции по балансу" className="integrator-operations-table">
        <thead>
          <tr>
            <SortHeader className="integrator-table-date" icon="arrowup-outline" iconButtonLabel="Сортировать по дате"
              direction={sort.key === 'date' ? sort.direction : 'none'} onChange={direction => setSort({ key: 'date', direction })}>Дата</SortHeader>
            <th scope="col">Операция</th>
            <SortHeader className="integrator-table-amount" icon="arrowup-outline" iconButtonLabel="Сортировать по сумме"
              direction={sort.key === 'amount' ? sort.direction : 'none'} onChange={direction => setSort({ key: 'amount', direction })}>Сумма</SortHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => <tr key={row.id}>
            <td>{dateLabel(row.date)}</td>
            <th scope="row">
              <div className="integrator-table-lines">
                <span className="integrator-table-primary">{row.type}</span>
                <small>{row.description}</small>
              </div>
            </th>
            <td className="integrator-table-primary">{row.amount > 0 ? '+' : ''}{money(row.amount)}</td>
          </tr>)}
          {!rows.length && <tr><td colSpan={3}>{query ? 'Операции не найдены' : 'Нет операций за выбранный период'}</td></tr>}
        </tbody>
      </IntegratorTable>
    </AnimatedBlock>
  </div>
}

function IntegratorDocuments({ documents, onDetails, onInvoice }) {
  const [document, setDocument] = useState(null)
  const [search, setSearch] = useState('')
  const query = normalizeSearch(search)
  const rows = documents.filter(row => matchesTableSearch(query, row, row.title, row.status, organization))
  return <>
    <div className="integrator-table-section">
      <div className="integrator-documents-toolbar">
        <SearchField label="Поиск по документам" placeholder="Поиск по документам"
          variant="toolbar" size={40} value={search} onChange={event => setSearch(event.target.value)} />
        <div className="integrator-documents-actions">
          <Button variant="neutral-solid" size={40} onClick={onDetails}>Мои реквизиты</Button>
          <Button size={40} onClick={onInvoice}>Выставить счёт</Button>
        </div>
      </div>
      <IntegratorTable label="Документы" className="integrator-documents-table">
        <thead>
          <tr>
            <th scope="col" className="integrator-table-date">Дата</th>
            <th scope="col">Документ</th>
            <th scope="col" className="integrator-table-amount">Сумма</th>
            <th scope="col" className="integrator-table-status">Статус</th>
            <th scope="col" className="integrator-table-action" aria-label="Открытие документа" />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => <tr key={row.id}>
            <td>{dateLabel(row.date)}</td>
            <th scope="row">
              <div className="integrator-table-lines">
                <span className="integrator-table-primary">{row.title}</span>
                <small>{organization}</small>
              </div>
            </th>
            <td className="integrator-table-primary">{money(row.amount)}</td>
            <td>{row.status}</td>
            <td className="integrator-table-action"><Button variant="neutral-solid" size={36} onClick={() => setDocument(row)}>Открыть</Button></td>
          </tr>)}
          {!rows.length && <tr><td colSpan={5}>{query ? 'Документы не найдены' : 'Документов пока нет'}</td></tr>}
        </tbody>
      </IntegratorTable>
    </div>
    <Dialog open={Boolean(document)} title={document?.title} onClose={() => setDocument(null)}>
      {document && <dl className="integrator-metrics">
        <div><dt>Плательщик</dt><dd>{organization}</dd></div>
        <div><dt>Дата</dt><dd>{dateLabel(document.date)}</dd></div>
        <div><dt>Сумма</dt><dd>{money(document.amount)}</dd></div>
        <div><dt>Статус</dt><dd>{document.status}</dd></div>
      </dl>}
    </Dialog>
  </>
}

function RequisiteRow({ label, value }) {
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 2000)
    return () => clearTimeout(timer)
  }, [feedback])

  async function copy() {
    let message = 'Скопировано'
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      message = 'Не удалось скопировать'
    }
    setFeedback({ message })
  }

  return <div className="integrator-requisite">
    <dt>{label}</dt>
    <dd>
      <span>{value}</span>
      <span className="integrator-requisite-action" data-feedback={feedback ? '' : undefined}>
        <IconButton size={24} label={`Скопировать: ${label}`} icon={<Icon name="copy-outline" size={16} />} onClick={copy} />
        <TooltipBubble className="integrator-requisite-feedback" role="status">{feedback?.message}</TooltipBubble>
      </span>
    </dd>
  </div>
}

function IntegratorDetails() {
  return <Surface elevation="card" className="integrator-card">
    <dl className="integrator-metrics">
      {requisites.map(([label, value]) => <RequisiteRow key={label} label={label} value={value} />)}
    </dl>
  </Surface>
}

function IntegratorNotifications({ demo, updateDemo }) {
  const values = demo.notifications ?? [true, true, true, true, false]
  return <ul className="integrator-notification-list">
    {notifications.map(({ label, icon, channel }, index) => <li key={label}>
      <Surface as="label" appearance="card" elevation="card" className="integrator-notification">
        <span className="integrator-notification-icon"><Icon name={icon} /></span>
        <span><strong>{label}</strong><small>{channel}</small></span>
        <Choice as="span" kind="switch" aria-label={label} checked={values[index]} onChange={event => {
          const checked = event.target.checked
          updateDemo(current => ({ ...current, notifications: (current.notifications ?? values).map((value, entry) => entry === index ? checked : value) }))
        }} />
      </Surface>
    </li>)}
  </ul>
}

function IntegratorSettings({ tab, onTabChange, demo, updateDemo }) {
  const account = demo.account ?? { name: 'Мой кабинет', email: 'demo@example.com' }
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState(account.name)
  const [email, setEmail] = useState(account.email)
  const [copyStatus, setCopyStatus] = useState('')

  function save(event) {
    event.preventDefault()
    if (!name.trim()) return
    updateDemo(current => ({ ...current, account: { name: name.trim(), email } }))
    setEdit(false)
  }

  return <>
    <PageHeader title="Настройки" />
    <TabList idPrefix="integrator-settings" label="Настройки аккаунта" tabs={integratorSettingsTabs} value={tab} onChange={onTabChange} />
    <AnimatedBlock>
      <Surface elevation="card" className="integrator-card hosting-reveal" role="tabpanel" key={tab}
        id={`integrator-settings-panel-${tab}`} aria-labelledby={`integrator-settings-tab-${tab}`}>
        {tab === 'account' && <>
          <PageHeader as="h2" title="Кабинет" actions={<Button variant="neutral" onClick={() => {
            setName(account.name)
            setEmail(account.email)
            setEdit(true)
          }}>Изменить</Button>} />
          <dl className="integrator-metrics">
            <div><dt>Название кабинета</dt><dd>{account.name}</dd></div>
            <div><dt>Идентификатор</dt><dd>cu203223 <Button appearance="text" pressable={false} type="button" className="integrator-link" onClick={async () => {
              try {
                await navigator.clipboard.writeText('cu203223')
                setCopyStatus('Скопировано')
              } catch {
                setCopyStatus('Не удалось скопировать')
              }
            }}>Скопировать</Button> <span role="status">{copyStatus}</span></dd></div>
            <div><dt>Почта для документов</dt><dd>{account.email}</dd></div>
          </dl>
        </>}
        {tab === 'users' && <><h2>Пользователи</h2><ul className="integrator-rows"><li><strong>cu203223</strong><span>Владелец кабинета</span></li></ul></>}
        {tab === 'security' && <><h2>Доступ и безопасность</h2><p>Параметры доступа для аккаунта cu203223.</p>
          <Link href="https://timeweb.com/ru/docs/">Инструкции по защите аккаунта</Link></>}
        {tab === 'history' && <><h2>История действий</h2><p>Действий в настройках пока нет.</p></>}
      </Surface>
    </AnimatedBlock>
    <Dialog open={edit} title="Данные кабинета" onClose={() => setEdit(false)}>
      <form className="integrator-form" onSubmit={save}>
        <TextField label="Название кабинета" required value={name} onChange={event => setName(event.target.value)} />
        <TextField label="Почта для документов" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
        <Button type="submit">Сохранить</Button>
      </form>
    </Dialog>
  </>
}

function InfoPage({ section }) {
  if (section === integratorKnowledge) return <>
    <PageHeader title="База знаний" />
    <Surface elevation="card" className="integrator-card"><h2>Документация Timeweb</h2>
      <p>Инструкции по партнёрской программе, оплате и работе с аккаунтом.</p>
      <Link href="https://timeweb.com/ru/docs/" target="_blank" rel="noreferrer">Открыть базу знаний Timeweb</Link>
    </Surface>
  </>
  if (section === integratorSupport) return <>
    <PageHeader title="Поддержка" />
    <Surface elevation="card" className="integrator-card"><h2>Связаться с Timeweb</h2>
      <Link href="https://timeweb.com/ru/contacts/" target="_blank" rel="noreferrer">Контакты и каналы поддержки</Link>
    </Surface>
  </>
  if (section === integratorNews) return <>
    <PageHeader title="Новости" />
    <Surface elevation="card" className="integrator-card"><h2>Панель интегратора</h2>
      <p>Баланс для клиентов, пополнение и документы доступны в партнёрской программе.</p>
    </Surface>
  </>
  return null
}

function ClientSummary({ balance, clients, onDeposit, onCreate }) {
  return <div className="integrator-summary">
    <div className="integrator-summary-cards">
      <Surface as="section" appearance="card" elevation="card" className="integrator-summary-column hosting-reveal"
        aria-label="Баланс для клиентов">
        <div className="integrator-balance-stat">
          <span>Баланс для клиентов</span>
          <strong>{money(balance)}</strong>
          <small>{organization}</small>
        </div>
        <div className="integrator-balance-footer">
          <Button icon={<Icon name="wallete-solid" size={16} />} onClick={onDeposit}>Пополнить баланс</Button>
          <small className="integrator-balance-bonus">
            <Icon name="present-solid" size={16} />
            <span>Премия 40% с каждого пополнения</span>
          </small>
        </div>
      </Surface>
      <Surface as="section" appearance="card" elevation="card" className="integrator-summary-column hosting-reveal"
        aria-label="Клиенты">
        <div className="integrator-balance-stat">
          <span>Клиенты</span>
          <strong>{clients.length}</strong>
          <small>Добавлено {countRecentClients(clients)} за последние 30 дней</small>
        </div>
        <Button variant="outline" tone="accent" icon={<Icon name="add-solid" size={16} />} onClick={onCreate}>Создать аккаунт</Button>
      </Surface>
    </div>
  </div>
}

export default function IntegratorPanel({ section, compact, tab, scenario, demo, updateDemo, onTabChange, onSelectSection, payment, setPayment }) {
  const [draft, setDraft] = useState(newDraft)
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [createClientOpen, setCreateClientOpen] = useState(false)
  const [topUpClientId, setTopUpClientId] = useState(null)
  const showToast = useContext(HostingToastContext)
  const clientsSection = section === integratorSection
  const topUpClient = clientsSection && demo.clients.find(client => client.id === topUpClientId)

  function closeInvoice() {
    setPayment(null)
    setInvoiceAmount('')
  }

  function submitInvoice(event) {
    event.preventDefault()
    const amount = Number(invoiceAmount)
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10000000) return
    createInvoice(amount)
    closeInvoice()
  }

  function createInvoice(amount) {
    const id = crypto.randomUUID()
    const date = new Date().toLocaleDateString('sv-SE')
    updateDemo(current => ({ ...current, documents: [
      { id, date, title: 'Счёт № ' + id.slice(0, 6).toUpperCase(), amount, status: 'Ожидает оплаты' }, ...current.documents,
    ] }))
  }

  function completeDeposit(amount, savedMethod) {
    const id = crypto.randomUUID()
    const date = new Date().toLocaleDateString('sv-SE')
    const bonus = depositBonus(amount)
    updateDemo(current => ({
      ...current,
      balance: Math.round((current.balance + amount + bonus) * 100) / 100,
      savedMethods: savePaymentMethod(current.savedMethods, savedMethod),
      operations: [
        { id: id + '-bonus', date, type: 'Премия', description: 'Премия 40 % за пополнение', amount: bonus },
        { id, date, type: 'Пополнение', description: 'Пополнение баланса для клиентов', amount },
        ...current.operations,
      ],
    }))
    showToast({ message: `Баланс для клиентов пополнен на ${money(amount + bonus)} с учётом премии`, success: true })
  }

  function completeClientTopUp(amount, savedMethod, balanceAmount) {
    const id = crypto.randomUUID()
    const date = new Date().toLocaleDateString('sv-SE')
    const externalAmount = Math.round((amount - balanceAmount) * 100) / 100
    const description = `Пополнение баланса клиента ${topUpClient.id}`
    const operations = []
    if (externalAmount > 0) operations.push({ id, date, type: 'Пополнение', description, amount: externalAmount })
    if (balanceAmount > 0) operations.push({
      id: id + '-transfer', date, type: 'Перевод клиентам', description: `${description} с баланса для клиентов`, amount: -balanceAmount,
    })
    updateDemo(current => current.balance < balanceAmount ? current : ({
      ...current,
      balance: Math.round((current.balance - balanceAmount) * 100) / 100,
      savedMethods: savePaymentMethod(current.savedMethods, savedMethod),
      clients: current.clients.map(client => client.id === topUpClient.id
        ? { ...client, balance: Math.round((client.balance + amount) * 100) / 100 }
        : client),
      operations: [...operations, ...current.operations],
    }))
    setDraft(current => {
      if (!current.selected.has(topUpClient.id)) return current
      const selected = new Set(current.selected)
      selected.delete(topUpClient.id)
      return { ...current, selected }
    })
    showToast({ message: `Баланс клиента ${topUpClient.id} пополнен на ${money(amount)}`, success: true })
  }

  if (!integratorProgramSections.includes(section)) return <div className="integrator-page">
    {section === integratorSettings ? <IntegratorSettings tab={tab} onTabChange={onTabChange} demo={demo} updateDemo={updateDemo} /> : <InfoPage section={section} />}
  </div>

  const formerPartner = scenario === 'integrator-former-partner'
  const documentsSection = section === integratorPages.documents
  const notificationsSection = section === integratorPages.notifications

  return <div className="integrator-page">
    <PageHeader title={section} actions={formerPartner && <span className="integrator-role">Бывший партнёр</span>} />
    {clientsSection ? <>
      <ClientSummary balance={demo.balance} clients={demo.clients}
        onDeposit={() => setPayment('deposit')} onCreate={() => setCreateClientOpen(true)} />
      <IntegratorClients demo={demo} compact={compact}
        createOpen={createClientOpen} onCloseCreate={() => setCreateClientOpen(false)}
        onTopUp={setTopUpClientId} updateDemo={updateDemo} draft={draft} setDraft={setDraft} />
    </> : (
      <div key={section} className="integrator-tab-content hosting-reveal">
        {section === integratorPages.operations && <IntegratorOperations operations={demo.operations} />}
        {documentsSection && <IntegratorDocuments documents={demo.documents}
          onDetails={() => onSelectSection(integratorPages.details)} onInvoice={() => setPayment('invoice')} />}
        {section === integratorPages.details && <IntegratorDetails />}
        {notificationsSection && <IntegratorNotifications demo={demo} updateDemo={updateDemo} />}
      </div>
    )}
    {(topUpClient || payment === 'deposit') && (
      <BalanceTopUp key={topUpClient?.id ?? 'deposit'} forClients compact={compact} savedMethods={demo.savedMethods ?? []}
        description={topUpClient ? `Для клиента ${topUpClient.id}` : undefined}
        amountPresets={topUpClient ? clientTopUpPresets : undefined}
        availableBalance={topUpClient ? demo.balance : undefined}
        describeCredit={topUpClient
          ? amount => <>После пополнения баланса хватит на <strong>{daysLabel(daysLeft(topUpClient, amount))}</strong></>
          : amount => <>С премией 40 % зачислим <strong>{money(amount + depositBonus(amount))}</strong></>}
        onUnlink={id => updateDemo(current => ({ ...current, savedMethods: current.savedMethods.filter(method => method.id !== id) }))}
        onPay={topUpClient ? completeClientTopUp : completeDeposit} onCreateInvoice={createInvoice}
        onClose={() => topUpClient ? setTopUpClientId(null) : setPayment(null)} />
    )}
    <Dialog open={payment === 'invoice'} title="Выставить счёт" description={organization} onClose={closeInvoice}>
      <form className="integrator-form" onSubmit={submitInvoice}>
        <TextField label="Сумма счёта, ₽" type="number" min="1" max="10000000" step="1"
          required value={invoiceAmount} onChange={event => setInvoiceAmount(event.target.value)} />
        <Button type="submit">Выставить счёт</Button>
      </form>
    </Dialog>
  </div>
}
