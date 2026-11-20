import { useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Button, Choice, Dialog, Link, PageHeader, SortHeader, Surface, TabList, TextField } from './ui/index.js'
import { IntegratorChips, IntegratorClients, IntegratorTable, IntegratorTopUp } from './IntegratorClients.jsx'
import { dateLabel, daysLabel, daysLeft, integratorKnowledge, integratorNews, integratorSection, integratorSettings,
  integratorSettingsTabs, integratorSupport, integratorTabs, money, organization } from './integrator-data.js'
import './integrator.css'

const newDraft = () => ({ term: '365', selected: new Set(), amounts: {} })
const operationTypes = [['all', 'Все'], ['Пополнение', 'Пополнения'], ['Премия', 'Премия'],
  ['Перевод клиентам', 'Переводы клиентам'], ['Автопополнение', 'Автопополнение']]
const operationPeriods = [['30', '30 дней'], ['90', '3 месяца'], ['365', 'Год'], ['all', 'Всё']]
const notifications = [
  'Клиенту хватит баланса меньше чем на 7 дней',
  'Автопополнение не прошло: не хватило баланса',
  'Начислена премия',
  'Выставлен счёт',
  'Клиенту хватит баланса меньше чем на 3 дня',
]

function IntegratorOperations({ operations }) {
  const [type, setType] = useState('all')
  const [period, setPeriod] = useState('90')
  const [sort, setSort] = useState({ key: 'date', direction: 'descending' })
  const cutoff = Date.now() - Number(period) * 86400000
  const rows = operations.filter(row => (type === 'all' || row.type === type)
    && (period === 'all' || new Date(row.date).getTime() >= cutoff))
  if (sort.direction !== 'none') {
    const direction = sort.direction === 'ascending' ? 1 : -1
    rows.sort((first, second) => direction * (sort.key === 'amount' ? first.amount - second.amount : first.date.localeCompare(second.date)))
  }

  return <Surface elevation="card" className="integrator-card">
    <IntegratorChips label="Тип операции" options={operationTypes} value={type} onChange={setType} />
    <IntegratorChips label="Период" options={operationPeriods} value={period} onChange={setPeriod} />
    <AnimatedBlock>
      <IntegratorTable label="Операции по балансу">
        <thead><tr><SortHeader direction={sort.key === 'date' ? sort.direction : 'none'} onChange={direction => setSort({ key: 'date', direction })}>Дата</SortHeader>
          <th scope="col">Операция</th><SortHeader direction={sort.key === 'amount' ? sort.direction : 'none'} onChange={direction => setSort({ key: 'amount', direction })}>Сумма</SortHeader></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id}><td>{dateLabel(row.date)}</td>
          <th scope="row">{row.type}<small>{row.description}</small></th><td>{row.amount > 0 ? '+' : ''}{money(row.amount)}</td></tr>)}
          {!rows.length && <tr><td colSpan={3}>Нет операций за выбранный период</td></tr>}</tbody>
      </IntegratorTable>
    </AnimatedBlock>
  </Surface>
}

function IntegratorDocuments({ documents, onDetails, onInvoice }) {
  const [document, setDocument] = useState(null)
  return <>
    <Surface elevation="card" className="integrator-card">
      <div className="integrator-toolbar integrator-toolbar-between">
        <p>Реквизиты плательщика в разделе <Button appearance="text" pressable={false} className="integrator-link" type="button" onClick={onDetails}>«Мои данные»</Button></p>
        <Button onClick={onInvoice}>Выставить счёт</Button>
      </div>
      <IntegratorTable label="Документы">
        <thead><tr><th scope="col">Дата</th><th scope="col">Документ</th><th scope="col">Сумма</th>
          <th scope="col">Статус</th><th scope="col">Действия</th></tr></thead>
        <tbody>{documents.map(row => <tr key={row.id}><td>{dateLabel(row.date)}</td>
          <th scope="row">{row.title}<small>{organization}</small></th><td>{money(row.amount)}</td><td>{row.status}</td>
          <td><Button variant="neutral" size={32} onClick={() => setDocument(row)}>Открыть</Button></td></tr>)}
          {!documents.length && <tr><td colSpan={5}>Документов пока нет</td></tr>}</tbody>
      </IntegratorTable>
    </Surface>
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

function IntegratorDetails({ demo, updateDemo }) {
  const [requisites, setRequisites] = useState(false)
  const values = demo.notifications ?? [true, true, true, true, false]
  return <>
    <Surface as="section" elevation="card" className="integrator-card">
      <h2>Реквизиты и выплаты</h2>
      <dl className="integrator-metrics">
        <div><dt>Организация и плательщик</dt><dd>{organization}</dd></div>
        <div><dt>Подписант</dt><dd>Смирнов Алексей Викторович</dd></div>
        <div><dt>Счёт для выплат</dt><dd>Уральский банк ПАО Сбербанк · •••• 4417</dd></div>
      </dl>
      <Button variant="neutral" aria-expanded={requisites} aria-controls="integrator-requisites" onClick={() => setRequisites(value => !value)}>
        {requisites ? 'Скрыть реквизиты' : 'Показать реквизиты'}
      </Button>
      <AnimatedBlock open={requisites}>
        <dl id="integrator-requisites" className="integrator-metrics">
          <div><dt>ИНН</dt><dd>6658123456</dd></div><div><dt>КПП</dt><dd>665801001</dd></div><div><dt>БИК</dt><dd>046577964</dd></div>
        </dl>
      </AnimatedBlock>
    </Surface>
    <Surface as="section" elevation="card" className="integrator-card">
      <h2>Уведомления интегратора</h2>
      <ul className="integrator-rows">{notifications.map((label, index) => <li key={label}>
        <div><strong>{label}</strong><small>{index === 4 ? 'SMS' : 'Письмо'}</small></div>
        <Choice kind="switch" aria-label={label} checked={values[index]} onChange={event => {
          const checked = event.target.checked
          updateDemo(current => ({ ...current, notifications: (current.notifications ?? values).map((value, entry) => entry === index ? checked : value) }))
        }} />
      </li>)}</ul>
    </Surface>
  </>
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

export default function IntegratorPanel({ section, tab, scenario, demo, updateDemo, onTabChange, payment, setPayment }) {
  const [draft, setDraft] = useState(newDraft)
  const [inspectedId, setInspectedId] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const tabList = useRef(null)
  const inspected = demo.clients.find(client => client.id === inspectedId)
  const amount = Number(paymentAmount)
  const bonus = Math.round(amount * 40) / 100
  const invoice = payment === 'invoice'
  const paymentTitle = invoice ? 'Выставить счёт' : 'Пополнить баланс'

  function openTopUp(id) {
    setInspectedId(null)
    setDraft({ ...newDraft(), selected: new Set([id]) })
    onTabChange('topup')
    requestAnimationFrame(() => {
      tabList.current?.scrollIntoView({ block: 'start' })
      tabList.current?.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true })
    })
  }

  function closePayment() {
    setPayment(null)
    setPaymentAmount('')
  }

  function submitPayment(event) {
    event.preventDefault()
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 10000000) return
    const id = crypto.randomUUID()
    const date = new Date().toLocaleDateString('sv-SE')
    if (invoice) {
      updateDemo(current => ({ ...current, documents: [
        { id, date, title: 'Счёт № ' + id.slice(0, 6).toUpperCase(), amount, status: 'Ожидает оплаты' }, ...current.documents,
      ] }))
      onTabChange('documents')
    } else {
      updateDemo(current => ({
        ...current,
        balance: Math.round((current.balance + amount + bonus) * 100) / 100,
        operations: [
          { id: id + '-bonus', date, type: 'Премия', description: 'Премия 40 % за пополнение', amount: bonus },
          { id, date, type: 'Пополнение', description: 'Пополнение баланса для клиентов', amount },
          ...current.operations,
        ],
      }))
    }
    closePayment()
  }

  if (section !== integratorSection) return <div className="integrator-page">
    {section === integratorSettings ? <IntegratorSettings tab={tab} onTabChange={onTabChange} demo={demo} updateDemo={updateDemo} /> : <InfoPage section={section} />}
  </div>

  return <div className="integrator-page">
    <PageHeader title={integratorSection} actions={<span className="integrator-role">{scenario === 'integrator-former-partner' ? 'Бывший партнёр' : 'Интегратор'}</span>} />
    <Surface as="section" elevation="card" className="integrator-balance hosting-reveal" aria-label="Баланс для клиентов">
      <div className="integrator-balance-main">
        <span>Баланс для клиентов</span>
        <strong>{money(demo.balance)}</strong>
        <small>{organization}</small>
      </div>
      <div className="integrator-balance-stat"><span>Премия</span><strong>40 %</strong><small>с каждого пополнения</small></div>
      <div className="integrator-balance-stat"><span>Клиенты</span><strong>{demo.clients.length}</strong></div>
      <Button onClick={() => setPayment('deposit')}>Пополнить баланс</Button>
    </Surface>
    <TabList ref={tabList} idPrefix="integrator-program" label="Партнёрская программа" tabs={integratorTabs} value={tab} onChange={onTabChange} />
    <AnimatedBlock>
      <div key={tab} className="integrator-tab-content hosting-reveal" role="tabpanel" id={`integrator-program-panel-${tab}`}
        aria-labelledby={`integrator-program-tab-${tab}`}>
        {tab === 'clients' && <IntegratorClients clients={demo.clients} balance={demo.balance} updateDemo={updateDemo} onTopUp={openTopUp} onInspect={setInspectedId} />}
        {tab === 'topup' && <IntegratorTopUp demo={demo} draft={draft} setDraft={setDraft} updateDemo={updateDemo} />}
        {tab === 'operations' && <IntegratorOperations operations={demo.operations} />}
        {tab === 'documents' && <IntegratorDocuments documents={demo.documents} onDetails={() => onTabChange('details')} onInvoice={() => setPayment('invoice')} />}
        {tab === 'details' && <IntegratorDetails demo={demo} updateDemo={updateDemo} />}
      </div>
    </AnimatedBlock>
    <Dialog open={Boolean(inspected)} title={inspected?.id} description={inspected?.name} onClose={() => setInspectedId(null)}
      actions={inspected && <Button onClick={() => openTopUp(inspected.id)}>Пополнить</Button>}>
      {inspected && <dl className="integrator-metrics"><div><dt>Тариф</dt><dd>{inspected.tariff}</dd></div>
        <div><dt>Баланс</dt><dd>{money(inspected.balance)}</dd></div>
        <div><dt>Осталось</dt><dd>{inspected.balance ? daysLabel(daysLeft(inspected)) : 'Заблокирован'}</dd></div></dl>}
    </Dialog>
    <Dialog open={Boolean(payment)} title={paymentTitle} description={organization} onClose={closePayment}>
      <form className="integrator-form" onSubmit={submitPayment}>
        <TextField label={invoice ? 'Сумма счёта, ₽' : 'Сумма пополнения, ₽'} type="number" min="1" max="10000000" step="1"
          required value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} />
        <AnimatedBlock open={!invoice && amount > 0}>
          <p>С премией 40 % зачислим <strong>{money(amount + bonus)}</strong></p>
        </AnimatedBlock>
        <Button type="submit">{invoice ? paymentTitle : 'Пополнить в демо'}</Button>
      </form>
    </Dialog>
  </div>
}
