const numberFormat = new Intl.NumberFormat('ru-RU')

export const rubles = amount => `${numberFormat.format(amount)} ₽`

export const plusPackage = {
  id: 'plus',
  title: 'Пакет Плюс',
  description: 'Подключение на месяц',
  amount: 299,
}

export const addPlusAction = { id: 'add-plus', label: `Добавить за ${rubles(plusPackage.amount)}` }
export const priceWithPlus = amount => Math.round(amount * 0.8)
