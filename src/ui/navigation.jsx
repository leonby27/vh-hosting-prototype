import { useRef } from 'react'
import { DropdownPanel, TabIndicator } from '../hosting-motion.jsx'
import caret from '../assets/hosting/caret.svg'
import { Icon } from './Icon.jsx'
import { Button, IconButton } from './Button.jsx'
import { useMenuDisclosure } from './menu-disclosure.js'
import { Radio } from './selection.jsx'
import { Tooltip } from './feedback.jsx'

export const defaultSegmentedSize = 40
export const segmentedSizes = [48, 44, defaultSegmentedSize, 32]

function segmentedSizeStyle(size) {
  return segmentedSizes.includes(size) ? { '--vh-segment-size': `${size}px` } : undefined
}

function NavigationItemContent({ icon, label, count, suffix }) {
  return <>{icon}{label}{count != null && <span className="vh-tab-count">{count}</span>}{suffix}</>
}

export function TabList({
  tabs, value, onChange, idPrefix, label, variant = 'line',
  className = '', indicator = true, size = variant === 'segmented' ? defaultSegmentedSize : undefined, surface, controls = true,
  ref, navigate, preventScroll = false, allowUnselected = false,
}) {
  const segmented = variant === 'segmented'
  const track = segmented ? 'hosting-segmented' : 'sites-tabs'
  const enabled = tabs.filter(tab => !tab.disabled)
  const active = enabled.find(tab => tab.id === value)?.id ?? (allowUnselected ? undefined : enabled[0]?.id)

  function select(id, focus) {
    function change() {
      onChange(id)
      focus?.focus({ preventScroll })
    }
    if (navigate) navigate(change)
    else change()
  }

  function move(event) {
    const current = enabled.findIndex(tab => event.target.id === (tab.elementId ?? `${idPrefix}-tab-${tab.id}`))
    if (current < 0) return
    const next = {
      ArrowRight: (current + 1) % enabled.length,
      ArrowLeft: (current + enabled.length - 1) % enabled.length,
      Home: 0,
      End: enabled.length - 1,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    const { id } = enabled[next]
    if (id !== active) select(id, event.currentTarget.querySelectorAll('button:not(:disabled)')[next])
  }

  return <div ref={ref} className={[track, className, indicator && 'hosting-indicator-track'].filter(Boolean).join(' ')}
    role="tablist" aria-label={label} data-size={size} data-segment-surface={segmented ? surface : undefined}
    style={segmented ? segmentedSizeStyle(size) : undefined} onKeyDown={move}>
    {indicator && <TabIndicator selected={active} />}
    {tabs.map(tab => <button key={tab.id} id={tab.elementId ?? `${idPrefix}-tab-${tab.id}`} type="button" role="tab" disabled={tab.disabled}
      data-decorated={Boolean(tab.icon || tab.count != null || tab.suffix) || undefined}
      aria-label={tab.accessibleLabel} aria-selected={tab.id === active} aria-controls={!controls || tab.disabled ? undefined : (tab.panelId ?? `${idPrefix}-panel-${tab.id}`)}
      tabIndex={tab.id === (active ?? enabled[0]?.id) ? 0 : -1} onClick={() => { if (tab.id !== active) select(tab.id) }}>
      <NavigationItemContent icon={tab.icon} label={tab.label} count={tab.count} suffix={tab.suffix} />
    </button>)}
  </div>
}

export function SegmentedOptions({ name, label, options, value, onChange, onReselect, indicator = true, size, surface, fullWidth, className = '' }) {
  return <div className={`hosting-segmented${indicator ? ' hosting-indicator-track' : ''} ${className}`.trim()}
    data-size={size} data-segment-surface={surface} data-full-width={fullWidth || undefined} style={segmentedSizeStyle(size)}
    role={label ? 'radiogroup' : undefined} aria-label={label}>
    {indicator && <TabIndicator selected={value} />}
    {options.map(option => <label key={option.value}>
      <Radio name={name} value={option.value} checked={value === option.value} aria-label={option.accessibleLabel}
        disabled={option.disabled} onChange={() => onChange(option.value)}
        onClick={onReselect && value === option.value ? () => onReselect(option.value) : undefined} />
      <span data-decorated={Boolean(option.icon || option.count != null || option.suffix) || undefined}><NavigationItemContent icon={option.icon} label={option.label} count={option.count} suffix={option.suffix} /></span>
    </label>)}
  </div>
}

export function moveMenuFocus(event, panel, open = true, onOpen) {
  if (event.defaultPrevented || !panel || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  if (!open && ['Home', 'End'].includes(event.key)) return
  const focusable = ':is(button, a[href]):not(:disabled, [aria-disabled="true"])'
  const items = Array.from(panel.querySelectorAll(`.vh-list-item${focusable}, .vh-choice > input[type="checkbox"]:enabled`))
  if (!items.length) items.push(...panel.querySelectorAll(focusable))
  if (!items.length) return

  event.preventDefault()
  const index = items.indexOf(event.target)
  const next = {
    ArrowDown: (index + 1) % items.length,
    ArrowUp: (index < 0 ? items.length - 1 : index + items.length - 1) % items.length,
    Home: 0,
    End: items.length - 1,
  }[event.key]
  if (open) items[next].focus()
  else {
    onOpen?.()
    requestAnimationFrame(() => items[next].focus())
  }
}

export function PopoverMenu({
  trigger, leading, optionSize, triggerProps = {}, children, disabled, placement = 'bottom', variant = 'default',
  className = '', panelClassName = '', panelAs = 'div', panelLabel, iconOnly = false, renderTrigger,
  preventScroll = false, open: controlledOpen, onOpenChange,
}) {
  const { id, open, close, setOpen, containerProps, triggerProps: disclosureTrigger } =
    useMenuDisclosure({ disabled, preventScroll, open: controlledOpen, onOpenChange })
  const panelRef = useRef(null)

  function move(event) {
    containerProps.onKeyDown(event)
    moveMenuFocus(event, panelRef.current, open, () => setOpen(true))
  }

  const buttonProps = {
    ...triggerProps,
    id: triggerProps.id ?? `${id}-trigger`,
    ...disclosureTrigger,
    disabled,
  }

  return <div {...containerProps} className={`vh-dropdown ${className}`} data-placement={placement} data-menu-variant={variant} data-option-size={optionSize} onKeyDown={move}>
    {renderTrigger ? renderTrigger(buttonProps) :
      <Button {...buttonProps} variant="neutral" appearance={iconOnly ? 'icon' : 'default'}
        size={triggerProps['data-size'] ?? (iconOnly ? 36 : undefined)} pressable={false} data-icon-only={iconOnly || undefined}
        className={`vh-menu-trigger ${triggerProps.className ?? ''}`.trim()}>
        {iconOnly ? trigger : <><span className={leading ? 'vh-menu-trigger-content' : undefined}>{leading}{trigger}</span><span className="vh-caret" style={{ '--vh-icon-image': `url("${caret}")` }} aria-hidden="true" /></>}
      </Button>}
    <MenuPanel as={panelAs} ref={panelRef} id={id} open={open}
      className={panelClassName}
      role={panelAs === 'div' ? 'group' : undefined} aria-label={panelLabel}
      aria-labelledby={!panelLabel ? buttonProps.id : undefined}>
      {children(close)}
    </MenuPanel>
  </div>
}

export function MenuPanel({ as = 'div', open, className = '', ...props }) {
  const classes = `vh-dropdown-panel ${className}`.trim()
  if (open === undefined) {
    const Panel = as
    return <Panel {...props} className={classes} />
  }
  return <DropdownPanel {...props} as={as} open={open} className={classes} />
}

export function MenuItem({ as: Item = 'button', selected, icon, children, tone, layout, className = '', ...props }) {
  return <Item {...props} type={Item === 'button' ? 'button' : undefined} aria-pressed={selected} data-tone={tone} data-menu-item-layout={layout}
    className={`vh-list-item vh-focus ${className}`.trim()}>
    {icon}{children}
  </Item>
}

export function DropdownItems({ items, onSelect, selection = false }) {
  return items.map(item => <MenuItem key={item.value} as={item.href && !item.disabled ? 'a' : 'button'}
    href={item.disabled ? undefined : item.href} disabled={item.disabled}
    data-preview-state={item.previewState}
    selected={selection && !item.href ? Boolean(item.selected) : undefined} onClick={item.href ? undefined : () => onSelect(item.value)}>
    {item.icon}<span className="vh-list-item-copy">{item.label}{item.description && <small>{item.description}</small>}</span>
    {item.shortcut && <kbd>{item.shortcut}</kbd>}
  </MenuItem>)
}

export function Dropdown({ items, onSelect, selection = false, ...props }) {
  return <PopoverMenu {...props}>
    {close => <DropdownItems items={items} selection={selection} onSelect={value => {
      onSelect(value)
      close()
    }} />}
  </PopoverMenu>
}

export function Pagination({ page, count, onChange, label = 'Страницы' }) {
  if (count < 2) return null

  const start = page <= 4 ? 2 : Math.min(page - 1, count - 4)
  const end = page >= count - 3 ? count - 1 : Math.max(page + 1, 5)
  const pages = count <= 7 ? Array.from({ length: count }, (_, index) => index + 1) : [
    1,
    ...(start > 2 ? ['before'] : []),
    ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
    ...(end < count - 1 ? ['after'] : []),
    count,
  ]

  return <nav className="vh-pagination" aria-label={label}>
    <button className="vh-focus vh-pagination-arrow" type="button" aria-label="Предыдущая страница"
      disabled={page <= 1} onClick={() => onChange(page - 1)}><Icon name="arrowleft-outline" size={16} /></button>
    {pages.map(number => typeof number === 'number'
      ? <button className="vh-focus" type="button" key={number} aria-label={`Страница ${number}`}
        aria-current={number === page ? 'page' : undefined} onClick={() => onChange(number)}>{number}</button>
      : <span key={number} aria-hidden="true">…</span>)}
    <button className="vh-focus vh-pagination-arrow" type="button" aria-label="Следующая страница"
      disabled={page >= count} onClick={() => onChange(page + 1)}><Icon name="arrowright-outline" size={16} /></button>
  </nav>
}

export function SortHeader({ direction = 'none', sortType = 'text', icon = 'bold-arrow-up', iconButtonLabel, onChange, children, ...props }) {
  const next = { none: 'ascending', ascending: 'descending', descending: 'none' }[direction]
  const labels = {
    text: { ascending: 'От А до Я', descending: 'От Я до А' },
    number: { ascending: 'От меньшего к большему', descending: 'От большего к меньшему' },
    date: { ascending: 'От старых к новым', descending: 'От новых к старым' },
  }
  const actionLabel = next === 'none' ? 'По умолчанию' : (labels[sortType] ?? labels.text)[next]
  const arrow = <Icon name={icon} size={16} />
  const sort = () => onChange(next)

  return <th {...props} scope="col" aria-sort={direction}>
    {iconButtonLabel
      ? <span className="vh-sort-heading">
        {children}
        <Tooltip content={actionLabel}>{id => <IconButton className="vh-sort-control" label={iconButtonLabel}
          aria-describedby={id} icon={arrow} size={24} data-sort-direction={direction}
          data-hover-as-pressed onClick={sort} />}</Tooltip>
      </span>
      : <Tooltip content={actionLabel}>{id => <button className="vh-sort vh-sort-control vh-focus" aria-describedby={id}
        data-sort-direction={direction} type="button" onClick={sort}>
        {children}{arrow}
      </button>}</Tooltip>}
  </th>
}
