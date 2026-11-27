import { useContext, useEffect, useState } from 'react'
import BalanceTopUp from './BalanceTopUp.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Badge, Button, Choice, Dialog, HostingToastContext, Icon, IconButton, Link, MultiSelect, PageHeader, SearchField, Select, SortHeader, Surface, TextField, Tooltip } from './ui/index.js'
import { IntegratorClients, IntegratorTable } from './IntegratorClients.jsx'
import { countRecentClients, dateLabel, daysLabel, daysLeft, integratorKnowledge, integratorNews, integratorPages, integratorProgramSections, integratorSection, integratorSettings,
  integratorSupport, money, organization } from './integrator-data.js'
import './integrator.css'
import operationsIcon from './assets/hosting/logs.svg'
import documentsIcon from './assets/hosting/files.svg'

const newDraft = () => ({ term: '365', selected: new Set(), customAmount: 0 })
const depositBonus = amount => Math.round(amount * 40) / 100
const clientTopUpPresets = [1000, 3000, 5000, 10000, 20000]
const documentStatusTones = { 'Оплачен': 'success', 'Подписан': 'info', 'Ожидает оплаты': 'warning' }
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
  ['Счёт для выплат', '•••• 4417'],
  ['Банк', 'Уральский банк ПАО Сбербанк'],
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
  const [sort, setSort] = useState({ key: 'date', direction: 'none' })
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
      <IntegratorTable label="Операции по балансу" className="integrator-operations-table" empty={!rows.length && {
        icon: operationsIcon,
        title: !operations.length ? 'Операций пока нет' : query ? 'Операции не найдены' : 'Нет операций за выбранный период',
        description: operations.length ? 'Измените запрос, период или параметры фильтров.' : 'Здесь появится история пополнений и переводов клиентам.',
      }}>
        <thead>
          <tr>
            <SortHeader sortType="date" className="integrator-table-date" icon="arrowup-outline" iconButtonLabel="Сортировать по дате"
              direction={sort.key === 'date' ? sort.direction : 'none'} onChange={direction => setSort({ key: 'date', direction })}>Дата</SortHeader>
            <th scope="col">Операция</th>
            <SortHeader sortType="number" className="integrator-table-amount" icon="arrowup-outline" iconButtonLabel="Сортировать по сумме"
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
        </tbody>
      </IntegratorTable>
    </AnimatedBlock>
  </div>
}

function IntegratorDocuments({ documents, onInvoice }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const query = normalizeSearch(search)
  const rows = documents.filter(row => matchesTableSearch(query, row, row.title, row.status, organization))
  return <>
    <div className="integrator-table-section">
      <div className="integrator-documents-toolbar">
        <SearchField label="Поиск по документам" placeholder="Поиск по документам"
          variant="toolbar" size={40} value={search} onChange={event => setSearch(event.target.value)} />
        <div className="integrator-documents-actions">
          <Button variant="neutral-solid" size={40} onClick={() => setDetailsOpen(true)}>Мои реквизиты</Button>
          <Button size={40} onClick={onInvoice}>Выставить счёт</Button>
        </div>
      </div>
      <IntegratorTable label="Документы" className="integrator-documents-table" empty={!rows.length && {
        icon: documentsIcon,
        title: documents.length ? 'Документы не найдены' : 'Документов пока нет',
        description: documents.length ? 'Попробуйте изменить поисковый запрос.' : 'Здесь появятся ваши счета и акты.',
      }}>
        <thead>
          <tr>
            <th scope="col" className="integrator-table-date">Дата</th>
            <th scope="col" className="integrator-table-document">Документ</th>
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
            <td><Badge tone={documentStatusTones[row.status] ?? 'neutral'}>{row.status}</Badge></td>
            <td className="integrator-table-action"><Button variant="neutral-solid" size={36}>Открыть</Button></td>
          </tr>)}
        </tbody>
      </IntegratorTable>
    </div>
    <Dialog open={detailsOpen} width={560} className="integrator-requisites-dialog" title="Мои реквизиты" onClose={() => setDetailsOpen(false)}>
      <IntegratorDetails />
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
      <Tooltip className="integrator-requisite-action" content={feedback?.message ?? 'Скопировать'} pressable>
        {id => <IconButton className="integrator-requisite-copy" size={24} label={`Скопировать: ${label}`}
          aria-describedby={id} icon={<Icon name="copy-outline" size={16} />} onClick={copy} />}
      </Tooltip>
    </dd>
  </div>
}

function IntegratorDetails() {
  return <dl className="integrator-metrics">
      {requisites.map(([label, value]) => <RequisiteRow key={label} label={label} value={value} />)}
  </dl>
}

function IntegratorNotifications({ demo, updateDemo }) {
  const showToast = useContext(HostingToastContext)
  const values = demo.notifications ?? [true, true, true, true, false]
  return <ul className="integrator-notification-list">
    {notifications.map(({ label, icon, channel }, index) => <li key={label}>
      <Surface as="label" appearance="card" elevation="card" className="integrator-notification">
        <span className="integrator-notification-icon" data-enabled={values[index]}><Icon name={icon} /></span>
        <span><strong>{label}</strong><small>{channel}</small></span>
        <Choice as="span" kind="switch" aria-label={label} checked={values[index]} onChange={event => {
          const checked = event.target.checked
          updateDemo(current => ({ ...current, notifications: (current.notifications ?? values).map((value, entry) => entry === index ? checked : value) }))
          showToast({ message: checked ? 'Уведомления включены' : 'Уведомления выключены', success: true })
        }} />
      </Surface>
    </li>)}
  </ul>
}

function IntegratorSettings({ demo, updateDemo }) {
  const account = demo.account ?? { name: 'Мой кабинет', email: 'demo@example.com' }
  const [edit, setEdit] = useState(null)
  const [value, setValue] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false)
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const showToast = useContext(HostingToastContext)

  function closePassword() {
    setPasswordOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setCurrentPasswordVisible(false)
    setNewPasswordVisible(false)
  }

  function changePassword(event) {
    event.preventDefault()
    if (!currentPassword || !newPassword) return
    closePassword()
    showToast({ message: 'Пароль успешно изменён', success: true })
  }

  function startEdit(field) {
    setValue(account[field])
    setEdit(field)
  }

  function save(event) {
    event.preventDefault()
    if (!edit || !value.trim()) return
    updateDemo(current => ({ ...current, account: { ...account, ...current.account, [edit]: value.trim() } }))
    setEdit(null)
  }

  const settings = [
    { id: 'name', label: 'Название кабинета', value: account.name, icon: 'profile-solid', action: () => startEdit('name') },
    { id: 'email', label: 'Почта для документов', value: account.email, icon: 'mail-solid', action: () => startEdit('email') },
    { id: 'password', label: 'Пароль', value: 'Для входа в кабинет', icon: 'lock-solid', action: () => setPasswordOpen(true) },
  ]

  return <>
    <PageHeader title="Настройки" />
    <section className="integrator-settings-section" aria-labelledby="integrator-management-title">
    <h2 className="integrator-settings-section-title" id="integrator-management-title">Управление</h2>
    <ul className="integrator-notification-list">
      {settings.map(setting => <li key={setting.id}>
        <Surface appearance="card" elevation="card" className="integrator-setting hosting-reveal">
          <span className="integrator-notification-icon"><Icon name={setting.icon} /></span>
          <div className="integrator-setting-copy"><strong>{setting.label}</strong><small>{setting.value}</small></div>
          <Button variant="neutral-solid" size={40} onClick={setting.action}>
            Изменить
          </Button>
        </Surface>
      </li>)}
    </ul>
    </section>
    <section className="integrator-settings-section" aria-labelledby="integrator-notifications-title">
      <h2 className="integrator-settings-section-title" id="integrator-notifications-title">Уведомления</h2>
      <IntegratorNotifications demo={demo} updateDemo={updateDemo} />
    </section>
    <Dialog open={Boolean(edit)} className="integrator-edit-account" title={edit === 'name' ? 'Название кабинета' : 'Почта для документов'}
      closeOnBackdrop={value === account[edit]} onClose={() => setEdit(null)}>
      <form className="integrator-edit-account-form" onSubmit={save}>
        <TextField label={edit === 'name' ? 'Название кабинета' : 'Почта для документов'}
          type={edit === 'email' ? 'email' : 'text'} required value={value} onChange={event => setValue(event.target.value)} />
        <Button size={44} type="submit" disabled={!value.trim()}>Сохранить</Button>
      </form>
    </Dialog>
    <Dialog open={passwordOpen} className="integrator-edit-account" title="Изменить пароль"
      closeOnBackdrop={!currentPassword && !newPassword} onClose={closePassword}>
      <form className="integrator-edit-account-form" onSubmit={changePassword}>
        <div className="integrator-password-fields">
          <TextField label="Текущий пароль" type={currentPasswordVisible ? 'text' : 'password'} autoComplete="current-password" required
            value={currentPassword} onChange={event => setCurrentPassword(event.target.value)}
            trailing={<IconButton appearance="quiet" size={32} label={currentPasswordVisible ? 'Скрыть текущий пароль' : 'Показать текущий пароль'}
              aria-pressed={currentPasswordVisible} icon={<Icon name={currentPasswordVisible ? 'eyehide-outline' : 'eye-outline'} size={20} />}
              onClick={() => setCurrentPasswordVisible(visible => !visible)} />} />
          <TextField label="Новый пароль" type={newPasswordVisible ? 'text' : 'password'} autoComplete="new-password" required
            value={newPassword} onChange={event => setNewPassword(event.target.value)}
            trailing={<IconButton appearance="quiet" size={32} label={newPasswordVisible ? 'Скрыть новый пароль' : 'Показать новый пароль'}
              aria-pressed={newPasswordVisible} icon={<Icon name={newPasswordVisible ? 'eyehide-outline' : 'eye-outline'} size={20} />}
              onClick={() => setNewPasswordVisible(visible => !visible)} />} />
        </div>
        <Button size={44} type="submit" disabled={!currentPassword || !newPassword}>Изменить</Button>
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

export default function IntegratorPanel({ section, compact, demo, updateDemo, payment, setPayment }) {
  const [draft, setDraft] = useState(newDraft)
  const [createClientOpen, setCreateClientOpen] = useState(false)
  const [topUpClientId, setTopUpClientId] = useState(null)
  const showToast = useContext(HostingToastContext)
  const clientsSection = section === integratorSection
  const topUpClient = clientsSection && demo.clients.find(client => client.id === topUpClientId)

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
    {section === integratorSettings ? <IntegratorSettings demo={demo} updateDemo={updateDemo} /> : <InfoPage section={section} />}
  </div>

  const documentsSection = section === integratorPages.documents

  return <div className="integrator-page">
    <PageHeader title={section} />
    {clientsSection ? <>
      <ClientSummary balance={demo.balance} clients={demo.clients}
        onDeposit={() => setPayment('deposit')} onCreate={() => setCreateClientOpen(true)} />
      <IntegratorClients demo={demo} compact={compact}
        createOpen={createClientOpen} onCloseCreate={() => setCreateClientOpen(false)}
        onTopUp={setTopUpClientId} onCreateInvoice={createInvoice} updateDemo={updateDemo} draft={draft} setDraft={setDraft} />
    </> : (
      <div key={section} className="integrator-tab-content hosting-reveal">
        {section === integratorPages.operations && <IntegratorOperations operations={demo.operations} />}
        {documentsSection && <IntegratorDocuments documents={demo.documents}
          onInvoice={() => setPayment('invoice')} />}
      </div>
    )}
    {(topUpClient || payment === 'deposit') && (
      <BalanceTopUp key={topUpClient?.id ?? 'deposit'} forClients compact={compact} savedMethods={demo.savedMethods ?? []}
        title={topUpClient ? 'Пополнить счёт клиента' : undefined}
        description={topUpClient ? topUpClient.name : undefined}
        amountPresets={clientTopUpPresets}
        creditInDescription
        availableBalance={topUpClient ? demo.balance : undefined}
        describeCredit={topUpClient
          ? amount => <>{topUpClient.name}{amount > 0 && <>. Хватит баланса на {daysLabel(daysLeft(topUpClient, amount))}</>}</>
          : amount => <>Зачислим с премией 40%{amount > 0 && <> — <strong>{money(amount + depositBonus(amount))}</strong></>}</>}
        onUnlink={id => updateDemo(current => ({ ...current, savedMethods: current.savedMethods.filter(method => method.id !== id) }))}
        onPay={topUpClient ? completeClientTopUp : completeDeposit} onCreateInvoice={createInvoice}
        onClose={() => topUpClient ? setTopUpClientId(null) : setPayment(null)} />
    )}
    {payment === 'invoice' && <BalanceTopUp forClients invoiceOnly compact={compact}
      title="Выставить счёт" description={organization} savedMethods={[]}
      onCreateInvoice={createInvoice} onClose={() => setPayment(null)} />}
  </div>
}
