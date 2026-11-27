export const networkProtectionMonthlyRate = 300

export const networkProtectionStatusLabels = {
  available: 'Не подключен',
  protected: 'Под защитой',
  connecting: 'Подключаем',
  dns: 'Ждём DNS',
  'dns-aaaa': 'Ждём DNS',
  action: 'Требуется действие',
  cdn: 'Требуется действие',
  'ssl-upload': 'Под защитой',
  'ssl-timeweb': 'Под защитой',
  'ssl-expired': 'Под защитой',
  'ssl-renewal-failed': 'Требуется действие',
  failed: 'Ошибка',
}

export const networkProtectionStates = [
  { id: 'protection-empty-selection', label: 'Домены не выбраны' },
  { id: 'protection-selection', label: 'Выбраны 4 домена' },
  { id: 'protection-connected', label: 'Защита подключена · с автопродлением' },
  { id: 'protection-no-renewal', label: 'Защита подключена · без автопродления' },
  { id: 'protection-no-protected-domains', label: 'Ни один домен не под защитой', requiresPreset: true },
  { id: 'protection-domain-statuses', label: 'Все статусы доменов', requiresPreset: true },
  { id: 'protection-many-domains', label: 'Длинный список · 50 доменов', requiresPreset: true },
  { id: 'no-saved-cards', label: 'Оплата без сохранённой карты' },
  { id: 'protection-no-sites', label: 'На аккаунте нет сайтов', requiresPreset: true },
  { id: 'protection-no-domains', label: 'К сайтам не привязаны домены', requiresPreset: true },
  { id: 'protection-server', label: 'Сервер не поддерживает защиту', requiresPreset: true },
  { id: 'protection-region', label: 'Сервер в Казахстане · перенос', requiresPreset: true },
  { id: 'protection-plan', label: 'Защита недоступна на тарифе', requiresPreset: true },
  { id: 'protection-blocked', label: 'Аккаунт заблокирован', requiresPreset: true },
  { id: 'protection-trial', label: 'Тестовый период хостинга', requiresPreset: true },
  { id: 'protection-integrator', label: 'Обратитесь к интегратору', requiresPreset: true },
  { id: 'protection-connecting', label: 'Подключение защиты' },
  { id: 'protection-failed', label: 'Сбой подключения', requiresPreset: true },
  { id: 'protection-attack', label: 'Атака на домен под защитой', requiresPreset: true },
  { id: 'protection-attack-single', label: 'Атака на домен без защиты', requiresPreset: true },
  { id: 'protection-attack-unadded', label: 'Атака на домен вне подключённой защиты', requiresPreset: true },
  { id: 'protection-attack-multiple', label: 'Атака на несколько доменов', requiresPreset: true },
  { id: 'protection-remove-domains', label: 'Отключение домена · Что изменится' },
  { id: 'protection-remove-aaaa', label: 'Отключение домена с AAAA-записью', requiresPreset: true },
  { id: 'protection-remove-cdn', label: 'Отключение домена со сторонним CDN', requiresPreset: true },
  { id: 'protection-remove-last-domain', label: 'Отключение последнего домена' },
  { id: 'protection-disable', label: 'Подтверждение отключения услуги' },
]

const domains = [
  { name: 'basketball-spb.ru', dns: 'DNS Timeweb' },
  { name: 'shop.basketball-spb.ru', parentDomain: 'basketball-spb.ru', dns: 'DNS Timeweb' },
  { name: 'timeweb.ru', dns: 'Beget' },
  { name: 'coconote.ru', dns: 'DNS Timeweb', requiresCaa: true },
  { name: 'myreviews.ru', dns: 'Reg.RU' },
  { name: 'longnameexample.ru', dns: 'DNS Timeweb' },
]

const statusExamples = [
  { name: 'ipv6-only.example', dns: 'Reg.RU', status: 'dns-aaaa', originalIpv6: '2001:db8::10' },
  { name: 'ipv6.example', dns: 'Reg.RU', status: 'dns-aaaa', originalIpv6: '2001:db8::10', wwwOriginalAddress: '192.0.2.11' },
  { name: 'example.ru', dns: 'Reg.RU', status: 'dns', wwwOriginalAddress: '192.0.2.11' },
  { name: 'example.com', dns: 'Reg.RU', status: 'dns', wwwOriginalAddress: '192.0.2.11', apexUsesProtectedIp: true },
  { name: 'cdn.example', dns: 'DNS Timeweb', status: 'cdn', externalCdn: true },
  { name: 'ssl-external.example', dns: 'DNS Timeweb', status: 'ssl-upload' },
  { name: 'ssl-timeweb.example', dns: 'DNS Timeweb', status: 'ssl-timeweb' },
  { name: 'ssl-expired.example', dns: 'DNS Timeweb', status: 'ssl-expired' },
  { name: 'ssl-renewal.example', dns: 'DNS Timeweb', status: 'ssl-renewal-failed' },
  { name: 'connection-error.example', dns: 'DNS Timeweb', status: 'failed' },
]
const statusDomains = [...domains, ...statusExamples]

const manyDomains = [...domains.filter(domain => !domain.parentDomain), ...Array.from({ length: 45 }, (_, index) => ({
  name: `site-${String(index + 6).padStart(2, '0')}.example`,
  dns: domains[index % domains.length].dns,
}))]

const storageKey = 'vh-network-protection'
const activeStatuses = {
  'timeweb.ru': 'protected',
  'coconote.ru': 'action',
  'myreviews.ru': 'protected',
}

export const networkAttackStates = networkProtectionStates.filter(({ id }) =>
  ['protection-attack', 'protection-attack-single', 'protection-attack-multiple', 'protection-attack-unadded'].includes(id))

const protectedStatuses = new Set(['protected', 'ssl-upload', 'ssl-timeweb', 'ssl-expired'])
export const isNetworkDomainProtected = status => protectedStatuses.has(status)

const presets = {
  'protection-empty-selection': {},
  'protection-no-sites': { availability: 'no-sites', domains: [] },
  'protection-no-domains': { availability: 'no-domains', domains: [] },
  'protection-server': { availability: 'server' },
  'protection-region': { availability: 'region' },
  'protection-plan': { availability: 'plan' },
  'protection-blocked': { availability: 'blocked' },
  'protection-trial': { trial: true },
  'protection-integrator': { availability: 'integrator', dialog: 'integrator' },
  'protection-connecting': { statuses: { 'basketball-spb.ru': 'connecting' }, renew: true },
  'protection-failed': { statuses: { 'basketball-spb.ru': 'failed' }, renew: true },
  'protection-attack': { statuses: activeStatuses, renew: true, attackedDomains: ['timeweb.ru'] },
  'protection-attack-single': { attackedDomains: ['basketball-spb.ru'] },
  'protection-attack-unadded': { statuses: activeStatuses, renew: true, attackedDomains: ['basketball-spb.ru'] },
  'protection-attack-multiple': { attackedDomains: [
    'basketball-spb.ru', 'shop.basketball-spb.ru', 'timeweb.ru', 'coconote.ru', 'myreviews.ru',
  ] },
  'protection-remove-domains': {
    statuses: activeStatuses, renew: true, editingDomains: true,
    removedDomain: 'myreviews.ru',
  },
  'protection-remove-aaaa': {
    domains: statusDomains, statuses: { ...activeStatuses, 'ipv6.example': 'protected' }, renew: true,
    editingDomains: true, removedDomain: 'ipv6.example', dialog: 'remove-domains',
  },
  'protection-remove-cdn': {
    domains: statusDomains, statuses: { ...activeStatuses, 'cdn.example': 'protected' }, renew: true,
    editingDomains: true, removedDomain: 'cdn.example', dialog: 'remove-domains',
  },
  'protection-remove-last-domain': {
    statuses: { 'basketball-spb.ru': 'protected' }, renew: true,
    editingDomains: true, removedDomain: 'basketball-spb.ru', dialog: 'remove-last-domains',
  },
  'protection-disable': { statuses: activeStatuses, renew: true, dialog: 'disconnect-service' },
  'protection-selection': { selected: 4 },
  'no-saved-cards': { selected: 4, hasSavedCard: false },
  'protection-connected': { statuses: activeStatuses, renew: true },
  'protection-no-renewal': { statuses: activeStatuses },
  'protection-no-protected-domains': { statuses: { 'timeweb.ru': 'dns', 'coconote.ru': 'action' }, renew: true },
  'protection-domain-statuses': {
    domains: statusDomains,
    statuses: {
      ...activeStatuses,
      'basketball-spb.ru': 'connecting',
      'myreviews.ru': 'dns',
      ...Object.fromEntries(statusExamples.map(({ name, status }) => [name, status])),
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

    const domainList = saved.statusExamples ? statusDomains : saved.many ? manyDomains : domains
    const statuses = Object.fromEntries(domainList.map(({ name }) => [name, saved.statuses[name]])
      .filter(([, status]) => status !== 'available' && Object.hasOwn(networkProtectionStatusLabels, status)))
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
      statusExamples: domains === statusDomains,
      statuses,
      renew,
      hasSavedCard,
      paidThrough: paidThrough.getTime(),
    }))
  } catch {
    // The current page remains usable if browser storage is unavailable.
  }
}
