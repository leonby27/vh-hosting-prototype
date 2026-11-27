export const tariffTransferState = {
  id: 'tariff-transfer-no-ddg', label: 'Смена тарифа · перенос на сервер без защиты от DDoS', transferPlan: 'Year', requiresPreset: true,
}

const expandedResources = { sites: 15, disk: 40, databases: 1000, mysql: 7800 }
const resourceReceipt = {
  amount: 6120,
  items: [{ title: 'Сайты', detail: '+7 сверх лимита' }, { title: 'Дисковая квота', detail: '+10 ГБ сверх лимита' }],
}
const annualReceipt = {
  amount: 6120,
  items: [{ title: 'Тариф Year годовой', detail: 'до 10.01.2028' }],
}

export const tariffStates = [
  tariffTransferState,
  { id: 'tariff-plans', label: 'Открыт выбор тарифа', plansOpen: true },
  { id: 'tariff-plans-selected', label: 'Выбран новый тариф', plansOpen: true, selectedPlan: '1Сайт' },
  { id: 'tariff-period', label: 'Открыт выбор периода оплаты', periodOpen: true },
  { id: 'tariff-plans-and-period', label: 'Открыты тарифы и период оплаты', plansOpen: true, periodOpen: true, quantities: expandedResources },
  { id: 'tariff-unpaid', label: 'Не оплачено · тестовый период', unpaid: true, requiresPreset: true },
  { id: 'tariff-resource-alert', label: 'Ресурсы на исходе', alert: 'resources', quantities: expandedResources, requiresPreset: true },
  { id: 'tariff-password-alert', label: 'Уведомление о пароле', alert: 'password', quantities: expandedResources, requiresPreset: true },
  { id: 'tariff-debt-blocked', label: 'Работа сервисов приостановлена', alert: 'blocked', requiresPreset: true },
  { id: 'tariff-debt-deferred', label: 'Задолженность по отложенному платежу', alert: 'deferred', requiresPreset: true },
  { id: 'tariff-resources-expanded', label: 'Расширение ресурсов · к оплате', quantities: expandedResources },
  { id: 'tariff-resources-discount', label: 'Расширение ресурсов со скидкой', quantities: { sites: 15 }, appliedPackage: 'plus' },
  { id: 'tariff-payment-methods', label: 'Открыты способы оплаты', quantities: expandedResources, hasSavedSbp: true, paymentMenuOpen: true },
  { id: 'tariff-saved-sbp', label: 'Сохранённые карта и СБП', hasSavedSbp: true, requiresPreset: true },
  { id: 'tariff-invoice', label: 'Ожидание оплаты по счёту', quantities: expandedResources, invoice: true },
  { id: 'tariff-year-payment', label: 'Годовая оплата · к доплате', period: 'year', appliedPeriod: 'month', annualQuote: 7126 },
  { id: 'tariff-month-recalculation', label: 'Помесячная оплата · пересчёт срока', period: 'month', appliedPeriod: 'year', annualQuote: 7126 },
  { id: 'tariff-apply', label: 'Применение тарифа без доплаты', selectedPlan: 'Year' },
  { id: 'tariff-refund', label: 'Снижение лимитов · возврат на баланс', appliedResources: { sites: 15, disk: 16 } },
  { id: 'tariff-payment-success', label: 'Лимиты оплачены и применены', receipt: resourceReceipt, appliedResources: { sites: 15, disk: 25 }, quantities: { sites: 15, disk: 25 } },
  { id: 'tariff-plan-paid', label: 'Годовой тариф оплачен', plan: 'Year', appliedPeriod: 'year', receipt: annualReceipt },
  { id: 'tariff-leave', label: 'Прервать настройку тарифа', quantities: expandedResources, leaveOpen: true },
  { id: 'tariff-parking', label: 'Тариф «Парковка»', plan: 'Парковка' },
  { id: 'tariff-mail', label: 'Тариф «Почтовый»', plan: 'Почтовый' },
  { id: 'tariff-mail-expanded', label: 'Почтовый · все тарифы', plan: 'Почтовый', showAllPlans: true },
  { id: 'tariff-parking-alternatives', label: 'Парковка · выбор доступного тарифа', plan: 'Парковка', plansOpen: true },
  { id: 'tariff-parking-confirm', label: 'Парковка · что изменится', parkingStage: 'confirm' },
  { id: 'tariff-parking-empty', label: 'Парковка · переход без удаления', parkingStage: 'confirm', noParkingData: true, requiresPreset: true },
  { id: 'tariff-parking-manual-choice', label: 'Парковка · выбор ручного удаления', parkingStage: 'method' },
  { id: 'tariff-parking-auto-choice', label: 'Парковка · выбор автоудаления', parkingStage: 'method', removalMethod: 'auto' },
  { id: 'tariff-parking-checklist', label: 'Парковка · осталось удалить данные', parkingStage: 'checklist', parkingRemoved: ['sites'] },
  { id: 'tariff-parking-ready', label: 'Парковка · данные удалены', parkingStage: 'checklist', noParkingData: true },
  { id: 'tariff-parking-deleting', label: 'Парковка · удаляем данные', parkingStage: 'deleting' },
  { id: 'tariff-parking-switching', label: 'Парковка · меняем тариф', parkingStage: 'switching' },
  { id: 'tariff-parking-success', label: 'Парковка · переход завершён', plan: 'Парковка', alert: 'parking-success' },
  { id: 'tariff-parking-payment', label: 'Парковка · оплата не поступила', plan: 'Парковка', alert: 'payment-failed', requiresPreset: true },
]

export const tariffServiceStates = [
  { id: 'services-plus', label: 'Подключён пакет «Плюс»', appliedPackage: 'plus' },
  { id: 'services-premium', label: 'Подключён пакет «Премиум»', appliedPackage: 'premium' },
  { id: 'services-checkout', label: 'Подключение пакета «Плюс»', packageId: 'plus' },
  { id: 'services-upgrade', label: 'Переход на «Премиум»', appliedPackage: 'plus', packageId: 'premium' },
  { id: 'services-downgrade', label: 'Переход на «Плюс»', appliedPackage: 'premium', packageId: 'plus' },
  { id: 'services-connected', label: 'Подключены дополнительные услуги', serviceIds: ['backups', 'builder'] },
]
