import { useEffect, useId, useState } from 'react'
import { Button, Dialog, Icon, ModalClose, ModalFrame, PageAlert, ProgressBar, SelectionCard, Surface } from './ui/index.js'
import { rubles } from './plan-preview-pricing.js'
import paymentSuccess from './assets/tariff-settings/payment-success.svg'
import selectedRadio from './assets/tariff-settings/radio-selected.svg'
import unselectedRadio from './assets/tariff-settings/radio-unselected.svg'

const parkingData = [
  ['sites', '1 сайт', 'Сайты'],
  ['databases', '1 база данных', 'Базы данных'],
  ['ftp', 'FTP-пользователи', 'Файлы'],
  ['backups', 'Резервные копии', 'Резервные копии'],
  ['mail', 'Почта (0,2 ГБ)', 'Почта'],
  ['services', 'Доп. услуги — дополнительный IP-адрес', 'Другие сервисы'],
]

const notices = {
  resources: {
    title: 'Ресурсы на исходе: дисковая квота 85%, Нагрузка на MySQL 99%',
    description: 'Century снимает ограничение — это +204 ₽ в месяц к вашему тарифу. Можно расширить только нужный ресурс ниже.',
    action: 'Смотреть Century',
  },
  password: {
    title: 'Ваш пароль не менялся больше года',
    description: 'Смените пароль в целях безопасности.',
    action: 'Смотреть Century',
  },
  blocked: {
    title: 'Работа сервисов приостановлена',
    description: 'Долг 200 ₽: оплатите — сайты включатся сразу. Если меняете тариф, долг войдёт в ту же оплату — одной суммой.',
    action: 'Погасить 200 ₽', warning: true, amount: 200,
  },
  deferred: {
    title: 'Задолженность 214 ₽',
    description: 'Отложенный платёж: сайты работают, но долг нужно закрыть. Если меняете тариф, долг войдёт в ту же оплату — одной суммой.',
    action: 'Погасить 214 ₽', warning: true, amount: 214,
  },
  'parking-success': { description: 'Готово: вы на тарифе «Парковка»', tone: 'success' },
  'payment-failed': {
    title: 'Ожидание оплаты',
    action: 'Попробовать снова',
  },
}

export function TariffAccountAlert({ kind, compact, plan, onAction, onDismiss }) {
  const notice = notices[kind]
  if (!notice) return null
  if (kind === 'parking-success') {
    return <PageAlert className="tariff-parking-success" description={notice.description} tone="success"
      icon={<Icon name="success-solid" size={24} />} onDismiss={onDismiss} />
  }
  if (kind === 'payment-failed') {
    return <PageAlert className="tariff-parking-payment" title={notice.title} tone="warning"
      description={`Оплата не поступила. Вы по-прежнему на тарифе «${plan}».`}
      icon={<Icon name="alert-solid" size={24} />} onDismiss={onDismiss} actionPosition={compact ? 'below' : 'side'}
      action={{ label: notice.action, size: compact ? 32 : 40, onClick: () => onAction(notice) }} />
  }
  return <PageAlert title={notice.title} description={notice.description} tone={notice.tone ?? (notice.warning ? 'error' : 'warning')}
    actionPosition={compact ? 'below' : 'side'} onDismiss={onDismiss}
    action={notice.action && (notice.warning
      ? <Button tone="danger" onClick={() => onAction(notice)}>{notice.action}</Button>
      : { label: notice.action, onClick: () => onAction(notice) })} />
}

export function TariffReceipt({ receipt, onClose }) {
  return <Surface as="section" appearance="card" level="background" padding="none" className="tariff-receipt hosting-reveal" aria-label="Оплата выполнена">
    <div className="tariff-receipt-body">
      <span className="tariff-receipt-icon"><img src={paymentSuccess} alt="" /></span>
      <h1>Оплачено {rubles(receipt.amount)}</h1>
      <p>Новые настройки уже действуют, перезапускать сайты не нужно. Списания по обновлённой цене начнутся со следующего платежа.</p>
      <dl>{receipt.items.map(({ title, detail }) => <div key={title}><dt>{title}</dt><dd>{detail}</dd></div>)}</dl>
      <Button variant="neutral" size={48} onClick={onClose}>Вернуться к настройкам</Button>
    </div>
  </Surface>
}

export function useParkingTransition(scenario, onComplete) {
  const [stage, setStage] = useState(scenario?.parkingStage ?? null)
  const [method, setMethod] = useState(scenario?.removalMethod ?? 'manual')
  const [removed, setRemoved] = useState(() => new Set(scenario?.noParkingData ? parkingData.map(([id]) => id) : scenario?.parkingRemoved))
  const [running, setRunning] = useState(false)
  const [activeRemoval, setActiveRemoval] = useState(null)
  const remaining = parkingData.filter(([id]) => !removed.has(id))
  const locked = stage === 'deleting' || stage === 'switching'
  const skipDeletion = remaining.length === 0
  const showChecklist = stage === 'checklist' || locked

  useEffect(() => {
    if (!running || !locked) return
    const timer = setTimeout(() => {
      if (stage === 'deleting') setStage('switching')
      else {
        setRemoved(new Set(parkingData.map(([id]) => id)))
        setStage(null)
        setRunning(false)
        onComplete()
      }
    }, 1800)
    return () => clearTimeout(timer)
  }, [locked, onComplete, running, stage])

  function start(next) {
    setStage(next)
    setRunning(true)
  }

  function close() {
    setStage(null)
  }

  return {
    stage, method, removed, remaining, locked, skipDeletion, showChecklist, activeRemoval,
    setMethod, setStage, setActiveRemoval, start, close,
    open: () => { setMethod('manual'); setStage('confirm') },
    confirmRemoval: () => {
      setRemoved(current => new Set([...current, activeRemoval[0]]))
      setActiveRemoval(null)
    },
  }
}

export function TariffParkingStatus({ transition }) {
  const { stage, removed, remaining, skipDeletion, close, start, setActiveRemoval } = transition
  const switching = stage === 'switching'
  const title = switching || (skipDeletion && !transition.locked) ? 'Переход на тариф «Парковка»: удалите данные' : 'Переход на тариф «Парковка»'
  if (transition.locked) {
    return <Surface as="section" appearance="card" elevation="card" padding="none" className="tariff-parking-card" aria-live="polite">
      <div className="tariff-parking-card-header">
        <h2>{title}</h2>
        <p>Шаг {switching ? 2 : 1} из 2 · Пока идёт переход, менять тариф и ресурсы нельзя.</p>
        <ProgressBar label="Ход перехода на парковку" value={switching ? 50 : 3} max={100} />
      </div>
      <ol className="tariff-parking-steps">
        <li aria-current={!switching ? 'step' : undefined} data-done={switching || undefined}>
          <Icon name={switching ? 'success-solid' : 'clock-solid'} size={24} />
          <span>Удаляем сайты, базы данных, FTP-пользователей и доп. услуги</span>
        </li>
        <li aria-current={switching ? 'step' : undefined}>
          {switching ? <Icon name="clock-solid" size={24} /> : <span className="tariff-parking-pending" aria-hidden="true" />}
          <span>Меняем тариф на Парковка</span>
        </li>
      </ol>
    </Surface>
  }

  const items = skipDeletion ? parkingData : remaining
  return <Surface as="section" appearance="card" elevation="card" padding="none" className="tariff-parking-card hosting-reveal">
    <div className="tariff-parking-card-header">
      <h2>{title}</h2>
      <p>Удалите в разделах всё из списка — тариф сменим, когда ничего не останется. Пакет и сервисы безопасности отключатся сами.</p>
    </div>
    <ul className="tariff-parking-checklist">
      {items.map(item => <li key={item[0]} data-done={removed.has(item[0]) || undefined}>
        <span>
          {removed.has(item[0]) ? <Icon name="success-solid" size={24} /> : <span className="tariff-parking-pending" aria-hidden="true" />}
          <span>{item[1]}</span>
        </span>
        {removed.has(item[0]) ? <small>Удалено</small> : <Button appearance="text" pressable={false} onClick={() => setActiveRemoval(item)}>
          {item[2]} <Icon name="arrowright-outline" size={16} />
        </Button>}
      </li>)}
    </ul>
    <div className="tariff-parking-actions">
      {skipDeletion && <Button onClick={() => start('switching')}>Перейти на парковку</Button>}
      <Button variant="neutral" onClick={close}>Отменить переход</Button>
    </div>
  </Surface>
}

export function TariffParkingDialogs({ transition, compact }) {
  const selectId = useId()
  const { stage, method, remaining, skipDeletion, close, start, setMethod, setStage, activeRemoval, setActiveRemoval, confirmRemoval } = transition
  const methodStep = stage === 'method'
  const open = stage === 'confirm' || methodStep
  const title = methodStep ? 'Как удалить данные?' : 'Переход на парковку'
  const back = <Button variant="neutral" size={44} onClick={() => setStage('confirm')}>Назад</Button>
  const continueButton = <Button size={44} onClick={() => method === 'auto' ? start('deleting') : setStage('checklist')}>
    {method === 'auto' ? 'Удалить данные и перенести' : 'Перейти к удалению'}
  </Button>
  return <>
    <ModalFrame open={open} className={`tariff-parking-dialog${compact ? ' hosting-dialog--sheet' : ''}`}
      aria-labelledby={`${selectId}-title`}
      onCancel={event => { event.preventDefault(); event.stopPropagation(); close() }}>
      <ModalClose className="tariff-parking-close" onClick={close} />
      <header className="tariff-parking-dialog-header">
        <p>{skipDeletion ? 'Что изменится' : `Шаг ${methodStep ? 2 : 1} из 2 · что изменится`}</p>
        <h2 id={`${selectId}-title`} className="hosting-dialog-title">{title}</h2>
      </header>
      <div className="tariff-parking-dialog-body">
        {methodStep ? <>
          <div className="tariff-removal-options" role="group" aria-label="Способ удаления">
            {[['manual', 'Удалить вручную', 'Сами удалите сайты, базы и остальное в своих разделах — покажем, что осталось. Тариф сменим, когда ничего не останется.'],
              ['auto', 'Удалить всё сразу', 'Без копии. Восстановить данные после удаления будет нельзя.']].map(([id, label, text]) =>
              <SelectionCard key={id} name={selectId} value={id} checked={method === id} onChange={() => setMethod(id)}>
                <span className="tariff-removal-option">
                  <img src={method === id ? selectedRadio : unselectedRadio} alt="" />
                  <span className="tariff-removal-copy"><strong>{label}</strong><span data-warning={id === 'auto' && method === id || undefined}>{text}</span></span>
                </span>
              </SelectionCard>)}
          </div>
          <div className="tariff-parking-actions tariff-parking-method-actions">
            {compact ? <>{continueButton}{back}</> : <>{back}{continueButton}</>}
          </div>
        </> : <>
          {!skipDeletion && <PageAlert className="tariff-parking-warning" tone="error" icon={false} title="Удалим всё, что связано с хостингом"
            description={<>{remaining.map(([, label]) => label).join(', ')}. <strong>Восстановить нельзя.</strong></>} />}
          <ul className="tariff-parking-steps">
            <li><Icon name="success-solid" size={24} />Останется: домены — продлеваются как обычно, DNS работает</li>
            <li><Icon name="success-solid" size={24} />Пересчитаем остаток по новому тарифу. Если не хватит — выставим счёт на доплату.</li>
          </ul>
          <div className="tariff-parking-actions">
            <Button variant="neutral" size={44} onClick={close}>Отмена</Button>
            <Button size={44} onClick={() => skipDeletion ? start('switching') : setStage('method')}>{skipDeletion ? 'Перейти на парковку' : 'Далее'}</Button>
          </div>
        </>}
      </div>
    </ModalFrame>
    <Dialog open={Boolean(activeRemoval)} title={activeRemoval?.[2]} onClose={() => setActiveRemoval(null)}
      description="В прототипе можно отметить этот пункт как удалённый. Данные аккаунта не меняются."
      actions={<Button onClick={confirmRemoval}>Отметить как удалённое</Button>} />
  </>
}
