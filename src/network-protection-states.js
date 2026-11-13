export const networkProtectionMonthlyRate = 300

export const networkProtectionStates = [
  { id: 'protection-empty-selection', label: 'Домены не выбраны' },
  { id: 'protection-selection', label: 'Выбраны 4 домена' },
  { id: 'protection-connected', label: 'Защита подключена · с автопродлением' },
  { id: 'protection-no-renewal', label: 'Защита подключена · без автопродления' },
  { id: 'protection-domain-statuses', label: 'Все статусы доменов' },
  { id: 'protection-many-domains', label: 'Длинный список · 50 доменов' },
  { id: 'no-saved-cards', label: 'Оплата без сохранённой карты' },
  { id: 'protection-no-sites', label: 'На аккаунте нет сайтов' },
  { id: 'protection-no-domains', label: 'К сайтам не привязаны домены' },
  { id: 'protection-server', label: 'Сервер не поддерживает защиту' },
  { id: 'protection-region', label: 'Сервер в Казахстане · перенос' },
  { id: 'protection-plan', label: 'Защита недоступна на тарифе' },
  { id: 'protection-blocked', label: 'Аккаунт заблокирован' },
  { id: 'protection-trial', label: 'Тестовый период хостинга' },
  { id: 'protection-integrator', label: 'Обратитесь к интегратору' },
  { id: 'protection-connecting', label: 'Подключение защиты' },
  { id: 'protection-failed', label: 'Сбой подключения' },
  { id: 'protection-attack', label: 'Обнаружена атака' },
  { id: 'protection-remove-domains', label: 'Подтверждение отключения домена' },
  { id: 'protection-disable', label: 'Подтверждение отключения услуги' },
]

const domains = [
  { name: 'basketball-spb.ru', dns: 'DNS Timeweb' },
  { name: 'timeweb.ru', dns: 'Beget' },
  { name: 'coconote.ru', dns: 'DNS Timeweb', requiresCaa: true },
  { name: 'myreviews.ru', dns: 'Reg.RU' },
  { name: 'longnameexample.ru', dns: 'DNS Timeweb' },
]

const manyDomains = [...domains, ...Array.from({ length: 45 }, (_, index) => ({
  name: `site-${String(index + 6).padStart(2, '0')}.example`,
  dns: domains[index % domains.length].dns,
}))]

const storageKey = 'vh-network-protection'
const enrolledStatuses = new Set(['protected', 'connecting', 'dns', 'action', 'failed'])

const activeStatuses = {
  'timeweb.ru': 'protected',
  'coconote.ru': 'action',
  'myreviews.ru': 'protected',
}

const presets = {
  'protection-empty-selection': {},
  'protection-no-sites': { availability: 'no-sites', domains: [] },
  'protection-no-domains': { availability: 'no-domains', domains: [] },
  'protection-server': { availability: 'server' },
  'protection-region': { availability: 'region' },
  'protection-plan': { availability: 'plan' },
  'protection-blocked': { availability: 'blocked' },
  'protection-trial': { availability: 'trial' },
  'protection-integrator': { availability: 'integrator', dialog: 'integrator' },
  'protection-connecting': { statuses: { 'basketball-spb.ru': 'connecting' }, renew: true },
  'protection-failed': { statuses: { 'basketball-spb.ru': 'failed' }, renew: true },
  'protection-attack': { statuses: activeStatuses, renew: true, attack: true },
  'protection-remove-domains': {
    statuses: activeStatuses, renew: true, editingDomains: true,
    removedDomain: 'myreviews.ru', dialog: 'disconnect-domains',
  },
  'protection-disable': { statuses: activeStatuses, renew: true, dialog: 'disconnect-service' },
  'protection-selection': { selected: 4 },
  'no-saved-cards': { selected: 4, hasSavedCard: false },
  'protection-connected': { statuses: activeStatuses, renew: true },
  'protection-no-renewal': { statuses: activeStatuses },
  'protection-domain-statuses': {
    statuses: {
      ...activeStatuses,
      'basketball-spb.ru': 'connecting',
      'myreviews.ru': 'dns',
    },
    renew: true,
  },
  'protection-many-domains': {
    domains: manyDomains,
    editingDomains: true,
    renew: true,
    statuses: {
      'timeweb.ru': 'protected',
      'coconote.ru': 'protected',
      'site-06.example': 'connecting',
      'site-07.example': 'protected',
      'site-15.example': 'protected',
    },
  },
}

export function getNetworkProtectionPreset(id) {
  const preset = id === null ? readSavedProtection() : presets[id]
  return { domains, selected: 0, statuses: {}, editingDomains: false, renew: false, hasSavedCard: true, ...preset }
}

function readSavedProtection() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey))
    if (!saved?.statuses || typeof saved.renew !== 'boolean' || !Number.isFinite(saved.paidThrough)) return null

    const domainList = saved.many ? manyDomains : domains
    const statuses = Object.fromEntries(domainList.map(({ name }) => [name, saved.statuses[name]])
      .filter(([, status]) => enrolledStatuses.has(status)))
    return {
      domains: domainList,
      statuses,
      renew: saved.renew,
      hasSavedCard: saved.hasSavedCard !== false,
      paidThrough: saved.paidThrough,
    }
  } catch {
    return null
  }
}

export function saveNetworkProtection({ domains, statuses, renew, hasSavedCard, paidThrough }) {
  try {
    if (!paidThrough) sessionStorage.removeItem(storageKey)
    else sessionStorage.setItem(storageKey, JSON.stringify({
      many: domains === manyDomains,
      statuses,
      renew,
      hasSavedCard,
      paidThrough: paidThrough.getTime(),
    }))
  } catch {
    // The current page remains usable if browser storage is unavailable.
  }
}
