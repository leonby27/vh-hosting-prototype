import { useId, useImperativeHandle, useRef } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import searchIcon from '../assets/network-protection/search.svg'
import { AssetIcon, Icon } from './Icon.jsx'
import plusIcon from '../assets/plan-changes/plus.svg'
import minusIcon from '../assets/plan-changes/minus.svg'
import { IconButton } from './Button.jsx'
import { Dropdown } from './navigation.jsx'
import { Checkbox, Radio } from './selection.jsx'
export { Button, IconButton } from './Button.jsx'

export { Checkbox, Radio } from './selection.jsx'

export function Link({ tone = 'accent', className = '', children, ...props }) {
  return <a {...props} className={`vh-link vh-focus ${className}`} data-tone={tone}>{children}</a>
}

function Field({ label, hideLabel, hint, error, id, children, className = '' }) {
  const showError = Boolean(error)
  const descriptionId = `${id}-description`
  const hintId = `${id}-hint`
  return (
    <div className={`vh-field ${className}`.trim()}>
      {!hideLabel && <label className="vh-field-label" htmlFor={id}>{label}</label>}
      {children({
        id,
        'aria-label': hideLabel ? label : undefined,
        'aria-invalid': showError || undefined,
        'aria-describedby': showError ? descriptionId : hint ? hintId : undefined,
      })}
      {hint && <AnimatedBlock open={!showError}><div className="vh-field-hint" id={hintId}>{hint}</div></AnimatedBlock>}
      {error !== undefined && <AnimatedBlock open={showError}>
        <div className="vh-field-error" id={descriptionId}>{error}</div>
      </AnimatedBlock>}
    </div>
  )
}

export function TextInput({ multiline, size = 44, variant = 'default', className = '', ...props }) {
  const Input = multiline ? 'textarea' : 'input'
  const input = <Input {...props} className={`vh-text-input vh-focus ${className}`.trim()}
    data-size={size} data-input-variant={variant} />
  return multiline && variant === 'default' ? <div className="vh-textarea">{input}</div> : input
}

export function TextField({ label, hideLabel, hint, error, multiline, size = 44, id, className, disabled, leading, trailing, caption, ...props }) {
  const generatedId = useId()
  return <Field label={label} hideLabel={hideLabel} hint={hint} error={disabled && error !== undefined ? '' : error}
    id={id ?? generatedId} className={className}>
    {fieldProps => {
      const input = <TextInput {...props} {...fieldProps} multiline={multiline} size={size} disabled={disabled} />
      return <div className="vh-input-decoration" data-decorated={Boolean(leading || trailing || caption) || undefined}>
        {leading && <span className="vh-input-leading">{leading}</span>}
        {input}
        {(trailing || caption) && <span className="vh-input-trailing">{caption && <span>{caption}</span>}{trailing}</span>}
      </div>
    }}
  </Field>
}

export function Select({ label, hideLabel, hint, error, value, options, onChange, placeholder = 'Выберите', disabled, id, className, variant = 'default', size = variant === 'surface' ? 40 : 44, optionSize = 44, leading, onClear, previewState }) {
  const generatedId = useId()
  const current = options.find(option => option.value === value)
  const leadingIcon = leading ?? current?.icon
  return <Field label={label} hideLabel={hideLabel} hint={hint} error={error} id={id ?? generatedId} className={className}>
    {fieldProps => <div className="vh-select" data-clearable={Boolean(current && onClear && !disabled)}>
      <Dropdown disabled={disabled} variant={variant} optionSize={optionSize} selection
        leading={leadingIcon} trigger={<span className="vh-select-value">{current?.label ?? placeholder}</span>}
        triggerProps={{ ...fieldProps, className: 'vh-select-trigger',
          'data-size': size, 'data-preview-state': previewState,
          'aria-label': [label, current?.label ?? placeholder].join(', ') }}
        items={options.map(option => ({ ...option, selected: option.value === value }))}
        onSelect={onChange} />
      {current && onClear && !disabled && <button type="button" className="vh-select-clear vh-focus"
        aria-label={`Очистить поле «${label}»`}
        onClick={event => {
          event.currentTarget.parentElement.querySelector('.vh-select-trigger')?.focus()
          onClear()
        }}>
        <Icon name="close-solid" size={16} />
      </button>}
    </div>}
  </Field>
}

export function SearchField({ label, icon, className = '', variant = 'default', size = 44, previewState, placeholder, disabled, readOnly, ref, ...props }) {
  const input = useRef(null)
  useImperativeHandle(ref, () => input.current, [])

  function clear() {
    const field = input.current
    field.focus()
    field.setRangeText('', 0, field.value.length)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  }

  return <div className={`sites-domain-search ${className}`.trim()} data-search-variant={variant}
    data-preview-state={previewState} style={{ '--vh-search-height': `${size}px` }}>
    <label className="vh-search-field">
      <span className="vh-search-icon" aria-hidden="true">
        {icon ?? <img src={searchIcon} alt="" />}
      </span>
      <input {...props} ref={input} type="search" aria-label={label} placeholder={placeholder || ' '}
        disabled={disabled} readOnly={readOnly} />
    </label>
    {!disabled && !readOnly && <button type="button" className="vh-search-clear vh-focus" aria-label="Очистить поиск" onClick={clear}>
      <span aria-hidden="true" />
    </button>}
  </div>
}

export function SwitchTrack({ className = '' }) {
  return <span className={`hosting-switch ${className}`.trim()} aria-hidden="true" />
}

export function Switch({ checked, children, trackAfter = false, appearance = 'default', className = '', ...props }) {
  return <button {...props} type="button" className={`vh-switch ${className}`.trim()}
    data-switch-appearance={appearance} role="switch" aria-checked={checked}>
    {!trackAfter && <SwitchTrack />}{children}{trackAfter && <SwitchTrack />}
  </button>
}

export function Choice({ as: Container = 'label', kind = 'checkbox', variant = 'default', label, indeterminate = false, size = 24, previewState, className, ...props }) {
  if (kind === 'radio' && variant === 'button') {
    return <label className="vh-radio-button" data-preview-state={previewState}>
      <Radio {...props} className={className} />
      <span>{label}</span>
    </label>
  }

  const mark = kind === 'switch' ? <SwitchTrack className="vh-choice-mark" />
    : <span className="vh-choice-mark" aria-hidden="true" />
  return <Container className="vh-choice" data-kind={kind} data-size={size} data-preview-state={previewState}>
    {kind === 'radio' ? <Radio {...props} className={className} />
      : <Checkbox {...props} indeterminate={indeterminate}
        className={[className, kind === 'checkbox' && 'hosting-checkbox-pressable'].filter(Boolean).join(' ') || undefined}
        role={kind === 'switch' ? 'switch' : undefined} />}
    {mark}
    {label}
  </Container>
}

export function Range({ label, value, min = 0, max = 100, onChange, ...props }) {
  const id = useId()
  return <div className="vh-range">
    <label htmlFor={id}>{label}</label>
    <output htmlFor={id}>{value}</output>
    <div className="vh-range-track">
      <span>{min}</span>
      <input {...props} className="vh-focus" id={id} type="range" min={min} max={max} value={value}
        onChange={event => onChange(event.target.valueAsNumber)} />
      <span>{max}</span>
    </div>
  </div>
}

export function Chip({ selected, onSelect, onRemove, removeLabel, children }) {
  return <span className="vh-chip" data-selected={selected || undefined}>
    {onSelect ? <button type="button" className="vh-focus" onClick={onSelect} aria-pressed={Boolean(selected)}>{children}</button>
      : <span>{children}</span>}
    {onRemove && <button type="button" className="vh-focus vh-chip-remove" aria-label={removeLabel ?? `Удалить ${children}`} onClick={onRemove}>
      <Icon name="close-solid" size={20} />
    </button>}
  </span>
}

export function Stepper({ label, value, onDecrease, onIncrease, atMin, atMax, className = '',
  decreaseLabel = 'Уменьшить', increaseLabel = 'Увеличить' }) {
  return <div className={`hosting-stepper ${className}`.trim()} role="group" aria-label={label}>
    <IconButton size={32} label={decreaseLabel} disabled={atMin} onClick={onDecrease}
      icon={<AssetIcon src={minusIcon} monochrome size={20} />} />
    <output aria-live="polite">{value}</output>
    <IconButton size={32} label={increaseLabel} disabled={atMax} onClick={onIncrease}
      icon={<AssetIcon src={plusIcon} monochrome size={20} />} />
  </div>
}
