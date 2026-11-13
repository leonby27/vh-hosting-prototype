import { useContext, useId, useRef, useState } from 'react'
import { AnimatedBlock, DropdownPanel, TabIndicator } from './hosting-motion.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import WarningDialog from './WarningDialog.jsx'
import apiIcon from './assets/hosting/api.svg'
import copyIcon from './assets/dashboard/copy.svg'
import searchIcon from './assets/network-protection/search.svg'
import caretIcon from './assets/hosting/caret.svg'
import { apiAddress, apiDocsUrl, capabilities, clients, journal, mcpAddress, permissions, presets, secretPlaceholder } from './api-agents-data.js'
import './api-agents.css'

export const apiAgentsSection = 'API и AI-агенты'
export const apiTabs = [['connection', 'Подключение'], ['keys', 'Ключи'], ['journal', 'Журнал']]
const accessLabels = { none: 'Нет доступа', read: 'Чтение', write: 'Чтение и запись' }
const durations = [['30', '30 дней'], ['90', '90 дней'], ['365', '1 год'], ['none', 'Без срока'], ['custom', 'Свой срок']]
const resultLabels = { 200: 'Успешно', 201: 'Создано', 403: 'Нет доступа', 429: 'Лимит запросов' }
const journalKeys = [...new Set(journal.map(row => row[1]))]
const resultCount = new Intl.PluralRules('ru')
const resultNouns = { one: 'запрос', few: 'запроса', many: 'запросов', other: 'запроса' }
const dateFormat = new Intl.DateTimeFormat('ru', { dateStyle: 'medium' })
const keyMask = suffix => `twh_…${suffix}`
const startDraft = () => ({ name: '', note: '', duration: '90', days: '', access: {} })

function Copy({ value, label = 'Скопировать', primary = false }) {
  const toast = useContext(HostingToastContext)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast({ message: 'Скопировано', success: true })
    } catch {
      toast({ message: 'Не удалось скопировать' })
    }
  }

  return <button type="button" className={primary ? 'api-button api-primary' : 'api-icon-button'} onClick={copy} aria-label={label} title={label}>
    {primary ? label : <img src={copyIcon} alt="" width="20" height="20" />}
  </button>
}

function Address({ label, value, copy = true }) {
  return <div className="api-address">
    <div><span>{label}</span><code>{value}</code></div>
    {copy && <Copy value={value} label={`Скопировать: ${label}`} />}
  </div>
}

function CodeSample({ value }) {
  return <div className="api-code">
    <pre tabIndex={0}><code>{value}</code></pre>
    <Copy value={value} label="Скопировать пример" />
  </div>
}

function AgentInstructions({ secret, initialClient = 0, onCreate }) {
  const [client, setClient] = useState(initialClient)
  const [name, instructions, code] = clients[client]
  return <div className="api-instructions">
    {!secret && <h2>Настройка MCP</h2>}
    <div className="api-choices" role="group" aria-label="Клиент MCP">
      {clients.map(([label], index) =>
        <button key={label} type="button" aria-pressed={index === client} onClick={() => setClient(index)}>{label}</button>,
      )}
    </div>
    <AnimatedBlock>
      <div className="api-stack" aria-label={name}>
        <p>{instructions}</p>
        {!secret && code.includes(secretPlaceholder) && <p>Замените <code>{secretPlaceholder}</code> на секрет ключа.</p>}
        <CodeSample value={secret ? code.replace(secretPlaceholder, secret) : code} />
        {onCreate && <button type="button" className="api-disclosure" onClick={() => onCreate(client)}>Выпустить ключ для клиента</button>}
      </div>
    </AnimatedBlock>
  </div>
}

function DataTable({ headings, label, children }) {
  return <div className="api-table-scroll" tabIndex={0} role="region" aria-label={label}>
    <table role="table">
      <thead role="rowgroup"><tr role="row">{headings.map(heading => <th key={heading} scope="col" role="columnheader">{heading}</th>)}</tr></thead>
      <tbody role="rowgroup">{children}</tbody>
    </table>
  </div>
}

function Connection({ hasKeys, onCreate, onKeys }) {
  const [guideOpen, setGuideOpen] = useState(false)
  return <div className="api-stack api-connection">
    <div className="api-actions hosting-reveal">
      <button type="button" className="api-button api-primary" onClick={hasKeys ? onKeys : () => onCreate()}>{hasKeys ? 'Управлять ключами' : 'Выпустить ключ'}</button>
      <p>Один ключ подходит для API и MCP.</p>
    </div>
    <div className="api-connection-grid hosting-reveal">
      <section className="api-card api-stack api-mcp-card">
        <header><h2>MCP для AI-агентов</h2><p>Для Claude, Cursor и других клиентов</p></header>
        <Address label="Адрес сервера" value={mcpAddress} />
        <button type="button" className="api-disclosure" aria-expanded={guideOpen} aria-controls="api-agent-guide"
          onClick={() => setGuideOpen(value => !value)}>
          Как подключить агента <span className="api-caret" aria-hidden="true" />
        </button>
      </section>
      <AnimatedBlock open={guideOpen}>
        <section id="api-agent-guide" className="api-card api-guide">
          <AgentInstructions onCreate={onCreate} />
        </section>
      </AnimatedBlock>
      <section className="api-card api-stack api-http-card">
        <header><h2>API</h2><p>Для скриптов, интеграций и Terraform</p></header>
        <Address label="Адрес API" value={apiAddress} />
        <div className="api-http-links">
          <a className="api-disclosure" href={apiDocsUrl} target="_blank" rel="noopener noreferrer"
            aria-label="Документация API хостинга, откроется в новой вкладке">Документация API <span aria-hidden="true">↗</span></a>
          <p><code>Authorization: Bearer</code></p>
        </div>
      </section>
    </div>
    <section className="api-stack api-capabilities hosting-reveal">
      <h2>Возможности API и MCP</h2>
      <DataTable label="Возможности API и MCP" headings={['Раздел', 'Чтение', 'Запись']}>
        {capabilities.map(({ id, label, read, write, upcoming }) => <tr key={id} role="row">
          <th scope="row" role="rowheader"><span className="api-capability-name">
            {label}{upcoming && <span className="sites-domain-badge">Скоро</span>}
          </span></th>
          <td role="cell"><span className="api-mobile-cell-label" aria-hidden="true">Чтение</span>{read}</td>
          <td role="cell"><span className="api-mobile-cell-label" aria-hidden="true">Запись</span>{write ?? '—'}</td>
        </tr>)}
      </DataTable>
    </section>
  </div>
}

function Keys({ keys, onCreate, onEdit, onRemove, onRotate }) {
  if (!keys.length) return <section className="api-card api-empty hosting-reveal">
    <span className="api-empty-icon" style={{ '--api-empty-icon': `url("${apiIcon}")` }} aria-hidden="true" />
    <h2>Ключей пока нет</h2>
    <p>Укажите, к каким разделам получит доступ ваша интеграция.</p>
    <button type="button" className="api-button api-primary" onClick={onCreate}>Выпустить ключ</button>
  </section>

  return <div className="api-stack hosting-reveal">
    <div className="api-actions">
      <button type="button" className="api-button api-primary" onClick={onCreate}>Выпустить ключ</button>
    </div>
    <div className="api-stack">
      {keys.map(key => <article className="api-card api-key" key={key.id}>
        <div className="api-key-copy">
          <div className="api-key-heading">
            <h2>{key.name}</h2>
            <span className="sites-domain-badge" data-expired={Boolean(key.expires && key.expires <= Date.now())}>
              {key.expires ? key.expires <= Date.now() ? 'Срок истёк' : `До ${dateFormat.format(key.expires)}` : 'Без срока'}
            </span>
          </div>
          <p><code>{keyMask(key.suffix)}</code><span>{describeAccess(key.access)}</span></p>
          {key.note && <p>{key.note}</p>}
        </div>
        <div className="api-actions">
          <button type="button" className="api-button" onClick={() => onEdit(key)}>Настроить</button>
          <ApiDropdown className="api-key-menu" buttonLabel={`Действия с ключом «${key.name}»`}
            buttonContent="Ещё">
            {close => <>
              <button type="button" onClick={() => { close(); onRotate(key) }}>Перевыпустить</button>
              <button type="button" className="api-danger" onClick={() => { close(); onRemove(key) }}>Удалить</button>
            </>}
          </ApiDropdown>
        </div>
      </article>)}
    </div>
  </div>
}

function accessForPreset(level, ids) {
  return Object.fromEntries(permissions.map(({ id, write }) => [
    id, ids && !ids.includes(id) ? 'none' : write ? level : 'read',
  ]))
}

function describeAccess(access) {
  const enabled = permissions.filter(({ id }) => access[id] === 'read' || access[id] === 'write')
  const count = enabled.length
  if (!count) return 'Выберите набор или настройте доступ вручную.'
  const sectionNoun = { one: 'раздел', few: 'раздела', many: 'разделов' }[resultCount.select(count)]
  const level = enabled.some(({ id }) => access[id] === 'write') ? 'есть права записи' : 'только чтение'
  return `${count} ${sectionNoun} · ${level}`
}

function KeyForm({ original, initialClient, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    ...startDraft(),
    name: initialClient === undefined || clients[initialClient][0] === 'Другие' ? '' : clients[initialClient][0],
    ...original,
  }))
  const [detailsOpen, setDetailsOpen] = useState(false)
  const detailsId = useId()
  const setField = (field, value) => setDraft(current => ({ ...current, [field]: value }))
  const selectedAccess = permissions.some(({ id }) => draft.access[id] && draft.access[id] !== 'none')
  const days = Number(draft.days)
  const validDuration = draft.duration !== 'custom' || (Number.isInteger(days) && days >= 1 && days <= 3650)
  const valid = draft.name.trim() && selectedAccess && validDuration

  return <form className="api-stack hosting-reveal" onSubmit={event => {
    event.preventDefault()
    if (valid) onSave({ ...draft, name: draft.name.trim(), note: draft.note.trim() })
  }}>
    <section className="api-card api-stack">
      <div className="api-fields">
        <label>Название<input value={draft.name} onChange={event => setField('name', event.target.value)}
          maxLength={80} required placeholder="Например, Claude Code" /></label>
        <label>Примечание <small>необязательно</small><input value={draft.note} onChange={event => setField('note', event.target.value)} maxLength={180} /></label>
      </div>
      <fieldset className="api-stack">
        <legend>Срок действия</legend>
        <div className="api-choices">
          {durations.map(([id, label]) => <label key={id}>
            <input type="radio" name="api-duration" value={id} checked={draft.duration === id} onChange={() => setField('duration', id)} />
            <span>{label}</span>
          </label>)}
        </div>
        <AnimatedBlock open={draft.duration === 'custom'}>
          <label className="api-custom-duration">Количество дней
            <input type="number" min="1" max="3650" step="1" value={draft.days}
              required={draft.duration === 'custom'} disabled={draft.duration !== 'custom'}
              onChange={event => setField('days', event.target.value)} />
          </label>
        </AnimatedBlock>
      </fieldset>
    </section>
    <section className="api-card api-stack">
      <h2>Права доступа</h2>
      <div className="api-choices" role="group" aria-label="Готовые наборы прав">
        {presets.map(([label, level, ids]) => {
          const access = accessForPreset(level, ids)
          const selected = permissions.every(({ id }) => (draft.access[id] ?? 'none') === access[id])
          return <button key={label} type="button" aria-pressed={selected} onClick={() => setField('access', access)}>{label}</button>
        })}
      </div>
      <div>
        <div className="api-access-summary">
          <p role="status">{describeAccess(draft.access)}</p>
          <button type="button" className="api-disclosure" aria-expanded={detailsOpen} aria-controls={detailsId}
            onClick={() => setDetailsOpen(value => !value)}>
            Настроить по разделам <span className="api-caret" aria-hidden="true" />
          </button>
        </div>
        <AnimatedBlock open={detailsOpen}>
          <div id={detailsId} className="api-permission-list">
            {permissions.map(({ id, label, write }) => <fieldset className="api-permission" key={id}>
              <legend>{label}</legend>
              <div className="api-choices">
                {Object.entries(accessLabels).filter(([value]) => value !== 'write' || write).map(([value, text]) =>
                  <label key={value}>
                    <input type="radio" name={`api-access-${id}`} value={value}
                      checked={(draft.access[id] ?? 'none') === value}
                      onChange={() => setField('access', { ...draft.access, [id]: value })} />
                    <span>{text}</span>
                  </label>,
                )}
              </div>
            </fieldset>)}
          </div>
        </AnimatedBlock>
      </div>
    </section>
    <div className="api-actions">
      <button type="submit" className="api-button api-primary" disabled={!valid}>{original ? 'Сохранить' : 'Выпустить ключ'}</button>
      <button type="button" className="api-button" onClick={onCancel}>Отмена</button>
    </div>
  </form>
}

function ApiDropdown({ className = '', label, buttonLabel, buttonContent, children }) {
  const id = useId()
  const trigger = useRef(null)
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
    trigger.current.focus()
  }

  return <div className={`api-dropdown ${className}`} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      close()
    }
  }}>
    {label && <span id={`${id}-label`}>{label}</span>}
    <button ref={trigger} type="button" className="api-button" aria-expanded={open} aria-controls={id}
      aria-label={buttonLabel} aria-labelledby={label ? `${id}-label ${id}-value` : undefined}
      onClick={() => setOpen(current => !current)}>
      <span id={`${id}-value`}>{buttonContent}</span>
      <span className="api-caret" aria-hidden="true" />
    </button>
    <DropdownPanel id={id} className="api-filter-panel" open={open}>{children(close)}</DropdownPanel>
  </div>
}

function JournalFilter({ label, options, value, onChange }) {
  return <ApiDropdown className="api-filter" label={label} buttonContent={options.find(([key]) => key === value)[1]}>
    {close => options.map(([key, text]) => <button key={key} type="button" aria-pressed={value === key}
      onClick={() => { onChange(key); close() }}>{text}</button>)}
  </ApiDropdown>
}

function JournalRow({ entry }) {
  const [timestamp, suffix, channel, call, ip, status] = entry
  const [date, time] = timestamp.split(', ')
  const space = call.indexOf(' ')
  const method = space === -1 ? null : call.slice(0, space)
  const request = call.slice(space + 1)

  return <tr role="row">
    <td role="cell" className="api-log-date">
      <span>{date}</span>
      <span className="api-log-meta">{time}</span>
    </td>
    <th scope="row" role="rowheader" className="api-log-call">
      <code>{method && <span className="api-log-method">{method} </span>}{request}</code>
      <span className="api-log-meta">{channel}</span>
    </th>
    <td role="cell" className="api-log-key">
      <code>{keyMask(suffix)}</code>
      <span className="api-log-meta">{ip}</span>
    </td>
    <td role="cell" className="api-log-result">
      <span className="api-status" data-error={status >= 400}>
        <span className="api-status-dot" aria-hidden="true" />
        <span>{resultLabels[status]}</span>
        <span className="api-status-code">{status}</span>
      </span>
    </td>
  </tr>
}

function Journal({ keys }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('')
  const [key, setKey] = useState('')
  const [result, setResult] = useState('')
  const searchField = useRef(null)
  const search = query.trim().toLowerCase()
  const keyOptions = new Map(journalKeys.map(suffix => [suffix, keyMask(suffix)]))
  keys.forEach(({ suffix, name }) => keyOptions.set(suffix, `${name} · ${keyMask(suffix)}`))
  const selectedKey = keyOptions.has(key) ? key : ''
  const rows = journal.filter(([, suffix, channel, call, ip, status]) =>
    (!source || source === channel) && (!selectedKey || selectedKey === suffix) &&
    (!result || (status < 400 ? 'success' : 'error') === result) &&
    [call, ip, channel, keyOptions.get(suffix)].some(value => value.toLowerCase().includes(search)),
  )

  function reset() {
    setQuery('')
    setSource('')
    setKey('')
    setResult('')
    searchField.current.focus({ preventScroll: true })
  }

  return <div className="api-stack api-journal hosting-reveal">
    <div className="api-journal-controls">
      <label className="sites-domain-search api-search">
        <img src={searchIcon} alt="" width="20" height="20" />
        <input type="search" aria-label="Поиск по журналу" ref={searchField} placeholder="Запрос, ключ, источник или IP"
          value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      <div className="api-filters">
        <JournalFilter label="Источник" value={source} onChange={setSource}
          options={[['', 'Все источники'], ...['API', 'MCP', 'Terraform'].map(value => [value, value])]} />
        <JournalFilter label="Ключ" value={selectedKey} onChange={setKey}
          options={[['', 'Все ключи'], ...keyOptions]} />
        <JournalFilter label="Результат" value={result} onChange={setResult}
          options={[['', 'Все результаты'], ['success', 'Успешные'], ['error', 'Ошибки']]} />
      </div>
    </div>
    <AnimatedBlock open={Boolean(search || source || selectedKey || result)}>
      <div className="api-journal-summary">
        <span role="status">Найдено: {rows.length} {resultNouns[resultCount.select(rows.length)]}</span>
        <button type="button" className="api-disclosure" onClick={reset}>Сбросить фильтры</button>
      </div>
    </AnimatedBlock>
    <AnimatedBlock>
      <div className="api-stack">
        {rows.length ? <DataTable label="Журнал запросов" headings={['Дата и время', 'Запрос', 'Ключ и IP', 'Результат']}>
          {rows.map(entry => <JournalRow key={`${entry[0]}-${entry[3]}`} entry={entry} />)}
        </DataTable> : <div className="api-card api-empty">
          <h2>Запросы не найдены</h2>
          <p>Измените запрос или сбросьте фильтры.</p>
        </div>}
      </div>
    </AnimatedBlock>
    <p className="api-note">Записи хранятся 6 месяцев.</p>
  </div>
}

function ApiTabs({ tab, onTabChange }) {
  function move(event) {
    const index = apiTabs.findIndex(([id]) => id === tab)
    const last = apiTabs.length - 1
    const next = { ArrowLeft: (index + last) % apiTabs.length, ArrowRight: (index + 1) % apiTabs.length, Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const [id] = apiTabs[next]
    onTabChange(id)
    event.currentTarget.querySelector(`#api-tab-${id}`).focus()
  }

  return <div className="sites-tabs hosting-indicator-track" role="tablist" aria-label={apiAgentsSection} onKeyDown={move}>
    <TabIndicator selected={tab} />
    {apiTabs.map(([id, label]) => <button type="button" role="tab" key={id} id={`api-tab-${id}`}
      aria-selected={tab === id} aria-controls={`api-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => onTabChange(id)}>
      {label}
    </button>)}
  </div>
}

export default function ApiAgents({ tab, onTabChange, keys, setKeys }) {
  const [form, setForm] = useState(null)
  const [issued, setIssued] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const toast = useContext(HostingToastContext)
  const heading = useRef(null)

  function showKeys() {
    setForm(null)
    setIssued(null)
    onTabChange('keys')
    window.scrollTo(0, 0)
    requestAnimationFrame(() => (document.getElementById('api-tab-keys') ?? heading.current)?.focus({ preventScroll: true }))
  }

  function cancelForm() {
    setForm(null)
    window.scrollTo(0, 0)
    requestAnimationFrame(() => document.getElementById(`api-tab-${tab}`)?.focus({ preventScroll: true }))
  }

  function edit(key, client) {
    setForm({ original: key, client })
    window.scrollTo(0, 0)
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
  }

  function save(draft, rotate = false) {
    const duration = draft.duration === 'custom' ? Number(draft.days) : Number(draft.duration)
    const now = Date.now()
    const expires = Number.isFinite(duration) ? (draft.createdAt ?? now) + duration * 86_400_000 : null
    if (draft.id && !rotate) {
      setKeys(current => current.map(key => key.id === draft.id ? { ...draft, expires } : key))
      toast({ message: 'Настройки сохранены', success: true })
      showKeys()
      return
    }

    const secret = `twh_demo_${crypto.randomUUID().replaceAll('-', '')}`
    const key = { ...draft, id: draft.id ?? crypto.randomUUID(), suffix: secret.slice(-4),
      createdAt: now, expires: Number.isFinite(duration) ? now + duration * 86_400_000 : null }
    setKeys(current => [key, ...current.filter(item => item.id !== key.id)])
    setForm(null)
    setIssued({ secret, name: key.name, client: form?.client })
    window.scrollTo(0, 0)
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }))
  }

  return <div className="sites-page api-page" style={{ '--api-caret': `url("${caretIcon}")` }}>
    <header className="sites-heading">
      {(form || issued) && <button type="button" className="api-disclosure" onClick={form ? cancelForm : showKeys}>
        ← {form && tab === 'connection' ? 'Подключение' : 'Все ключи'}
      </button>}
      <h1 ref={heading} tabIndex={-1}>{form ? form.original ? 'Настройки ключа' : 'Новый ключ' : issued ? 'Ключ выпущен' : apiAgentsSection}</h1>
      {!form && !issued && <ApiTabs tab={tab} onTabChange={onTabChange} />}
    </header>
    {form && <KeyForm original={form.original} initialClient={form.client} onSave={save} onCancel={cancelForm} />}
    {issued && <div className="api-stack hosting-reveal">
      <section className="api-card api-stack">
        <div className="api-stack api-issued-heading">
          <h2>{issued.name}</h2>
          <p>Сохраните секрет тестового ключа. Он показывается один раз.</p>
        </div>
        <Address label="Секрет ключа" value={issued.secret} copy={false} />
        <div className="api-actions">
          <Copy value={issued.secret} label="Скопировать секрет" primary />
          <button type="button" className="api-button" onClick={showKeys}>К списку ключей</button>
        </div>
      </section>
      <section className="api-card api-stack"><h2>Подключение агента</h2><AgentInstructions secret={issued.secret} initialClient={issued.client} /></section>
    </div>}
    {apiTabs.map(([id]) => <div key={id} id={`api-panel-${id}`} role="tabpanel"
      aria-labelledby={`api-tab-${id}`} hidden={Boolean(form || issued) || tab !== id} tabIndex={0}>
      {id === 'connection' && <Connection hasKeys={keys.length > 0} onKeys={showKeys} onCreate={client => edit(null, client)} />}
      {id === 'keys' && <Keys keys={keys} onCreate={() => edit(null)} onEdit={edit}
        onRemove={key => setConfirmation({ key, remove: true })} onRotate={key => setConfirmation({ key, remove: false })} />}
      {id === 'journal' && <Journal keys={keys} />}
    </div>)}
    {confirmation && <WarningDialog title={confirmation.remove ? 'Удалить ключ?' : 'Перевыпустить ключ?'}
      description={`Интеграции с ключом «${confirmation.key.name}» потеряют доступ.`}
      confirmLabel={confirmation.remove ? 'Удалить' : 'Перевыпустить'} onClose={confirmed => {
        setConfirmation(null)
        if (!confirmed) return
        if (confirmation.remove) {
          setKeys(current => current.filter(key => key.id !== confirmation.key.id))
          toast({ message: 'Ключ удалён', success: true })
          showKeys()
        } else {
          save(confirmation.key, true)
        }
      }} />}
  </div>
}
