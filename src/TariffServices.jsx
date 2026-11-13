import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatedBlock, DropdownPanel } from './hosting-motion.jsx'
import WarningDialog from './WarningDialog.jsx'
import { plusPackage, rubles } from './plan-preview-pricing.js'
import moreIcon from './assets/plan-changes/more.svg'
import caretIcon from './assets/hosting/caret.svg'
import chevronIcon from './assets/hosting/mobile-more-chevron.svg'
import settingsIcon from './assets/tariff-settings/settings.svg'
import disableIcon from './assets/plan-changes/disable.svg'
import changePackageIcon from './assets/plan-changes/retry.svg'
import benefitCheckIcon from './assets/plan-changes/apply.svg'
import infoIcon from './assets/tariff-settings/info.svg'
import plusIcon from './assets/tariff-settings/plus.svg'
import antivirusIcon from './assets/antivirus/service-icon-blue.png'
import popularityIcon from './assets/antivirus/plan-recommended.svg'
import ddosIcon from './assets/network-protection/service-icon-blue.png'
import shieldIcon from './assets/network-protection/shield.svg'
import domainIcon from './assets/hosting/domains.svg'
import backupsIcon from './assets/hosting/backups.svg'
import builderIcon from './assets/hosting/sites.svg'
import mailIcon from './assets/hosting/mail.svg'
import acceleratorIcon from './assets/hosting/monitoring.svg'

const serviceIcons = {
  ip: domainIcon, backups: backupsIcon, ssl: shieldIcon, builder: builderIcon,
  'mail-space': mailIcon, accelerator: acceleratorIcon,
}

const sslSetup = [
  'Настройка SSL-сертификата',
  'Выпуск и автопродление',
  'В пакет входят выпуск и автопродление SSL-сертификата. Отдельно услуга стоит 99 ₽ / мес.',
]
const resourceDiscountSummary = 'Сайты, диск, БД, копии, CPU и ускоритель'
const resourceDiscountDescription = 'Скидка действует на дополнительные сайты, диск, базы данных, копии по требованию, лимит CPU и ускоритель сайта.'

export const packages = [
  { ...plusPackage, title: 'Плюс', discount: 20, benefits: [
    sslSetup,
  ] },
  { id: 'premium', title: 'Премиум', amount: 599, discount: 30, benefits: [
    sslSetup,
    ['Приоритетная поддержка', 'Ответ в 2 раза быстрее', 'По замерам Timeweb, поддержка отвечает в 2 раза быстрее.'],
    ['SSL Timeweb Pro', '897 ₽ вместо 1 495 ₽ за 6 мес.', 'Сертификат SSL Timeweb Pro стоит 897 ₽ вместо 1 495 ₽ за 6 месяцев.'],
  ] },
]

export const availableServices = [
  { id: 'backups', title: 'Копии по требованию', description: 'Резервные копии по кнопке.', amount: 152.5 },
  { id: 'ssl', title: 'SSL Timeweb Pro', description: 'Платный сертификат с гарантией.', amount: 2990, period: 'в год' },
  { id: 'builder', title: 'Конструктор сайтов', description: 'Редактор без вёрстки для пяти сайтов.', amount: 1250 },
  { id: 'mail-space', title: 'Место для почты', description: 'Дополнительное место сверх 10 ГБ квоты тарифа.', amount: 20, period: '/ мес. за 1 ГБ' },
  { id: 'accelerator', title: 'Ускоритель сайта', description: 'Кэш и сжатие для быстрой загрузки страниц.', amount: 122, period: '/ мес. за сайт' },
]

export const additionalIp = { id: 'ip', title: 'Дополнительный IP-адрес', description: '92.53.112.125', amount: 150 }
const security = [
  { id: 'antivirus', icon: antivirusIcon, title: 'Антивирус', description: 'Проверка сайтов и лечение заражений.', pricePrefix: 'от ', amount: 399, period: '/ мес. за сайт' },
  { id: 'network-protection', icon: ddosIcon, title: 'Защита от DDoS', description: 'Фильтрация атак на сайты.', amount: 300 },
]

export function packagePrice(amount, packageId, precision = 1) {
  const discount = packages.find(entry => entry.id === packageId)?.discount ?? 0
  return discount ? Math.round(amount * (100 - discount) / 100 * precision) / precision : amount
}

function servicePrice(service) {
  return `${service.pricePrefix ?? ''}${rubles(service.amount)} ${service.period ?? '/ мес.'}`
}

function BenefitDescription({ title, summary, description }) {
  const id = useId()
  const tooltip = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function dismissOutside(event) {
      if (!tooltip.current?.contains(event.target)) setOpen(false)
    }

    function dismissOnEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open])

  return (
    <div className="tariff-benefit-summary">
      <span>{summary}</span>
      <span className="tariff-benefit-tooltip" ref={tooltip}>
        <button type="button" className="tariff-benefit-info" aria-label={`Подробнее: ${title}`}
          aria-expanded={open} aria-controls={id} aria-describedby={open ? id : undefined}
          onPointerEnter={event => {
            if (event.pointerType === 'mouse') setOpen(true)
          }}
          onPointerLeave={event => {
            if (event.pointerType === 'mouse') setOpen(false)
          }}
          onFocus={event => {
            if (event.currentTarget.matches(':focus-visible')) setOpen(true)
          }}
          onBlur={() => setOpen(false)}
          onClick={event => {
            if (event.pointerType === 'touch' || event.pointerType === 'pen') setOpen(current => !current)
            else setOpen(true)
          }}>
          <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${infoIcon}")` }} />
        </button>
        <DropdownPanel as="span" id={id} role="tooltip" open={open} className="tariff-benefit-details">{description}</DropdownPanel>
      </span>
    </div>
  )
}

function ServiceRow({ service, card = false, children }) {
  return (
    <li className={`tariff-service-row${card ? ' tariff-card' : ''}`} data-service={service.id}>
      <div className="tariff-service-title">
        <ServiceIcon id={service.id} />
        <div>
          <h3>{service.title}</h3>
          <p>{service.description}</p>
        </div>
      </div>
      <div className="tariff-service-price">{servicePrice(service)}</div>
      <div className="tariff-service-actions">{children}</div>
    </li>
  )
}

function ServiceIcon({ id }) {
  return <span className="tariff-service-icon" aria-hidden="true"
    style={{ '--tariff-service-icon': `url("${serviceIcons[id]}")` }} />
}

function Action({ children, variant = 'outline', className = '', ...props }) {
  return <button type="button" className={`tariff-button tariff-button--${variant} hosting-pressable ${className}`} {...props}>{children}</button>
}

function ServiceActions({ title, onSettings, packageChange, onDisable, disableLabel = 'Отключить', disabling = true }) {
  const id = useId()
  const container = useRef(null)
  const trigger = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function dismiss(event) {
      if (!container.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  function close() {
    trigger.current.focus({ preventScroll: true })
    setOpen(false)
  }

  return (
    <div className="tariff-disclosure tariff-service-disclosure" ref={container}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={event => {
        if (open && event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          close()
        }
      }}>
      <Action ref={trigger} variant="neutral" className="tariff-service-icon-button tariff-service-menu-button" aria-label={`Действия: ${title}`}
        aria-expanded={open} aria-controls={id} onClick={() => setOpen(current => !current)}>
        <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${moreIcon}")` }} />
      </Action>
      <DropdownPanel id={id} open={open} className="tariff-menu tariff-service-menu">
        {packageChange && (
          <button type="button" className="hosting-menu-item" onClick={event => {
            close()
            packageChange.onSelect(event)
          }}>
            <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${changePackageIcon}")` }} />
            {packageChange.label}
          </button>
        )}
        {onSettings && (
          <button type="button" className="hosting-menu-item" onClick={() => {
            close()
            onSettings()
          }}>
            <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${settingsIcon}")` }} />
            Настроить
          </button>
        )}
        <button type="button" className={disabling ? 'hosting-menu-item tariff-service-menu-danger' : 'hosting-menu-item'}
          onClick={() => {
            close()
            onDisable()
          }}>
          <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${disabling ? disableIcon : benefitCheckIcon}")` }} />
          {disableLabel}
        </button>
      </DropdownPanel>
    </div>
  )
}

export function ServiceSettings({ service, ptr, renew, onSave, onClose }) {
  const isIp = service.id === additionalIp.id
  const id = useId()
  const dialog = useRef(null)

  useLayoutEffect(() => {
    dialog.current.showModal()
  }, [])

  return (
    <dialog ref={dialog} className="hosting-dialog tariff-ip-dialog" aria-labelledby={id} onClose={onClose}>
      <form onSubmit={event => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        dialog.current.close()
        onSave(isIp ? { ptr: form.get('ptr').trim() } : { renew: form.has('renew') })
      }}>
        <h2 className="hosting-dialog-title" id={id}>{service.title}</h2>
        {isIp ? (
          <>
            <dl><dt>Адрес</dt><dd>{service.description}</dd><dt>Домен на этом адресе</dt><dd>davydov.ru</dd></dl>
            <label>PTR-запись<input name="ptr" defaultValue={ptr} autoFocus /></label>
            <p>При отключении услуги домен вернётся на общий IP сервера.</p>
          </>
        ) : (
          <label className="tariff-service-settings-renew">
            <input type="checkbox" name="renew" defaultChecked={renew} /> Автопродление
          </label>
        )}
        <div className="tariff-service-actions">
          <Action onClick={() => dialog.current.close()}>Отмена</Action>
          <button type="submit" className="tariff-button tariff-button--primary hosting-pressable">Сохранить</button>
        </div>
      </form>
    </dialog>
  )
}

function packageBenefits(entry) {
  return [
    [`Скидка ${entry.discount}% на ресурсы`, resourceDiscountSummary, resourceDiscountDescription],
    ...entry.benefits,
  ]
}

function BenefitList({ benefits, className = '' }) {
  return (
    <ul className={`tariff-package-benefits ${className}`}>
      {benefits.map(([title, summary, description]) => (
        <li key={title}>
          <span className="tariff-package-benefit-check" aria-hidden="true"
            style={{ '--tariff-benefit-check-icon': `url("${benefitCheckIcon}")` }} />
          <div>
            <strong>{title}</strong>
            <BenefitDescription title={title} summary={summary} description={description} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ConnectedPackage({ entry, packageId, appliedServices, onPackageChange, onPackageSwitch }) {
  const id = useId()
  const premium = packages.find(plan => plan.id === 'premium')
  const upgrading = entry.id === plusPackage.id
  const targetPackageId = upgrading ? premium.id : plusPackage.id
  const pendingRemoval = packageId === null
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [benefitsOpen, setBenefitsOpen] = useState(false)
  const switchPackage = event => onPackageSwitch(targetPackageId, event.detail === 0)
  const switchLabel = upgrading ? 'Улучшить до Премиума' : 'Изменить на Плюс'
  const includedBenefits = [
    ...packageBenefits(entry),
    ...availableServices.filter(service => service.id === 'accelerator' || service.id === 'backups').map(service => [
      service.title,
      `Скидка ${entry.discount}% · ${rubles(packagePrice(service.amount, entry.id, 100))} ${service.period ?? '/ мес.'}`,
      `${service.description} ${appliedServices[service.id] ? 'Услуга подключена.' : 'Услугу можно подключить отдельно.'}`,
    ]),
  ]

  return (
    <section className="tariff-current-package" aria-labelledby={id}>
      <div className="tariff-card tariff-active-banner">
        <div className="tariff-active-header">
          <div className="tariff-active-copy">
            <p>Мой пакет</p>
            <h1 id={id}>{entry.title} · {rubles(entry.amount)} / мес.</h1>
            <p>Оплачивается вместе с хостингом</p>
          </div>
          <ServiceActions title={`Пакет «${entry.title}»`}
            packageChange={{ label: switchLabel, onSelect: switchPackage }}
            disableLabel={pendingRemoval ? 'Отменить отключение' : 'Отключить пакет'}
            disabling={!pendingRemoval} onDisable={() => {
              if (pendingRemoval) onPackageChange(entry.id)
              else setConfirmDisable(true)
            }} />
        </div>
        <div>
          <button type="button" className="tariff-active-benefits-toggle"
            aria-expanded={benefitsOpen} aria-controls={`${id}-benefits`} onClick={() => setBenefitsOpen(open => !open)}>
            Преимущества пакета
            <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${caretIcon}")` }} />
          </button>
          <AnimatedBlock open={benefitsOpen}>
            <div id={`${id}-benefits`} className="tariff-active-benefits">
              <BenefitList benefits={includedBenefits} />
            </div>
          </AnimatedBlock>
        </div>
      </div>
      {upgrading && (
        <div className="tariff-card tariff-package tariff-package-upgrade" data-package={premium.id}>
          <div className="tariff-package-banner">
            <div className="tariff-package-upgrade-copy">
              <h2>Улучшить до Премиума за {rubles(premium.amount)} / мес.</h2>
              <p>Скидка {premium.discount}% на ресурсы, приоритетная поддержка и специальная цена на SSL Timeweb Pro.</p>
            </div>
            <div className="tariff-package-upgrade-action">
              <Action variant="primary" onClick={switchPackage}>
                Перейти на Премиум
              </Action>
            </div>
          </div>
        </div>
      )}
      {confirmDisable && (
        <WarningDialog title={`Отключить пакет «${entry.title}»?`}
          description="После применения изменений скидки и преимущества пакета станут недоступны. Хостинг и отдельно подключённые услуги продолжат работать."
          confirmLabel="Отключить" onClose={confirmed => {
            setConfirmDisable(false)
            if (confirmed) onPackageChange(null)
          }} />
      )}
    </section>
  )
}

export default function TariffServices({
  packageId, appliedPackage, onPackageChange, onPackageSwitch, services, appliedServices, onServiceChange,
  serviceRenewals, onServiceRenew, onServiceSettings, onDetails, onSecurity,
}) {
  const id = useId()
  const currentPackage = packages.find(entry => entry.id === appliedPackage)
  const connected = [additionalIp, ...availableServices].filter(service => appliedServices[service.id])
  const available = availableServices.filter(service => !appliedServices[service.id])

  return (
    <div className="tariff-services">
      <AnimatedBlock>
        {currentPackage ? (
          <ConnectedPackage key={currentPackage.id} entry={currentPackage} packageId={packageId}
            appliedServices={appliedServices} onPackageChange={onPackageChange} onPackageSwitch={onPackageSwitch} />
        ) : (
          <section aria-labelledby={`${id}-packages`} className="hosting-reveal">
            <h1 id={`${id}-packages`}>Пакеты преимуществ</h1>
            <div className="tariff-packages">
              {packages.map(entry => {
                const selected = packageId === entry.id
                const togglePackage = event => {
                  if (selected) onPackageChange(null)
                  else onPackageSwitch(entry.id, event.detail === 0)
                }
                return (
                  <article key={entry.id} className="tariff-card tariff-package" data-package={entry.id}
                    onClick={event => {
                      if (!event.target.closest('button, .tariff-benefit-details')) togglePackage(event)
                    }}>
                    {entry.id === 'premium' && (
                      <span className="tariff-package-popularity">
                        <span className="tariff-action-icon tariff-package-flame" aria-hidden="true"
                          style={{ '--tariff-action-icon': `url("${popularityIcon}")` }} />
                        Выбирают 3 из 4 клиентов
                      </span>
                    )}
                    <div className="tariff-package-banner">
                      <div className="tariff-package-heading">
                        <div className="tariff-package-title">
                          <button type="button" className="tariff-package-selection"
                            aria-label={`Пакет «${entry.title}»`} aria-pressed={selected} onClick={togglePackage} />
                          <h2>{entry.title}</h2>
                        </div>
                        <div className="tariff-package-price"><strong>{rubles(entry.amount)}</strong> / мес.</div>
                      </div>
                      <div className="tariff-package-discount">
                        <strong>−{entry.discount}%</strong>
                        <span className="tariff-package-discount-label">на ресурсы</span>
                      </div>
                    </div>
                    <div className="tariff-package-body">
                      <BenefitList benefits={packageBenefits(entry)} />
                      <div className="tariff-package-footer">
                        <Action variant={selected ? 'neutral' : 'primary'}
                          aria-label={selected ? `Убрать пакет «${entry.title}» из заказа` : `Выбрать пакет «${entry.title}»`}
                          onClick={togglePackage}>
                          {selected ? 'Убрать из заказа' : `Выбрать «${entry.title}»`}
                        </Action>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </AnimatedBlock>

      <AnimatedBlock open={connected.length > 0}>
        <section className="tariff-section" aria-labelledby={`${id}-connected`}>
          <h2 id={`${id}-connected`}>Подключено</h2>
          <ul className="tariff-card tariff-service-list tariff-connected-services">
            {connected.map(service => (
              <ServiceRow key={service.id} service={service}>
                <button type="button" role="switch" aria-checked={serviceRenewals[service.id]} className="tariff-service-switch"
                  aria-label={`Автопродление: ${service.title}`} onClick={() => onServiceRenew(service, !serviceRenewals[service.id])}>
                  <span className="hosting-switch" aria-hidden="true" />Автопродление
                </button>
                <ServiceActions title={service.title} onSettings={() => onServiceSettings(service)}
                  onDisable={() => onServiceChange(service.id, false)} />
              </ServiceRow>
            ))}
          </ul>
        </section>
      </AnimatedBlock>

      <section className="tariff-section hosting-reveal" aria-labelledby={`${id}-security`}>
        <h2 id={`${id}-security`}>Сервисы безопасности</h2>
        <ul className="tariff-security-cards">
          {security.map(service => (
            <li key={service.id}>
              <a className="tariff-card tariff-security-card" href={`?sites=${service.id}`} onClick={event => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                onSecurity(service.id)
              }}>
                <div className="tariff-security-top">
                  <img className="tariff-security-illustration" src={service.icon} width={64} height={64} alt="" />
                  <span className="tariff-security-arrow" aria-hidden="true">↗</span>
                </div>
                <div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
                <div className="tariff-service-price">{servicePrice(service)}</div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <AnimatedBlock>
        <section className="tariff-section hosting-reveal" aria-labelledby={`${id}-available`}>
          <h2 id={`${id}-available`}>Можно подключить</h2>
          <ul className="tariff-service-list tariff-service-catalog">
            {available.map(service => (
              <ServiceRow key={service.id} service={service} card>
                {(service.id === 'backups' || service.id === 'builder') && (
                  <Action variant={services[service.id] ? 'neutral' : 'primary'}
                    aria-label={`${services[service.id] ? 'Убрать из заказа' : 'Добавить'}: ${service.title}`}
                    onClick={() => onServiceChange(service.id, !services[service.id])}>
                    {services[service.id] ? 'Убрать из заказа' : (
                      <><span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${plusIcon}")` }} />Добавить</>
                    )}
                  </Action>
                )}
                <Action variant="neutral" className="tariff-service-icon-button tariff-service-details-button" aria-label={`Подробнее: ${service.title}`}
                  onClick={() => onDetails({ title: service.title, description: `${service.description} ${servicePrice(service)}` })}>
                  <span className="tariff-action-icon" aria-hidden="true" style={{ '--tariff-action-icon': `url("${chevronIcon}")` }} />
                </Action>
              </ServiceRow>
            ))}
          </ul>
        </section>
      </AnimatedBlock>
    </div>
  )
}
