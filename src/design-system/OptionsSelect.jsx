import { MultiSelect } from '../ui/index.js'

export function OptionsSelect({ label = 'Варианты', emptyLabel = 'Без дополнений', ...props }) {
  return <MultiSelect {...props} label={label} placeholder={emptyLabel}
    formatSummary={(selected, total) => `Выбрано ${selected} из ${total}`} />
}
