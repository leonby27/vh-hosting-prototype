const bankCard = {
  id: 'bank', icon: 'bank-card', tone: 'blue', label: 'Банковская карта', hint: 'МИР, Visa, Mastercard',
}

export const paymentMethods = [
  bankCard,
  { id: 'sbp', icon: 'sbp', tone: 'sbp', label: 'СБП', hint: 'Через приложение' },
  { id: 'invoice', icon: 'invoice', tone: 'orange', label: 'Счёт для юрлиц', hint: 'Безналичный расчёт' },
  { id: 'foreign', icon: 'foreign-card', tone: 'pink', label: 'Иностранная карта', hint: 'Банк не из России' },
  { id: 'yoomoney', icon: 'yoomoney', label: 'ЮMoney', hint: 'Кошелёк' },
  { id: 'sber', icon: 'sber', tone: 'sber', label: 'Квитанция Сбера', hint: 'Оплата в отделении' },
]

export const savedCard = {
  id: 'saved-card', icon: 'bank-card', tone: 'blue', label: '**** 2663', hint: 'Сохранённая карта',
  listLabel: 'Карта •••• 2663', unlinkLabel: 'Отвязать карту •••• 2663',
}
export const savedSbp = {
  id: 'saved-sbp', icon: 'sbp', tone: 'sbp', label: 'СБП · Т-Банк', hint: 'Сохранённый способ',
  unlinkLabel: 'Отвязать СБП · Т-Банк',
}
export const newCard = { ...bankCard, id: 'new-card', listLabel: 'Другая карта' }
const extraMethods = ['sbp', 'yoomoney', 'sber', 'foreign', 'invoice']
  .map(id => paymentMethods.find(method => method.id === id))

function getSavedPaymentMethods(savedMethods) {
  return [
    savedMethods[0],
    newCard,
    {
      id: 'other', icon: 'more', tone: 'neutral', label: 'Другие способы', hint: 'Выберите тип оплаты', wide: true,
      choices: [...savedMethods, newCard, ...extraMethods],
    },
  ]
}

const payByCard = { id: 'pay-card', icon: 'pay-card', label: 'Оплатить картой', demoPayment: true }

export const paymentActions = {
  'saved-card': { ...payByCard, label: 'Оплатить картой •••• 2663' },
  'saved-sbp': { id: 'sbp', label: 'Оплатить через СБП · Т-Банк', demoPayment: true },
  'new-card': payByCard,
  bank: payByCard,
  sbp: { id: 'sbp', label: 'Оплатить через СБП', demoPayment: true },
  invoice: { id: 'invoice', label: 'Получить счёт' },
  foreign: { id: 'foreign', label: 'Оплатить иностранной картой', demoPayment: true },
  yoomoney: { id: 'yoomoney', label: 'Оплатить ЮMoney', demoPayment: true },
  sber: { id: 'sber', label: 'Получить квитанцию', document: { title: 'Демо-квитанция сформирована', confirm: 'Сформировать квитанцию' } },
}

export function getPaymentGroup(method, hasSavedCard, hasSavedSbp = false, allowedMethods) {
  const savedMethods = [hasSavedCard && savedCard, hasSavedSbp && savedSbp].filter(Boolean)
  const allOptions = savedMethods.length ? getSavedPaymentMethods(savedMethods) : paymentMethods
  const options = allowedMethods
    ? allOptions.flatMap(option => {
      if (!option.choices) return allowedMethods.includes(option.id) ? [option] : []
      const choices = option.choices.filter(choice => allowedMethods.includes(choice.id))
      return choices.length ? [{ ...option, choices }] : []
    })
    : allOptions
  const available = options.some(option => option.id === method || option.choices?.some(choice => choice.id === method))
  return {
    id: 'payment',
    label: 'Способ оплаты',
    value: available ? method : options[0]?.choices?.[0]?.id ?? options[0]?.id,
    options,
  }
}

export function canSaveCard(method) {
  return ['bank', 'new-card', 'foreign'].includes(method)
}

export function renewalOption(checked, id = 'renew') {
  return {
    id,
    label: 'Продлевать автоматически',
    checked,
    warning: !checked,
    hint: checked ? undefined : 'Выбранные сервисы сами не продлятся, если не оплатить их вручную. Включите автопродление.',
  }
}

export function saveCardOption(checked, id = 'save') {
  return {
    id,
    label: 'Сохранить',
    checked,
    warning: !checked,
    hint: checked
      ? 'оплата в один клик и автопродление'
      : 'Без сохранённого способа автопродление спишет деньги только с баланса — пополняйте его заранее.',
  }
}

export const securePaymentNote = {
  desktop: 'Платёж защищён: данные карты принимает платёжный сервис, мы их не храним',
  mobile: 'Платёж защищён — оплата проходит через банк',
}
