import { useId, useState } from 'react'
import PlanChanges from './PlanChanges.jsx'
import { getPaymentGroup, paymentActions } from './plan-payment-options.js'
import { networkProtectionMonthlyRate } from './network-protection-states.js'
import { addPlusAction, plusPackage, priceWithPlus, rubles } from './plan-preview-pricing.js'

const applyChanges = { id: 'apply', label: 'Применить изменения', icon: 'apply' }
const disableService = { id: 'disable', label: 'Отключить', icon: 'disable', tone: 'danger' }
const protectionMonth = { id: 'protection', title: 'Сетевая защита', description: 'Подключение аккаунта на месяц', amount: networkProtectionMonthlyRate }
const protectionWithPlus = priceWithPlus(networkProtectionMonthlyRate)

const plusAdded = {
  items: [
    { ...protectionMonth, amount: protectionWithPlus, previous: protectionMonth.amount, discountRequires: 'plus' },
    plusPackage,
  ],
  notices: [{ id: 'plus-included', tone: 'success', icon: 'success', title: 'Скидка по пакету Плюс −20 %', description: 'Скидка на сетевую защиту уже учтена в цене.', requires: ['protection', 'plus'] }],
  payment: 'saved',
}

const hostingRenewal = [{ id: 'hosting', title: 'Хостинг Optimo', description: 'Продление на месяц', amount: 1595 }]

export const planChangeScenarios = [
  {
    id: 'one-service', title: 'Одна услуга',
    items: [{ id: 'ssl', title: 'SSL-сертификат', description: 'Продление для магазина на год', amount: 990 }],
    payment: 'new',
  },
  {
    id: 'long-list', title: 'Длинный список услуг',
    items: [
      { id: 'hosting', title: 'Хостинг Optimo', description: 'Продление на 3 месяца', amount: 4785 },
      protectionMonth,
      { id: 'backup', title: 'Резервное копирование', description: 'Хранение копий в течение 30 дней', amount: 400 },
      { id: 'mail', title: 'Почтовый тариф', description: '10 дополнительных ящиков', amount: 350 },
      { id: 'domain', title: 'Домен магазина', description: 'Продление регистрации на год', amount: 850 },
      { id: 'ssl', title: 'SSL-сертификат', description: 'Продление на год', amount: 990 },
      { id: 'storage', title: 'Дополнительное место на диске', description: '10 ГБ на месяц', amount: 250 },
      { id: 'database', title: 'Дополнительная база данных', description: 'Подключение на месяц', amount: 120 },
    ],
    payment: 'saved',
  },
  {
    id: 'plus-available', title: 'Пакет Плюс не добавлен',
    items: [protectionMonth],
    notices: [{
      id: 'plus-offer', tone: 'info', icon: 'discount',
      title: `С пакетом Плюс сетевая защита стоит ${rubles(protectionWithPlus)} вместо ${rubles(protectionMonth.amount)}`,
      description: `Скидка 20 % на сетевую защиту. Пакет стоит ${rubles(plusPackage.amount)} в месяц.`,
      action: addPlusAction,
    }],
    payment: 'saved',
  },
  { id: 'plus-added', title: 'Пакет Плюс добавлен', ...plusAdded },
  { id: 'saved-card', title: 'Есть сохранённая карта', items: hostingRenewal, payment: 'saved' },
  { id: 'new-card', title: 'Нет сохранённых карт', items: hostingRenewal, payment: 'new' },
  {
    id: 'refund', title: 'Возврат на баланс',
    items: [{ id: 'storage', title: 'Дополнительное место на диске', description: 'Уменьшение с 60 до 40 ГБ. Возврат за оставшиеся дни.', amount: 360 }],
    totalLabel: 'Возврат на баланс',
    action: applyChanges,
    credit: true,
  },
  {
    id: 'no-charge', title: 'Доплачивать не нужно',
    items: [{ id: 'backup', title: 'Резервное копирование', description: 'Перенос ежедневного копирования с 02:00 на 04:00', amount: 0 }],
    totalLabel: 'Доплачивать не нужно',
    action: applyChanges,
  },
  {
    id: 'disable', title: 'Отключение услуги',
    items: [{ id: 'protection', title: 'Сетевая защита', description: 'Отключение для example.ru', amount: 0 }],
    notices: [{
      id: 'protection-warning', tone: 'warning', icon: 'alert',
      description: 'После отключения трафик домена перестанет проходить через фильтры DDoS-Guard.',
    }],
    totalLabel: 'Доплачивать не нужно',
    action: disableService,
  },
  {
    id: 'bonuses', title: 'Часть суммы покрывают бонусы',
    items: [
      { id: 'domain', title: 'Домен магазина', description: 'Продление регистрации на год', amount: 850 },
      { id: 'storage', title: 'Дополнительное место на диске', description: '10 ГБ на месяц', amount: 250 },
    ],
    bonus: 300,
    payment: 'saved',
  },
  {
    id: 'invoice', title: 'Оплата по счёту для компании',
    items: [{ id: 'hosting', title: 'Хостинг Optimo', description: 'Годовое продление для сайта компании', amount: 9480 }],
    payment: 'new',
    initialMethod: 'invoice',
  },
  {
    id: 'payment-error', title: 'Ошибка оплаты',
    items: hostingRenewal,
    payment: 'new',
    simulatePaymentFailure: true,
  },
]

export function ScenarioExample({ scenario }) {
  const heading = useId()
  const [hasPlus, setHasPlus] = useState(false)
  const [removed, setRemoved] = useState(() => new Set())
  const [useBonus, setUseBonus] = useState(true)
  const [hasSavedCard, setHasSavedCard] = useState(scenario.payment === 'saved')
  const [method, setMethod] = useState(scenario.initialMethod ?? (scenario.payment === 'saved' ? 'saved-card' : 'bank'))
  const [feedback, setFeedback] = useState('')
  const data = hasPlus ? plusAdded : scenario
  const items = data.items.map(item => (
    removed.has(item.discountRequires) ? { ...item, amount: item.previous, previous: undefined } : item
  ))
  const remaining = items.filter(item => !removed.has(item.id))
  const subtotal = remaining.reduce((sum, item) => sum + item.amount, 0)
  const bonus = Math.min(subtotal, data.bonus ?? 0)
  const total = subtotal - (useBonus ? bonus : 0)
  const showPayment = data.payment && total > 0
  const paymentGroup = getPaymentGroup(method, hasSavedCard)
  const action = remaining.length ? (showPayment ? paymentActions[paymentGroup.value] : data.action ?? applyChanges) : null
  const totalLabel = remaining.length ? data.totalLabel ?? (showPayment ? 'К оплате' : 'Доплачивать не нужно') : 'Доплачивать не нужно'
  const notices = remaining.length ? data.notices?.filter(notice => notice.requires?.every(id => !removed.has(id)) ?? true) : []

  function update(group, id, patch) {
    setFeedback('')
    if (group === 'items') {
      setRemoved(current => {
        const next = new Set(current)
        if (patch.removed) next.add(id)
        else next.delete(id)
        return next
      })
    } else if (group === 'adjustments') setUseBonus(patch.checked)
    else if (group === 'paymentGroups') setMethod(patch.value)
  }

  function performAction(entry) {
    if (entry.id === 'add-plus') {
      setHasPlus(true)
      setFeedback('Пакет Плюс добавлен в примере.')
      return
    }
    if (entry.id === 'unlink-payment-method') {
      setHasSavedCard(false)
      setFeedback('Карта отвязана в примере.')
      return
    }
    setFeedback(entry.demoPayment ? '' : `Выбрано демо-действие «${entry.label}».`)
  }

  return (
    <article className="plan-preview-scenario" aria-labelledby={heading}>
      <h3 id={heading}>{scenario.title}</h3>
      <PlanChanges
        label={null}
        items={items.map(item => ({
          ...item,
          removable: true,
          removed: removed.has(item.id),
          amount: `${data.credit ? '− ' : ''}${rubles(item.amount)}`,
          previous: item.previous === undefined ? undefined : rubles(item.previous),
          credit: data.credit,
        }))}
        notices={notices}
        adjustments={bonus ? [{ id: 'bonus', label: 'Списать бонусы', amount: `− ${rubles(bonus)}`, checked: useBonus }] : []}
        totals={[{ label: totalLabel, amount: rubles(total) }]}
        paymentGroups={showPayment ? [paymentGroup] : []}
        actions={action ? [action] : []}
        simulatePaymentFailure={data.simulatePaymentFailure}
        onChange={update}
        onAction={performAction}
      />
      <div role="status">{feedback && <p className="plan-demo-feedback">{feedback}</p>}</div>
    </article>
  )
}

export default function PlanChangesScenarios() {
  const heading = useId()
  return (
    <section className="plan-preview-scenarios" aria-labelledby={heading}>
      <h2 id={heading}>Примеры сценариев</h2>
      {planChangeScenarios.map(scenario => <ScenarioExample key={scenario.id} scenario={scenario} />)}
    </section>
  )
}
