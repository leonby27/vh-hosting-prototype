import { Fragment, useContext, useId, useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import { Button, Choice, IconButton, Link, SearchField, TextField } from './ui/controls.jsx'
import { Surface, TableFrame } from './ui/layout.jsx'
import { AssetIcon } from './ui/Icon.jsx'
import { Badge, StatusBadge, Tooltip } from './ui/feedback.jsx'
import { MenuItem, PopoverMenu, SegmentedOptions, TabList } from './ui/navigation.jsx'
import WarningDialog from './WarningDialog.jsx'
import { PlanChangesEmpty } from './PlanChanges.jsx'
import { ProtectionFaq } from './SitesProtectionUI.jsx'
import claudeCodeIcon from './assets/api-agents/claudecode-color.svg'
import claudeIcon from './assets/api-agents/claude-color.svg'
import cursorIcon from './assets/api-agents/cursor.svg'
import keyIcon from './assets/api-agents/key-fill.svg'
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
import { apiAddress, apiAgentsSection, apiDocsUrl, capabilities, clients, demoApiKeys, journal, permissions, presets, secretPlaceholder } from './api-agents-data.js'
import './api-agents.css'

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
const connectionQuestions = [
  {
    id: 'api-docs', title: 'Документация API',
    answer: <>Описание методов и примеры запросов есть в <Link href={apiDocsUrl}
      target="_blank" rel="noopener noreferrer">документации API Timeweb <span aria-hidden="true">↗</span></Link>.</>,
  },
  {
    id: 'mcp-setup', title: 'Как подключить MCP',
    answer: 'В разделе «Как подключить» выберите своего клиента, выпустите ключ и добавьте MCP-сервер по инструкции для этого клиента.',
  },
  {
    id: 'request-limits', title: 'Ограничения на число запросов',
    answer: 'Код 429 в журнале означает, что превышен лимит запросов. Уменьшите частоту запросов и повторите запрос после паузы.',
  },
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

  const className = primary ? 'api-button api-copy-key' : 'api-code-copy'
  return <Tooltip content={primary ? label : 'Скопировать'} placement={primary ? 'bottom' : 'top'}
    className={primary ? undefined : className}>
    {id => <IconButton variant={primary ? 'primary' : 'neutral'} size={primary ? 40 : 32}
      appearance={primary ? 'default' : 'icon-solid'} className={primary ? className : undefined} onClick={copy} label={label} aria-describedby={id}>
      <span className="api-copy-key-icon" aria-hidden="true" />
      {primary && label}
    </IconButton>}
  </Tooltip>
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
  return <Button variant="outline" appearance="compact-outline" pressable={false} onClick={onClick}
    icon={<AssetIcon src={keyIcon} monochrome />}>
    {children}
  </Button>
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
    <>Выберите нужный метод и настройте авторизацию по <Link href={apiDocsUrl}
      target="_blank" rel="noopener noreferrer">документации API <span aria-hidden="true">↗</span></Link>.</>,
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
        label="Способ подключения" variant="segmented" surface="page" />
    </div>
    <ApiDropdown className="api-connection-select" optionSize={44} buttonLabel={`Способ подключения: ${selectedLabel}`}
      buttonIcon={<AssetIcon {...selectedIcon} />} buttonContent={selectedLabel}>
      {close => connectionTabs.map(([id, label, icon]) => <MenuItem key={id} selected={method === id}
        icon={<AssetIcon {...icon} />} onClick={() => { setMethod(id); close() }}>
        {label}
      </MenuItem>)}
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
  return <TableFrame appearance="surface" className={`api-table-scroll ${className}`.trim()} label={label}>
    <table role="table">
      <thead role="rowgroup"><tr role="row">
        {headings.map(heading => <th key={heading} scope="col" role="columnheader">{heading}</th>)}
        {hasActions && <th scope="col" role="columnheader" aria-label="Действия" />}
      </tr></thead>
      <tbody role="rowgroup">{children}</tbody>
    </table>
  </TableFrame>
}

function CapabilityName({ id, label, upcoming }) {
  return <span className="api-capability-name">
    <span className="api-capability-icon" aria-hidden="true"
      style={{ '--api-capability-icon': `url("${capabilityIcons[id]}")` }} />
    {label}{upcoming && <Badge tone="success" className="api-capability-badge">Скоро</Badge>}
  </span>
}

function Connection({ hasKeys, onCreate, onKeys }) {
  const connectionId = useId()

  return <div className="api-stack api-section-flow">
    <Surface as="section" elevation="card" className="api-card api-key-promo hosting-reveal">
      <span className="api-key-promo-grain" aria-hidden="true" />
      <span className="api-key-promo-rim" aria-hidden="true" />
      <div className="api-stack api-key-promo-content">
        <div>
          <h2>Ключ для API и MCP</h2>
          <p>Подключайте интеграции и AI-агентов одним ключом. Права доступа можно выбрать при выпуске.</p>
        </div>
        <Button pressable={false} className="api-button" onClick={hasKeys ? onKeys : () => onCreate()}>{hasKeys ? 'Управлять ключами' : 'Выпустить ключ'}</Button>
      </div>
      <img className="api-key-promo-art" src={apiMcpPrism} width="350" height="233" alt="" />
    </Surface>
    <section className="api-stack api-section hosting-reveal" aria-labelledby={`${connectionId}-title`}>
      <h2 id={`${connectionId}-title`}>Как подключить</h2>
      <Surface elevation="card" className="api-card api-stack">
        <ConnectionInstructions onCreate={onCreate} />
      </Surface>
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
    <ProtectionFaq questions={connectionQuestions} />
  </div>
}

function Keys({ keys, onCreate, onEdit, onRemove, onRotate }) {
  if (!keys.length) return <Surface appearance="card" padding="none" className="plan-changes-card hosting-reveal">
    <PlanChangesEmpty title="Ключей пока нет" icon={apiIcon}
      description="Укажите, к каким разделам получит доступ ваша интеграция.">
      <Button pressable={false} type="button" className="api-button" onClick={onCreate}>Выпустить ключ</Button>
    </PlanChangesEmpty>
  </Surface>

  return <section className="api-stack hosting-reveal">
    <div className="api-keys-heading">
      <div className="api-keys-heading-copy">
        <h2>Мои ключи</h2>
        <p>Выпущено {keys.length} {keyNouns[countPlural.select(keys.length)]}</p>
      </div>
      <Button pressable={false} type="button" className="api-button" onClick={onCreate}>Выпустить ключ</Button>
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
            <Badge tone={expired ? 'danger' : undefined} className="sites-domain-badge">
              {expired ? 'Срок истёк' : key.expires ? `До ${dateFormat.format(key.expires)}` : 'Без срока'}
            </Badge>
          </td>
          <td role="cell" className="api-key-last-call">
            <span className="api-mobile-cell-label" aria-hidden="true">Последний вызов</span>
            {lastCall ?? '—'}
          </td>
          <td role="cell" className="api-key-actions">
            <ApiDropdown className="api-key-menu" buttonLabel={`Действия с ключом «${key.name}»`} iconOnly>
              {close => <>
                <MenuItem onClick={() => { close(); onEdit(key) }}>Настроить</MenuItem>
                <MenuItem onClick={() => { close(); onRotate(key) }}>Перевыпустить</MenuItem>
                <MenuItem tone="danger" onClick={() => { close(); onRemove(key) }}>Удалить</MenuItem>
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
  if (compact) return <ApiSelect variant="surface" className="api-permission-select" label={label}
    options={options} value={value} disabledValue={disabledValue} onChange={onChange} />

  return <div className="api-permission-options">
    <SegmentedOptions surface="page" size={40} name={name} label={label} value={value} onChange={onChange}
      options={options.map(([id, text]) => ({ value: id, label: text, disabled: id === disabledValue }))} />
  </div>
}

function findPermissionPreset(access) {
  return permissionPresets.find(preset => permissions.every(({ id }) => (access[id] ?? 'none') === preset.access[id]))
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
        input.closest('.vh-field').scrollIntoView({
          block: 'start',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        })
      })
      return
    }
    onSave({ ...draft, name, note: draft.note.trim(), customAccess })
  }

  const customDurationInput = <AnimatedBlock open={draft.duration === 'custom'}>
    <TextField className="api-custom-duration" label="Количество дней" hideLabel size={36} placeholder="Количество дней"
      type="number" min="1" max="3650" step="1" value={draft.days}
      required={draft.duration === 'custom'} disabled={draft.duration !== 'custom'}
      error={errors.days ?? ''}
      onChange={event => setField('days', event.target.value)} />
  </AnimatedBlock>

  return <form className="api-stack api-section-flow hosting-reveal" noValidate onSubmit={submit}>
    <section className="api-stack api-section" aria-labelledby={`${formId}-details`}>
      <h2 id={`${formId}-details`}>Данные ключа</h2>
      <Surface elevation="card" className="api-card api-stack">
        <TextField label="Название" value={draft.name} onChange={event => setField('name', event.target.value)}
          maxLength={80} required placeholder="Например, Claude Code" error={errors.name ?? ''} />
        <TextField label="Примечание" value={draft.note} placeholder="Необязательно"
          onChange={event => setField('note', event.target.value)} maxLength={180} />
        <fieldset className="api-stack">
          <legend className="api-field-label">Срок действия</legend>
          <div className="api-choices">
            {durations.map(([id, label]) => {
              const option = <Choice kind="radio" variant="button" label={label} name="api-duration" value={id}
                checked={draft.duration === id} onChange={() => setField('duration', id)} />
              if (id !== 'custom' || compact) return <Fragment key={id}>{option}</Fragment>

              return <div className="api-duration-custom" key={id}>
                {option}
                {customDurationInput}
              </div>
            })}
          </div>
          {compact && customDurationInput}
        </fieldset>
      </Surface>
    </section>
    <section className="api-stack api-section" aria-labelledby={`${formId}-access`}>
      <h2 id={`${formId}-access`}>Права доступа</h2>
      <Surface elevation="card" className="api-card">
        <fieldset className="api-stack" aria-labelledby={`${formId}-access`}>
          <div className="api-choices">
            {permissionPresetOptions.map(([id, label]) => <Choice key={id} kind="radio" variant="button"
              label={label} name="api-access-preset" value={id} checked={selectedPreset === id}
              onChange={() => selectPreset(id)} />)}
          </div>
          <AnimatedBlock open={Boolean(errors.access)}>
            <div className="vh-field-error" role="status">{errors.access}</div>
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
      </Surface>
    </section>
    <div className={original ? 'api-actions' : 'api-actions api-key-create-actions'}>
      <Button pressable={false} type="submit" className="api-button">{original ? 'Сохранить' : 'Выпустить ключ'}</Button>
      {original ? <Button variant="neutral" pressable={false} className="api-button" onClick={onCancel}>Отмена</Button> :
        <p className="api-key-once">
          <span className="api-key-once-icon" aria-hidden="true" />
          <span>Ключ будет показан только один раз после выпуска.</span>
        </p>}
    </div>
  </form>
}

function ApiDropdown({ variant, className = '', buttonLabel, buttonContent, buttonIcon, optionSize, iconOnly = false, children }) {
  return <PopoverMenu variant={variant} className={`api-dropdown ${className}`} panelClassName="api-filter-panel" optionSize={optionSize} leading={buttonIcon} iconOnly={iconOnly}
    triggerProps={{ className: 'api-button', 'aria-label': buttonLabel }}
    trigger={iconOnly ? <span className="api-kebab" aria-hidden="true" /> : buttonContent}>
    {children}
  </PopoverMenu>
}

function ApiSelect({ label, options, value, onChange, disabledValue, variant = 'toolbar', className = '' }) {
  const selectedLabel = options.find(([key]) => key === value)?.[1] ?? label
  return <ApiDropdown variant={variant} className={`api-filter ${className}`.trim()} buttonLabel={`${label}: ${selectedLabel}`} buttonContent={selectedLabel}>
    {close => options.map(([key, text]) => <MenuItem key={key} selected={value === key} disabled={key === disabledValue}
      onClick={() => { onChange(key); close() }}>{text}</MenuItem>)}
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
      <StatusBadge code={status} tone={status >= 400 ? 'error' : 'success'}>{resultLabels[status]}</StatusBadge>
    </td>
  </tr>
}

function Journal({ keys, compact, empty = false }) {
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
  const rows = (empty ? [] : journal).filter(([, suffix, channel, call, ip, status]) =>
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
      <SearchField variant="toolbar" className="api-search" label="Поиск по журналу" ref={searchField} placeholder="Запрос, ключ, источник или IP"
        value={query} onChange={event => setQuery(event.target.value)} />
      {compact && <Button variant="neutral" size={44} className="api-button" appearance="icon-toggle"
        aria-expanded={filtersOpen} aria-controls={filtersId} aria-label={hasActiveFilters ? 'Фильтры, есть активные' : 'Фильтры'}
        onClick={() => setFiltersOpen(open => !open)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 4h18l-7 8v5l-4 3v-8z" />
        </svg>
      </Button>}
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
        <Button appearance="text" pressable={false} type="button" className="api-disclosure" onClick={reset}>Сбросить фильтры</Button>
      </div>
    </AnimatedBlock>
    <AnimatedBlock>
      <div className="api-stack">
        {rows.length ? <DataTable label="Журнал запросов" headings={['Дата и время', 'Запрос', 'Ключ', 'Результат']}>
          {rows.map(entry => <JournalRow key={`${entry[0]}-${entry[3]}`} entry={entry} keyName={keyNames.get(entry[1])} />)}
        </DataTable> : <Surface appearance="card" padding="none" className="plan-changes-card">
          <PlanChangesEmpty icon={apiIcon} title={empty ? 'Запросов пока нет' : 'Запросы не найдены'}
            description={empty ? 'Здесь появится история запросов к API, MCP и Terraform.' : 'Измените запрос или сбросьте фильтры.'} />
        </Surface>}
      </div>
    </AnimatedBlock>
  </div>
}

function ApiTabs({ tab, onTabChange, tabs = apiTabs, idPrefix = 'api', label = apiAgentsSection, variant = 'line', surface, size }) {
  return <TabList tabs={tabs.map(([id, text, icon]) => ({ id, label: text, icon: icon && <AssetIcon {...icon} /> }))}
    value={tab} onChange={onTabChange} idPrefix={idPrefix} label={label} variant={variant} surface={surface} size={size} indicator />
}

export default function ApiAgents({ tab, onTabChange, keys: accountKeys, setKeys: setAccountKeys, showDemoKeys, emptyJournal = false, compact }) {
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

  return <div className="sites-page api-page">
    <header className="sites-heading">
      {(form || issued) && <Button appearance="text" pressable={false} type="button" className="api-disclosure" onClick={form ? cancelForm : showKeys}>
        ← {form && tab === 'connection' ? 'Подключение' : 'Все ключи'}
      </Button>}
      <h1 ref={heading} tabIndex={-1}>{form ? form.original ? 'Настройки ключа' : 'Новый ключ' : issued ? 'Ключ выпущен' : apiAgentsSection}</h1>
      {!form && !issued && <ApiTabs tab={tab} onTabChange={onTabChange} size={compact ? 'compact' : undefined} />}
    </header>
    {form && <KeyForm original={form.original} initialClient={form.client} onSave={save} onCancel={cancelForm} compact={compact} />}
    {issued && <div className="api-stack hosting-reveal">
      <Surface as="section" elevation="card" className="api-card api-stack">
        <h2>{issued.name}</h2>
        <Address label="Ключ" value={issued.secret} />
        <div className="api-actions">
          <Copy value={issued.secret} label="Скопировать ключ" primary />
          <Button variant="neutral" pressable={false} className="api-button" onClick={showKeys}>К списку ключей</Button>
        </div>
        <p className="api-issued-warning">Сохраните ключ. Он показывается только один раз.</p>
      </Surface>
      <Surface as="section" elevation="card" className="api-card api-stack">
        <h2>Подключение агента</h2>
        <ConnectionInstructions secret={issued.secret} initialMethod={`client-${issued.client ?? 0}`} />
      </Surface>
    </div>}
    {apiTabs.map(([id]) => <div key={id} id={`api-panel-${id}`} role="tabpanel"
      aria-labelledby={`api-tab-${id}`} hidden={Boolean(form || issued) || tab !== id} tabIndex={0}>
      {id === 'connection' && <Connection hasKeys={keys.length > 0} onKeys={showKeys} onCreate={client => edit(null, client)} />}
      {id === 'keys' && <Keys keys={keys} onCreate={() => edit(null)} onEdit={edit}
        onRemove={key => setConfirmation({ key, remove: true })} onRotate={key => setConfirmation({ key, remove: false })} />}
      {id === 'journal' && <Journal keys={keys} compact={compact} empty={emptyJournal} />}
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
