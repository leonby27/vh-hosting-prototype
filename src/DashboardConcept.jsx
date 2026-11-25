import { useContext, useId, useLayoutEffect, useRef, useState } from 'react'
import { Button, Switch, IconButton, Link } from './ui/controls.jsx'
import { createPortal } from 'react-dom'
import BalanceTopUp from './BalanceTopUp.jsx'
import DashboardMailQuota, { readMailQuota } from './DashboardMailQuota.jsx'
import DashboardMetricPlot from './DashboardMetricPlot.jsx'
import TariffUsage from './TariffUsage.jsx'
import { formatTopUpAmount, topUpStates } from './balance-top-up-states.js'
import { HostingToastContext } from './hosting-toast.jsx'
import { Dropdown, TabList } from './ui/navigation.jsx'
import { AssetIcon } from './ui/Icon.jsx'
import { Surface } from './ui/layout.jsx'
import { Badge, Tooltip } from './ui/feedback.jsx'
import NetworkAttackNotice from './NetworkAttackNotice.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { getDashboardState, typicalDashboard } from './dashboard-variants.js'
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
  },
  {
    title: 'Домены', icon: 'globe', section: 'Домены и SSL', action: 'Купить домен',
    rows: [{ name: 'myreviews.ru' }, { name: 'myreviews.ru', info: true }],
    mobileAction: 'Добавить домен',
  },
  {
    title: 'Почта', icon: 'mail', section: 'Почта', action: 'Добавить ящик', mailUsage: 16.4,
    rows: [{ name: 'timeweb.ru', detail: '8 ящиков' }],
  },
]

const siteDescription = 'Разместите новый или перенесите существующий сайт, DNS уже настроен.'
const populatedSites = [
  { name: 'timeweb-test', detail: 'Не привязан', tone: 'warning' },
  { name: 'twsite', detail: 'coconote.ru' },
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
    mail: {
      description: 'Создание почты недоступно на тестовом периоде. Оплатите тариф.',
      action: 'Оплатить тариф', actionSection: 'Настройки тарифа', mailUsage: 0,
      sectionUnavailableReason: 'Раздел станет доступен после оплаты тарифа',
    },
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
  rich: { extra: 'Продление 10 доменов', shortfall: 4296, note: 'Автоплатёж выключен', tone: 'warning' },
  overdue: { title: 'Заблокировано', extra: 'и ещё 3 сервиса', shortfall: 4296, note: 'Пополните счёт для разблокировки', tone: 'error' },
  blocked: { title: 'Заблокировано', plan: 'Недоступен', tone: 'error' },
  parking: { title: 'Отсутствует', plan: 'Парковка', shortfall: 399 },
  trial: { shortfall: 4716, note: 'Автоплатёж включён' },
}

const serviceSkeletonWidths = {
  site: [114, 194, 160, 118],
  globe: [187, 95, 233, 118],
  mail: [154, 233, 108, 128],
}

const ftpDetails = [
  { label: 'IP', value: '192.0.2.15', leader: 'ftp-ip-leader' },
  { label: 'Логин', value: 'demo001', leader: 'ftp-login-leader' },
  { label: 'Хост', value: 'vh354.example', leader: 'ftp-host-leader' },
]

const serviceStatuses = [
  ['web', 'Web'],
  ['mysql', 'MySQL'],
  ['ftp', 'FTP'],
  ['status-mail', 'Почта'],
  ['smtp', 'SMTP'],
  ['ssh', 'SSH'],
]

const serviceStatusLabels = { up: 'Работает', down: 'Недоступен' }

const dates = ['01.01', '03.01', '05.01', '07.01', '09.01', '11.01', '13.01']
const yearlyDebitAmount = '4 716 ₽'
const cpuUnits = ['%', 'CP']

const monitoringMetrics = [
  { value: 'CPU', description: 'Нагрузка на\u00A0процессор', limit: 80 },
  { value: 'MySQL', unit: 'сек', description: 'Нагрузка на\u00A0базы данных', limit: 300,
    values: [47, 60, 57, 65, 71, 62, 54, 76, 88, 106, 104, 94, 88, 102, 115, 124, 110, 118, 143, 129] },
  { value: 'RAM', unit: 'МБ', description: 'Объём используемой памяти', limit: 1000, warningThreshold: 800,
    values: [220, 280, 320, 360, 340, 390, 350, 330, 310, 280, 375, 460, 510, 610, 750, 860, 920, 770, 840, 910] },
  { value: 'I/O', unit: 'МБ/с', description: 'Ограничение скорости чтения и записи на\u00A0диск', limit: 10,
    values: [2, 1.5, 2.4, 1, 2.8, 3.1, 6, 4.8, 4.5, 4, 3.8, 5.3, 5, 4.6, 3.7, 3, 3.8, 3.2, 5, 4] },
  { value: 'IOPS', unit: 'оп/с', description: 'Количество операций ввода-вывода', limit: 500,
    values: [120, 110, 130, 90, 130, 180, 220, 210, 160, 190, 180, 150, 160, 150, 180, 190, 210, 190, 240, 210] },
  { value: 'Nginx', unit: 'шт.', description: 'Максимум одновременно работающих процессов', limit: 50,
    values: [12, 13, 12, 15, 17, 16, 18, 17, 15, 11, 15, 20, 23, 21, 19, 15, 16, 14, 19, 17] },
]

const typicalMonitoringMetrics = monitoringMetrics.map(metric => metric.value === 'RAM' ? {
  ...metric,
  warningThreshold: undefined,
  values: [220, 280, 320, 360, 340, 390, 350, 330, 310, 280, 375, 460, 510, 490, 420, 450, 460, 440, 510, 480],
} : metric)

const metricWarningDot = <span className="dashboard-metric-warning" aria-hidden="true" />

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

function DisabledActionTooltip({ label, content, children }) {
  return (
    <Tooltip className="dashboard-action-tooltip" content={content} pressable>
      {id => <span className="dashboard-disabled-action vh-focus" tabIndex={0} role="group" aria-label={label} aria-describedby={id}>
        {children}
      </span>}
    </Tooltip>
  )
}

function OpenSection({ section, onSelect, unavailableReason }) {
  const label = `Открыть раздел «${section}»`
  const disabled = Boolean(unavailableReason)
  const button = (
    <DashboardButton iconOnly disabled={disabled} label={label} onClick={() => onSelect(section)}>
      <TintedArtwork name="arrow-out" tone={disabled ? undefined : 'icon-primary'} />
    </DashboardButton>
  )
  return disabled ? <DisabledActionTooltip label={label} content={unavailableReason}>{button}</DisabledActionTooltip> : button
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

function Billing({ onTopUp, onOpenTariff, credit, compact, state, loading }) {
  const { mode } = state
  const debit = debitStates[mode] ?? {}
  const unavailable = mode === 'blocked'
  const balance = (state.balance ?? 2784) + credit
  const initialShortfall = debit.shortfall ?? 0
  const shortfall = Math.max(0, initialShortfall - credit)
  const balanceNote = shortfall ? `Не хватает ${formatTopUpAmount(shortfall)} ₽` : 'Баланса хватает до списания'
  const debitTitle = debit.title ?? (compact ? '12 сентября' : '12 сентября 2028')
  const debitNote = debit.note ?? 'Автоплатёж включён'
  const showDebit = !unavailable && mode !== 'parking'

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
                <strong className="dashboard-amount">{yearlyDebitAmount}</strong>
              </div>
              <p className="dashboard-note">Тариф Year, год</p>
            </> : <>
              <p className="dashboard-amount" data-tone={debit.title ? debit.tone : undefined}>{debitTitle}</p>
              {showDebit && <div className="dashboard-renewals">
                <DebitLine label="Тариф Year, годовой" amount={yearlyDebitAmount} />
                {debit.extra && <DebitLine label={debit.extra} amount="400 ₽" />}
              </div>}
            </>}
          </div>
          {showDebit && <p className="dashboard-label" data-tone={debit.tone}>{loading ? <Skeleton width="114px" /> : debitNote}</p>}
        </div>
      </Surface>
      <Surface as="section" appearance="card" elevation="card" padding="none"
        className="dashboard-card dashboard-billing-cell dashboard-plan-card hosting-reveal"
        data-usage={showDebit || undefined} aria-labelledby="dashboard-plan">
        {showDebit ? <>
          <header className="dashboard-plan-heading">
            <h2 id="dashboard-plan">Тариф Optimo</h2>
            <Link href="?tariff" aria-label="Настроить тариф" onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              onOpenTariff()
            }}>Настроить</Link>
          </header>
          {loading ? <div className="dashboard-plan-usage" aria-hidden="true">
            <Skeleton width="68%" />
            <Skeleton width="84%" />
            <Skeleton width="76%" />
          </div> : <TariffUsage className="dashboard-plan-usage" dashboard diskWarning={mode === 'rich'} />}
        </> : <div>
          <h2 className="dashboard-label" id="dashboard-plan">Тариф</h2>
          <p className="dashboard-amount" data-tone={unavailable ? 'muted' : undefined}>
            {loading ? <Skeleton width="114px" /> : debit.plan}
          </p>
        </div>}
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
  const { title, icon, section, action, actionSection, mailUsage, rows, description, price, more, warning, actionTone, blocked, limit } = { ...service, ...example }
  const [firstBar, secondBar, thirdBar, actionBar] = serviceSkeletonWidths[icon]
  const actionLabel = compact && !example?.action ? service.mobileAction ?? action : action
  const singleAction = Boolean(price)
  const sectionUnavailableReason = example?.sectionUnavailableReason
  const quotaDisabled = Boolean(sectionUnavailableReason)
  const openSection = () => onSelect(actionSection ?? section)
  return (
    <Surface as="article" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-service hosting-reveal"
      data-muted={Boolean(blocked || price)} data-expanded={Boolean(more) || undefined}>
      <div className="dashboard-service-heading">
        <span className="dashboard-service-icon"><Artwork name={icon} /></span>
        <h3>{title}</h3>
        {!loading && mailUsage != null && (
          <Button className="dashboard-mail-badge-trigger" appearance="text" pressable={false} disabled={quotaDisabled}
            aria-haspopup={quotaDisabled ? undefined : 'dialog'}
            aria-label={`${quotaDisabled ? 'Почтовая квота' : 'Изменить почтовую квоту'}, ${mailUsage} из ${mailQuota} Гб`}
            onClick={() => onEditMailQuota(mailUsage)}>
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
                {rows.map(({ name, detail, info, tone }, index) => (
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
          <div className="dashboard-service-actions" data-single-action={singleAction || undefined}>
            {loading ? icon === 'site' ? <Skeleton width={`${actionBar}px`} /> :
              <span className="dashboard-skeleton-action" style={{ '--dashboard-skeleton-action-width': `${actionBar + 22}px` }}>
                <Skeleton width={`${actionBar}px`} />
              </span> : limit ? <DisabledActionTooltip label={actionLabel} content="Достигнут лимит по тарифу">
              <DashboardButton disabled>{actionLabel}</DashboardButton>
            </DisabledActionTooltip> : <DashboardButton primary={singleAction || Boolean(actionTone)} tone={actionTone} onClick={openSection}>{actionLabel}</DashboardButton>}
            {!singleAction && <OpenSection section={section} onSelect={onSelect} unavailableReason={sectionUnavailableReason} />}
          </div>
        </div>
      </>}
    </Surface>
  )
}

function MonitoringMetricSelector({ metrics, value, onChange, cpuUnit, cpuWarning }) {
  const id = useId()
  const barRef = useRef(null)
  const measureRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(metrics.length)
  const metricSegments = metrics.map(metric => {
    const overloaded = metric.warningThreshold || (cpuWarning && metric.value === 'CPU')
    return {
      id: metric.value,
      label: metric.value,
      menuLabel: `${metric.value},\u00A0${metric.unit ?? cpuUnit}`,
      description: metric.description,
      suffix: overloaded ? metricWarningDot : undefined,
      accessibleLabel: overloaded ? `${metric.value}, перегрузка` : undefined,
    }
  })

  useLayoutEffect(() => {
    const bar = barRef.current
    const measure = measureRef.current

    function fit() {
      const style = getComputedStyle(measure)
      const gap = parseFloat(style.columnGap)
      const available = bar.clientWidth
      const widths = Array.from(measure.children, child => child.getBoundingClientRect().width)
      const moreWidth = widths.pop()
      const fullWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1)
      if (fullWidth <= available) {
        setVisibleCount(widths.length)
        return
      }

      let used = moreWidth
      let count = 0
      for (const width of widths) {
        used += gap + width
        if (used > available) break
        count += 1
      }
      setVisibleCount(count)
    }

    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(bar)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [cpuWarning, metrics])

  const overflow = metricSegments.slice(visibleCount)
  const selectedOverflow = overflow.some(option => option.id === value)

  const moreLabel = <>Ещё <TintedArtwork name="arrow-down" /></>

  return (
    <div className="dashboard-metric-bar" ref={barRef}>
      <div className="dashboard-metric-switcher">
        {visibleCount > 0 && <TabList idPrefix={id} label="Метрика нагрузки"
          className="dashboard-metric-tabs" tabs={metricSegments.slice(0, visibleCount)}
          value={value} onChange={onChange} controls={false} allowUnselected />}
        {overflow.length > 0 && <Dropdown className="dashboard-metric-dropdown" panelClassName="dashboard-metric-panel"
          panelLabel="Другие метрики нагрузки" optionSize={40} selection
          items={overflow.map(option => ({
            value: option.id,
            selected: option.id === value,
            label: <>{option.menuLabel}{option.suffix && <>
              {option.suffix}<span className="dashboard-sr-only">, перегрузка</span>
            </>} <span className="dashboard-metric-description">· {option.description}</span></>,
          }))} onSelect={onChange}
          renderTrigger={props => <div className="sites-tabs">
            <button {...props} className="dashboard-metric-more" data-active={selectedOverflow || undefined}
              aria-label={selectedOverflow ? `Ещё метрики, выбрана ${value}` : 'Ещё метрики'}>{moreLabel}</button>
          </div>} />}
      </div>
      <div className="dashboard-metric-measure" aria-hidden="true" inert>
        <div className="sites-tabs" ref={measureRef}>
          {metricSegments.map(option => <button key={option.id} type="button">
            {option.label}{option.suffix}
          </button>)}
          <button type="button" className="dashboard-metric-more">{moreLabel}</button>
        </div>
      </div>
    </div>
  )
}

function Monitoring({ onSelect, state, loading, metrics }) {
  const [metricName, setMetricName] = useState('CPU')
  const [cpuUnit, setCpuUnit] = useState('CP')
  const metric = metrics.find(option => option.value === metricName)
  const isCpu = metricName === 'CPU'
  const inPercent = isCpu && cpuUnit === '%'
  const axisLimit = inPercent ? 100 : metric.limit
  const marks = Array.from({ length: 6 }, (_, index) => {
    const mark = axisLimit * (5 - index) / 5
    return inPercent && mark > 0 ? `${mark}%` : mark
  })
  const unavailable = state === 'blocked'
  const highLoad = state === 'high'
  const cpuOverload = isCpu && highLoad
  const overloadPercent = metric.warningThreshold
    ? Math.round(Math.max(...metric.values) / metric.limit * 100)
    : cpuOverload ? 85 : null

  return (
    <Surface as="section" appearance="card" elevation="card" padding="none" className="dashboard-card dashboard-monitor hosting-reveal"
      data-unavailable={unavailable || undefined} aria-label="Мониторинг">
      {!unavailable && <div className="dashboard-monitor-top">
        <MonitoringMetricSelector metrics={metrics} value={metricName} onChange={setMetricName} cpuUnit={cpuUnit} cpuWarning={highLoad} />
        <div className="dashboard-metric-caption">
          <p aria-live="polite">{isCpu ? `${metric.description},` : `${metric.description},\u00A0${metric.unit}`}</p>
          {isCpu && <Dropdown className="dashboard-unit-dropdown" panelClassName="dashboard-unit-panel" panelLabel="Единицы нагрузки CPU"
            optionSize={40} selection onSelect={setCpuUnit}
            items={cpuUnits.map(unit => ({ value: unit, label: unit, selected: unit === cpuUnit }))}
            renderTrigger={props => <Button {...props} appearance="text" pressable={false} className="dashboard-monitor-unit"
              aria-label={`Единицы нагрузки CPU: ${cpuUnit}`}>{cpuUnit}<TintedArtwork name="arrow-down" /></Button>} />}
        </div>
      </div>}
      {unavailable ? <p className="dashboard-unavailable">Раздел недоступен</p> : <>
      <figure className="dashboard-chart" aria-label={loading ? 'График загружается' : `График нагрузки ${metricName} с 1 по 13 января`}>
        <div className="dashboard-chart-y" aria-hidden="true">
          {marks.map(mark => <span key={mark}>{mark}</span>)}
        </div>
        <div className="dashboard-chart-plot" data-loading={loading} aria-hidden="true">
          {!loading && <DashboardMetricPlot metric={metric} highLoad={highLoad} />}
        </div>
        <div className="dashboard-chart-x" aria-hidden="true">
          {dates.map(date => <span key={date}>{date}</span>)}
        </div>
      </figure>
      <div className="dashboard-monitor-footer">
        {loading ? <Skeleton width="160px" /> : overloadPercent !== null ? <>
          <p className="dashboard-load-sites">
            <DomainName value={cpuOverload ? 'exampleweblongname.ru' : 'timeweb.ru'} />
            {cpuOverload && <Badge className="dashboard-load-count" tone="danger">+4 сайта</Badge>}
          </p>
          <span className="dashboard-load-leader" aria-hidden="true" />
          <span className="dashboard-load-percent" data-tone="error">{overloadPercent}%</span>
        </> : <p>
          <TintedArtwork name="chart-ok" tone="icon-success" />
          Ни один сайт не перегружает сервер
        </p>}
        <OpenSection section="Мониторинг нагрузки" onSelect={onSelect} />
      </div></>}
    </Surface>
  )
}

function FtpStatus({ loading, initialSsh, smtpDown }) {
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
            {ftpDetails.map(({ label, value, leader }) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <AssetIcon src={assets[`./assets/dashboard/${leader}.svg`]} monochrome size={2}
                    tone="plan-branch-line" className="dashboard-ftp-leader" />
                  {loading ? <Skeleton width="100px" /> : <>
                    <span>{value}</span>
                    <IconButton className="dashboard-ftp-copy" size={20} label={`Скопировать ${label}`}
                      onClick={() => copyDetail(value)}>
                      <TintedArtwork name="copy" />
                    </IconButton>
                  </>}
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
                <TintedArtwork name={icon} tone="icon-primary" />
                <span>{label}</span>
                {icon === 'ssh'
                  ? <Switch className="dashboard-ssh" aria-label="SSH" disabled={loading} checked={sshEnabled} onClick={() => setSshEnabled(value => !value)} />
                  : <span className="dashboard-service-status" data-status={status} role={loading ? undefined : 'img'}
                    aria-label={serviceStatusLabels[status]} aria-hidden={loading || undefined}>
                    <TintedArtwork name="service-status-dot" />
                  </span>}
              </li>
            )
          })}
        </ul>
      </div>
    </Surface>
  )
}

const conceptMailQuotaStorageKey = 'vh-dashboard-concept-mail-quota'

export default function DashboardConcept({ onSelect, compact, screenState, attackNotice, refreshing }) {
  const state = getDashboardState(screenState)
  const preset = topUpStates.find(state => state.id === screenState)
  const [topUpOpen, setTopUpOpen] = useState(Boolean(preset))
  const [creditCents, setCreditCents] = useState(0)
  const [savedMethods, setSavedMethods] = useState(preset?.saved ?? [])
  const [mailQuota, setMailQuota] = useState(() => readMailQuota(conceptMailQuotaStorageKey))
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
      sessionStorage.setItem(conceptMailQuotaStorageKey, JSON.stringify(settings))
    } catch {
      // The current dashboard still reflects the saved settings.
    }
  }

  const monitoring = <Monitoring key="monitoring" onSelect={onSelect} state={state.monitoring}
    loading={loading} metrics={state.id === typicalDashboard.id ? typicalMonitoringMetrics : monitoringMetrics} />
  const ftp = <FtpStatus key={rich ? 'ftp-rich' : 'ftp'} loading={loading} initialSsh={!rich} smtpDown={rich} />
  const trialNotice = trial && <DashboardTrialNotice onPay={openTariff} compact={compact} />
  const visibleServices = parking ? [services[1], services[0], services[2]] : services
  const serviceState = attackNotice ? 'rich' : state.services

  return (
    <div ref={dashboard} className="dashboard" data-dashboard-concept="" data-mode={loading ? 'loading' : state.mode}>
      {trial && !compact && headerNotice && createPortal(trialNotice, headerNotice)}
      {trial && compact && trialNotice}
      {attackNotice && <NetworkAttackNotice {...attackNotice} summarizeDomains onConnect={() => onSelect('Сайты', 'network-protection')} />}
      {loading && <span className="dashboard-sr-only" role="status">Дашборд загружается</span>}
      <div>
        <DashboardMigrationBanner visible={Boolean(state.migration)} compact={compact} onMigrate={() => onSelect('Перенести к нам')} />
        <AnimatedBlock>
          <Billing onTopUp={openTopUp} onOpenTariff={openTariff} credit={creditCents / 100} compact={compact} state={state} loading={loading} />
        </AnimatedBlock>
      </div>
      <section className="dashboard-services" aria-labelledby="dashboard-services-title">
        <h2 id="dashboard-services-title">Мои сервисы</h2>
        <AnimatedBlock>
          <div className="dashboard-service-grid">
            {visibleServices.map(service => <ServiceCard key={service.icon} service={service} onSelect={onSelect} compact={compact}
              state={serviceState}
              mailQuota={mailQuota.amount} onEditMailQuota={setMailQuotaUsage} loading={loading} />)}
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
          mobileSheet
          savedMethods={savedMethods}
          onUnlink={id => setSavedMethods(current => current.filter(method => method.id !== id))}
          onPay={completeTopUp}
          onClose={() => setTopUpOpen(false)}
        />
      )}
    </div>
  )
}
