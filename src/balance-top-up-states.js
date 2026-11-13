import { savedCard, savedSbp } from './plan-payment-options.js'

const secondCard = {
  ...savedCard,
  id: 'saved-card-3299',
  label: '**** 3299',
  listLabel: 'Карта •••• 3299',
  unlinkLabel: 'Отвязать карту •••• 3299',
}

export const topUpStates = [
  { id: 'top-up-quarter', label: 'Пополнение за 3 месяца', amount: 1578 },
  { id: 'top-up-year', label: 'Пополнение за 1 год', amount: 6120 },
  { id: 'top-up-saved-card', label: 'Сохранённая карта', amount: 6120, saved: [savedCard] },
  { id: 'top-up-saved-menu', label: 'Открытый список способов оплаты', amount: 6120, saved: [savedCard, savedSbp], methodsOpen: true },
  { id: 'top-up-annual-plan', label: 'Пополнение для годового тарифа', amount: 1578, saved: [savedCard], annualPlan: true, requiresPreset: true },
  { id: 'top-up-yoomoney', label: 'Выбран ЮMoney', amount: 6120, saved: [savedCard, secondCard], method: 'yoomoney' },
]

const amountFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })

export function formatTopUpAmount(amount) {
  return amountFormat.format(amount)
}
