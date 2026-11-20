import { useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import successIcon from '../assets/dashboard/status-ok.svg'
import { Badge, Button, Dialog, FeatureHint, Link, PageAlert, Select, Spinner, Toast, Tooltip, TooltipBubble } from '../ui/index.js'
import { Example } from './Preview.jsx'

const spinnerSizes = [40, 32, 24]

export function SpinnerExample() {
  return <Example>
    <div className="catalog-row catalog-centered">
      {spinnerSizes.map(size => <div key={size} className="catalog-spinner-sample">
        <Spinner size={size} label={`Загрузка, ${size} px`} />
        <span aria-hidden="true">{size} px</span>
      </div>)}
    </div>
  </Example>
}

const alertTones = [
  {
    tone: 'neutral', label: 'Нейтральный', title: 'Настройки обновлены', action: 'Подробнее',
    lines: ['Изменения сохраняются для всех сайтов.', 'Обновлённые настройки появятся через несколько минут.'],
  },
  {
    tone: 'warning', label: 'Оранжевый', title: 'Идёт тестовый период хостинга', action: 'Оплатить',
    lines: ['Чтобы подключить защиту, оплатите хостинг.', 'После оплаты настройки безопасности станут доступны.'],
  },
  {
    tone: 'error', label: 'Красный', title: 'Не удалось обновить настройки', action: 'Повторить',
    lines: ['Сохранить изменения не получилось.', 'Повторите действие через несколько минут.'],
  },
  {
    tone: 'success', label: 'Зелёный', title: 'Резервная копия готова', action: 'Открыть',
    lines: ['Файлы сайта и база данных сохранены.', 'Копия доступна в разделе резервного копирования.'],
  },
]
const alertVariants = [
  { label: 'Полный' },
  { label: 'Без кнопки', omit: 'action' },
  { label: 'Без крестика', omit: 'dismiss' },
  { label: 'Без описания', omit: 'description' },
  { label: 'Без заголовка', omit: 'title' },
  { label: 'С кнопкой под описанием', appearance: 'inline' },
]
const alertColors = alertTones.map(({ tone, label }) => ({ value: tone, label }))

function AlertSample({ alert, variant }) {
  const [dismissed, setDismissed] = useState(false)
  const [activated, setActivated] = useState(false)
  const { label, omit, appearance } = variant
  const [firstLine, secondLine] = alert.lines

  return <div className="catalog-alert-sample">
    <span className="catalog-sample-label">{label}</span>
    <AnimatedBlock open={!dismissed}>
      <PageAlert appearance={appearance} tone={alert.tone} title={omit === 'title' ? undefined : alert.title}
        description={omit === 'description' ? undefined : <>{firstLine}<br />{secondLine}</>}
        action={omit === 'action' ? undefined : {
          label: activated ? 'Готово' : alert.action,
          onClick: () => setActivated(true),
        }}
        onDismiss={omit === 'dismiss' ? undefined : () => setDismissed(true)} />
    </AnimatedBlock>
    <AnimatedBlock open={dismissed}>
      <Button variant="outline" onClick={() => { setDismissed(false); setActivated(false) }}>Вернуть алерт</Button>
    </AnimatedBlock>
  </div>
}

export function AlertExample() {
  const [tone, setTone] = useState('neutral')
  const [dialog, setDialog] = useState(false)
  const alert = alertTones.find(item => item.tone === tone)

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar">
      <Select label="Цвет" options={alertColors} value={tone} onChange={setTone} />
    </div>
    <Example title={null} className="catalog-alert-preview" contrast>
      <AnimatedBlock>
        <div className="catalog-stack" key={tone}>
          {alertVariants.map(variant => <AlertSample key={variant.label} alert={alert} variant={variant} />)}
        </div>
      </AnimatedBlock>
    </Example>
    <Example title="Диалог">
      <div className="catalog-row catalog-centered">
        <Button variant="neutral" onClick={() => setDialog(true)}>Открыть диалог</Button>
      </div>
      <Dialog open={dialog} title="Настройки" description="Изменения сохраняются для всех сайтов."
        onClose={() => setDialog(false)} />
    </Example>
    <Example title="Статусы">
      <div className="catalog-row catalog-centered">
        <Badge>Доступно</Badge><Badge tone="info">Подключаем</Badge><Badge tone="success">Подключено</Badge>
        <Badge tone="warning">Требует внимания</Badge><Badge tone="danger">Ошибка</Badge>
      </div>
    </Example>
  </div>
}

export function ToastExample() {
  return <Example contrast>
    <div className="catalog-stack catalog-feedback-stack">
      <Toast>Настройки обновляются</Toast>
      <Toast icon={<img src={successIcon} alt="" width="24" height="24" />}>Изменения сохранены</Toast>
      <Toast icon={<Spinner size={20} />}>Сохраняем настройки</Toast>
      <Toast action={<Link className="catalog-toast-link">Подробнее</Link>}>Резервная копия готова</Toast>
    </div>
  </Example>
}

export function TooltipExample() {
  return <Example>
    <div className="catalog-stack catalog-feedback-stack">
      <TooltipBubble>Доступно на тарифе «Плюс»</TooltipBubble>
      <TooltipBubble size="large">Резервная копия включает файлы сайта и базы данных.</TooltipBubble>
      <TooltipBubble size="large" variant="surface">Подробности об условиях тарифа</TooltipBubble>
      <Tooltip content="Доступно на тарифе «Плюс»">
        {id => <Button variant="neutral" aria-describedby={id}>Условия тарифа</Button>}
      </Tooltip>
    </div>
  </Example>
}

const hintArrows = [
  ['top-left', 'Сверху слева'],
  ['top-right', 'Сверху справа'],
  ['left-top', 'Слева сверху'],
  ['right-top', 'Справа сверху'],
  ['left-bottom', 'Слева снизу'],
  ['right-bottom', 'Справа снизу'],
  ['bottom-left', 'Снизу слева'],
  ['bottom-right', 'Снизу справа'],
]
const hintWidths = [200, 240, 280, 320]

function HintSample({ label, arrow, width }) {
  const [acknowledged, setAcknowledged] = useState(false)
  return <div className="catalog-hint-sample">
    <span className="catalog-sample-label">{label}</span>
    <FeatureHint title="Автоматические резервные копии" width={width} arrow={arrow}
      action={<Button appearance="hint-action" size={32} pressable={false} className="vh-hint-action"
        onClick={() => setAcknowledged(true)}>{acknowledged ? 'Готово' : 'Понятно'}</Button>}>
      Настройте копирование файлов сайта.
    </FeatureHint>
  </div>
}

export function HintExample() {
  return <div className="catalog-example-flow">
    <Example title="Положение стрелки">
      <div className="catalog-hint-grid">
        {hintArrows.map(([arrow, label]) => <HintSample key={arrow} arrow={arrow} label={label} />)}
      </div>
    </Example>
    <Example title="Ширина">
      <div className="catalog-hint-grid catalog-hint-widths">
        {hintWidths.map(width => <HintSample key={width} arrow="top-left" width={width} label={`${width} px`} />)}
      </div>
    </Example>
  </div>
}
