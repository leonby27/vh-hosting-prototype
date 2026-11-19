import { Fragment, useContext, useId, useRef, useState } from 'react'
import { AnimatedBlock, DropdownPanel, TabIndicator } from './hosting-motion.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import WarningDialog from './WarningDialog.jsx'
import { PlanChangesEmpty } from './PlanChanges.jsx'
import claudeCodeIcon from './assets/api-agents/claudecode-color.svg'
import claudeIcon from './assets/api-agents/claude-color.svg'
import cursorIcon from './assets/api-agents/cursor.svg'
import vsCodeIcon from './assets/api-agents/vscode.svg'
import windsurfIcon from './assets/api-agents/windsurf.svg'
import codexIcon from './assets/api-agents/codex-color.svg'
import apiIcon from './assets/hosting/api.svg'
import sitesIcon from './assets/dashboard/site.svg'
import domainsIcon from './assets/api-agents/globe-fill.svg'
import dnsIcon from './assets/api-agents/tree-structure-fill.svg'
import sslIcon from './assets/api-agents/shield-check-fill.svg'
import databasesIcon from './assets/api-agents/database-fill.svg'
import mailIcon from './assets/dashboard/mail.svg'
import filesIcon from './assets/api-agents/folder-simple-fill.svg'
import crontabIcon from './assets/api-agents/clock-fill.svg'
import backupsIcon from './assets/api-agents/archive-fill.svg'
import accountIcon from './assets/api-agents/user-circle-fill.svg'
import otherClientsIcon from './assets/plan-changes/more.svg'
import apiMcpPrism from './assets/hosting/api-mcp-prism.png'
import searchIcon from './assets/network-protection/search.svg'
import caretIcon from './assets/hosting/caret.svg'
import { apiAddress, apiDocsUrl, capabilities, clients, demoApiKeys, journal, permissions, presets, secretPlaceholder } from './api-agents-data.js'
import './api-agents.css'

export const apiAgentsSection = 'API и AI-агенты'
export const apiTabs = [['connection', 'Подключение'], ['keys', 'Ключи'], ['journal', 'Журнал']]
const clientTabIcons = {
  'Claude Code': { src: claudeCodeIcon },
  'Claude Desktop': { src: claudeIcon },
  Cursor: { src: cursorIcon, monochrome: true },
  'VS Code': { src: vsCodeIcon },
  Windsurf: { src: windsurfIcon, monochrome: true },
  Codex: { src: codexIcon },
}
const otherTabIcon = { src: otherClientsIcon, monochrome: true }
const capabilityIcons = {
  sites: sitesIcon, domains: domainsIcon, dns: dnsIcon, ssl: sslIcon, databases: databasesIcon,
  mail: mailIcon, files: filesIcon, crontab: crontabIcon, backups: backupsIcon, account: accountIcon,
}
const connectionTabs = [
  ['http', 'API', { src: apiIcon, monochrome: true }],
  ...clients.map(([label], index) => [`client-${index}`, label, clientTabIcons[label] ?? otherTabIcon]),
]
const accessLabels = { none: 'Нет доступа', read: 'Чтение', write: 'Чтение и запись' }
const durations = [['none', 'Бессрочный'], ['365', '1 год'], ['90', '90 дней'], ['30', '30 дней'], ['custom', 'Свой срок']]
const resultLabels = { 200: 'Успешно', 201: 'Создано', 403: 'Нет доступа', 429: 'Лимит запросов' }
const journalKeys = [...new Set(journal.map(row => row[1]))]
const journalMonths = { сен: 'сентября', окт: 'октября', ноя: 'ноября' }
const countPlural = new Intl.PluralRules('ru')
const resultNouns = { one: 'запрос', few: 'запроса', many: 'запросов', other: 'запроса' }
const keyNouns = { one: 'ключ', few: 'ключа', many: 'ключей', other: 'ключей' }
const dateFormat = new Intl.DateTimeFormat('ru', { dateStyle: 'medium' })
const keyMask = suffix => `twh_…${suffix}`
const startDraft = () => ({ name: '', note: '', duration: '90', days: '', access: accessForPreset('read') })

function Copy({ value, label, primary = false }) {
  const toast = useContext(HostingToastContext)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      toast({ message: 'Скопировано', success: true })
    } catch {
      toast({ message: 'Не удалось скопировать' })
    }
  }

  const className = primary ? 'api-button api-primary api-copy-key' : 'api-code-copy'
  return <button type="button" className={className} onClick={copy} aria-label={label} title={label}>
    <span className="api-copy-key-icon" aria-hidden="true" />
    {primary && label}
  </button>
}

function Address({ label, value }) {
  return <div className="api-address">
    <div><span>{label}</span><code>{value}</code></div>
  </div>
}

const codeTokens = /(?<command>^claude mcp add\b)|(?<option>--[\w-]+)|(?<key>"(?:\\.|[^"\\])*"(?=\s*:)|\b[\w-]+(?=\s*=)|^Authorization(?=:))|(?<string>"(?:\\.|[^"\\])*")|(?<url>https?:\/\/[^\s"]+)/gm

function highlightCode(value) {
  const parts = []
  let start = 0
  for (const match of value.matchAll(codeTokens)) {
    const kind = Object.keys(match.groups).find(key => match.groups[key] !== undefined)
    parts.push(value.slice(start, match.index))
    parts.push(<span key={match.index} data-token={kind}>{match[0]}</span>)
    start = match.index + match[0].length
  }
  parts.push(value.slice(start))
  return parts
}

function CodeSample({ label, value, wrap = false }) {
  const lines = value.split('\n')
  return <div className="api-code">
    <pre tabIndex={0} aria-label={label} data-wrap={wrap}>
      <code>{lines.map((line, index) => <Fragment key={index}>
        <span className="api-code-line">
          <span className="api-code-line-number" data-line={index + 1} aria-hidden="true" />
          <span className="api-code-line-text">{highlightCode(line)}</span>
        </span>
        {index < lines.length - 1 && '\n'}
      </Fragment>)}</code>
    </pre>
    <Copy value={value} label={`Скопировать: ${label}`} />
  </div>
}

function ConnectionSteps({ steps }) {
  return <ol className="api-connection-steps" role="list">
    {steps.map((step, index) => <li key={index}>
      <span className="api-step-number" aria-hidden="true">{index + 1}</span>
      <div className="api-step-content">{step}</div>
    </li>)}
  </ol>
}

function IssueConnectionKeyButton({ onClick, children }) {
  return <button type="button" className="api-button api-client-key-button" onClick={onClick}>
    <span className="api-client-key-icon" aria-hidden="true" />
    {children}
  </button>
}

function ApiInstructions({ onCreate }) {
  const steps = []
  if (onCreate) {
    steps.push(<div className="api-step-with-action">
      <p>Выпустите ключ с правами, которые нужны вашей интеграции.</p>
      <IssueConnectionKeyButton onClick={() => onCreate()}>Выпустить ключ</IssueConnectionKeyButton>
    </div>)
  }
  steps.push(
    <div className="api-step-with-action">
      <p>Скопируйте адрес API и укажите его в скрипте, интеграции или настройках Terraform.</p>
      <CodeSample label="Адрес API" value={apiAddress} wrap />
    </div>,
    <>Выберите нужный метод и настройте авторизацию по <a className="api-step-link" href={apiDocsUrl}
      target="_blank" rel="noopener noreferrer">документации API <span aria-hidden="true">↗</span></a>.</>,
  )
  return <ConnectionSteps steps={steps} />
}

function ClientInstructions({ client, secret, onCreate }) {
  const [, instructions, code, credentialStep] = clients[client]
  const label = client === 0 ? 'Команда для терминала' : client === clients.length - 1 ? 'Параметры подключения' : 'Пример конфигурации'
  const copyTarget = client === 0 ? 'команду для терминала'
    : client === clients.length - 1 ? 'параметры подключения' : 'пример конфигурации'
  const value = secret ? code.replace(secretPlaceholder, secret) : code
  const needsSecret = !secret && code.includes(secretPlaceholder)
  const steps = []

  if (onCreate) {
    steps.push(<div className="api-step-with-action">
      <p>Выпустите ключ с правами доступа, которые нужны этому клиенту.</p>
      <IssueConnectionKeyButton onClick={() => onCreate(client)}>Выпустить ключ для клиента</IssueConnectionKeyButton>
    </div>)
  }
  steps.push(<div className="api-step-with-action">
    <p>Скопируйте {copyTarget}.</p>
    <CodeSample label={label} value={value} wrap={client === 0} />
  </div>)
  if (needsSecret) {
    steps.push(<>Подставьте свой ключ вместо <code className="api-step-secret">{secretPlaceholder}</code> в примере.</>)
  } else if (credentialStep) {
    steps.push(credentialStep)
  }
  steps.push(instructions.join(' '))

  return <ConnectionSteps steps={steps} />
}

function ConnectionInstructions({ secret, onCreate, initialMethod = 'http' }) {
  const [method, setMethod] = useState(initialMethod)
  const idPrefix = useId()
  const [, selectedLabel, selectedIcon] = connectionTabs.find(([id]) => id === method)

  return <>
    <div className="api-connection-tabs">
      <ApiTabs tab={method} onTabChange={setMethod} tabs={connectionTabs} idPrefix={idPrefix}
        label="Способ подключения" className="hosting-segmented" />
    </div>
    <ApiDropdown className="api-connection-select" buttonLabel={`Способ подключения: ${selectedLabel}`}
      buttonContent={<><ConnectionIcon icon={selectedIcon} />{selectedLabel}</>}>
      {close => connectionTabs.map(([id, label, icon]) => <button key={id} type="button" aria-pressed={method === id}
        onClick={() => { setMethod(id); close() }}>
        <ConnectionIcon icon={icon} />{label}
      </button>)}
    </ApiDropdown>
    <AnimatedBlock>
      {connectionTabs.map(([id], index) => <div key={id} id={`${idPrefix}-panel-${id}`} role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${id}`} hidden={method !== id} tabIndex={0}>
        {id === 'http' ? <ApiInstructions onCreate={onCreate} /> :
          <ClientInstructions client={index - 1} secret={secret} onCreate={onCreate} />}
      </div>)}
    </AnimatedBlock>
  </>
}

function DataTable({ headings, label, className = '', hasActions = false, children }) {
  return <div className={`api-table-scroll ${className}`.trim()} tabIndex={0} role="region" aria-label={label}>
    <table role="table">
      <thead role="rowgroup"><tr role="row">
        {headings.map(heading => <th key={heading} scope="col" role="columnheader">{heading}</th>)}
        {hasActions && <th scope="col" role="columnheader" aria-label="Действия" />}
      </tr></thead>
      <tbody role="rowgroup">{children}</tbody>
    </table>
  </div>
}

function CapabilityName({ id, label, upcoming }) {
  return <span className="api-capability-name">
    <span className="api-capability-icon" aria-hidden="true"
      style={{ '--api-capability-icon': `url("${capabilityIcons[id]}")` }} />
    {label}{upcoming && <span className="sites-domain-badge api-capability-badge">Скоро</span>}
  </span>
}

function Connection({ hasKeys, onCreate, onKeys }) {
  const connectionId = useId()

  return <div className="api-stack api-section-flow">
    <section className="api-card api-key-promo hosting-reveal">
      <span className="api-key-promo-grain" aria-hidden="true" />
      <span className="api-key-promo-rim" aria-hidden="true" />
      <div className="api-stack api-key-promo-content">
        <div>
          <h2>Ключ для API и MCP</h2>
          <p>Подключайте интеграции и AI-агентов одним ключом. Права доступа можно выбрать при выпуске.</p>
        </div>
        <button type="button" className="api-button api-primary" onClick={hasKeys ? onKeys : () => onCreate()}>{hasKeys ? 'Управлять ключами' : 'Выпустить ключ'}</button>
      </div>
      <img className="api-key-promo-art" src={apiMcpPrism} width="350" height="233" alt="" />
    </section>
    <section className="api-stack api-section hosting-reveal" aria-labelledby={`${connectionId}-title`}>
      <h2 id={`${connectionId}-title`}>Как подключить</h2>
      <div className="api-card api-stack">
        <ConnectionInstructions onCreate={onCreate} />
      </div>
    </section>
    <section className="api-stack api-section api-capabilities hosting-reveal">
      <h2>Возможности API и MCP</h2>
      <DataTable label="Возможности API и MCP" headings={['Раздел', 'Чтение', 'Запись']}>
        {capabilities.map(({ id, label, read, write, upcoming }) => <tr key={id} role="row">
          <th scope="row" role="rowheader"><CapabilityName id={id} label={label} upcoming={upcoming} /></th>
          <td role="cell"><span className="api-mobile-cell-label" aria-hidden="true">Чтение</span>{read}</td>
          <td role="cell"><span className="api-mobile-cell-label" aria-hidden="true">Запись</span>{write ?? '—'}</td>
        </tr>)}
      </DataTable>
    </section>
  </div>
}

function Keys({ keys, onCreate, onEdit, onRemove, onRotate }) {
  if (!keys.length) return <div className="plan-changes-card hosting-reveal">
    <PlanChangesEmpty title="Ключей пока нет" icon={apiIcon}
      description="Укажите, к каким разделам получит доступ ваша интеграция.">
      <button type="button" className="api-button api-primary" onClick={onCreate}>Выпустить ключ</button>
    </PlanChangesEmpty>
  </div>

  return <section className="api-stack hosting-reveal">
    <div className="api-keys-heading">
      <div className="api-keys-heading-copy">
        <h2>Мои ключи</h2>
        <p>Выпущено {keys.length} {keyNouns[countPlural.select(keys.length)]}</p>
      </div>
      <button type="button" className="api-button api-primary" onClick={onCreate}>Выпустить ключ</button>
    </div>
    <DataTable className="api-keys-table" label="Мои ключи" hasActions
      headings={['Название ключа', 'Доступы', 'Срок', 'Последний вызов']}>
      {keys.map(key => {
        const expired = key.expires !== null && key.expires <= Date.now()
        const lastCall = journal.find(([, suffix]) => suffix === key.suffix)?.[0]
        const preset = key.customAccess ? undefined : findPermissionPreset(key.access)
        return <tr role="row" key={key.id}>
          <th scope="row" role="rowheader" className="api-key-name">{key.name}</th>
          <td role="cell" className="api-key-access">
            <span className="api-mobile-cell-label" aria-hidden="true">Доступы</span>
            {preset?.label ?? 'Индивидуальный'}
          </td>
          <td role="cell" className="api-key-expiry">
            <span className="api-mobile-cell-label" aria-hidden="true">Срок</span>
            <span className="sites-domain-badge" data-expired={expired}>
              {expired ? 'Срок истёк' : key.expires ? `До ${dateFormat.format(key.expires)}` : 'Без срока'}
            </span>
          </td>
          <td role="cell" className="api-key-last-call">
            <span className="api-mobile-cell-label" aria-hidden="true">Последний вызов</span>
            {lastCall ?? '—'}
          </td>
          <td role="cell" className="api-key-actions">
            <ApiDropdown className="api-key-menu" buttonLabel={`Действия с ключом «${key.name}»`} iconOnly>
              {close => <>
                <button type="button" onClick={() => { close(); onEdit(key) }}>Настроить</button>
                <button type="button" onClick={() => { close(); onRotate(key) }}>Перевыпустить</button>
                <button type="button" className="api-danger" onClick={() => { close(); onRemove(key) }}>Удалить</button>
              </>}
            </ApiDropdown>
          </td>
        </tr>
      })}
    </DataTable>
  </section>
}

function accessForPreset(level, ids) {
  return Object.fromEntries(permissions.map(({ id, write }) => [
    id, ids && !ids.includes(id) ? 'none' : write ? level : 'read',
  ]))
}

const permissionPresets = presets.map(([label, level, ids]) => ({ label, access: accessForPreset(level, ids) }))
const permissionPresetOptions = [...permissionPresets.map(({ label }) => [label, label]), ['custom', 'Индивидуальный']]
const permissionOptions = Object.entries(accessLabels)
function AccessOptions({ name, label, options, value, disabledValue, onChange, compact }) {
  if (compact) return <ApiSelect className="api-permission-select" label={label}
    options={options} value={value} disabledValue={disabledValue} onChange={onChange} />

  return <div className="api-permission-options">
    <div className="hosting-segmented hosting-indicator-track" role="radiogroup" aria-label={label}>
      <TabIndicator selected={value} />
      {options.map(([id, text]) => <label key={id}>
        <input type="radio" name={name} value={id} checked={value === id}
          disabled={id === disabledValue} onChange={() => onChange(id)} />
        <span>{text}</span>
      </label>)}
    </div>
  </div>
}

function findPermissionPreset(access) {
  return permissionPresets.find(preset => permissions.every(({ id }) => (access[id] ?? 'none') === preset.access[id]))
}

function KeyInput({ label, hideLabel = false, error, className = '', ...inputProps }) {
  const id = useId()
  const showError = Boolean(error && !inputProps.disabled)

  return <div className={`api-field ${className}`.trim()}>
    {!hideLabel && <span className="api-field-label" id={`${id}-label`}>{label}</span>}
    <input {...inputProps} id={id} className="api-field-input"
      aria-label={hideLabel ? label : undefined} aria-labelledby={hideLabel ? undefined : `${id}-label`}
      aria-invalid={showError || undefined} aria-describedby={showError ? `${id}-error` : undefined} />
    {error !== undefined && <AnimatedBlock open={showError}>
      <p className="api-field-error" id={`${id}-error`}>{error}</p>
    </AnimatedBlock>}
  </div>
}

function KeyForm({ original, initialClient, onSave, onCancel, compact }) {
  const [draft, setDraft] = useState(() => ({
    ...startDraft(),
    name: initialClient === undefined || clients[initialClient][0] === 'Другие' ? '' : clients[initialClient][0],
    ...original,
  }))
  const [errors, setErrors] = useState({})
  const [customAccess, setCustomAccess] = useState(original?.customAccess ?? false)
  const formId = useId()
  const activePreset = customAccess ? undefined : findPermissionPreset(draft.access)
  const selectedPreset = activePreset?.label ?? 'custom'
  function selectPreset(value) {
    const preset = permissionPresets.find(({ label }) => label === value)
    setCustomAccess(!preset)
    if (preset) setField('access', preset.access)
  }
  function setField(field, value) {
    setDraft(current => ({ ...current, [field]: value }))
    const errorField = field === 'duration' ? 'days' : field
    setErrors(current => current[errorField] ? { ...current, [errorField]: '' } : current)
  }
  const selectedAccess = permissions.some(({ id }) => draft.access[id] && draft.access[id] !== 'none')
  const days = Number(draft.days)
  const validDuration = draft.duration !== 'custom' || (Number.isInteger(days) && days >= 1 && days <= 3650)
  function submit(event) {
    event.preventDefault()
    const name = draft.name.trim()
    const validation = {
      name: name ? '' : 'Введите название ключа.',
      days: validDuration ? '' : 'Укажите целое число от 1 до 3650.',
      access: selectedAccess ? '' : 'Выберите хотя бы один раздел для доступа.',
    }
    if (Object.values(validation).some(Boolean)) {
      const form = event.currentTarget
      setErrors(validation)
      requestAnimationFrame(() => {
        const input = form.querySelector('input[aria-invalid="true"]')
        if (!input?.isConnected) return
        input.focus({ preventScroll: true })
        input.closest('.api-field').scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        })
      })
      return
    }
    onSave({ ...draft, name, note: draft.note.trim(), customAccess })
  }

  const customDurationInput = <AnimatedBlock open={draft.duration === 'custom'}>
    <KeyInput className="api-custom-duration" label="Количество дней" hideLabel placeholder="Количество дней"
      type="number" min="1" max="3650" step="1" value={draft.days}
      required={draft.duration === 'custom'} disabled={draft.duration !== 'custom'}
      error={errors.days ?? ''}
      onChange={event => setField('days', event.target.value)} />
  </AnimatedBlock>

  return <form className="api-stack api-section-flow hosting-reveal" noValidate onSubmit={submit}>
    <section className="api-stack api-section" aria-labelledby={`${formId}-details`}>
      <h2 id={`${formId}-details`}>Данные ключа</h2>
      <div className="api-card api-stack">
        <KeyInput label="Название" value={draft.name} onChange={event => setField('name', event.target.value)}
          maxLength={80} required placeholder="Например, Claude Code" error={errors.name ?? ''} />
        <KeyInput label="Примечание" value={draft.note} placeholder="Необязательно"
          onChange={event => setField('note', event.target.value)} maxLength={180} />
        <fieldset className="api-stack">
          <legend className="api-field-label">Срок действия</legend>
          <div className="api-choices">
            {durations.map(([id, label]) => {
              const option = <label>
                <input type="radio" name="api-duration" value={id} checked={draft.duration === id} onChange={() => setField('duration', id)} />
                <span>{label}</span>
              </label>
              if (id !== 'custom' || compact) return <Fragment key={id}>{option}</Fragment>

              return <div className="api-duration-custom" key={id}>
                {option}
                {customDurationInput}
              </div>
            })}
          </div>
          {compact && customDurationInput}
        </fieldset>
      </div>
    </section>
    <section className="api-stack api-section" aria-labelledby={`${formId}-access`}>
      <h2 id={`${formId}-access`}>Права доступа</h2>
      <div className="api-card">
        <fieldset className="api-stack" aria-labelledby={`${formId}-access`}>
          <div className="api-choices">
            {permissionPresetOptions.map(([id, label]) => <label key={id}>
              <input type="radio" name="api-access-preset" value={id} checked={selectedPreset === id}
                onChange={() => selectPreset(id)} />
              <span>{label}</span>
            </label>)}
          </div>
          <AnimatedBlock open={Boolean(errors.access)}>
            <p className="api-field-error" role="status">{errors.access}</p>
          </AnimatedBlock>
          <ul className="api-permission-list" role="list" aria-label="Права доступа по разделам">
            {permissions.map(({ id, label, read, write }) => {
              const access = draft.access[id] ?? 'none'
              const description = { read, write }[access] ?? 'Нет доступа к этому разделу'
              return <li className="api-permission-card" key={id} data-access={access}>
                <div className="api-permission-heading">
                  <span className="api-permission-icon" aria-hidden="true"
                    style={{ '--api-capability-icon': `url("${capabilityIcons[id]}")` }} />
                  <div>
                    <h3>{label}</h3>
                    <AnimatedBlock>
                      <p className="api-permission-description">{description}</p>
                    </AnimatedBlock>
                  </div>
                </div>
                <AccessOptions name={`api-access-${id}`} label={label} compact={compact}
                  options={permissionOptions} value={access} disabledValue={write ? undefined : 'write'}
                  onChange={value => {
                    setCustomAccess(true)
                    setField('access', { ...draft.access, [id]: value })
                  }} />
              </li>
            })}
          </ul>
        </fieldset>
      </div>
    </section>
    <div className={original ? 'api-actions' : 'api-actions api-key-create-actions'}>
      <button type="submit" className="api-button api-primary">{original ? 'Сохранить' : 'Выпустить ключ'}</button>
      {original ? <button type="button" className="api-button" onClick={onCancel}>Отмена</button> :
        <p className="api-key-once">
          <span className="api-key-once-icon" aria-hidden="true" />
          <span>Ключ будет показан только один раз после выпуска.</span>
        </p>}
    </div>
  </form>
}

function ApiDropdown({ className = '', buttonLabel, buttonContent, iconOnly = false, children }) {
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
    <button ref={trigger} type="button" className="api-button" aria-expanded={open} aria-controls={id}
      aria-label={buttonLabel}
      onClick={() => setOpen(current => !current)}>
      {iconOnly ? <span className="api-kebab" aria-hidden="true" /> : <>
        <span>{buttonContent}</span>
        <span className="api-caret" aria-hidden="true" />
      </>}
    </button>
    <DropdownPanel id={id} className="api-filter-panel" open={open}>{children(close)}</DropdownPanel>
  </div>
}

function ApiSelect({ label, options, value, onChange, disabledValue, className = '' }) {
  const selectedLabel = options.find(([key]) => key === value)[1]
  return <ApiDropdown className={`api-filter ${className}`.trim()} buttonLabel={`${label}: ${selectedLabel}`} buttonContent={selectedLabel}>
    {close => options.map(([key, text]) => <button key={key} type="button" aria-pressed={value === key} disabled={key === disabledValue}
      onClick={() => { onChange(key); close() }}>{text}</button>)}
  </ApiDropdown>
}

function JournalRow({ entry, keyName }) {
  const [timestamp, , , call, , status] = entry
  const [date, time] = timestamp.split(', ')
  const [day, month] = date.split(' ')
  const space = call.indexOf(' ')
  const method = space === -1 ? null : call.slice(0, space)
  const request = call.slice(space + 1)

  return <tr role="row">
    <td role="cell" className="api-log-date">
      <span className="api-mobile-cell-label" aria-hidden="true">Дата и время</span>
      {`${day} ${journalMonths[month] ?? month}, ${time}`}
    </td>
    <td role="cell" className="api-log-call">
      <span className="api-mobile-cell-label" aria-hidden="true">Запрос</span>
      <code>{method && <span className="api-log-method">{method} </span>}{request}</code>
    </td>
    <th scope="row" role="rowheader" className="api-log-key">
      <span title={keyName}>{keyName}</span>
    </th>
    <td role="cell" className="api-log-result">
      <span className="api-mobile-cell-label" aria-hidden="true">Результат</span>
      <span className="api-status" data-error={status >= 400}>
        <span className="api-status-dot" aria-hidden="true" />
        <span>{resultLabels[status]}</span>
        <span className="api-status-code">{status}</span>
      </span>
    </td>
  </tr>
}

function Journal({ keys, compact }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState('')
  const [key, setKey] = useState('')
  const [result, setResult] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersId = useId()
  const searchField = useRef(null)
  const search = query.trim().toLowerCase()
  const keyNames = new Map(journalKeys.map(suffix => [suffix, 'Неизвестный ключ']))
  demoApiKeys.forEach(({ suffix, name }) => keyNames.set(suffix, name))
  keys.forEach(({ suffix, name }) => keyNames.set(suffix, name))
  const selectedKey = keyNames.has(key) ? key : ''
  const hasActiveFilters = Boolean(source || selectedKey || result)
  const rows = journal.filter(([, suffix, channel, call, ip, status]) =>
    (!source || source === channel) && (!selectedKey || selectedKey === suffix) &&
    (!result || (status < 400 ? 'success' : 'error') === result) &&
    [call, ip, channel, keyNames.get(suffix), keyMask(suffix)].some(value => value.toLowerCase().includes(search)),
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
      {compact && <button type="button" className="api-button api-journal-filter-toggle"
        aria-expanded={filtersOpen} aria-controls={filtersId} aria-label={hasActiveFilters ? 'Фильтры, есть активные' : 'Фильтры'}
        onClick={() => setFiltersOpen(open => !open)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h18l-7 8v5l-4 3v-8z" />
        </svg>
      </button>}
      <AnimatedBlock open={!compact || filtersOpen}>
        <div className="api-filters" id={filtersId}>
          <ApiSelect label="Источник" value={source} onChange={setSource}
            options={[['', 'Все источники'], ...['API', 'MCP', 'Terraform'].map(value => [value, value])]} />
          <ApiSelect label="Ключ" value={selectedKey} onChange={setKey}
            options={[['', 'Все ключи'], ...keyNames]} />
          <ApiSelect label="Результат" value={result} onChange={setResult}
            options={[['', 'Все результаты'], ['success', 'Успешные'], ['error', 'Ошибки']]} />
        </div>
      </AnimatedBlock>
    </div>
    <AnimatedBlock open={Boolean(search) || hasActiveFilters}>
      <div className="api-journal-summary">
        <span role="status">Найдено: {rows.length} {resultNouns[countPlural.select(rows.length)]}</span>
        <button type="button" className="api-disclosure" onClick={reset}>Сбросить фильтры</button>
      </div>
    </AnimatedBlock>
    <AnimatedBlock>
      <div className="api-stack">
        {rows.length ? <DataTable label="Журнал запросов" headings={['Дата и время', 'Запрос', 'Ключ', 'Результат']}>
          {rows.map(entry => <JournalRow key={`${entry[0]}-${entry[3]}`} entry={entry} keyName={keyNames.get(entry[1])} />)}
        </DataTable> : <div className="api-card api-empty">
          <h2>Запросы не найдены</h2>
          <p>Измените запрос или сбросьте фильтры.</p>
        </div>}
      </div>
    </AnimatedBlock>
  </div>
}

function ConnectionIcon({ icon }) {
  return icon.monochrome
    ? <span className="api-tab-icon api-tab-icon-mask" aria-hidden="true" style={{ '--api-tab-icon': `url("${icon.src}")` }} />
    : <img className="api-tab-icon" src={icon.src} width="16" height="16" alt="" />
}

function ApiTabs({ tab, onTabChange, tabs = apiTabs, idPrefix = 'api', label = apiAgentsSection, className = 'sites-tabs' }) {
  function move(event) {
    const index = tabs.findIndex(([id]) => id === tab)
    const last = tabs.length - 1
    const next = { ArrowLeft: (index + last) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: last }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const [id] = tabs[next]
    onTabChange(id)
    document.getElementById(`${idPrefix}-tab-${id}`).focus()
  }

  return <div className={`${className} hosting-indicator-track`} role="tablist" aria-label={label} onKeyDown={move}>
    <TabIndicator selected={tab} />
    {tabs.map(([id, text, icon]) => <button type="button" role="tab" key={id} id={`${idPrefix}-tab-${id}`}
      aria-selected={tab === id} aria-controls={`${idPrefix}-panel-${id}`} tabIndex={tab === id ? 0 : -1} onClick={() => onTabChange(id)}>
      {icon && <ConnectionIcon icon={icon} />}
      {text}
    </button>)}
  </div>
}

export default function ApiAgents({ tab, onTabChange, keys: accountKeys, setKeys: setAccountKeys, showDemoKeys, compact }) {
  const [demoKeys, setDemoKeys] = useState(() => {
    if (!showDemoKeys) return []
    const now = Date.now()
    return demoApiKeys.map(({ name, suffix, age, duration, preset, note = '' }) => {
      const createdAt = now - age * 86_400_000
      return {
        id: `demo-key-${suffix}`, name, suffix, note, duration, days: '', createdAt,
        expires: duration === 'none' ? null : createdAt + Number(duration) * 86_400_000,
        access: permissionPresets.find(entry => entry.label === preset).access,
      }
    })
  })
  const keys = showDemoKeys ? demoKeys : accountKeys
  const setKeys = showDemoKeys ? setDemoKeys : setAccountKeys
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
    {form && <KeyForm original={form.original} initialClient={form.client} onSave={save} onCancel={cancelForm} compact={compact} />}
    {issued && <div className="api-stack hosting-reveal">
      <section className="api-card api-stack">
        <h2>{issued.name}</h2>
        <Address label="Ключ" value={issued.secret} />
        <div className="api-actions">
          <Copy value={issued.secret} label="Скопировать ключ" primary />
          <button type="button" className="api-button" onClick={showKeys}>К списку ключей</button>
        </div>
        <p className="api-issued-warning">Сохраните ключ. Он показывается только один раз.</p>
      </section>
      <section className="api-card api-stack">
        <h2>Подключение агента</h2>
        <ConnectionInstructions secret={issued.secret} initialMethod={`client-${issued.client ?? 0}`} />
      </section>
    </div>}
    {apiTabs.map(([id]) => <div key={id} id={`api-panel-${id}`} role="tabpanel"
      aria-labelledby={`api-tab-${id}`} hidden={Boolean(form || issued) || tab !== id} tabIndex={0}>
      {id === 'connection' && <Connection hasKeys={keys.length > 0} onKeys={showKeys} onCreate={client => edit(null, client)} />}
      {id === 'keys' && <Keys keys={keys} onCreate={() => edit(null)} onEdit={edit}
        onRemove={key => setConfirmation({ key, remove: true })} onRotate={key => setConfirmation({ key, remove: false })} />}
      {id === 'journal' && <Journal keys={keys} compact={compact} />}
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
