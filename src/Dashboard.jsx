import { useContext, useState } from 'react'
import BalanceTopUp from './BalanceTopUp.jsx'
import { formatTopUpAmount, topUpStates } from './balance-top-up-states.js'
import { HostingToastContext } from './hosting-toast.jsx'
import { TabIndicator } from './hosting-motion.jsx'
import './dashboard.css'

const assets = {
  ...import.meta.glob(['./assets/dashboard/*.svg', '!./assets/dashboard/mobile-*.svg'], { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('./assets/dashboard/mobile-*.svg', { eager: true, query: '?url&no-inline', import: 'default' }),
}

const services = [
  {
    title: 'Управление сайтами', icon: 'site', section: 'Сайты', action: 'Добавить сайт',
    rows: [{ name: 'twsite', detail: 'timeweb.ru' }, { name: 'twsitelongnam…', detail: 'timeweblon…ru' }],
    mobileRows: [{ name: 'twsite', detail: 'timeweb.ru' }],
  },
  {
    title: 'Домены', icon: 'globe', section: 'Домены и SSL', action: 'Купить домен', compact: true,
    rows: [{ name: 'myreviews.ru' }, { name: 'myreviews.ru', info: true }],
    mobileAction: 'Добавить домен',
    mobileRows: [{ name: 'timeweb.ru', detail: 'до 12.10.2028' }, { name: 'myreviews.ru', detail: 'до 10.04.2027' }],
  },
  {
    title: 'Почта', icon: 'mail', section: 'Почта', action: 'Добавить ящик', badge: '16.4 из 20 Гб',
    rows: [{ name: 'timeweb.ru', detail: '8 ящиков' }],
  },
]

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

const percentages = ['100%', '80%', '60%', '40%', '20%', '0']
const mobilePercentages = ['50%', '40%', '30%', '20%', '10%', '0']
const cpuSeconds = ['80', '64', '48', '32', '16', '0']
const dates = ['01.01', '03.01', '05.01', '07.01', '09.01', '11.01', '13.01']

function Artwork({ name }) {
  return <img src={assets[`./assets/dashboard/${name}.svg`]} alt="" />
}

function TintedArtwork({ name, tone, label, className = '' }) {
  const url = assets[`./assets/dashboard/${name}.svg`]
  return (
    <span
      className={`dashboard-tinted-art ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ '--artwork-mask': `url("${url}")`, '--artwork-color': `var(--hosting-${tone})` }}
    >
      <img src={url} alt="" />
    </span>
  )
}

function DashboardButton({ children, onClick, label, primary = false }) {
  const className = `dashboard-button hosting-pressable${primary ? ' dashboard-button--primary' : ''}`
  return <button type="button" className={className} aria-label={label} onClick={onClick}>{children}</button>
}

function OpenSection({ section, onSelect }) {
  return (
    <DashboardButton label={`Открыть раздел «${section}»`} onClick={() => onSelect(section)}>
      <TintedArtwork name="arrow-out" tone="icon-primary" />
    </DashboardButton>
  )
}

function Billing({ onTopUp, onTariffSettings, balance, compact }) {
  return (
    <div className="dashboard-billing">
      <section className="dashboard-card dashboard-balance hosting-reveal" aria-label="Баланс и ближайшее списание">
        <div className="dashboard-billing-cell">
          <div className="dashboard-balance-top">
            <div>
              <h2 className="dashboard-label">Баланс</h2>
              <p className="dashboard-amount">{formatTopUpAmount(balance)} ₽</p>
              {compact && <p className="dashboard-note">Не хватает 4 296 ₽</p>}
            </div>
            <DashboardButton primary onClick={onTopUp}>Пополнить</DashboardButton>
          </div>
          {!compact && <p className="dashboard-note">Баланса хватает до списания</p>}
        </div>
        <div className="dashboard-billing-cell">
          <div>
            <h2 className="dashboard-label">Ближайшее списание</h2>
            {compact ? <>
              <div className="dashboard-mobile-debit">
                <time className="dashboard-amount" dateTime="2028-09-12">12 сентября</time>
                <TintedArtwork name="mobile-balance-leader" tone="plan-branch-line" />
                <strong className="dashboard-amount">4 716 ₽</strong>
              </div>
              <p className="dashboard-note">Тариф Year, год</p>
            </> : <>
              <p className="dashboard-amount">12 сентября 2028</p>
              <div className="dashboard-renewal">
                <span>Тариф Year, годовой</span>
                <TintedArtwork name="balance-leader" tone="line" className="dashboard-renewal-leader" />
                <strong>4 716 ₽</strong>
              </div>
            </>}
          </div>
          <p className="dashboard-label">Автоплатёж включён</p>
        </div>
      </section>
      <section className="dashboard-card dashboard-billing-cell hosting-reveal" aria-labelledby="dashboard-plan">
        <div>
          <h2 className="dashboard-label" id="dashboard-plan">Тариф</h2>
          <button type="button" className="dashboard-amount dashboard-plan-link" onClick={onTariffSettings} aria-label="Настройки тарифа Optimo">Optimo</button>
        </div>
        {!compact && <p className="dashboard-note">Оплачен до 30.09, ещё 16 дней</p>}
      </section>
    </div>
  )
}

function ServiceCard({ service, onSelect, compact }) {
  const { title, icon, section, action, badge, rows, mobileAction, mobileRows } = service
  return (
    <article className="dashboard-card dashboard-service hosting-reveal">
      <div className="dashboard-service-heading">
        <span className="dashboard-service-icon"><Artwork name={icon} /></span>
        <h3>{title}</h3>
        {badge && <span className="dashboard-badge">{badge}</span>}
      </div>
      <ul className={service.compact ? 'dashboard-service-rows dashboard-service-rows--compact' : 'dashboard-service-rows'}>
        {(compact && mobileRows ? mobileRows : rows).map(({ name, detail, info }, index) => (
          <li key={index}>
            <span>{name}</span>
            {detail && <span className="dashboard-service-detail">{detail}</span>}
            {info && <span title="Информация о домене"><TintedArtwork name="info" tone="icon-info" label="Информация о домене" /></span>}
          </li>
        ))}
      </ul>
      <div className="dashboard-service-actions">
        <DashboardButton onClick={() => onSelect(section)}>{compact && mobileAction ? mobileAction : action}</DashboardButton>
        <OpenSection section={section} onSelect={onSelect} />
      </div>
    </article>
  )
}

function Monitoring({ onSelect, dark, compact }) {
  const [unit, setUnit] = useState('CP')
  const [showSeconds, setShowSeconds] = useState(false)
  const marks = showSeconds ? cpuSeconds : compact ? mobilePercentages : percentages

  function selectUnit(value) {
    setUnit(value)
    setShowSeconds(value === 'CP')
  }

  return (
    <section className="dashboard-card dashboard-monitor hosting-reveal" aria-labelledby="dashboard-monitor-title">
      <div className="dashboard-monitor-top">
        <div>
          <h3 id="dashboard-monitor-title">
            {compact ? 'Нагрузка:' : 'Мониторинг'} <button type="button" className="dashboard-metric" onClick={() => onSelect('Мониторинг нагрузки')}>
              CPU <TintedArtwork name="arrow-down" tone="link-text" />
            </button>
          </h3>
          <p>Сегодня: 60 сек из 80 сек</p>
        </div>
        <div className="dashboard-units hosting-indicator-track" role="group" aria-label="Единицы нагрузки">
          <TabIndicator selected={unit} />
          {['%', 'CP'].map(value => (
            <button key={value} type="button" aria-pressed={unit === value} onClick={() => selectUnit(value)}>{value}</button>
          ))}
        </div>
      </div>
      <figure className="dashboard-chart" aria-label={compact ? 'График нагрузки CPU с 1 по 11 января' : 'График нагрузки CPU с 1 по 13 января'}>
        <div className="dashboard-chart-y" aria-hidden="true">
          {marks.map(mark => <span key={mark}>{mark}</span>)}
        </div>
        <div className="dashboard-chart-plot">
          {compact ? <div className="dashboard-mobile-chart" aria-hidden="true">
            <div className="dashboard-mobile-chart-high"><Artwork name="mobile-chart-high" /></div>
            <div className="dashboard-mobile-chart-normal"><Artwork name="mobile-chart-normal" /></div>
          </div> : <Artwork name={dark ? 'chart-dark' : 'chart'} />}
        </div>
        <div className="dashboard-chart-x" aria-hidden="true">
          {(compact ? dates.slice(0, -1) : dates).map(date => <span key={date}>{date}</span>)}
        </div>
      </figure>
      <div className="dashboard-monitor-footer">
        {compact ? <>
          <p className="dashboard-load-sites">
            <span>exampleweb...ru</span>
            <span className="dashboard-load-count">+4 сайта</span>
          </p>
          <TintedArtwork name="mobile-chart-leader" tone="warning-text" className="dashboard-load-leader" />
          <span className="dashboard-load-percent">85%</span>
        </> : <>
          <TintedArtwork name="chart-divider" tone="line" className="dashboard-monitor-divider" />
          <p><TintedArtwork name="chart-ok" tone="icon-success" /> Ни один сайт не перегружает сервер</p>
        </>}
        <OpenSection section="Мониторинг нагрузки" onSelect={onSelect} />
      </div>
    </section>
  )
}

function FtpStatus({ compact }) {
  const [copyStatus, setCopyStatus] = useState('')
  const [sshEnabled, setSshEnabled] = useState(true)

  async function copyDetail(label, value) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyStatus(`Скопировано: ${label}`)
    } catch {
      setCopyStatus('Не удалось скопировать')
    }
  }

  return (
    <section className="dashboard-card dashboard-ftp hosting-reveal" aria-labelledby="dashboard-ftp-title">
      <h3 id="dashboard-ftp-title">FTP-доступ и статус сервисов</h3>
      <div className="dashboard-ftp-panels">
        <div className="dashboard-ftp-details">
          <dl>
            {(compact ? mobileFtpFields : Object.keys(ftpDetails)).map(label => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>
                  <span>{ftpDetails[label]}</span>
                  <button type="button" aria-label={`Скопировать ${label}`} onClick={() => copyDetail(label, ftpDetails[label])}>
                    <TintedArtwork name="copy" tone="icon-secondary" />
                  </button>
                </dd>
              </div>
            ))}
          </dl>
          <p className="dashboard-ftp-note">Пароль доступа по FTP совпадает с паролем для панели управления.</p>
          <span className="dashboard-sr-only" role="status">{copyStatus}</span>
        </div>
        <ul className="dashboard-status-list">
          {serviceStatuses.map(([icon, label]) => (
            <li key={icon}>
              <span className="dashboard-status-icon"><TintedArtwork name={compact && icon === 'web' ? 'mobile-web' : icon} tone="icon-primary" /></span>
              <span>{label}</span>
              {icon === 'ssh'
                ? <button type="button" className="dashboard-ssh" role="switch" aria-label="SSH" aria-checked={sshEnabled} onClick={() => setSshEnabled(value => !value)}><span className="hosting-switch" aria-hidden="true" /></button>
                : <TintedArtwork name="status-ok" tone="icon-success" label="Работает" />}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default function Dashboard({ onSelect, dark, compact, screenState }) {
  const preset = topUpStates.find(state => state.id === screenState)
  const [topUpOpen, setTopUpOpen] = useState(Boolean(preset))
  const [balance, setBalance] = useState(2784)
  const [savedMethods, setSavedMethods] = useState(preset?.saved ?? [])
  const showToast = useContext(HostingToastContext)

  function completeTopUp(amount, saveMethod) {
    setBalance(current => (Math.round(current * 100) + Math.round(amount * 100)) / 100)
    if (saveMethod) setSavedMethods(current => current.some(method => method.id === saveMethod.id) ? current : [...current, saveMethod])
    showToast({ message: `Баланс пополнен на ${formatTopUpAmount(amount)} ₽ в деморежиме`, success: true })
  }

  const monitoring = <Monitoring key="monitoring" onSelect={onSelect} dark={dark} compact={compact} />
  const ftp = <FtpStatus key="ftp" compact={compact} />

  return (
    <div className="dashboard">
      <Billing onTariffSettings={() => onSelect('Настройки тарифа')} onTopUp={() => setTopUpOpen(true)} balance={balance} compact={compact} />
      <section className="dashboard-services" aria-labelledby="dashboard-services-title">
        <h2 id="dashboard-services-title">Мои сервисы</h2>
        <div className="dashboard-service-grid">
          {services.map(service => <ServiceCard key={service.icon} service={service} onSelect={onSelect} compact={compact} />)}
        </div>
        <div className="dashboard-detail-grid">
          {compact ? [ftp, monitoring] : [monitoring, ftp]}
        </div>
      </section>
      {topUpOpen && (
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
