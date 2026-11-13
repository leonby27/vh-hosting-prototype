import { rubles } from './plan-preview-pricing.js'

const applyAction = { id: 'apply', label: 'Применить изменения', icon: 'apply' }
const disableAction = { id: 'disable', label: 'Отключить', icon: 'disable', tone: 'danger' }

export function removesAllServiceTargets(selected, removals) {
  return selected.size === 0 && removals.length > 0
}

export function serviceChangesPayment({ disabling, onApply, onDisable }) {
  return {
    totals: disabling ? [] : [{ label: 'К оплате', amount: rubles(0) }],
    actions: [disabling ? disableAction : applyAction],
    onAction: disabling ? onDisable : onApply,
  }
}
