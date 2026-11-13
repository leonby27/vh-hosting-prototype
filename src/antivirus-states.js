export const antivirusPlans = {
  treatment: {
    title: 'Лечение',
    rate: 399,
    description: 'Для сайта без CMS: визитка, лендинг, статичные страницы',
    features: [
      ['Еженедельная проверка файлов', 'включая плагины, темы и ядро CMS'],
      ['Автоматическое лечение', 'вырезаем вредоносный код'],
      ['Отчёт по каждой проверке', 'что нашли, вылечили и что пропущено'],
    ],
  },
  protection: {
    title: 'Защита',
    rate: 599,
    description: 'Для сайтов на WordPress, Битрикс и других CMS',
    features: [
      ['Файрвол сайта', 'блокирует SQL-инъекции, XSS и другие атаки'],
      ['Закрываем уязвимости CMS', 'автоматически, не дожидаясь обновления'],
      ['Статистика атак', 'за последние 30 дней'],
    ],
  },
  full: {
    title: 'Полный доступ',
    rate: 799,
    description: 'Для разработчиков и агентств, которые сами правят код сайта',
    features: [
      ['Редактор файлов', 'с подсветкой вредоносного кода'],
      ['Ручное лечение', 'для файлов, которые не вылечились автоматически'],
      ['Список исключений', 'для безопасных файлов'],
    ],
  },
}

export const antivirusStatusLabels = {
  available: 'Не подключён',
  protected: 'Угроз нет',
  threat: 'Найдены угрозы',
  connecting: 'Подключаем',
  missing: 'Файл связи не найден',
}

export const antivirusStates = [
  { id: 'antivirus-selected', label: 'Выбраны 4 сайта' },
  { id: 'antivirus-connected', label: 'Антивирус подключён · угроз нет' },
  { id: 'antivirus-threats', label: 'Обнаружены угрозы · все статусы', requiresPreset: true },
  { id: 'antivirus-no-renewal', label: 'Антивирус подключён · без автопродления' },
  { id: 'antivirus-edit-sites', label: 'Изменение списка сайтов' },
  { id: 'antivirus-upgrade', label: 'Повышение уровня защиты' },
  { id: 'antivirus-downgrade', label: 'Понижение уровня защиты' },
  { id: 'antivirus-no-card', label: 'Оплата без сохранённой карты' },
  { id: 'antivirus-many-sites', label: 'Длинный список · 50 сайтов', requiresPreset: true },
  { id: 'antivirus-no-sites', label: 'На аккаунте нет сайтов', requiresPreset: true },
  { id: 'antivirus-suspicious', label: 'Подозрительная активность', requiresPreset: true },
  { id: 'antivirus-disable', label: 'Подтверждение отключения услуги' },
]

const sites = [
  { name: 'Mywebsite', domains: ['Mywebsite.spb.ru', 'basketball-spb.ru', 'dunkfest.ru', 'basketballzone.ru', 'hoopdreamers.ru', 'hooplife.ru'] },
  { name: 'timeweb', domains: ['timeweb.com'] },
  { name: 'coconote', domains: ['coconote.ru'] },
  { name: 'myreviews', domains: ['myreviews.ru', 'reviews.example', 'shop.reviews.example'] },
  { name: 'longnameexample', domains: ['Testsite.com'] },
]

const manySites = [...sites, ...Array.from({ length: 45 }, (_, index) => {
  const name = `site-${String(index + 6).padStart(2, '0')}`
  return { name, domains: [`${name}.example`] }
})]

const storageKey = 'vh-antivirus'
const selected = ['Mywebsite', 'timeweb', 'coconote', 'longnameexample']
const active = {
  plan: 'protection',
  renew: true,
  statuses: Object.fromEntries(selected.map(name => [name, 'protected'])),
}
const presets = {
  'antivirus-selected': { selected },
  'antivirus-connected': active,
  'antivirus-threats': {
    ...active,
    statuses: { Mywebsite: 'connecting', timeweb: 'missing', coconote: 'threat', longnameexample: 'protected' },
  },
  'antivirus-no-renewal': { ...active, renew: false },
  'antivirus-edit-sites': { ...active, mode: 'sites', selected: ['Mywebsite', 'coconote', 'myreviews', 'longnameexample'] },
  'antivirus-upgrade': { ...active, mode: 'plan', draftPlan: 'full' },
  'antivirus-downgrade': { ...active, mode: 'plan', draftPlan: 'treatment' },
  'antivirus-no-card': { selected, hasSavedCard: false },
  'antivirus-many-sites': { ...active, sites: manySites, mode: 'sites', selected },
  'antivirus-no-sites': { sites: [] },
  'antivirus-suspicious': { suspicious: true },
  'antivirus-disable': { ...active, dialog: 'disable' },
}

function readSavedAntivirus() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey))
    if (!saved) return null

    const siteList = saved.many ? manySites : sites
    const statuses = Object.fromEntries(siteList.map(({ name }) => [name, saved.statuses?.[name]])
      .filter(([, status]) => status && status !== 'available' && Object.hasOwn(antivirusStatusLabels, status)))
    if (!Object.hasOwn(antivirusPlans, saved.plan) || !Number.isFinite(saved.paidThrough) || !Object.keys(statuses).length) {
      return { hasSavedCard: saved.hasSavedCard !== false }
    }

    const nextPlan = Object.hasOwn(antivirusPlans, saved.nextPlan?.id) && Number.isFinite(saved.nextPlan.startsAt)
      ? saved.nextPlan
      : null
    const useNextPlan = nextPlan && nextPlan.startsAt <= Date.now()
    return {
      sites: siteList,
      plan: useNextPlan ? nextPlan.id : saved.plan,
      statuses,
      renew: saved.renew === true,
      nextPlan: useNextPlan ? null : nextPlan,
      hasSavedCard: saved.hasSavedCard !== false,
      paidThrough: saved.paidThrough,
    }
  } catch {
    return null
  }
}

export function getAntivirusPreset(id) {
  const preset = id === null ? readSavedAntivirus() : presets[id]
  return { sites, statuses: {}, selected: [], plan: null, nextPlan: null, renew: false, hasSavedCard: true, ...preset }
}

export function saveAntivirus({ sites, statuses, plan, nextPlan, paidThrough, renew, hasSavedCard }) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      many: sites === manySites, statuses, plan, nextPlan, paidThrough: paidThrough?.getTime(), renew, hasSavedCard,
    }))
  } catch {
    // The prototype remains usable when storage is unavailable.
  }
}
