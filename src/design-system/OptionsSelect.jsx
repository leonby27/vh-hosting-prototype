import { useId } from 'react'
import { Choice, PopoverMenu } from '../ui/index.js'

export function OptionsSelect({ options, value, onChange }) {
  const id = useId()
  const summary = value.length ? `Выбрано ${value.length} из ${options.length}` : 'Без дополнений'

  return <div className="vh-field">
    <label className="vh-field-label" htmlFor={id}>Варианты</label>
    <PopoverMenu trigger={<span className="vh-select-value">{summary}</span>}
      keyboardNavigation={false}
      triggerProps={{ id, className: 'vh-button vh-focus vh-menu-trigger vh-select-trigger',
        'data-size': 44, 'aria-label': `Варианты, ${summary}` }}>
      {() => options.map(option => <Choice key={option.value} label={option.label} size={20}
        checked={value.includes(option.value)} onChange={event => onChange(event.target.checked
          ? [...value, option.value]
          : value.filter(selected => selected !== option.value))} />)}
    </PopoverMenu>
  </div>
}
