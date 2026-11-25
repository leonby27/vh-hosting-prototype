export const dashboardConceptSection = 'Концепт дашборда'
export const dashboardConceptHref = '?concept=dashboard'

export function isDashboardSection(section) {
  return section === 'Дашборд' || section === dashboardConceptSection
}

export const typicalDashboard = { id: 'dashboard-typical', label: 'Типичный вариант' }
export const richDashboard = {
  id: 'initial', label: 'Насыщенный вариант', mode: 'rich', migration: true, monitoring: 'high', services: 'rich',
}

export const dashboardStates = [
  typicalDashboard,
  richDashboard,
  { id: 'dashboard-parking', label: 'Парковка', mode: 'parking', balance: 0, migration: true, services: 'parking' },
  { id: 'dashboard-trial', label: 'Тестовый период', mode: 'trial', balance: 0, services: 'trial' },
  { id: 'dashboard-overdue', label: 'Оплата просрочена', mode: 'overdue', balance: 0 },
  { id: 'dashboard-blocked', label: 'Аккаунт заблокирован', mode: 'blocked', balance: -200, monitoring: 'blocked', services: 'blocked' },
  { id: 'dashboard-loading', label: 'Скелетоны', mode: 'loading' },
  { id: 'dashboard-site-limit', label: 'Достигнут лимит тарифа', services: 'limit' },
].map(state => ({ ...state, requiresPreset: true }))

export function getDashboardState(id) {
  return dashboardStates.find(state => state.id === id) ?? typicalDashboard
}
