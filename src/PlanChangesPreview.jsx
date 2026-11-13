import { useId, useRef, useState } from 'react'
import { TabIndicator } from './hosting-motion.jsx'
import { usePendingChanges } from './pending-changes.jsx'
import { revealProtectionCheckout } from './SitesProtectionUI.jsx'
import PlanChanges from './PlanChanges.jsx'
import PlanChangesScenarios, { ScenarioExample } from './PlanChangesScenarios.jsx'
import { networkProtectionMonthlyRate } from './network-protection-states.js'
import { addPlusAction, plusPackage, priceWithPlus, rubles } from './plan-preview-pricing.js'
import {
  canSaveCard, getPaymentGroup, paymentActions, renewalOption,
  saveCardOption, securePaymentNote,
} from './plan-payment-options.js'

const adjustmentAmounts = { bonus: 300, balance: 420 }
const sufficientBalance = 5000
const balanceMethod = {
  id: 'balance', icon: 'pay-balance', tone: 'pink', label: 'Списать с баланса',
  hint: `Доступно ${rubles(sufficientBalance)}`,
}
const payFromBalance = { id: 'pay-balance', label: 'Списать с баланса', icon: 'pay-balance', demoPayment: true }

function withBalancePayment(group) {
  return {
    ...group,
    options: [
      balanceMethod,
      ...group.options.map(option => option.choices ? { ...option, wide: true } : option),
    ],
  }
}

const unsavedPaymentGroup = getPaymentGroup('bank', false)
const balancePaymentGroup = {
  ...withBalancePayment(unsavedPaymentGroup),
  id: 'sufficient-balance',
  label: 'Способы оплаты',
  value: balanceMethod.id,
}

const example = {
  items: [
    {
      id: 'fixed', title: 'Заголовок', accessibleName: 'услугу со сроком оплаты', description: 'Описание', amount: '420 ₽', removable: true,
      term: {
        value: 1, hint: 'Описание',
        options: [{ value: 1, label: '1 мес.' }, { value: 3, label: '3 мес.' }, { value: 6, label: '6 мес.' }, { value: 12, label: 'год' }],
      },
      addons: [
        { id: 'addon-1', title: 'Дополнительная услуга', amount: '200 ₽' },
        { id: 'addon-2', title: 'Дополнительная услуга', amount: '200 ₽' },
      ],
    },
    {
      id: 'months', title: 'Заголовок', accessibleName: 'услугу с помесячной оплатой', description: 'Описание', amount: '5 990 ₽',
      removable: true, term: { value: 10, min: 1, max: 36, hint: 'Описание' },
    },
    { id: 'detail', title: 'Заголовок', accessibleName: 'услугу с описанием', description: 'Описание', detail: 'Описание', removable: true },
    { id: 'sale', title: 'Заголовок', accessibleName: 'услугу со скидкой', description: 'Описание', previous: '500 ₽', amount: '420 ₽', removable: true },
    { id: 'removed', title: 'Заголовок', description: 'Описание', removable: true, removed: true },
    { id: 'charge', title: 'Заголовок', amount: '420 ₽' },
    { id: 'credit', title: 'Заголовок', amount: '− 420 ₽', credit: true },
  ],
  nextCharge: { label: 'Дальше', amount: '949 ₽ в месяц' },
  notices: [
    {
      id: 'plus', tone: 'info', icon: 'discount',
      title: 'С пакетом Плюс это стоило бы 340 ₽ вместо 420 ₽',
      description: 'Скидка 20 % на ресурсы и настройка SSL-сертификата',
      action: addPlusAction,
    },
    { id: 'discount', tone: 'success', icon: 'success', title: 'Скидка по пакету Плюс −20 %', description: 'Уже в цене' },
    {
      id: 'disable', tone: 'warning', icon: 'alert',
      description: 'Защита снимется со всех сайтов сразу. За месяцы, оплаченные вперёд, вернём 1 198 ₽ на баланс.',
    },
  ],
  renewalOptions: [renewalOption(false, 'renew-off'), renewalOption(true, 'renew-on')],
  adjustments: [
    { id: 'bonus', label: 'Списать бонусы', amount: `− ${rubles(adjustmentAmounts.bonus)}`, checked: true },
    { id: 'balance', label: 'Списать с баланса', amount: rubles(adjustmentAmounts.balance), checked: false },
  ],
  totals: [
    { label: 'К оплате', amount: '2 295 ₽' },
    { label: 'Возврат на баланс', amount: '1 100 ₽' },
  ],
  paymentGroups: [
    {
      ...unsavedPaymentGroup, id: 'methods', accessibleName: 'Основные способы оплаты',
    },
    {
      ...getPaymentGroup('saved-card', true, true), id: 'saved', accessibleName: 'Сохранённые способы оплаты',
    },
    balancePaymentGroup,
  ],
  saveOptions: [saveCardOption(true, 'save-on'), saveCardOption(false, 'save-off')],
  actions: [
    paymentActions['saved-card'],
    paymentActions.yoomoney,
    payFromBalance,
    { id: 'apply', label: 'Применить изменения', icon: 'apply' },
    { id: 'disable', label: 'Отключить', icon: 'disable', tone: 'danger' },
    { id: 'ask-partner', label: 'Попросить партнёра оплатить', icon: 'ask-partner' },
  ],
  actionDescription: 'Описание под кнопкой, например до конца месяца нужно доплатить 120 ₽, далее 3 196 ₽ в месяц',
  paymentNote: securePaymentNote,
}

function usePreviewExample() {
  const [preview, setPreview] = useState(example)

  function update(group, id, patch) {
    setPreview(current => ({
      ...current,
      [group]: current[group].map(entry => entry.id === id ? { ...entry, ...patch } : entry),
    }))
  }

  return [preview, update, () => setPreview(example)]
}

function FullPreview({ current = false }) {
  const [preview, update] = usePreviewExample()
  const [action, setAction] = useState('')
  const items = current
    ? preview.items.map(item => item.id === 'months' ? { ...item, term: undefined } : item)
    : preview.items
  const adjustments = current ? preview.adjustments.filter(entry => entry.id !== 'balance') : preview.adjustments
  const paymentGroups = current
    ? preview.paymentGroups.filter(group => group.id !== balancePaymentGroup.id)
    : preview.paymentGroups
  const actions = current
    ? preview.actions.filter(entry => entry.id !== 'ask-partner' && entry.id !== 'pay-balance')
    : preview.actions

  function performAction(entry) {
    if (entry.id === 'unlink-payment-method') {
      const group = preview.paymentGroups.find(group => group.id === 'saved')
      const remaining = group.options.find(option => option.choices).choices.filter(choice => choice.id !== entry.method)
      const { value, options } = getPaymentGroup(
        group.value,
        remaining.some(choice => choice.id === 'saved-card'),
        remaining.some(choice => choice.id === 'saved-sbp'),
      )
      update('paymentGroups', group.id, { value, options })
    }
    setAction(entry.demoPayment ? '' : entry.label)
  }

  return (
    <>
      <PlanChanges {...preview} items={items} adjustments={adjustments} paymentGroups={paymentGroups} actions={actions}
        onChange={update} onAction={performAction} />
      <div role="status">{action && <p className="plan-demo-feedback">Выбрано действие «{action}».</p>}</div>
    </>
  )
}

const protection = { id: 'protection', title: 'Сетевая защита', description: 'Продление на 2 месяца', amount: networkProtectionMonthlyRate * 2 }
const protectionWithPlus = { ...protection, previous: protection.amount, amount: priceWithPlus(protection.amount) }

function DynamicPreview({ startsWithSavedCard, balance, showDynamic }) {
  const [preview, updateExample, resetExample] = usePreviewExample()
  const [hasPlus, setHasPlus] = useState(false)
  const [renew, setRenew] = useState(true)
  const [save, setSave] = useState(true)
  const [hasSavedCard, setHasSavedCard] = useState(startsWithSavedCard)
  const [hasSavedSbp, setHasSavedSbp] = useState(startsWithSavedCard)
  const [method, setMethod] = useState(balance ? balanceMethod.id : startsWithSavedCard ? 'saved-card' : 'bank')
  const [feedback, setFeedback] = useState('')
  const [hasPendingEdits, setHasPendingEdits] = useState(false)
  const checkout = useRef(null)
  usePendingChanges(hasPendingEdits, {
    title: 'Прервать оплату?',
    description: 'Выбранные параметры оплаты и изменения заказа будут сброшены.',
    revealCheckout: () => {
      showDynamic()
      requestAnimationFrame(() => revealProtectionCheckout(checkout.current))
    },
  }, discardChanges)
  const items = [
    { id: 'hosting', title: 'Хостинг Optimo', amount: 1595 },
    hasPlus ? protectionWithPlus : protection,
    { id: 'backups', title: 'Резервное копирование', amount: 400 },
  ]
  if (hasPlus) items.push({ ...plusPackage, removable: true })

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const bonus = preview.adjustments.find(option => option.id === 'bonus').checked ? adjustmentAmounts.bonus : 0
  const canPayFromBalance = balance >= subtotal - bonus
  const adjustments = canPayFromBalance ? preview.adjustments.filter(option => option.id !== 'balance') : preview.adjustments
  const deductions = adjustments.reduce((sum, option) => sum + (option.checked ? adjustmentAmounts[option.id] : 0), 0)
  const standardPaymentGroup = getPaymentGroup(method, hasSavedCard, hasSavedSbp)
  const paymentGroup = canPayFromBalance
    ? withBalancePayment({ ...standardPaymentGroup, value: method === balanceMethod.id ? method : standardPaymentGroup.value })
    : standardPaymentGroup
  const showSaveOption = canSaveCard(paymentGroup.value) || paymentGroup.value === 'sbp'
  const paymentAction = paymentGroup.value === balanceMethod.id ? payFromBalance : paymentActions[paymentGroup.value]
  const notice = hasPlus
    ? preview.notices.find(entry => entry.id === 'discount')
    : {
      ...preview.notices.find(entry => entry.id === 'plus'),
      title: `С пакетом Плюс сетевая защита стоит ${rubles(protectionWithPlus.amount)} вместо ${rubles(protection.amount)}`,
    }

  function discardChanges() {
    resetExample()
    setHasPlus(false)
    setRenew(true)
    setSave(true)
    setMethod(canPayFromBalance ? balanceMethod.id : hasSavedCard ? 'saved-card' : hasSavedSbp ? 'saved-sbp' : 'bank')
    setFeedback('')
    setHasPendingEdits(false)
  }

  function update(group, id, patch) {
    setFeedback('')
    setHasPendingEdits(true)
    if (group === 'items' && id === plusPackage.id) setHasPlus(!patch.removed)
    else if (group === 'renewalOptions') setRenew(patch.checked)
    else if (group === 'saveOptions') setSave(patch.checked)
    else if (group === 'paymentGroups') setMethod(patch.value)
    else updateExample(group, id, patch)
  }

  function performAction(action) {
    if (action.id === 'add-plus') {
      setHasPlus(true)
      setHasPendingEdits(true)
      setFeedback('Пакет Плюс добавлен в демо.')
    } else if (action.id === 'unlink-payment-method') {
      const keepCard = hasSavedCard && action.method !== 'saved-card'
      const keepSbp = hasSavedSbp && action.method !== 'saved-sbp'
      setHasSavedCard(keepCard)
      setHasSavedSbp(keepSbp)
      setMethod(getPaymentGroup(method, keepCard, keepSbp).value)
      setFeedback(action.method === 'saved-card' ? 'Карта отвязана в демо.' : 'СБП отвязан в демо.')
    } else if (action.demoPayment) {
      setHasPendingEdits(false)
      if (showSaveOption && save) {
        if (paymentGroup.value === 'sbp') {
          setHasSavedSbp(true)
          setMethod('saved-sbp')
        } else {
          setHasSavedCard(true)
          setMethod('saved-card')
        }
      }
      setFeedback('')
    } else {
      setFeedback(`Выбрано действие «${action.label}».`)
    }
  }

  return (
    <div ref={checkout} className="plan-preview-checkout" tabIndex={-1}>
      <PlanChanges
        heading={{}}
        onDiscard={hasPendingEdits ? () => {
          discardChanges()
          checkout.current?.focus({ preventScroll: true })
        } : undefined}
        items={items.map(item => ({
          ...item,
          amount: rubles(item.amount),
          previous: item.previous === undefined ? undefined : rubles(item.previous),
        }))}
        nextCharge={preview.nextCharge}
        notices={[notice]}
        renewalOptions={[renewalOption(renew)]}
        adjustments={adjustments}
        totals={[{ ...preview.totals[0], amount: rubles(subtotal - deductions) }]}
        paymentGroups={[paymentGroup]}
        saveOptions={showSaveOption ? [saveCardOption(save)] : []}
        actions={[paymentAction]}
        paymentNote={preview.paymentNote}
        onChange={update}
        onAction={performAction}
      />
      <div role="status">{feedback && <p className="plan-demo-feedback">{feedback}</p>}</div>
    </div>
  )
}

const modes = [
  { id: 'dynamic', label: 'Динамический' },
  { id: 'full', label: 'Полный' },
  { id: 'current', label: 'Текущий' },
]

export default function PlanChangesPreview({ startsWithSavedCard = false, startsWithSufficientBalance = false, scenario }) {
  const id = useId()
  const tabs = useRef(null)
  const [mode, setMode] = useState('dynamic')

  function moveFocus(event) {
    const index = modes.findIndex(tab => tab.id === mode)
    const nextIndex = {
      ArrowLeft: (index + modes.length - 1) % modes.length,
      ArrowRight: (index + 1) % modes.length,
      Home: 0,
      End: modes.length - 1,
    }[event.key]
    if (nextIndex === undefined) return
    event.preventDefault()
    const next = modes[nextIndex].id
    setMode(next)
    tabs.current?.querySelector(`[aria-controls="${id}-${next}"]`)?.focus()
  }

  return (
    <div className="plan-changes-preview hosting-reveal">
      <div ref={tabs} className="plan-preview-tabs hosting-indicator-track" role="tablist" aria-label="Режим просмотра" onKeyDown={moveFocus}>
        <TabIndicator selected={mode} />
        {modes.map(tab => (
          <button
            type="button"
            key={tab.id}
            id={`${id}-tab-${tab.id}`}
            role="tab"
            aria-selected={mode === tab.id}
            aria-controls={`${id}-${tab.id}`}
            tabIndex={mode === tab.id ? 0 : -1}
            onClick={() => setMode(tab.id)}
          >{tab.label}</button>
        ))}
      </div>
      {modes.map(tab => (
        <div
          key={tab.id}
          id={`${id}-${tab.id}`}
          className={`plan-preview-panel--${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${tab.id}`}
          tabIndex={0}
          hidden={mode !== tab.id}
        >
          {tab.id !== 'dynamic' ? <FullPreview current={tab.id === 'current'} /> : scenario ? (
            <ScenarioExample scenario={scenario} />
          ) : (
            <>
              <DynamicPreview startsWithSavedCard={startsWithSavedCard} showDynamic={() => setMode('dynamic')}
                balance={startsWithSufficientBalance ? sufficientBalance : adjustmentAmounts.balance} />
              <PlanChangesScenarios />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
