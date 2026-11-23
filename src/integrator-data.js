export const integratorSection = 'Мои клиенты'
export const integratorSettings = 'Настройки интегратора'
export const integratorKnowledge = 'База знаний интегратора'
export const integratorSupport = 'Поддержка интегратора'
export const integratorNews = 'Новости для интеграторов'

export const integratorPages = {
  program: integratorSection,
  operations: 'Операции',
  documents: 'Документы',
  details: 'Реквизиты и выплаты',
  notifications: 'Уведомления',
  settings: integratorSettings,
  knowledge: integratorKnowledge,
  support: integratorSupport,
  news: integratorNews,
}

export const integratorProgramSections = [
  integratorSection, integratorPages.operations, integratorPages.documents, integratorPages.details, integratorPages.notifications,
]

export const integratorSettingsTabs = [
  { id: 'account', label: 'Аккаунт' },
  { id: 'users', label: 'Пользователи' },
  { id: 'security', label: 'Доступ и безопасность' },
  { id: 'history', label: 'История действий' },
]

export const integratorStates = [
  { id: 'integrator-low-balance', label: 'Мало денег · 1 200 ₽', requiresPreset: true },
  { id: 'integrator-former-partner', label: 'Бывший партнёр', requiresPreset: true },
  { id: 'integrator-new', label: 'Новый без клиентов', requiresPreset: true },
]

export const organization = 'ООО «Веб-студия Урал»'
export const defaultBalance = 48600
const dayMs = 86400000
const demoDate = Date.now()
export const demoClients = [
  ['vostok-auto', 'Восток Авто', 'Year', 10.4, 3210],
  ['cafe-lagom', 'Кафе Lagom', 'Optimo', 12.5, 96, true],
  ['stomat-plus', 'Стомат Плюс', 'Century', 21.9, 6870, true],
  ['bm-stroy', 'БМ Строй', 'Year', 10.4, 1240],
  ['yurist-ekb', 'Юрист ЕКБ', 'Optimo', 12.5, 55],
  ['detsad-zvezda', 'Детсад Звезда', 'Optimo', 12.5, 2410],
  ['flowers-66', 'Цветы 66', 'Optimo', 12.5, 330],
  ['avtoshkola-1', 'Автошкола № 1', 'Year', 10.4, 2980],
  ['tehno-sklad', 'Техносклад', 'Century', 21.9, 4150, true],
  ['fitness-atom', 'Фитнес Атом', 'Optimo', 12.5, 140],
  ['nail-studio', 'Студия маникюра', 'Optimo', 12.5, 1870],
  ['ural-gaz', 'Уралгаз', 'Year', 10.4, 3790, true],
  ['kvartal-24', 'Квартал 24', 'Optimo+', 15.8, 920],
  ['okna-profi', 'Окна Профи', 'Year', 10.4, 2250],
  ['hostel-center', 'Хостел Центр', 'Optimo', 12.5, 610],
  ['zoo-magazin', 'Зоомагазин', 'Optimo+', 15.8, 3480],
  ['bani-ural', 'Бани Урал', 'Year', 10.4, 74],
  ['print-center', 'Принт Центр', 'Optimo', 12.5, 1520],
  ['info-mail', 'Инфо Почта', 'Почтовый', 6.2, 450, false, 18],
  ['mebel-art', 'Мебель Арт', 'Century', 21.9, 0, false, 11],
  ['psiholog-ann', 'Психолог Анна', 'Optimo', 12.5, 0, false, 5],
].map(([id, name, tariff, rate, balance, automatic = false, ageInDays = 90]) => ({
  id, name, tariff, rate, balance, automatic, billingPeriod: tariff === 'Year' ? 'year' : 'month',
  createdAt: demoDate - ageInDays * dayMs,
}))

export function countRecentClients(clients, now = Date.now()) {
  return clients.filter(client => client.createdAt >= now - 30 * dayMs && client.createdAt <= now).length
}

export const demoOperations = [
  { id: 'auto', date: '2026-09-27', type: 'Автопополнение', description: 'Автопополнение для 4 клиентов', amount: -640 },
  { id: 'transfer', date: '2026-09-25', type: 'Перевод клиентам', description: 'Перевод vostok-auto на год', amount: -3800 },
  { id: 'bonus', date: '2026-09-20', type: 'Премия', description: 'Премия 40 % за пополнение', amount: 12000 },
  { id: 'deposit', date: '2026-09-20', type: 'Пополнение', description: 'Оплата счёта № 4418820', amount: 30000 },
]

export const demoDocuments = [
  { id: 'invoice', date: '2026-09-20', title: 'Счёт № 4418820', amount: 30000, status: 'Оплачен' },
  { id: 'act', date: '2026-09-20', title: 'Акт № 1190332', amount: 30000, status: 'Подписан' },
  { id: 'invoice-august', date: '2026-08-28', title: 'Счёт № 4392718', amount: 15000, status: 'Оплачен' },
]

const rubles = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 })
const dayWords = { one: 'день', few: 'дня', many: 'дней', other: 'дня' }
const plurals = new Intl.PluralRules('ru-RU')

export const money = amount => rubles.format(amount)
export const daysLabel = days => `${days} ${dayWords[plurals.select(days)]}`
export const daysLeft = (client, added = 0) => Math.floor((client.balance + added) / client.rate)
export const dateLabel = date => date.split('-').reverse().join('.')

export function getIntegratorDemo(state) {
  if (state === 'integrator-new') return { balance: 0, clients: [], operations: [], documents: [] }
  return {
    balance: state === 'integrator-low-balance' ? 1200 : defaultBalance,
    clients: demoClients,
    operations: demoOperations,
    documents: demoDocuments,
  }
}
