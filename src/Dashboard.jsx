import { useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { Button, Switch, IconButton } from './ui/controls.jsx'
import { createPortal } from 'react-dom'
import BalanceTopUp from './BalanceTopUp.jsx'
import DashboardMailQuota, { mailQuotaStorageKey, readMailQuota } from './DashboardMailQuota.jsx'
import DashboardMetricPlot from './DashboardMetricPlot.jsx'
import { formatTopUpAmount, topUpStates } from './balance-top-up-states.js'
import { HostingToastContext } from './hosting-toast.jsx'
import { Dropdown, SegmentedOptions } from './ui/navigation.jsx'
import { AssetIcon } from './ui/Icon.jsx'
import { Surface } from './ui/layout.jsx'
import { Badge, Tooltip } from './ui/feedback.jsx'
import NetworkAttackNotice from './NetworkAttackNotice.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { getDashboardState } from './dashboard-variants.js'
import { DashboardMigrationBanner, DashboardTrialNotice } from './DashboardNotices.jsx'
import './dashboard.css'

const assets = {
  ...import.meta.glob(['./assets/dashboard/*.svg', '!./assets/dashboard/mobile-*.svg'], { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('./assets/dashboard/mobile-*.svg', { eager: true, query: '?url&no-inline', import: 'default' }),
}

const services = [
  {
    title: 'Сайты', icon: 'site', section: 'Сайты', action: 'Добавить сайт',
    rows: [{ name: 'twsite', detail: 'timeweb.ru' }, { name: 'twsitelongname', detail: 'timeweblongname.ru' }],
    mobileRows: [{ name: 'twsite', detail: 'timeweb.ru' }],
  },
  {
    title: 'Домены', icon: 'globe', section: 'Домены и SSL', action: 'Купить домен',
    rows: [{ name: 'myreviews.ru' }, { name: 'myreviews.ru', info: true }],
    mobileAction: 'Добавить домен',
    mobileRows: [{ name: 'timeweb.ru', detail: 'до 12.10.2028' }, { name: 'myreviews.ru', detail: 'до 10.04.2027' }],
  },
  {
    title: 'Почта', icon: 'mail', section: 'Почта', action: 'Добавить ящик', mailUsage: 16.4,
    rows: [{ name: 'timeweb.ru', detail: '8 ящиков' }],
  },
]

const siteDescription = 'Разместите новый или перенесите существующий сайт, DNS уже настроен.'
const populatedSites = [
  { name: 'twsite', detail: 'coconote.ru' },
  { name: 'timeweb-test', detail: 'Не привязан', tone: 'unlinked' },
  { name: 'notes', detail: 'coconote.ru' },
]

const serviceStates = {
  rich: {
    site: { rows: populatedSites, more: '+ 12 сайтов' },
    globe: {
      rows: [{ name: 'domainexample.ru', detail: 'Истёк', tone: 'error' }, { name: 'timeweb.ru', detail: 'до 01.09', tone: 'warning' }, { name: 'myreviews.ru' }],
      more: '+ 12 доменов', warning: 'Без автопродления: 9 из 15 шт.', action: 'Продлить домены', actionTone: 'danger',
    },
    mail: {
      mailUsage: 19.4, more: '+ 3 почтовых домена',
      rows: [{ name: 'perov.ru', detail: '4 ящика' }, { name: 'myreviews.ru', detail: '8 ящиков' }, { name: 'myreviews.ru', detail: '8 ящиков' }],
    },
  },
  trial: {
    site: { description: siteDescription },
    mail: { description: 'Добавьте первый почтовый ящик на вашем домене.', mailUsage: 0 },
  },
  parking: {
    globe: { description: 'Выберите домен для будущего сайта и почты, всё остальное подключается к нему.', price: 'от 200 ₽ / год', action: 'Подобрать домен' },
    site: { description: siteDescription, price: 'от 199 ₽ / мес', action: 'Разместить сайт' },
    mail: { description: 'Подключите почту к вашему домену.', price: 'от 95 ₽ / мес', action: 'Подключить почту', mailUsage: null },
  },
  blocked: { site: { blocked: true }, mail: { blocked: true, mailUsage: null } },
  limit: { site: { rows: populatedSites, more: '+ 12 сайтов', limit: true } },
}

const debitStates = {
  rich: { extra: 'Продление 10 доменов', shortfall: 4296, note: 'Не забудьте пополнить счёт', tone: 'warning', planServices: '2 сервиса' },
  overdue: { title: 'Заблокировано', extra: 'и ещё 3 сервиса', shortfall: 4296, note: 'Пополните счёт для разблокировки', tone: 'error' },
  blocked: { title: 'Заблокировано', plan: 'Недоступен', tone: 'error' },
  parking: { title: 'Отсутствует', plan: 'Парковка', shortfall: 399 },
  trial: { shortfall: 4716, note: 'Автоплатёж включён', planNote: 'Тестовый период до 12 сент. 2026' },
}

const serviceSkeletonWidths = {
  site: [114, 194, 160, 118],
  globe: [187, 95, 233, 118],
  mail: [154, 233, 108, 128],
}

const ftpDetails = { IP: '192.0.2.15', Хост: 'vh354.example', Логин: 'demo001' }
const mobileFtpFields = ['IP', 'Логин', 'Хост']

const serviceStatuses = [
  ['web', 'Web'],
  ['mysql', 'MySQL'],
  ['ftp', 'FTP'],
  ['status-mail', 'Почта'],
  ['smtp', 'SMTP'],
  ['ssh', 'SSH'],
]

const serviceStatusLabels = { up: 'Работает', down: 'Недоступен' }

const percentages = ['100%', '80%', '60%', '40%', '20%', '0']
const mobilePercentages = ['50%', '40%', '30%', '20%', '10%', '0']
const cpuSeconds = ['80', '64', '48', '32', '16', '0']
const monitoringUnits = [{ value: '%', label: '%' }, { value: 'CP', label: 'CP' }]
const unavailableMonitoringUnits = monitoringUnits.map(option => ({ ...option, disabled: true }))
const dates = ['01.01', '03.01', '05.01', '07.01', '09.01', '11.01', '13.01']

const monitoringMetrics = [
  { value: 'CPU', label: 'CPU, %', description: 'Процессор' },
  { value: 'MySQL', label: 'MySQL, сек', description: 'База данных', unit: 'сек', limit: 300,
    values: [47, 60, 57, 65, 71, 62, 54, 76, 88, 106, 104, 94, 88, 102, 115, 124, 110, 118, 143, 129] },
  { value: 'RAM', label: 'RAM, Мб', description: 'Объём доступной памяти', unit: 'Мб', limit: 1000,
    values: [220, 280, 320, 360, 340, 390, 350, 330, 310, 280, 375, 460, 510, 490, 420, 450, 460, 440, 510, 480] },
  { value: 'IO', label: 'IO, Мб/сек', description: 'Ограничение скорости', unit: 'Мб/сек', limit: 10,
    values: [2, 1.5, 2.4, 1, 2.8, 3.1, 6, 4.8, 4.5, 4, 3.8, 5.3, 5, 4.6, 3.7, 3, 3.8, 3.2, 5, 4] },
  { value: 'IOPS', label: 'IOPS', description: 'Кол-во операций ввода-вывода в сек.', unit: 'оп/сек', limit: 500,
    values: [120, 110, 130, 90, 130, 180, 220, 210, 160, 190, 180, 150, 160, 150, 180, 190, 210, 190, 240, 210] },
  { value: 'nPROC', label: 'nPROC', description: 'Макс. одновременно работающих процессов', unit: 'проц.', limit: 50,
    values: [12, 13, 12, 15, 17, 16, 18, 17, 15, 11, 15, 20, 23, 21, 19, 15, 16, 14, 19, 17] },
]

function Artwork({ name }) {
  return <img src={assets[`./assets/dashboard/${name}.svg`]} alt="" />
}

function TintedArtwork({ name, tone, label, className = '' }) {
  return <AssetIcon src={assets[`./assets/dashboard/${name}.svg`]} monochrome intrinsic tone={tone}
    label={label} className={`dashboard-tinted-art ${className}`.trim()} />
}

function DashboardButton({ children, onClick, label, primary = false, ...props }) {
  return <Button appearance="dashboard" className="dashboard-button" variant={primary ? 'primary' : 'neutral'} aria-label={label} onClick={onClick} {...props}>{children}</Button>
}

function OpenSection({ section, onSelect }) {
  return (
    <DashboardButton iconOnly label={`Открыть раздел «${section}»`} onClick={() => onSelect(section)}>
      <TintedArtwork name="arrow-out" tone="icon-primary" />
    </DashboardButton>
  )
}

function Skeleton({ width }) {
  return <span className="dashboard-skeleton" aria-hidden="true" style={{ '--dashboard-skeleton-width': width }} />
}

function DebitLine({ label, amount }) {
  return <div className="dashboard-renewal">
    <span>{label}</span>
    <span className="dashboard-renewal-leader" aria-hidden="true" />
    <strong>{amount}</strong>
  </div>
}

function Billing({ onTopUp, onTariffSettings, credit, compact, state, loading }) {
  const { mode } = state
  const debit = debitStates[mode] ?? {}
  const unavailable = mode === 'blocked'
  const mobileTrial = mode === 'trial' && compact
  const balance = (mobileTrial ? 2784 : state.balance ?? 2784) + credit
  const initialShortfall = mobileTrial ? 4296 : debit.shortfall ?? (compact ? 4296 : 0)
  const shortfall = Math.max(0, initialShortfall - credit)
  const balanceNote = shortfall ? `Не хватает ${formatTopUpAmount(shortfall)} ₽` : 'Баланса хватает до списания'
  const debitTitle = debit.title ?? (compact ? '12 сентября' : '12 сентября 2028')
  const debitNote = debit.note ?? 'Автоплатёж включён'
  const showDebit = !unavailable && mode !== 'parking'
  const planNoteAtBottom = !compact && !unavailable && mode !== 'parking' && !debit.planServices

  return (
    <div className="dashboard-billing" data-blocked={unavailable || undefined}>
      <Surface as="section" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-balance hosting-reveal" aria-label="Баланс и ближайшее списание">
        <div className="dashboard-billing-cell">
          <div className="dashboard-balance-top">
            <div>
              <h2 className="dashboard-label">Баланс</h2>
              <p className="dashboard-amount" data-tone={balance < 0 ? 'error' : undefined}>
                {loading ? <Skeleton width="79px" /> : `${formatTopUpAmount(balance)} ₽`}
              </p>
              {compact && !unavailable && <p className="dashboard-note">{loading ? <Skeleton width="114px" /> : balanceNote}</p>}
            </div>
            {!unavailable && <DashboardButton primary size={compact ? 40 : 44} onClick={onTopUp}>Пополнить</DashboardButton>}
          </div>
          {!compact && !unavailable && <p className="dashboard-note">{loading ? <Skeleton width="114px" /> : balanceNote}</p>}
        </div>
        <div className="dashboard-billing-cell">
          <div>
            <h2 className="dashboard-label">Ближайшее списание</h2>
            {loading ? <>
              <p className="dashboard-amount"><Skeleton width="210px" /></p>
              {showDebit && <div className="dashboard-note dashboard-debit-placeholder" data-expanded={Boolean(debit.extra) || undefined}>
                <p><Skeleton width="151px" /></p>
              </div>}
            </> : compact && !debit.title && !debit.extra ? <>
              <div className="dashboard-mobile-debit">
                <time className="dashboard-amount" dateTime="2028-09-12">{debitTitle}</time>
                <TintedArtwork name="mobile-balance-leader" tone="plan-branch-line" />
                <strong className="dashboard-amount">4 716 ₽</strong>
              </div>
              <p className="dashboard-note">Тариф Year, год</p>
            </> : <>
              <p className="dashboard-amount" data-tone={debit.title ? debit.tone : undefined}>{debitTitle}</p>
              {showDebit && <div className="dashboard-renewals">
                <DebitLine label="Тариф Year, годовой" amount="4 716 ₽" />
                {debit.extra && <DebitLine label={debit.extra} amount="400 ₽" />}
              </div>}
            </>}
          </div>
          {showDebit && <p className="dashboard-label" data-tone={debit.tone}>{loading ? <Skeleton width="114px" /> : debitNote}</p>}
        </div>
      </Surface>
      <Surface as="section" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-billing-cell hosting-reveal" aria-labelledby="dashboard-plan">
        <div>
          <h2 className="dashboard-label" id="dashboard-plan">Тариф</h2>
          {loading ? <>
            <p className="dashboard-amount">
              <Skeleton width="114px" />
              {compact && !debit.planServices && <Skeleton width="194px" />}
            </p>
            {!planNoteAtBottom && (!compact || debit.planServices) && <p className="dashboard-note"><Skeleton width="194px" /></p>}
          </> : unavailable || mode === 'parking' ?
            <p className="dashboard-amount" data-tone={unavailable ? 'muted' : undefined}>{debit.plan}</p> :
            <Button appearance="nav-action" pressable={false} className="dashboard-amount dashboard-plan-link"
              onClick={onTariffSettings} aria-label="Настройки тарифа Optimo">Optimo</Button>}
          {!loading && debit.planServices && <p className="dashboard-note">{debit.planServices}</p>}
        </div>
        {planNoteAtBottom && <p className="dashboard-note">
          {loading ? <Skeleton width="194px" /> : debit.planNote ?? 'Оплачен до 30.09, ещё 16 дней'}
        </p>}
      </Surface>
    </div>
  )
}

function DomainName({ value, className, ...props }) {
  const lastDot = value.lastIndexOf('.', value.endsWith('.') ? value.length - 2 : value.length - 1)
  if (lastDot < 1) return <span className={`dashboard-ellipsis ${className ?? ''}`.trim()} {...props}>{value}</span>

  // The final dot of the ellipsis doubles as the dot before the domain zone.
  return <span className={`dashboard-domain-name ${className ?? ''}`.trim()} {...props}>
    <span className="dashboard-ellipsis">{value.slice(0, lastDot + 1)}</span>
    <span>{value.slice(lastDot + 1)}</span>
  </span>
}

function ServiceCard({ service, onSelect, compact, state, mailQuota, onEditMailQuota, loading }) {
  const example = serviceStates[state]?.[service.icon]
  const { title, icon, section, action, mailUsage, rows, description, price, more, warning, actionTone, blocked, limit } = { ...service, ...example }
  const [firstBar, secondBar, thirdBar, actionBar] = serviceSkeletonWidths[icon]
  const visibleRows = compact && !example?.rows && service.mobileRows ? service.mobileRows : rows
  const actionLabel = compact && !example?.action ? service.mobileAction ?? action : action
  const openSection = () => onSelect(section)
  return (
    <Surface as="article" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-service hosting-reveal"
      data-muted={Boolean(blocked || price)} data-expanded={Boolean(more) || undefined}>
      <div className="dashboard-service-heading">
        <span className="dashboard-service-icon"><Artwork name={icon} /></span>
        <h3>{title}</h3>
        {!loading && mailUsage != null && (
          <Button className="dashboard-mail-badge-trigger" appearance="text" pressable={false} aria-haspopup="dialog"
            aria-label={`Изменить почтовую квоту, ${mailUsage} из ${mailQuota} Гб`} onClick={() => onEditMailQuota(mailUsage)}>
            <Badge className="dashboard-badge" tone={mailUsage / mailQuota >= 0.95 ? 'danger' : 'info'}>{mailUsage} из {mailQuota} Гб</Badge>
          </Button>
        )}
      </div>
      {blocked ? <p className="dashboard-unavailable">Раздел недоступен</p> : <>
        <AnimatedBlock>
          <div className="dashboard-service-content">
            {loading ? <div className="dashboard-skeleton-stack">
              {[firstBar, secondBar, thirdBar].map(width => <Skeleton key={width} width={`${width}px`} />)}
            </div> : description ?
              <div className={price ? 'dashboard-service-offer' : undefined}>
                <p className="dashboard-service-summary">{description}</p>
                {price && <p className="dashboard-service-price">{price}</p>}
              </div> :
              <ul className="dashboard-service-rows">
                {visibleRows.map(({ name, detail, info, tone }, index) => (
                  <li key={index} data-row-tone={tone}>
                    {icon === 'site' ? <span className="dashboard-ellipsis">{name}</span> : <DomainName value={name} />}
                    {detail && (icon === 'site'
                      ? <DomainName value={detail} className="dashboard-service-detail" data-tone={tone} />
                      : <span className="dashboard-service-detail dashboard-ellipsis" data-tone={tone}>{detail}</span>)}
                    {info && <Tooltip className="dashboard-domain-info" content="Информация о домене" pressable>
                      {id => <IconButton size={24} label="Информация о домене" aria-describedby={id}>
                        <TintedArtwork name="info" tone="icon-info" />
                      </IconButton>}
                    </Tooltip>}
                  </li>
                ))}
              </ul>}
            {!loading && more && <p className="dashboard-service-summary dashboard-service-more">{more}</p>}
          </div>
        </AnimatedBlock>
        <div className="dashboard-service-bottom">
          {warning && <AnimatedBlock open={!loading}>
            <p className="dashboard-service-summary dashboard-service-warning" data-tone="warning">{warning}</p>
          </AnimatedBlock>}
          <div className="dashboard-service-actions" data-price={Boolean(price)}>
            {loading ? icon === 'site' ? <Skeleton width={`${actionBar}px`} /> :
              <span className="dashboard-skeleton-action" style={{ '--dashboard-skeleton-action-width': `${actionBar + 22}px` }}>
                <Skeleton width={`${actionBar}px`} />
              </span> : limit ? <Tooltip content="Достигнут лимит по тарифу" placement="top" pressable>
              {id => <span className="dashboard-limit-trigger vh-focus" tabIndex={0} role="group" aria-label={actionLabel} aria-describedby={id}>
                <DashboardButton disabled>{actionLabel}</DashboardButton>
              </span>}
            </Tooltip> : <DashboardButton primary={Boolean(price || actionTone)} tone={actionTone} onClick={openSection}>{actionLabel}</DashboardButton>}
            {!price && <OpenSection section={section} onSelect={onSelect} />}
          </div>
        </div>
      </>}
    </Surface>
  )
}

function Monitoring({ onSelect, compact, state, loading }) {
  const unitName = useId()
  const [metricName, setMetricName] = useState('CPU')
  const [unit, setUnit] = useState('CP')
  const [showSeconds, setShowSeconds] = useState(false)
  const metric = monitoringMetrics.find(option => option.value === metricName)
  const isCpu = metricName === 'CPU'
  const marks = isCpu ? showSeconds ? cpuSeconds : compact ? mobilePercentages : percentages :
    Array.from({ length: 6 }, (_, index) => metric.limit * (5 - index) / 5)
  const unavailable = state === 'blocked'
  const highLoad = state === 'high'
  const heading = compact && !unavailable ? 'Нагрузка:' : 'Мониторинг'
  const today = isCpu ? '60 сек из 80 сек' : `${metric.values.at(-1)} ${metric.unit} из ${metric.limit} ${metric.unit}`
  const metricOptions = monitoringMetrics.map(option => ({
    value: option.value,
    selected: option.value === metricName,
    label: <>{option.label} <span className="dashboard-metric-description">· {option.description}</span></>,
  }))

  function selectUnit(value) {
    setUnit(value)
    setShowSeconds(value === 'CP')
  }

  return (
    <Surface as="section" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-monitor hosting-reveal"
      data-unavailable={unavailable || undefined} aria-labelledby="dashboard-monitor-title">
      <div className="dashboard-monitor-top">
        <div>
          {unavailable ? <h3 id="dashboard-monitor-title">{heading}</h3> :
            <Dropdown className="dashboard-metric-dropdown" panelClassName="dashboard-metric-panel" panelLabel="Метрики нагрузки"
              optionSize={40} selection items={metricOptions} onSelect={setMetricName}
              renderTrigger={props => <h3 id="dashboard-monitor-title">
                {heading} <Button {...props} appearance="text" pressable={false} className="dashboard-metric" aria-label={`Метрика нагрузки: ${metricName}`}>
                  {metricName} <TintedArtwork name="arrow-down" tone="link-text" />
                </Button>
              </h3>} />}
          <p>{loading ? <Skeleton width="237px" /> : unavailable ? 'Сегодня: нет данных' : `Сегодня: ${today}`}</p>
        </div>
        {isCpu && <SegmentedOptions name={unitName} label="Единицы нагрузки" options={unavailable ? unavailableMonitoringUnits : monitoringUnits}
          value={unit} onChange={selectUnit} onReselect={selectUnit} />}
      </div>
      {unavailable ? <p className="dashboard-unavailable">Раздел недоступен</p> : <>
      <figure className="dashboard-chart" aria-label={loading ? 'График загружается' : `График нагрузки ${metricName} с 1 по ${compact ? 11 : 13} января`}>
        <div className="dashboard-chart-y" aria-hidden="true">
          {marks.map(mark => <span key={mark}>{mark}</span>)}
        </div>
        <div className="dashboard-chart-plot" data-loading={loading} aria-hidden="true">
          {!loading && <DashboardMetricPlot metric={metric} compact={compact} highLoad={highLoad} />}
        </div>
        <div className="dashboard-chart-x" aria-hidden="true">
          {(compact ? dates.slice(0, -1) : dates).map(date => <span key={date}>{date}</span>)}
        </div>
      </figure>
      <div className="dashboard-monitor-footer">
        {!compact && <TintedArtwork name="chart-divider" tone="line" className="dashboard-monitor-divider" />}
        {loading ? <Skeleton width="160px" /> : !isCpu ? <p>Нагрузка в пределах лимита</p> : compact || highLoad ? <>
          <p className="dashboard-load-sites">
            <DomainName value="exampleweblongname.ru" />
            <Badge className="dashboard-load-count" tone="danger">+4 сайта</Badge>
          </p>
          <TintedArtwork name={compact ? 'mobile-chart-leader' : 'chart-high-leader'} tone="warning-text"
            className="dashboard-load-leader" />
          <span className="dashboard-load-percent" data-tone="error">85%</span>
        </> : <p><TintedArtwork name="chart-ok" tone="icon-success" /> Ни один сайт не перегружает сервер</p>}
        <OpenSection section="Мониторинг нагрузки" onSelect={onSelect} />
      </div></>}
    </Surface>
  )
}

function FtpStatus({ compact, loading, initialSsh, smtpDown }) {
  const showToast = useContext(HostingToastContext)
  const [sshEnabled, setSshEnabled] = useState(initialSsh)

  async function copyDetail(value) {
    try {
      await navigator.clipboard.writeText(value)
      showToast({ message: 'Скопировано', success: true })
    } catch {
      showToast({ message: 'Не удалось скопировать' })
    }
  }

  return (
    <Surface as="section" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-ftp hosting-reveal" aria-labelledby="dashboard-ftp-title">
      <h3 id="dashboard-ftp-title">FTP-доступ и статус сервисов</h3>
      <div className="dashboard-ftp-panels">
        <div className="dashboard-ftp-details">
          <dl>
            {(compact ? mobileFtpFields : Object.keys(ftpDetails)).map(label => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  {loading ? <Skeleton width="100px" /> : <><span>{ftpDetails[label]}</span>
                  <IconButton className="dashboard-ftp-copy" size={compact ? 24 : 20} label={`Скопировать ${label}`}
                    onClick={() => copyDetail(ftpDetails[label])}>
                    <TintedArtwork name="copy" />
                  </IconButton></>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="dashboard-ftp-note">Пароль доступа по FTP совпадает с паролем для панели управления.</p>
        </div>
        <ul className="dashboard-status-list">
          {serviceStatuses.map(([icon, label]) => {
            const status = loading ? 'loading' : smtpDown && icon === 'smtp' ? 'down' : 'up'

            return (
              <li key={icon}>
                <span className="dashboard-status-icon"><TintedArtwork name={compact && icon === 'web' ? 'mobile-web' : icon} tone="icon-primary" /></span>
                <span>{label}</span>
                {icon === 'ssh'
                  ? <Switch className="dashboard-ssh" aria-label="SSH" disabled={loading} checked={sshEnabled} onClick={() => setSshEnabled(value => !value)} />
                  : <span className="dashboard-service-status" data-status={status} role={loading ? undefined : 'img'}
                    aria-label={serviceStatusLabels[status]} aria-hidden={loading || undefined} />}
              </li>
            )
          })}
        </ul>
      </div>
    </Surface>
  )
}

export default function Dashboard({ onSelect, compact, screenState, attackNotice, refreshing }) {
  const state = getDashboardState(screenState)
  const preset = topUpStates.find(state => state.id === screenState)
  const [topUpOpen, setTopUpOpen] = useState(Boolean(preset))
  const [creditCents, setCreditCents] = useState(0)
  const [savedMethods, setSavedMethods] = useState(preset?.saved ?? [])
  const [mailQuota, setMailQuota] = useState(readMailQuota)
  const [mailQuotaUsage, setMailQuotaUsage] = useState(null)
  const showToast = useContext(HostingToastContext)
  const dashboard = useRef(null)
  const [headerNotice, setHeaderNotice] = useState(null)
  const trial = state.mode === 'trial'
  const loading = refreshing || state.mode === 'loading'
  const parking = state.mode === 'parking'
  const rich = state.mode === 'rich'
  const openTopUp = () => setTopUpOpen(true)
  const openTariff = () => onSelect('Настройки тарифа')

  useLayoutEffect(() => {
    if (!trial || compact) return
    setHeaderNotice(dashboard.current.closest('.hosting-shell').querySelector('[data-dashboard-header-notice]'))
  }, [trial, compact])

  function completeTopUp(amount, saveMethod) {
    setCreditCents(current => current + Math.round(amount * 100))
    if (saveMethod) setSavedMethods(current => current.some(method => method.id === saveMethod.id) ? current : [...current, saveMethod])
    showToast({ message: `Баланс пополнен на ${formatTopUpAmount(amount)} ₽ в деморежиме`, success: true })
  }

  function saveMailQuota(settings) {
    setMailQuota(settings)
    try {
      sessionStorage.setItem(mailQuotaStorageKey, JSON.stringify(settings))
    } catch {
      // The current dashboard still reflects the saved settings.
    }
  }

  const monitoring = <Monitoring key="monitoring" onSelect={onSelect} compact={compact} state={state.monitoring} loading={loading} />
  const ftp = <FtpStatus key={rich ? 'ftp-rich' : 'ftp'} compact={compact} loading={loading} initialSsh={!rich} smtpDown={rich} />
  const trialNotice = trial && <DashboardTrialNotice onPay={openTariff} compact={compact} />
  const visibleServices = parking ? [services[1], services[0], services[2]] : services
  const serviceState = attackNotice ? 'rich' : trial && compact ? undefined : state.services

  return (
    <div ref={dashboard} className="dashboard" data-mode={loading ? 'loading' : state.mode}>
      {trial && !compact && headerNotice && createPortal(trialNotice, headerNotice)}
      {trial && compact && trialNotice}
      {attackNotice && <NetworkAttackNotice {...attackNotice} summarizeDomains onConnect={() => onSelect('Сайты', 'network-protection')} />}
      {loading && <span className="dashboard-sr-only" role="status">Дашборд загружается</span>}
      <div>
        <DashboardMigrationBanner visible={Boolean(state.migration)} onMigrate={() => onSelect('Перенести к нам')} />
        <AnimatedBlock>
          <Billing onTariffSettings={openTariff} onTopUp={openTopUp} credit={creditCents / 100} compact={compact} state={state} loading={loading} />
        </AnimatedBlock>
      </div>
      <section className="dashboard-services" aria-labelledby="dashboard-services-title">
        <h2 id="dashboard-services-title">Мои сервисы</h2>
        <AnimatedBlock>
          <div className="dashboard-service-grid">
            {visibleServices.map(service => <ServiceCard key={service.icon} service={service} onSelect={onSelect} compact={compact}
              state={serviceState} mailQuota={mailQuota.amount} onEditMailQuota={setMailQuotaUsage} loading={loading} />)}
          </div>
        </AnimatedBlock>
        {!parking && <div className="dashboard-detail-grid">{compact ? [ftp, monitoring] : [monitoring, ftp]}</div>}
      </section>
      {!refreshing && mailQuotaUsage !== null && <DashboardMailQuota settings={mailQuota} used={mailQuotaUsage}
        onSave={saveMailQuota} onClose={() => setMailQuotaUsage(null)} />}
      {!refreshing && topUpOpen && (
        <BalanceTopUp
          preset={preset}
          compact={compact}
          savedMethods={savedMethods}
          onUnlink={id => setSavedMethods(current => current.filter(method => method.id !== id))}
          onPay={completeTopUp}
          onClose={() => setTopUpOpen(false)}
        />
      )}
    </div>
  )
}
