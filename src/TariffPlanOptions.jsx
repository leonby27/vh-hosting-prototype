import { useId, useState } from 'react'
import { Badge, Button, Choice, Icon, ModalClose, ModalFrame, Surface } from './ui/index.js'
import { AnimatedBlock } from './hosting-motion.jsx'
import { rubles } from './plan-preview-pricing.js'
import caret from './assets/hosting/caret.svg'

export const hostingPlans = [
  { name: 'Year', price: 452, sites: '2', disk: '15 ГБ', databases: '2', cpu: '160', summary: '2 сайта · 15 ГБ · нагрузка 100', comparison: '−13 сайтов · −25 ГБ · нагрузка −250' },
  { name: 'Optimo', price: 729, sites: '15', disk: '40 ГБ', databases: 'Безлимит', cpu: '710', summary: '15 сайтов · 40 ГБ · нагрузка 350' },
  { name: 'Century', price: 1020, sites: '35', disk: '50 ГБ', databases: 'Безлимит', cpu: '930', summary: '35 сайтов · 50 ГБ · нагрузка 450', comparison: '+20 сайтов · +10 ГБ · нагрузка +100' },
  { name: 'Millennium', price: 1478, sites: '60', disk: '60 ГБ', databases: 'Безлимит', cpu: '1350', summary: '60 сайтов · 60 ГБ · нагрузка 650' },
  { name: '1Сайт', price: 852, sites: '1', disk: '15 ГБ', databases: 'Безлимит', cpu: '1100', summary: '1 сайт · 15 ГБ · нагрузка 1100' },
  { name: 'Eterno', price: 2473, sites: '50', disk: '80 ГБ', databases: 'Безлимит', cpu: '2500', summary: '50 сайтов · 80 ГБ · нагрузка 1100' },
  { name: 'Premium', price: 5388, sites: 'Безлимит', disk: '15 ГБ', databases: 'Безлимит', cpu: '4000', summary: 'Безлимитно сайтов · 15 ГБ · нагрузка 4000' },
]

const nonHostingPlans = [
  { name: 'Почтовый', price: 95, priceDetail: 'в месяц за 10 ГБ почты', summary: 'Домены и почта остаются: ящики, письма и правила пересылки работают дальше' },
  { name: 'Парковка', price: 0, summary: 'Домены остаются у нас и продлеваются как обычно, DNS продолжает работать' },
]

export function planPrice(name) {
  return [...hostingPlans, ...nonHostingPlans].find(plan => plan.name === name)?.price ?? 0
}

export function isHostingPlan(name) {
  return hostingPlans.some(plan => plan.name === name)
}

export function TariffPeriodOptions({ value, onChange }) {
  const id = useId()
  return <section className="tariff-period-options" aria-labelledby={id}>
    <h2 id={id}>Период оплаты</h2>
    <div className="tariff-period-grid" role="group" aria-labelledby={id}>
      {[
        { id: 'month', name: 'Помесячно', price: 452, description: 'Платёж каждый месяц, менять тариф можно в любой момент' },
        { id: 'year', name: 'Ежегодно', price: 316, description: 'Списывается сразу 3 792 ₽. Экономия 1 632 ₽ за год' },
      ].map(option => <Surface key={option.id} as="label" appearance="card" elevation={100} padding="none" className="tariff-period-card">
        <Choice as="span" size={24} kind="radio" name={id} value={option.id} checked={value === option.id} onChange={() => onChange(option.id)}
          aria-label={option.name}
          label={<>{option.name}{option.id === 'year' && <Badge tone="success" size={22}>−30%</Badge>}</>} />
        <span className="tariff-period-price"><strong>{rubles(option.price)}</strong><span> в месяц</span></span>
        <span className="tariff-period-description">{option.description}</span>
      </Surface>)}
    </div>
  </section>
}

function PlanRow({ entry, plan, selected, compact, blocked, onSelect }) {
  const active = plan === entry.name
  const chosen = selected === entry.name && !active
  const parking = plan === 'Парковка'
  const originalPrice = planPrice(plan)
  const difference = entry.price - originalPrice
  const comparison = plan === 'Optimo' && entry.comparison
  const parkingSummary = parking && (entry.sites
    ? entry.summary.replace(' · нагрузка', ` · ${entry.databases === 'Безлимит' ? '∞' : entry.databases} базы данных · нагрузка`)
    : '10 ГБ почты · ящики и домены без ограничений · сайт не поднять')
  return <li className="tariff-plan-row" data-current={active || undefined}>
    <div className="tariff-plan-copy">
      <div className="tariff-plan-name">
        <strong>{entry.name}</strong>
        {parking && !compact && entry.name === 'Year' && <Badge tone="success" size={22}>Рекомендуем</Badge>}
      </div>
      {!compact || (!entry.sites && !parking) ? <p data-tone={comparison ? (blocked ? 'danger' : 'success') : undefined}>{comparison || parkingSummary || entry.summary}</p> : null}
    </div>
    <div className="tariff-plan-price">
      <strong>{rubles(entry.price)}{compact && ' / мес'}</strong>
      <p>{!compact && entry.sites && difference !== 0 && `${difference > 0 ? '+' : '−'} ${rubles(Math.abs(difference))} к вашему · `}
        {entry.priceDetail ?? (!compact ? 'в месяц' : null)}</p>
    </div>
    <div className="tariff-plan-action">
      {active && !selected ? <Badge size={40} tone="success">Текущий</Badge> : chosen ? <Badge size={40} tone="accent">Выбран</Badge> :
        <Button size={40} variant={active ? 'outline' : 'primary'} disabled={blocked}
          aria-label={blocked ? `${entry.name} не подходит` : active ? `Вернуть ${entry.name}` : `Выбрать ${entry.name}`}
          onClick={() => onSelect(entry.name)}>{blocked ? 'Не подходит' : active ? 'Вернуть' : 'Выбрать'}</Button>}
    </div>
    {compact && entry.sites && <dl className="tariff-plan-specs">
      {[['Сайтов', entry.sites], ['Место на диске', entry.disk], ['Баз данных', entry.databases], ['Нагрузка', `${entry.cpu} cp`]].map(([label, detail]) =>
        <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}
    </dl>}
    {compact && parking && !entry.sites && <p className="tariff-plan-specs">{entry.summary}</p>}
  </li>
}

export function TariffPlanOptions({ plan, selected, compact, onSelect, showAll = false, transferPlan, inDialog = false, disabled }) {
  const id = useId()
  const [expanded, setExpanded] = useState(showAll)
  const hosting = isHostingPlan(plan)
  const groups = hosting
    ? [['Похожие тарифы', hostingPlans.slice(0, 3)], ['Больше мощности и сайтов', hostingPlans.slice(3)]]
    : [['Хостинг', hostingPlans.slice(0, 3)]]
  groups.push(['Без хостинга', nonHostingPlans.filter(entry => entry.name !== plan)])
  const heading = hosting ? 'Тарифы' : 'Куда можно перейти'

  return <section className="tariff-plan-options" aria-label={inDialog ? heading : undefined}
    aria-labelledby={!inDialog ? id : undefined} inert={disabled || undefined}>
    {!inDialog && <h2 id={id}>{heading}</h2>}
    {groups.map(([name, plans]) => <Surface key={name} appearance="outline" level="surface" padding="none" className="tariff-plan-group">
      <h3>{name}</h3>
      <ul>
        {plans.map(entry => <PlanRow key={entry.name} entry={entry} plan={plan} selected={selected} compact={compact}
          blocked={hosting && plan === 'Optimo' && entry.name === 'Year' && transferPlan !== entry.name}
          onSelect={onSelect} />)}
      </ul>
      {!hosting && name === 'Хостинг' && <>
        <AnimatedBlock open={expanded}>
          <ul id={`${id}-more`}>{hostingPlans.slice(3).map(entry => <PlanRow key={entry.name} entry={entry}
            plan={plan} selected={selected} compact={compact} onSelect={onSelect} />)}</ul>
        </AnimatedBlock>
        <div className="tariff-plan-more">
          <Button appearance="text" pressable={false} aria-expanded={expanded} aria-controls={`${id}-more`} onClick={() => setExpanded(value => !value)}>
            <span className="tariff-plan-more-label">
              {expanded ? 'Свернуть' : 'и ещё +4 тарифа'}
              <Icon src={caret} size={20} />
            </span>
          </Button>
        </div>
      </>}
    </Surface>)}
  </section>
}

export function TariffSheet({ title, open, onClose, children }) {
  const id = useId()
  return <ModalFrame open={open} width={560} className="hosting-dialog hosting-dialog--sheet tariff-sheet" aria-labelledby={id}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}>
    <ModalClose className="tariff-sheet-close" onClick={onClose} />
    <h2 id={id} className="hosting-dialog-title">{title}</h2>
    {children}
  </ModalFrame>
}
