import { useLayoutEffect, useRef, useState } from 'react'
import caret from '../assets/hosting/caret.svg'
import { Icon } from './Icon.jsx'
import { PopoverMenu } from './navigation.jsx'

const dateLabel = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'full' })
const monthLabel = new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' })
const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' })
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const keyOffsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
const dateKey = date => [String(date.getFullYear()).padStart(4, '0'), date.getMonth() + 1, date.getDate()]
  .map(value => String(value).padStart(2, '0')).join('-')

function calendarDate(year, month, day = 1) {
  const date = new Date(0)
  date.setFullYear(year, month, day)
  date.setHours(12, 0, 0, 0)
  return date
}

function monthFor(value) {
  const [year, month] = value.split('-').map(Number)
  return calendarDate(year, month - 1)
}

function orderedRange(anchor, end) {
  return end < anchor ? { start: end, end: anchor } : { start: anchor, end }
}

function CalendarYear({ year, firstYear, lastYear, onChange }) {
  const decade = Math.floor(year / 10) * 10
  const [page, setPage] = useState({ year, start: decade })
  const pageStart = page.year === year ? page.start : decade
  const first = Math.max(firstYear, pageStart)
  const last = Math.min(lastYear, pageStart + 9)
  const years = Array.from({ length: last - first + 1 }, (_, index) => first + index)
  const setPageStart = start => setPage({ year, start })

  return <PopoverMenu className="vh-calendar-year-menu" panelClassName="vh-calendar-years" preventScroll
    renderTrigger={props => <button {...props} className="vh-calendar-year-trigger vh-focus" aria-label={`Выбрать год, ${year}`}
      onClick={event => {
        if (!props['aria-expanded']) setPageStart(decade)
        props.onClick(event)
      }}>
      {year}<Icon src={caret} size={14} />
    </button>}>
    {close => <>
      <div className="vh-calendar-year-navigation">
        <button className="vh-icon-button vh-focus" type="button" aria-label="Предыдущие годы" disabled={first <= firstYear}
          onClick={() => setPageStart(pageStart - 10)}><Icon src={caret} size={16} /></button>
        <span aria-live="polite">{first === last ? first : `${first}–${last}`}</span>
        <button className="vh-icon-button vh-focus" type="button" aria-label="Следующие годы" disabled={last >= lastYear}
          onClick={() => setPageStart(pageStart + 10)}><Icon src={caret} size={16} /></button>
      </div>
      <div className="vh-calendar-year-grid">
        {years.map(option => <button type="button" className="vh-focus" key={option}
          aria-pressed={option === year} onClick={() => { onChange(option); close() }}>{option}</button>)}
      </div>
    </>}
  </PopoverMenu>
}

export function Calendar({ value, onChange, min: minDate, max: maxDate, range = false }) {
  const min = minDate || '0001-01-01'
  const max = maxDate || '9999-12-31'
  const start = range ? value?.start : value
  const end = range ? value?.end : undefined
  const [month, setMonth] = useState(() => {
    const initial = start || dateKey(new Date())
    return monthFor(initial < min ? min : initial > max ? max : initial)
  })
  const [focused, setFocused] = useState('')
  const [hovered, setHovered] = useState('')
  const grid = useRef(null)
  const pendingFocus = useRef('')
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const offset = (calendarDate(year, monthIndex).getDay() + 6) % 7
  const dayCount = calendarDate(year, monthIndex + 1, 0).getDate()
  const days = Array.from({ length: Math.ceil((offset + dayCount) / 7) * 7 },
    (_, index) => calendarDate(year, monthIndex, index + 1 - offset))
  const today = dateKey(new Date())
  const firstDay = dateKey(calendarDate(year, monthIndex))
  const lastDay = dateKey(calendarDate(year, monthIndex, dayCount))
  const allowed = key => key && key >= min && key <= max
  const tabStop = [focused, start, today, min > firstDay ? min : firstDay]
    .find(key => allowed(key) && key >= firstDay && key <= lastDay)
  const preview = range && start && !end && hovered ? orderedRange(start, hovered) : null
  const visibleStart = preview?.start ?? start
  const visibleEnd = preview?.end ?? end

  useLayoutEffect(() => {
    if (!pendingFocus.current) return
    const key = pendingFocus.current
    pendingFocus.current = ''
    grid.current.querySelector(`[data-date="${key}"]`)?.focus()
  }, [month])

  function moveMonth(delta) {
    setHovered('')
    setMonth(calendarDate(year, monthIndex + delta))
  }

  function moveYear(nextYear) {
    const next = dateKey(calendarDate(nextYear, monthIndex))
    setHovered('')
    setMonth(monthFor(next < min ? min : next > max ? max : next))
  }

  function moveFocus(event, day) {
    const delta = keyOffsets[event.key]
    if (!delta) return
    event.preventDefault()
    const next = calendarDate(year, day.getMonth(), day.getDate() + delta)
    const key = dateKey(next)
    if (!allowed(key)) return
    if (key >= firstDay && key <= lastDay) {
      grid.current.querySelector(`[data-date="${key}"]`)?.focus()
    } else {
      pendingFocus.current = key
      setMonth(next)
    }
  }

  function selectDay(key) {
    setHovered('')
    if (!range) onChange(key)
    else if (!start || end) onChange({ start: key, end: '' })
    else onChange(orderedRange(start, key))
  }

  return <div className="vh-calendar">
    <div className="vh-calendar-header">
      <div className="vh-calendar-period">
        <strong aria-live="polite" aria-label={monthLabel.format(month)}>{monthName.format(month)}</strong>
        <CalendarYear year={year} firstYear={Number(min.slice(0, 4))} lastYear={Number(max.slice(0, 4))}
          onChange={moveYear} />
      </div>
      <div className="vh-calendar-navigation">
        <button type="button" className="vh-icon-button vh-focus" aria-label="Предыдущий месяц"
          disabled={Boolean(min && min >= firstDay)} onClick={() => moveMonth(-1)}><Icon src={caret} size={16} /></button>
        <button type="button" className="vh-icon-button vh-focus" aria-label="Следующий месяц"
          disabled={Boolean(max && max <= lastDay)} onClick={() => moveMonth(1)}><Icon src={caret} size={16} /></button>
      </div>
    </div>
    <div className="vh-calendar-grid" ref={grid} role="group" aria-label="Даты" onPointerLeave={() => setHovered('')}>
      {weekdays.map(day => <span className="vh-calendar-weekday" key={day} aria-hidden="true">{day}</span>)}
      {days.map(day => {
        const key = dateKey(day)
        const outside = day.getMonth() !== monthIndex
        const disabled = outside || !allowed(key)
        const selected = !disabled && (key === start || Boolean(end && key >= start && key <= end))
        const inRange = !disabled && visibleEnd && visibleStart !== visibleEnd && key >= visibleStart && key <= visibleEnd
        const rangePart = inRange ? key === visibleStart ? 'start' : key === visibleEnd ? 'end' : 'middle' : undefined
        return <button type="button" className="vh-calendar-day vh-focus" key={key} data-date={key}
          data-outside={outside || undefined} data-range={rangePart}
          data-endpoint={!disabled && (key === start || key === end) || undefined}
          aria-label={dateLabel.format(day)} aria-current={!outside && key === today ? 'date' : undefined}
          aria-pressed={selected} disabled={disabled} tabIndex={key === tabStop ? 0 : -1}
          onFocus={() => setFocused(key)} onKeyDown={event => moveFocus(event, day)}
          onPointerEnter={() => setHovered(range && start && !end && !disabled ? key : '')}
          onClick={() => selectDay(key)}><span className="vh-calendar-day-number">{day.getDate()}</span></button>
      })}
    </div>
  </div>
}
