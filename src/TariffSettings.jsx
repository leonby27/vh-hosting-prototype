import { TabList } from './ui/navigation.jsx'
import { Badge, Dialog } from './ui/feedback.jsx'
import TariffUsage from './TariffUsage.jsx'
import { useCallback, useContext, useEffect, useId, useRef, useState } from 'react'
import { Button as SharedButton, IconButton, Stepper } from './ui/controls.jsx'
import { Surface } from './ui/layout.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import { usePendingChanges } from './pending-changes.jsx'
import { HostingToastContext } from './hosting-toast.jsx'
import PlanChanges from './PlanChanges.jsx'
import TariffServices, { ServiceSettings, additionalIp, availableServices, packagePrice, packages } from './TariffServices.jsx'
import { isHostingPlan, planPrice, TariffPeriodOptions, TariffPlanOptions, TariffSheet } from './TariffPlanOptions.jsx'
import { TariffAccountAlert, TariffParkingDialogs, TariffParkingStatus, TariffReceipt, useParkingTransition } from './TariffScenarioUI.jsx'
import LeaveCheckoutDialog from './LeaveCheckoutDialog.jsx'
import { HostingTrialNotice } from './DashboardNotices.jsx'
import WarningDialog from './WarningDialog.jsx'
import { canSaveCard, getPaymentGroup, paymentActions, renewalOption, saveCardOption, savedCard, securePaymentNote } from './plan-payment-options.js'
import { plusPackage, rubles } from './plan-preview-pricing.js'
import discount from './assets/plan-changes/discount.png'
import transferIllustration from './assets/tariff-settings/server-transfer.png'
import './tariff-settings.css'
import './tariff-scenarios.css'

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
const tariffPaymentMethods = ['saved-card', 'saved-sbp', 'new-card', 'bank', 'sbp', 'foreign', 'yoomoney', 'invoice', 'sber']
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

function AnnualPaymentOffer({ onClick, disabled }) {
  return (
    <div className="tariff-offer hosting-reveal">
      <div className="tariff-offer-content">
        <span className="tariff-discount"><img src={discount} alt="" /></span>
        <div className="tariff-offer-copy">
          <strong>Годовая оплата дешевле на 30 %</strong>
          <p>316 ₽ в месяц вместо 452 ₽. За год это 1 632 ₽, при том же тарифе и ресурсах</p>
        </div>
      </div>
      <SharedButton appearance="tariff" variant="outline" size={44} disabled={disabled} onClick={onClick}>Перейти на год</SharedButton>
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

function ResourceRow({ resource, quantity, packageId, onAdjust, onInfo, disabled }) {
  const { id, name, min, step, unit, info } = resource
  const cost = resourceCost(resource, quantity)
  return (
    <li className="tariff-resource" data-stepper={Boolean(step)}>
      <div className="tariff-resource-title">
        <span className="tariff-resource-icon"><Art name={`${id}.svg`} /></span>
        <div>
          <h3>{name}<IconButton disabled={disabled} size={24} type="button" className="tariff-resource-info" aria-label={`Подробнее: ${name}`} onClick={() => onInfo({ title: name, description: info })}><Art name="info.svg" /></IconButton></h3>
          <p className={id === 'mysql' && 6900 / quantity >= 0.85 ? 'tariff-warning' : undefined}>{resourceUsage(resource, quantity)}</p>
        </div>
      </div>
      {step && (
        <Stepper className="tariff-stepper" label={name}
          value={`${number.format(quantity)}${unit && unit !== 'шт.' ? ` ${unit}` : ''}`}
          atMin={disabled || quantity <= min} atMax={disabled} decreaseLabel={`Уменьшить: ${name}`} increaseLabel={`Увеличить: ${name}`}
          onDecrease={() => onAdjust(resource, -step)} onIncrease={() => onAdjust(resource, step)} />
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
  if (!heading) return
  const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
  if (focus) heading.focus({ preventScroll: true })
  heading.scrollIntoView({ behavior, block: 'start' })
}

export default function TariffSettings({ compact, tab, scenario, onTabChange, onSecurity }) {
  const id = useId()
  const showToast = useContext(HostingToastContext)
  const [plan, setPlan] = useState(scenario?.plan ?? 'Optimo')
  const [selectedPlan, setSelectedPlan] = useState(scenario?.selectedPlan ?? null)
  const [appliedPeriod, setAppliedPeriod] = useState(scenario?.appliedPeriod ?? 'month')
  const [period, setPeriod] = useState(scenario?.period ?? appliedPeriod)
  const [plansOpen, setPlansOpen] = useState(Boolean(scenario?.plansOpen))
  const [periodOpen, setPeriodOpen] = useState(Boolean(scenario?.periodOpen))
  const [receipt, setReceipt] = useState(scenario?.receipt ?? null)
  const [alert, setAlert] = useState(scenario?.alert ?? null)
  const [debt, setDebt] = useState(scenario?.alert === 'blocked' ? 200 : scenario?.alert === 'deferred' ? 214 : 0)
  const [unpaid, setUnpaid] = useState(Boolean(scenario?.unpaid))
  const [leaveOpen, setLeaveOpen] = useState(Boolean(scenario?.leaveOpen))
  const [quantities, setQuantities] = useState(() => ({ ...includedQuantities, ...scenario?.quantities }))
  const [applied, setApplied] = useState(() => ({ ...includedQuantities, ...scenario?.appliedResources }))
  const [appliedPackage, setAppliedPackage] = useState(scenario?.appliedPackage ?? null)
  const [packageId, setPackageId] = useState(scenario?.packageId ?? appliedPackage)
  const [appliedServices, setAppliedServices] = useState(() => Object.fromEntries(
    [...(isHostingPlan(plan) ? [additionalIp.id] : []), ...(scenario?.serviceIds ?? [])].map(id => [id, true]),
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
  const [hasSavedSbp, setHasSavedSbp] = useState(Boolean(scenario?.hasSavedSbp))
  const [method, setMethod] = useState(scenario?.invoice ? 'invoice' : savedCard.id)
  const [dialog, setDialog] = useState(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const transferPlan = scenario?.transferPlan
  const [showTransferDialog, setShowTransferDialog] = useState(tab === 'tariff' && Boolean(transferPlan))
  const completeParking = useCallback(() => {
    setPlan('Парковка')
    setSelectedPlan(null)
    setAppliedPackage(null)
    setPackageId(null)
    setAppliedServices({})
    setServices({})
    setServiceRenewals({})
    setApplied(includedQuantities)
    setQuantities(includedQuantities)
    setPeriod('month')
    setAppliedPeriod('month')
    setPlansOpen(false)
    setPeriodOpen(false)
    setAlert('parking-success')
  }, [])
  const parking = useParkingTransition(scenario, completeParking)
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
  const planChanged = Boolean(selectedPlan && selectedPlan !== plan)
  const periodChanged = period !== appliedPeriod
  const scheduleChanged = planChanged || periodChanged
  const effectivePlan = selectedPlan ?? plan
  const annualQuote = !planChanged && scenario?.annualQuote ? scenario.annualQuote : Math.round(planPrice(effectivePlan) * 12 * 0.7)
  const planCost = scheduleChanged
    ? period === 'year' ? annualQuote
      : planChanged ? Math.max(0, planPrice(effectivePlan) - planPrice(plan)) : 0
    : 0
  const reduction = changes.reduce((sum, resource) => sum + Math.max(0, resourceCost(resource, applied[resource.id]) - resourceCost(resource, quantities[resource.id])), 0)
  const payable = resourceTotal + packageCost + serviceTotal + planCost + (scheduleChanged ? debt : 0)
  const total = Math.max(0, payable - reduction)
  const refund = Math.max(0, reduction - payable)
  const hasChanges = changes.length > 0 || packageChanged || serviceChanges.length > 0 || scheduleChanged
  const navigate = usePendingChanges(hasChanges && !cancelApplyScroll.current, {
    title: tab === 'services' ? 'Прервать оформление услуг?' : 'Прервать настройку тарифа?',
    description: tab === 'services' ? 'Выбранные пакеты и изменения услуг будут сброшены.' : 'Выбранные параметры не сохранятся',
    checkoutLabel: tab === 'tariff' ? 'Вернуться к настройке тарифа' : undefined,
    leaveLabel: tab === 'tariff' ? 'Прервать настройку тарифа' : undefined,
    revealCheckout: () => scrollToReview(review.current, true),
  }, resetChanges)
  const plusOfferTotal = changes.reduce((sum, resource) => sum + packagePrice(changeCost(resource), plusPackage.id), plusPackage.amount)
  const paymentGroup = { ...getPaymentGroup(method, hasSavedCard, hasSavedSbp, tariffPaymentMethods), defaultMenuOpen: scenario?.paymentMenuOpen }
  const showSaveOption = total > 0 && canSaveCard(paymentGroup.value)

  useEffect(() => () => cancelApplyScroll.current?.(), [])

  useEffect(() => {
    const request = pendingReviewScroll.current
    if (!request) return
    pendingReviewScroll.current = null
    if (tab !== request.tab || !hasChanges) return

    const heading = review.current
    const block = heading?.closest('.hosting-animated-block')
    if (!block) return
    let cancelled = false

    function scrollWhenReady() {
      if (!cancelled) scrollToReview(heading, request.focus)
    }

    const animations = block.getAnimations()
    if (animations.length) Promise.allSettled(animations.map(animation => animation.finished)).then(scrollWhenReady)
    else scrollWhenReady()

    return () => { cancelled = true }
  }, [tab, selectedPlan, packageId, services, hasChanges])

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

  function selectPeriod(value) {
    setPeriod(value)
    if (compact) setPeriodOpen(false)
  }

  function showTrialPayment() {
    function openPeriodOptions() {
      if (tab !== 'tariff') onTabChange('tariff')
      setPeriodOpen(true)
      requestAnimationFrame(() => scrollToReview(document.getElementById(`${id}-period`), false))
    }

    if (tab === 'tariff') openPeriodOptions()
    else navigate(openPeriodOptions)
  }

  function selectPlan(value) {
    if (value === transferPlan) {
      setPlansOpen(false)
      setShowTransferDialog(true)
      return
    }
    if (value === 'Парковка') {
      setPlansOpen(false)
      parking.open()
      return
    }
    if (value !== plan) pendingReviewScroll.current = { tab: 'tariff', focus: true }
    setSelectedPlan(value === plan ? null : value)
    if (value === 'Почтовый') setPeriod('month')
    if (compact) setPlansOpen(false)
  }

  function handleAlertAction(notice) {
    if (notice.amount) {
      setDialog({
        title: `Погасить ${rubles(notice.amount)}?`,
        description: 'В прототипе можно имитировать погашение задолженности.',
        confirmLabel: 'Имитировать оплату',
        apply: () => { setDebt(0); setAlert(null) },
      })
    } else {
      setPlansOpen(true)
      if (alert === 'payment-failed') setAlert(null)
    }
  }

  function applyChanges({ immediate = false } = {}) {
    function commitChanges() {
      if (scheduleChanged) {
        setPlan(effectivePlan)
        setSelectedPlan(null)
        setAppliedPeriod(period)
        setPlansOpen(false)
        setPeriodOpen(false)
        if (debt) { setDebt(0); setAlert(null) }
      }
      if (planChanged && !isHostingPlan(effectivePlan)) {
        setAppliedPackage(null)
        setPackageId(null)
        setAppliedServices({})
        setServices({})
        setServiceRenewals({})
        setApplied(includedQuantities)
        setQuantities(includedQuantities)
        return
      }
      setApplied(quantities)
      setAppliedPackage(packageId)
      setAppliedServices(services)
      setServiceRenewals(current => Object.fromEntries(
        Object.keys(services).filter(id => services[id]).map(id => [id, appliedServices[id] ? current[id] : renew]),
      ))
    }

    if (cancelApplyScroll.current) return
    if (immediate || !packageChanged || !selectedPackage || window.scrollY <= 0) {
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
      if (id === 'tariff-plan') setSelectedPlan(null)
      else if (id === 'tariff-period') setPeriod(appliedPeriod)
      else if (id === 'package') setPackageId(appliedPackage)
      else if (serviceChanges.some(service => service.id === id)) updateService(id, appliedServices[id])
      else setQuantities(current => ({ ...current, [id]: applied[id] }))
    }
  }

  function handleAction(action) {
    if (action.id === 'add-plus') {
      if (compact) selectTab('services', true, true)
      else setPackageId(plusPackage.id)
    } else if (action.id === 'unlink-payment-method') {
      const cardRemains = hasSavedCard && action.method !== 'saved-card'
      const sbpRemains = hasSavedSbp && action.method !== 'saved-sbp'
      setHasSavedCard(cardRemains)
      setHasSavedSbp(sbpRemains)
      setMethod(getPaymentGroup(method, cardRemains, sbpRemains, tariffPaymentMethods).value)
    } else if (action.demoPayment) {
      confirmPayment()
    } else if (action.document) setReceiptOpen(true)
    else if (action.id === 'apply') confirmApply()
  }

  function confirmPayment() {
    setUnpaid(false)
    if (tab === 'tariff') {
      const periodDetail = period === 'year' ? 'годовой' : 'помесячный'
      const items = [
        ...(scheduleChanged ? [{ title: `Тариф ${effectivePlan} ${periodDetail}`, detail: period === 'year' ? 'до 10.01.2028' : 'Помесячная оплата' }] : []),
        ...changes.map(resource => ({
          title: resource.name,
          detail: `${quantities[resource.id] > applied[resource.id] ? '+' : '−'}${number.format(Math.abs(quantities[resource.id] - applied[resource.id]))}${resource.unit ? ` ${resource.unit}` : ''} сверх лимита`,
        })),
      ]
      setReceipt({ amount: total, items })
    }
    applyChanges({ immediate: tab === 'tariff' })
    if (showSaveOption && save) {
      setHasSavedCard(true)
      setMethod(savedCard.id)
    }
  }

  function updateService(id, enabled) {
    if (!enabled && appliedServices[id]) pendingReviewScroll.current = { tab: 'services', focus: true }
    setServices(current => ({ ...current, [id]: Boolean(enabled) }))
  }

  function switchPackage(nextPackageId, focus) {
    if (nextPackageId === packageId) {
      scrollToReview(review.current, focus)
      return
    }
    pendingReviewScroll.current = { tab: 'services', focus }
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
    setSelectedPlan(null)
    setPeriod(appliedPeriod)
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
              ...(planChanged ? [{
                id: 'tariff-plan', title: `Тариф ${effectivePlan}`, description: `Вместо тарифа ${plan}`,
                amount: rubles(periodChanged ? 0 : planCost), removable: true,
              }] : []),
              ...(periodChanged ? [{
                id: 'tariff-period', title: `Тариф ${effectivePlan}`, description: period === 'year' ? 'Ежегодная оплата' : 'Помесячная оплата',
                amount: rubles(period === 'month' && appliedPeriod === 'year' ? annualQuote : planCost), detail: '/ год', removable: true,
              }] : []),
              ...(debt && scheduleChanged ? [{ id: 'tariff-debt', title: 'Задолженность', amount: rubles(debt) }] : []),
              ...changes.map(resource => {
                const difference = quantities[resource.id] - applied[resource.id]
                const cost = changeCost(resource)
                const units = `${difference > 0 ? '+' : '−'}${number.format(Math.abs(difference))}${resource.unit ? ` ${resource.unit}` : ''}`
                return {
                  id: resource.id,
                  title: resource.name,
                  description: units + (difference > 0 ? ' сверх тарифа' : ''),
                  amount: rubles(difference < 0 ? resourceCost(resource, applied[resource.id]) - resourceCost(resource, quantities[resource.id]) : packagePrice(cost, packageId)),
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
            notices={[...(tab === 'tariff' && !packageId && !appliedPackage && plusOfferTotal < resourceTotal ? [{
              id: 'plus-offer',
              tone: 'info',
              icon: 'discount',
              title: `С пакетом Плюс это расширение стоило бы ${rubles(plusOfferTotal)} вместо ${rubles(resourceTotal)}`,
              description: 'Скидка 20 % на ресурсы и настройка SSL-сертификата.',
              action: { id: 'add-plus', label: compact ? 'Посмотреть пакет' : plusActionLabel },
            }] : []), ...(periodChanged && period === 'month' ? [{
              id: 'month-recalculation', tone: 'info',
              title: 'Оплаченного хватит до 18 апреля 2027 вместо 22 мая 2027',
              description: 'Годовая скидка перестанет действовать. Срок сократится на 34 дня — с 274 до 240.',
            }] : [])]}
            totals={[
              { label: refund ? 'Вернётся на баланс' : periodChanged && period === 'month' ? 'К доплате' : 'К оплате', amount: rubles(refund || total), live: true },
              ...(selectedPackage && resourceTotal > 0 ? [{ label: `Скидка ${selectedPackage.discount}% по пакету`, amount: `− ${rubles(changes.reduce((sum, resource) => sum + changeCost(resource), 0) - resourceTotal)}` }] : []),
            ]}
            renewalOptions={total > 0 ? [renewalOption(renew)] : []}
            paymentGroups={total > 0 ? [paymentGroup] : []}
            saveOptions={showSaveOption ? [saveCardOption(save)] : []}
            actions={[total > 0 ? { ...paymentActions[paymentGroup.value], defaultOpen: scenario?.invoice } : {
              id: 'apply', label: periodChanged && period === 'month' ? 'Перейти на помесячную оплату' : 'Применить настройки',
            }]}
            paymentNote={total > 0 ? securePaymentNote : undefined}
            paymentContext={JSON.stringify([quantities, packageId, services, selectedPlan, period])}
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
        <ul>{faqs.map(([title, description]) => <li key={title}><SharedButton appearance="text" pressable={false} type="button" onClick={() => setDialog({ title, description })}>{title}</SharedButton></li>)}</ul>
      </section>
    )
  }

  const hostingPlan = isHostingPlan(plan)
  const parkingPlan = plan === 'Парковка'
  const inlinePlans = !hostingPlan || !compact
  const checklistOnly = parking.stage === 'checklist' && !parking.skipDeletion
  const planOptions = {
    plan, selected: selectedPlan, compact, transferPlan, onSelect: selectPlan,
    showAll: scenario?.showAllPlans, disabled: parking.locked,
  }

  function closeReceipt() {
    setReceipt(null)
    requestAnimationFrame(() => document.getElementById(`${id}-tariff-title`)?.focus())
  }

  return (
    <div className="tariff-settings">
      <HostingTrialNotice open={unpaid} compact={compact} onPay={showTrialPayment} />
      <TabList size={35} idPrefix={id} label="Настройки тарифа" value={tab}
        navigate={navigate} onChange={onTabChange} tabs={tabs.map(([key, label]) => ({
          id: key, label, elementId: `${id}-${key}`, panelId: `${id}-${key}-panel`,
          count: key === 'services' ? Number(Boolean(appliedPackage)) + Object.values(appliedServices).filter(Boolean).length : undefined,
          disabled: key === 'services' && parking.locked,
        }))} />
      <div className="tariff-panel" role="tabpanel" id={`${id}-tariff-panel`} aria-labelledby={`${id}-tariff`} hidden={tab !== 'tariff'}>
        <AnimatedBlock open={Boolean(alert)}>
          <div className="tariff-top-state">
            <TariffAccountAlert kind={alert} compact={compact} plan={plan} onAction={handleAlertAction} onDismiss={() => setAlert(null)} />
          </div>
        </AnimatedBlock>
        <AnimatedBlock open={parking.showChecklist}>
          <div className="tariff-top-state"><TariffParkingStatus transition={parking} /></div>
        </AnimatedBlock>
        {receipt ? <div className="tariff-receipt-section"><TariffReceipt receipt={receipt} onClose={closeReceipt} /></div> : <>
        <h1 id={`${id}-tariff-title`} tabIndex={-1}>Настройки тарифа</h1>
        <Surface appearance="card" elevation="card" padding="none" data-parking={parkingPlan || undefined} className="tariff-overview tariff-card hosting-reveal">
          <div className="tariff-overview-cell">
            <div><p>Тариф</p><strong>{plan}</strong><p>{parkingPlan ? 'Бесплатно, период не выбирается' : hostingPlan
              ? `${appliedPeriod === 'year' ? 'годовая' : 'помесячная'} оплата, ${currentPackage ? `с пакетом «${currentPackage.title}»` : 'без пакета'}`
              : 'Помесячно. Оплачено до 12.01.2027'}</p></div>
            {hostingPlan && <SharedButton variant={plansOpen ? 'neutral' : 'primary'} disabled={parking.locked}
              aria-expanded={plansOpen} aria-controls={inlinePlans ? `${id}-plans` : undefined} aria-haspopup={!inlinePlans ? 'dialog' : undefined}
              aria-label={plansOpen ? 'Закрыть выбор тарифа' : 'Сменить тариф'}
              onClick={() => setPlansOpen(value => !value)}>{plansOpen ? 'Закрыть' : compact ? 'Сменить' : 'Сменить тариф'}</SharedButton>}
            {!hostingPlan && !parkingPlan && <SharedButton variant="neutral" aria-expanded={periodOpen} aria-controls={`${id}-period`}
              onClick={() => setPeriodOpen(value => !value)}>{periodOpen ? 'Закрыть' : 'Изменить период'}</SharedButton>}
          </div>
          {hostingPlan ? <>
            <TariffUsage className="tariff-usage tariff-overview-cell" tariffCpu={unpaid && !compact ? 430 : 0} />
            <div className="tariff-overview-cell">
              <div><p>Оплачен до</p><strong>{unpaid ? 'Не оплачено' : appliedPeriod === 'year' ? '10 января 2028' : '12 сентября'}</strong>
                <p>{unpaid ? compact ? 'до 12 декабря' : 'Тестовый период до 12 декабря' : appliedPeriod === 'month' ? 'Это ещё 16 дней' : null}</p></div>
              <SharedButton variant="neutral" disabled={parking.locked} aria-expanded={periodOpen} aria-controls={`${id}-period`}
                aria-label={periodOpen ? 'Закрыть выбор периода' : 'Изменить период'}
                onClick={() => setPeriodOpen(value => !value)}>{periodOpen ? 'Закрыть' : 'Изменить период'}</SharedButton>
            </div>
          </> : <>
            <div className="tariff-overview-cell"><div><p>{parkingPlan ? 'Домены' : 'Ящики и домены'}</p><strong>{parkingPlan ? 'Нет' : 'Без ограничений'}</strong>
              {parkingPlan && <p>Оплачивается отдельно, тариф на это не влияет</p>}</div></div>
            <div className="tariff-overview-cell"><div><p>Абонентская плата</p><strong>{rubles(planPrice(plan))}</strong>
              <p>{parkingPlan ? 'в месяц' : 'в месяц за 10 ГБ почты'}</p></div></div>
          </>}
        </Surface>
        <AnimatedBlock open={periodOpen && !parkingPlan}>
          <div id={`${id}-period`} className="tariff-inline-options"><TariffPeriodOptions value={period} onChange={selectPeriod} /></div>
        </AnimatedBlock>
        {inlinePlans && <AnimatedBlock open={!hostingPlan || plansOpen}>
          <div id={`${id}-plans`} className="tariff-inline-options"><TariffPlanOptions {...planOptions} /></div>
        </AnimatedBlock>}
        {compact && <TariffSheet title={hostingPlan ? 'Сменить тариф' : 'Куда можно перейти'} open={plansOpen && tab === 'tariff'} onClose={() => setPlansOpen(false)}>
          <TariffPlanOptions {...planOptions} inDialog />
        </TariffSheet>}
        <AnimatedBlock open={hostingPlan && !checklistOnly && appliedPeriod === 'month'}>
          <AnnualPaymentOffer disabled={parking.locked} onClick={() => { setPeriod('year'); setPeriodOpen(true) }} />
        </AnimatedBlock>
        <AnimatedBlock open={hostingPlan && !checklistOnly}>
        <section className="tariff-section hosting-reveal">
          <h2>Ресурсы <Badge className="tariff-badge" tone="success">{selectedPackage ? `−${selectedPackage.discount} % по пакету «${selectedPackage.title}»` : '−20 % по пакету «Плюс»'}</Badge></h2>
          <Surface as="ul" appearance="card" elevation="card" padding="none" className="tariff-card tariff-resources">
            {resources.map(resource => <ResourceRow key={resource.id} disabled={parking.locked} resource={resource} quantity={quantities[resource.id]} packageId={packageId} onAdjust={changeQuantity} onInfo={setDialog} />)}
          </Surface>
        </section>

        </AnimatedBlock>
        {tab === 'tariff' && !parking.locked && renderChanges()}
        </>}
        {renderFaq()}
      </div>
      <div className="tariff-panel" role="tabpanel" id={`${id}-services-panel`} aria-labelledby={`${id}-services`} hidden={tab !== 'services'}>
        <TariffServices compact={compact}
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
      {tab === 'tariff' && <TariffParkingDialogs transition={parking} compact={compact} />}
      {leaveOpen && <LeaveCheckoutDialog title="Прервать настройку тарифа?" description="Выбранные параметры не сохранятся"
        checkoutLabel="Вернуться к настройке тарифа" leaveLabel="Прервать настройку тарифа"
        onClose={action => {
          setLeaveOpen(false)
          if (action === 'leave') resetChanges()
          if (action === 'checkout' && review.current) requestAnimationFrame(() => scrollToReview(review.current, true))
        }} />}
      <Dialog open={receiptOpen} title="Демо-квитанция сформирована" description={`Сумма к оплате — ${rubles(total)}.`}
        onClose={() => setReceiptOpen(false)} actions={<SharedButton onClick={() => { setReceiptOpen(false); confirmPayment() }}>Имитировать оплату</SharedButton>} />
      {transferPlan && <Dialog
        open={showTransferDialog}
        title="Для смены тарифа обратитесь в поддержку"
        description={`Чтобы перейти на тариф «${transferPlan}», нужно перенести аккаунт на другой сервер. На нём защита от DDoS недоступна. Обратитесь в поддержку, чтобы согласовать переход.`}
        illustration={<img src={transferIllustration} alt="" />}
        onClose={() => setShowTransferDialog(false)}
        actions={<SharedButton as="a" href="https://timeweb.com/ru/contacts/" target="_blank" rel="noopener noreferrer"
          onClick={() => setShowTransferDialog(false)}>Обратиться в поддержку</SharedButton>}
      />}
    </div>
  )
}
