import { useContext, useEffect, useId, useRef, useState } from 'react'
import { AnimatedBlock, DropdownPanel, TabIndicator } from './hosting-motion.jsx'
import { usePendingChanges } from './pending-changes.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import PlanChanges from './PlanChanges.jsx'
import TariffServices, { ServiceSettings, additionalIp, availableServices, packagePrice, packages } from './TariffServices.jsx'
import WarningDialog from './WarningDialog.jsx'
import { canSaveCard, getPaymentGroup, paymentActions, renewalOption, saveCardOption, savedCard, securePaymentNote } from './plan-payment-options.js'
import { plusPackage, rubles } from './plan-preview-pricing.js'
import discount from './assets/plan-changes/discount.png'
import './tariff-settings.css'

const artwork = import.meta.glob('./assets/tariff-settings/*.svg', {
  eager: true, query: '?url', import: 'default',
})

const darkArtworkTones = {
  'sites.svg': 'link-text',
  'disk.svg': 'link-text',
  'databases.svg': 'link-text',
  'cpu.svg': 'link-text',
  'mysql.svg': 'warning-text-emphasis',
  'minus.svg': 'icon-primary',
  'minus-disabled.svg': 'icon-secondary-light',
  'plus.svg': 'icon-primary',
  'info.svg': 'icon-info',
  'faq.svg': 'icon-info',
  'faq-divider.svg': 'line',
}

const number = new Intl.NumberFormat('ru-RU')
const plusActionLabel = `Добавить за ${rubles(plusPackage.amount)} / мес.`
const resources = [
  { id: 'sites', name: 'Сайты', min: 8, step: 1, rate: 60, unit: 'шт.', info: 'Количество сайтов, доступных на аккаунте.' },
  { id: 'disk', name: 'Дисковая квота', min: 15, step: 1, rate: 75, unit: 'ГБ', info: 'Место для файлов сайтов и других данных аккаунта.' },
  { id: 'databases', name: 'Базы данных', min: 3, rate: 100, unit: 'шт.', info: 'Количество баз данных на аккаунте.' },
  { id: 'cpu', name: 'Нагрузка на CPU', min: 150, step: 50, rate: 100, info: 'Допустимая нагрузка на процессор.' },
  { id: 'mysql', name: 'Нагрузка на MySQL', min: 5200, step: 1300, rate: 60, unit: 'сек', info: 'Лимит нагрузки на сервер баз данных.' },
]

const includedQuantities = Object.fromEntries(resources.map(({ id, min }) => [id, min]))

const faqs = [
  ['Как подобрать тариф?', 'Ориентируйтесь на количество сайтов, объём файлов и нагрузку на CPU и MySQL. Текущее использование видно в блоках «Тариф» и «Ресурсы».'],
  ['Как управлять тарифом и доп. услугами?', 'Тариф и период оплаты меняются в верхней карточке. Дополнительные ресурсы можно выбрать ниже, а услуги доступны во вкладке «Другие сервисы».'],
  ['Чем отличаются тарифы?', 'У тарифов разные лимиты на сайты, дисковое пространство и нагрузку. Сравните их перед сменой тарифа.'],
]
const tariffPaymentMethods = ['saved-card', 'new-card', 'bank', 'sbp', 'foreign', 'yoomoney']
const usage = [['Сайтов', 14, 20, ''], ['Диск', 4, 30, ' ГБ'], ['Нагрузка на CPU', 0, 1200, '']]
const tabs = [['tariff', 'Тариф'], ['services', 'Другие сервисы']]

function Art({ name, className }) {
  const source = artwork[`./assets/tariff-settings/${name}`]
  const tone = darkArtworkTones[name]
  if (!tone) return <img className={className} src={source} alt="" />

  return (
    <span aria-hidden="true" className={`tariff-art${className ? ` ${className}` : ''}`}
      style={{ '--tariff-art-mask': `url("${source}")`, '--tariff-art-color': `var(--hosting-${tone})` }}>
      <img src={source} alt="" />
    </span>
  )
}

function Button({ variant = 'neutral', children, ...props }) {
  return <button type="button" className={`tariff-button tariff-button--${variant} hosting-pressable`} {...props}>{children}</button>
}

function Choices({ label, title, options, value, onSelect, variant }) {
  const id = useId()
  const disclosure = useRef(null)
  const trigger = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    function dismiss(event) {
      if (!disclosure.current.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  function close() {
    trigger.current.focus({ preventScroll: true })
    setOpen(false)
  }

  return (
    <div ref={disclosure} className="tariff-disclosure" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }} onKeyDown={event => {
      if (open && event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }}>
      <Button ref={trigger} variant={variant} aria-label={title} aria-expanded={open} aria-controls={id} onClick={() => setOpen(current => !current)}>
        {label}
      </Button>
      <DropdownPanel id={id} open={open} className="tariff-menu">
        {options.map(([key, option]) => (
          <button type="button" key={key} aria-pressed={value === key} onClick={() => {
            close()
            onSelect(key)
          }}>{option}</button>
        ))}
      </DropdownPanel>
    </div>
  )
}

function Offer({ title, description, label, onClick, annual }) {
  return (
    <div className={`tariff-offer hosting-reveal${annual ? ' tariff-offer--annual' : ''}`}>
      <span className="tariff-discount"><img src={discount} alt="" /></span>
      <div className="tariff-offer-copy"><strong>{title}</strong><p>{description}</p></div>
      <Button variant="outline" onClick={onClick}>{label}</Button>
    </div>
  )
}

function resourceCost(resource, quantity) {
  if (resource.id === 'databases') return quantity > resource.min ? resource.rate : 0
  return (quantity - resource.min) / resource.step * resource.rate
}

function resourceUsage(resource, quantity) {
  switch (resource.id) {
    case 'sites': return `Занято 1 из ${number.format(quantity)}`
    case 'disk': return `Занято 2,1 ГБ из ${quantity} ГБ · Это ${Math.ceil(2.1 / quantity * 100)} %`
    case 'databases': return quantity > resource.min ? 'Неограниченное количество' : `Доступно ${quantity} базы данных`
    case 'cpu': return `Занято 18 из ${quantity} · Это ${Math.round(18 / quantity * 100)} %`
    case 'mysql': return `Занято 6 900 сек из ${number.format(quantity)} сек · Это ${Math.round(6900 / quantity * 100)} %`
  }
}

function ResourceRow({ resource, quantity, packageId, onAdjust, onInfo }) {
  const { id, name, min, step, unit, info } = resource
  const cost = resourceCost(resource, quantity)
  return (
    <li className="tariff-resource" data-stepper={Boolean(step)}>
      <div className="tariff-resource-title">
        <span className="tariff-resource-icon"><Art name={`${id}.svg`} /></span>
        <div>
          <h3>{name}<button type="button" className="tariff-resource-info" aria-label={`Подробнее: ${name}`} onClick={() => onInfo({ title: name, description: info })}><Art name="info.svg" /></button></h3>
          <p className={id === 'mysql' && 6900 / quantity >= 0.85 ? 'tariff-warning' : undefined}>{resourceUsage(resource, quantity)}</p>
        </div>
      </div>
      {step && (
        <div className="hosting-stepper tariff-stepper" role="group" aria-label={name}>
          <button type="button" disabled={quantity <= min} aria-label={`Уменьшить: ${name}`} onClick={() => onAdjust(resource, -step)}><Art name={quantity <= min ? 'minus-disabled.svg' : 'minus.svg'} /></button>
          <output aria-label={name}>{number.format(quantity)}{unit && unit !== 'шт.' ? ` ${unit}` : ''}</output>
          <button type="button" aria-label={`Увеличить: ${name}`} onClick={() => onAdjust(resource, step)}><Art name="plus.svg" /></button>
        </div>
      )}
      <div className="tariff-resource-price">
        {id === 'databases' && quantity > min ? <strong>Безлимит</strong> : step && cost > 0 ? (
          <><strong>+ {rubles(packagePrice(cost, packageId))}</strong><p>/ мес.</p></>
        ) : <p>Входит в тариф</p>}
      </div>
    </li>
  )
}

function scrollToReview(heading, focus) {
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  if (focus) heading.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior, block: 'start' })
}

export default function TariffSettings({ compact, tab, scenario, onTabChange, onSecurity }) {
  const id = useId()
  const showToast = useContext(HostingToastContext)
  const [plan, setPlan] = useState('Optimo')
  const [period, setPeriod] = useState('month')
  const [quantities, setQuantities] = useState(includedQuantities)
  const [applied, setApplied] = useState(includedQuantities)
  const [appliedPackage, setAppliedPackage] = useState(scenario?.appliedPackage ?? null)
  const [packageId, setPackageId] = useState(scenario?.packageId ?? appliedPackage)
  const [appliedServices, setAppliedServices] = useState(() => Object.fromEntries(
    [additionalIp.id, ...(scenario?.serviceIds ?? [])].map(id => [id, true]),
  ))
  const [services, setServices] = useState(appliedServices)
  const [serviceRenewals, setServiceRenewals] = useState(appliedServices)
  const [serviceSettings, setServiceSettings] = useState(null)
  const [ptr, setPtr] = useState('vh462.timeweb.ru')
  const review = useRef(null)
  const pendingReviewScroll = useRef(null)
  const cancelApplyScroll = useRef(null)
  const [renew, setRenew] = useState(true)
  const [save, setSave] = useState(true)
  const [hasSavedCard, setHasSavedCard] = useState(true)
  const [method, setMethod] = useState(savedCard.id)
  const [dialog, setDialog] = useState(null)
  const changes = resources.filter(resource => quantities[resource.id] !== applied[resource.id])

  function changeCost(resource) {
    return Math.max(0, resourceCost(resource, quantities[resource.id]) - resourceCost(resource, applied[resource.id]))
  }

  const selectedPackage = packages.find(entry => entry.id === packageId)
  const currentPackage = packages.find(entry => entry.id === appliedPackage)
  const serviceChanges = [additionalIp, ...availableServices].filter(service => Boolean(services[service.id]) !== Boolean(appliedServices[service.id]))
  const packageChanged = packageId !== appliedPackage
  const packageCost = packageChanged ? Math.max(0, (selectedPackage?.amount ?? 0) - (currentPackage?.amount ?? 0)) : 0
  const resourceTotal = changes.reduce((sum, resource) => sum + packagePrice(changeCost(resource), packageId), 0)
  const serviceTotal = serviceChanges.reduce((sum, service) => sum + (services[service.id] ? serviceCost(service) : 0), 0)
  const total = resourceTotal + packageCost + serviceTotal
  const hasChanges = changes.length > 0 || packageChanged || serviceChanges.length > 0
  const navigate = usePendingChanges(hasChanges && !cancelApplyScroll.current, {
    title: tab === 'services' ? 'Прервать оформление услуг?' : 'Прервать изменение тарифа?',
    description: tab === 'services' ? 'Выбранные пакеты и изменения услуг будут сброшены.' : 'Выбранные изменения тарифа будут сброшены.',
    revealCheckout: () => scrollToReview(review.current, true),
  }, resetChanges)
  const plusOfferTotal = changes.reduce((sum, resource) => sum + packagePrice(changeCost(resource), plusPackage.id), plusPackage.amount)
  const paymentGroup = getPaymentGroup(method, hasSavedCard, false, tariffPaymentMethods)
  const showSaveOption = total > 0 && canSaveCard(paymentGroup.value)

  useEffect(() => () => cancelApplyScroll.current?.(), [])

  useEffect(() => {
    const request = pendingReviewScroll.current
    if (!request) return
    pendingReviewScroll.current = null
    if (tab !== 'services' || !hasChanges) return

    const heading = review.current
    const block = heading.closest('.hosting-animated-block')
    let cancelled = false

    function scrollWhenReady() {
      if (!cancelled) scrollToReview(heading, request.focus)
    }

    const animations = block.getAnimations()
    if (animations.length) Promise.allSettled(animations.map(animation => animation.finished)).then(scrollWhenReady)
    else scrollWhenReady()

    return () => { cancelled = true }
  }, [tab, packageId, services, hasChanges])

  function selectTab(next, focus = false, keepChanges = false) {
    if (next === tab) return
    function switchTab() {
      onTabChange(next)
      if (focus) document.getElementById(`${id}-${next}`)?.focus()
    }
    if (keepChanges) switchTab()
    else navigate(switchTab)
  }

  function changeQuantity(resource, delta) {
    setQuantities(current => ({
      ...current,
      [resource.id]: Math.max(resource.min, current[resource.id] + delta),
    }))
  }

  function confirmPeriod(value) {
    if (value === period) return
    setDialog({
      title: 'Изменить период оплаты?',
      description: value === 'year' ? 'Годовая оплата составит 3 792 ₽.' : 'Помесячная оплата составит 452 ₽ / мес.',
      confirmLabel: 'Изменить период',
      apply: () => setPeriod(value),
    })
  }

  function confirmPlan(value) {
    if (value === plan) return
    setDialog({
      title: `Перейти на тариф ${value}?`,
      description: 'Изменение применяется к демонстрационному аккаунту.',
      confirmLabel: 'Сменить тариф',
      apply: () => setPlan(value),
    })
  }

  function applyChanges() {
    function commitChanges() {
      setApplied(quantities)
      setAppliedPackage(packageId)
      setAppliedServices(services)
      setServiceRenewals(current => Object.fromEntries(
        Object.keys(services).filter(id => services[id]).map(id => [id, appliedServices[id] ? current[id] : renew]),
      ))
    }

    if (cancelApplyScroll.current) return
    if (!packageChanged || !selectedPackage || window.scrollY <= 0) {
      commitChanges()
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('onscrollend' in document)) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      commitChanges()
      return
    }

    // Keep the review in place until the page has finished scrolling away from it.
    const section = review.current.closest('.tariff-section')
    section.inert = true
    function cleanup() {
      document.removeEventListener('scrollend', finish)
      section.inert = false
      cancelApplyScroll.current = null
    }
    function finish() {
      cleanup()
      commitChanges()
    }
    cancelApplyScroll.current = cleanup
    document.addEventListener('scrollend', finish, { once: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function confirmApply() {
    setDialog({
      title: 'Применить изменения?',
      description: 'Изменения вступят в силу сразу.',
      confirmLabel: 'Применить',
      apply: () => {
        applyChanges()
        showToast({ message: 'Изменения применены', success: true })
      },
    })
  }

  function handleChange(group, id, patch) {
    if (group === 'renewalOptions') setRenew(patch.checked)
    else if (group === 'saveOptions') setSave(patch.checked)
    else if (group === 'paymentGroups') setMethod(patch.value)
    else if (group === 'items' && patch.removed) {
      if (id === 'package') setPackageId(appliedPackage)
      else if (serviceChanges.some(service => service.id === id)) updateService(id, appliedServices[id])
      else setQuantities(current => ({ ...current, [id]: applied[id] }))
    }
  }

  function handleAction(action) {
    if (action.id === 'add-plus') {
      if (compact) selectTab('services', true, true)
      else setPackageId(plusPackage.id)
    } else if (action.id === 'unlink-payment-method') {
      setHasSavedCard(false)
      setMethod(getPaymentGroup(method, false, false, tariffPaymentMethods).value)
    } else if (action.demoPayment) {
      applyChanges()
      if (showSaveOption && save) {
        setHasSavedCard(true)
        setMethod(savedCard.id)
      }
    } else if (action.id === 'apply') confirmApply()
  }

  function updateService(id, enabled) {
    if (!enabled && appliedServices[id]) pendingReviewScroll.current = { focus: true }
    setServices(current => ({ ...current, [id]: Boolean(enabled) }))
  }

  function switchPackage(nextPackageId, focus) {
    if (nextPackageId === packageId) {
      scrollToReview(review.current, focus)
      return
    }
    pendingReviewScroll.current = { focus }
    setPackageId(nextPackageId)
  }

  function requestServiceRenewal(service, enabled) {
    function apply() {
      setServiceRenewals(current => ({ ...current, [service.id]: enabled }))
      showToast({ message: enabled ? 'Автопродление включено' : 'Автопродление выключено', success: true })
    }

    if (serviceRenewals[service.id] === enabled) return
    if (enabled) {
      apply()
      return
    }

    setDialog({
      title: 'Выключить автопродление?',
      description: `Услуга «${service.title}» будет действовать до конца оплаченного периода. Чтобы продлить её, оплатите следующий период вручную.`,
      confirmLabel: 'Выключить',
      apply,
    })
  }

  function serviceCost(service) {
    return service.id === 'backups' ? packagePrice(service.amount, packageId, 100) : service.amount
  }

  function resetChanges() {
    setQuantities(applied)
    setPackageId(appliedPackage)
    setServices(appliedServices)
  }

  function renderChanges() {
    return (
      <AnimatedBlock open={hasChanges}>
        <section className="tariff-section">
          <PlanChanges
            heading={{ ref: review }}
            onDiscard={hasChanges ? () => {
              resetChanges()
              document.getElementById(`${id}-${tab}`)?.focus({ preventScroll: true })
            } : undefined}
            animateHeight={false}
            items={[
              ...changes.map(resource => {
                const difference = quantities[resource.id] - applied[resource.id]
                const cost = changeCost(resource)
                const units = `${difference > 0 ? '+' : '−'}${number.format(Math.abs(difference))}${resource.unit ? ` ${resource.unit}` : ''}`
                return {
                  id: resource.id,
                  title: resource.name,
                  description: units + (difference > 0 ? ' сверх тарифа' : ''),
                  amount: rubles(packagePrice(cost, packageId)),
                  detail: '/ мес.',
                  removable: true,
                  removeLabel: `Убрать изменение: ${resource.name}`,
                }
              }),
              ...(packageChanged ? [{
                id: 'package',
                title: `Пакет «${(selectedPackage ?? currentPackage).title}»`,
                description: selectedPackage ? (currentPackage ? `Вместо пакета «${currentPackage.title}»` : 'Подключение') : 'Отключение',
                amount: selectedPackage ? rubles(packageCost) : undefined,
                detail: selectedPackage ? '/ мес.' : undefined,
                removable: true,
                removeLabel: 'Убрать изменение пакета',
              }] : []),
              ...serviceChanges.map(service => ({
                id: service.id,
                title: service.title,
                description: services[service.id] ? 'Подключение' : 'Отключение',
                amount: services[service.id] ? rubles(serviceCost(service)) : undefined,
                detail: services[service.id] ? '/ мес.' : undefined,
                removable: true,
                removeLabel: `Убрать изменение: ${service.title}`,
              })),
            ]}
            notices={tab === 'tariff' && !packageId && !appliedPackage && plusOfferTotal < resourceTotal ? [{
              id: 'plus-offer',
              tone: 'info',
              icon: 'discount',
              title: `С пакетом Плюс это расширение стоило бы ${rubles(plusOfferTotal)} вместо ${rubles(resourceTotal)}`,
              description: 'Скидка 20 % на ресурсы и настройка SSL-сертификата.',
              action: { id: 'add-plus', label: compact ? 'Посмотреть пакет' : plusActionLabel },
            }] : []}
            totals={[{ label: 'К оплате', amount: rubles(total), live: true }]}
            renewalOptions={total > 0 ? [renewalOption(renew)] : []}
            paymentGroups={total > 0 ? [paymentGroup] : []}
            saveOptions={showSaveOption ? [saveCardOption(save)] : []}
            actions={[total > 0 ? paymentActions[paymentGroup.value] : { id: 'apply', label: 'Применить изменения' }]}
            paymentNote={total > 0 ? securePaymentNote : undefined}
            paymentContext={JSON.stringify([quantities, packageId, services])}
            onChange={handleChange}
            onAction={handleAction}
          />
        </section>
      </AnimatedBlock>
    )
  }

  function renderFaq() {
    return (
      <section className="tariff-faq hosting-reveal" aria-label="Частые вопросы">
        <div><Art name="faq.svg" /><span>Частые вопросы</span></div>
        <Art name="faq-divider.svg" className="tariff-faq-divider" />
        <ul>{faqs.map(([title, description]) => <li key={title}><button type="button" onClick={() => setDialog({ title, description })}>{title}</button></li>)}</ul>
      </section>
    )
  }

  return (
    <div className="tariff-settings">
      <div className="tariff-tabs hosting-indicator-track" role="tablist" aria-label="Настройки тарифа" onKeyDown={event => {
        const keys = { ArrowLeft: tab === 'tariff' ? 'services' : 'tariff', ArrowRight: tab === 'tariff' ? 'services' : 'tariff', Home: 'tariff', End: 'services' }
        const next = keys[event.key]
        if (!next) return
        event.preventDefault()
        selectTab(next, true)
      }}>
        {tabs.map(([key, label]) => (
          <button type="button" role="tab" key={key} id={`${id}-${key}`} aria-controls={`${id}-${key}-panel`} aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1} onClick={() => selectTab(key)}>{label}{key === 'services' && <span className="tariff-tab-count">{Number(Boolean(appliedPackage)) + Object.values(appliedServices).filter(Boolean).length}</span>}</button>
        ))}
        <TabIndicator selected={tab} />
      </div>
      <div className="tariff-panel" role="tabpanel" id={`${id}-tariff-panel`} aria-labelledby={`${id}-tariff`} hidden={tab !== 'tariff'}>
        <h1>Настройки тарифа</h1>
        <div className="tariff-overview tariff-card hosting-reveal">
          <div className="tariff-overview-cell">
            <div><p>Тариф</p><strong>{plan}</strong><p>{period === 'year' ? 'годовая' : 'помесячная'} оплата, {currentPackage ? `с пакетом «${currentPackage.title}»` : 'без пакета'}</p></div>
            <Choices label={compact ? 'Сменить' : 'Сменить тариф'} title="Сменить тариф" variant="primary" value={plan} options={['Optimo', 'Year'].map(name => [name, name])} onSelect={confirmPlan} />
          </div>
          <div className="tariff-usage tariff-overview-cell">
            {usage.map(([label, used, limit, unit]) => (
              <div key={label}>
                <div><span>{label}</span><b>{used} из {limit}{unit}</b></div>
                <progress aria-label={label} value={used} max={limit} />
              </div>
            ))}
          </div>
          <div className="tariff-overview-cell">
            <div><p>Оплачен до</p><strong>12 сентября</strong><p>Это ещё 16 дней</p></div>
            <Choices label="Изменить период" value={period} options={[['month', 'Месяц'], ['year', 'Год']]} onSelect={confirmPeriod} />
          </div>
        </div>
        <AnimatedBlock open={period === 'month'}>
          <Offer annual title="Годовая оплата дешевле на 30 %" description="316 ₽ / мес. вместо 452 ₽. За год это 1 632 ₽, при том же тарифе и ресурсах" label="Перейти на год" onClick={() => confirmPeriod('year')} />
        </AnimatedBlock>

        <section className="tariff-section hosting-reveal">
          <h2>Ресурсы <span className="tariff-badge">{selectedPackage ? `−${selectedPackage.discount} % по пакету «${selectedPackage.title}»` : '−20 % по пакету «Плюс»'}</span></h2>
          <ul className="tariff-card tariff-resources">
            {resources.map(resource => <ResourceRow key={resource.id} resource={resource} quantity={quantities[resource.id]} packageId={packageId} onAdjust={changeQuantity} onInfo={setDialog} />)}
          </ul>
        </section>

        {tab === 'tariff' && renderChanges()}
        {renderFaq()}
      </div>
      <div className="tariff-panel" role="tabpanel" id={`${id}-services-panel`} aria-labelledby={`${id}-services`} hidden={tab !== 'services'}>
        <TariffServices
          packageId={packageId} appliedPackage={appliedPackage} onPackageChange={setPackageId} onPackageSwitch={switchPackage}
          services={services} appliedServices={appliedServices} onServiceChange={updateService}
          serviceRenewals={serviceRenewals} onServiceRenew={requestServiceRenewal} onServiceSettings={setServiceSettings}
          onDetails={setDialog} onSecurity={onSecurity}
        />
        {tab === 'services' && renderChanges()}
        {renderFaq()}
      </div>
      {serviceSettings && <ServiceSettings service={serviceSettings} ptr={ptr} renew={serviceRenewals[serviceSettings.id]}
        onSave={settings => {
          if (serviceSettings.id === additionalIp.id) {
            setPtr(settings.ptr)
            showToast({ message: 'Настройки услуги сохранены', success: true })
          } else requestServiceRenewal(serviceSettings, settings.renew)
        }}
        onClose={() => setServiceSettings(null)} />}
      {dialog && <WarningDialog {...dialog} onClose={confirmed => {
        if (confirmed) dialog.apply?.()
        setDialog(null)
      }} />}
    </div>
  )
}
