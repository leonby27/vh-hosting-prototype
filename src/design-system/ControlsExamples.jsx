import { useId, useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Calendar, Choice, Icon, SearchField, Select, Stepper, TextField } from '../ui/index.js'
import { Example } from './Preview.jsx'
import { OptionsSelect } from './OptionsSelect.jsx'

const fieldSizes = [44, 40, 36, 32].map(value => ({ value, label: `${value} px` }))

const plans = [
  { value: 'start', label: 'Старт' },
  { value: 'plus', label: 'Плюс' },
  { value: 'max', label: 'Максимум' },
]

const textFieldOptions = [
  { value: 'leading', label: 'Иконка слева' },
  { value: 'trailing', label: 'Иконка справа' },
  { value: 'caption', label: 'Подпись в поле' },
  { value: 'hint', label: 'Подсказка под полем' },
]
const textFieldStates = [
  { value: 'empty', label: 'Пустой' },
  { value: 'filled', label: 'Заполненный' },
  { value: 'hover', label: 'Наведение' },
  { value: 'focus', label: 'Фокус' },
  { value: 'error', label: 'Ошибка' },
  { value: 'disabled', label: 'Недоступный' },
]
const textFieldSamples = [
  {
    title: 'Overview', label: 'Домен', placeholder: 'Введите домен', showDecoration: true,
    sample: 'example.ru', invalidSample: 'example', error: 'Укажите доменную зону',
  },
  {
    title: 'Пароль', label: 'Пароль', placeholder: 'Введите пароль', type: 'password',
    sample: 'example-password', invalidSample: '123', error: 'Пароль слишком короткий',
  },
  {
    title: 'Многострочное поле', label: 'Описание', placeholder: 'Добавьте описание', multiline: true, rows: 3,
    sample: 'Описание сайта', invalidSample: '…', error: 'Добавьте подробнее',
  },
]

export function TextFieldExample() {
  const [stepperValue, setStepperValue] = useState(1)
  const [state, setState] = useState('empty')
  const [size, setSize] = useState(44)
  const [options, setOptions] = useState([])
  const decoration = {
    leading: options.includes('leading') ? <Icon name="globe-outline" size={18} /> : undefined,
    trailing: options.includes('trailing') ? <Icon name="info-solid" size={16} /> : undefined,
    caption: options.includes('caption') ? 'DNS' : undefined,
    hint: options.includes('hint') ? 'Например, example.ru' : undefined,
  }
  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примеров инпутов">
      <Select label="Состояние" options={textFieldStates} value={state} onChange={setState} />
      <Select label="Размер" options={fieldSizes} value={size} onChange={setSize} />
      <OptionsSelect options={textFieldOptions} value={options} onChange={setOptions} />
    </div>
    {textFieldSamples.map(({ title, sample, invalidSample, error, showDecoration, ...props }) => {
      const defaultValue = {
        filled: sample,
        focus: sample,
        error: invalidSample,
        disabled: sample,
      }[state]
      return <Example key={title} title={title}>
        <AnimatedBlock>
          <div className="catalog-field-sample">
            <TextField key={state} {...props} {...(showDecoration ? decoration : {})}
              size={size} defaultValue={defaultValue} data-preview-state={state}
              disabled={state === 'disabled'} error={state === 'error' ? error : undefined} />
          </div>
        </AnimatedBlock>
      </Example>
    })}
    <Example title="Число со степпером">
      <div className="catalog-row catalog-centered">
        <Stepper label="Количество" value={stepperValue} atMin={stepperValue === 1} atMax={stepperValue === 12}
          onDecrease={() => setStepperValue(value => Math.max(1, value - 1))}
          onIncrease={() => setStepperValue(value => Math.min(12, value + 1))} />
      </div>
    </Example>
  </div>
}

const searchVariants = [
  { value: 'default', title: 'С рамкой' },
  { value: 'solid', title: 'Сплошной' },
]
const searchStates = [
  { value: 'empty', label: 'Пустое' },
  { value: 'filled', label: 'С текстом' },
  { value: 'hover', label: 'Наведение' },
  { value: 'focus', label: 'Фокус' },
]

export function SearchExample() {
  const [size, setSize] = useState(44)
  return <div className="catalog-example-flow">
    <div className="catalog-toolbar">
      <Select label="Высота поиска" options={fieldSizes} value={size} onChange={setSize} />
    </div>
    {searchVariants.map(({ value, title }) => <Example key={value} title={title} contrast={value === 'solid'}>
      <div className="catalog-search-samples">
        {searchStates.map(state => <div key={state.value} className="catalog-search-sample">
          <span>{state.label}</span>
          <SearchField variant={value} size={size} label={`${title}. ${state.label}`} placeholder="Поиск по сайтам"
            previewState={state.value} defaultValue={state.value === 'filled' || state.value === 'focus' ? 'example.ru' : undefined} />
        </div>)}
      </div>
    </Example>)}
  </div>
}

const selectStates = [
  { id: 'empty', label: 'Пустой', value: '' },
  { id: 'filled', label: 'Выбранный', value: 'plus' },
  { id: 'hover', label: 'Наведение', value: '', previewState: 'hover' },
  { id: 'focus', label: 'Фокус', value: 'plus', previewState: 'focus' },
  { id: 'clear', label: 'С очисткой', value: 'plus' },
  { id: 'hint', label: 'С подписью', value: '', hint: 'Тариф можно изменить позже' },
  { id: 'error', label: 'Ошибка', value: '', error: 'Выберите тариф' },
  { id: 'disabled', label: 'Недоступный', value: 'start', disabled: true },
]
const selectVariants = [
  { value: 'default', label: 'Стандартный' },
  { value: 'toolbar', label: 'Скрытая рамка' },
  { value: 'surface', label: 'На карточке' },
]
const selectStateOptions = selectStates.map(({ id, label }) => ({ value: id, label }))
export function SelectExample() {
  const [state, setState] = useState('empty')
  const [size, setSize] = useState(44)
  const [values, setValues] = useState({})
  const { value, disabled, hint, error, previewState } = selectStates.find(option => option.id === state)

  function select(key, next) {
    setValues(current => ({ ...current, [key]: next }))
  }

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примера селекта">
      <Select label="Состояние" options={selectStateOptions} value={state} onChange={setState} />
      <Select label="Высота поля" options={fieldSizes} value={size} onChange={setSize} />
    </div>
    {selectVariants.map(({ value: variant, label }) => {
      const key = `${variant}-${state}`
      return <Example key={variant} title={label} contrast={variant === 'toolbar'}>
        <AnimatedBlock>
          <div className="catalog-field-sample">
            <Select variant={variant} label="Тариф" size={size} options={plans}
              value={values[key] ?? value} onChange={next => select(key, next)}
              onClear={state === 'clear' ? () => select(key, '') : undefined}
              disabled={disabled} hint={hint} error={error ?? ''} previewState={previewState} />
          </div>
        </AnimatedBlock>
      </Example>
    })}
  </div>
}

const choiceTypes = [
  { value: 'checkbox', label: 'Флажок' },
  { value: 'radio', label: 'Радиокнопка' },
  { value: 'switch', label: 'Переключатель' },
]
const choiceStates = {
  checkbox: [['Обычный'], ['Наведение', { previewState: 'hover' }], ['Выбран', { defaultChecked: true }],
    ['Нажатие', { previewState: 'pressed' }], ['Фокус', { previewState: 'focus' }], ['Частично выбран', { indeterminate: true }], ['Недоступен', { disabled: true }], ['Выбран и недоступен', { defaultChecked: true, disabled: true }]],
  radio: [['Обычная'], ['Наведение', { previewState: 'hover' }], ['Выбрана', { defaultChecked: true }], ['Фокус', { previewState: 'focus' }],
    ['Недоступна', { disabled: true }], ['Выбрана и недоступна', { defaultChecked: true, disabled: true }]],
  switch: [['Выключен'], ['Наведение', { previewState: 'hover' }], ['Включён', { defaultChecked: true }],
    ['Включён при наведении', { defaultChecked: true, previewState: 'hover' }], ['Фокус', { previewState: 'focus' }], ['Недоступен', { disabled: true }],
    ['Включён и недоступен', { defaultChecked: true, disabled: true }]],
}

export function ChoiceExample() {
  const id = useId()
  return <div className="catalog-example-flow catalog-choice-examples">
    {choiceTypes.map(({ value, label }) => <Example key={value} title={label}>
      <div className="catalog-row catalog-centered">
        {choiceStates[value].map(([state, props], index) => <Choice key={state}
          kind={value} label={state} name={`${id}-${value}-${index}`} {...props} />)}
      </div>
    </Example>)}
    <Example title="Радиокнопки в виде кнопок" contrast>
      <div className="catalog-row catalog-centered">
        {choiceStates.radio.map(([label, props], index) => <Choice key={label}
          kind="radio" variant="button" label={label} name={`${id}-button-${index}`} {...props} />)}
      </div>
    </Example>
  </div>
}

export function CalendarExample() {
  const [date, setDate] = useState('')
  const [range, setRange] = useState(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return { start: `${now.getFullYear()}-${month}-12`, end: `${now.getFullYear()}-${month}-18` }
  })
  return <div className="catalog-example-flow">
    <Example title="Одна дата" className="catalog-calendar-preview" contrast>
      <AnimatedBlock><Calendar value={date} onChange={setDate} /></AnimatedBlock>
    </Example>
    <Example title="Диапазон" className="catalog-calendar-preview" contrast>
      <AnimatedBlock><Calendar range value={range} onChange={setRange} /></AnimatedBlock>
    </Example>
  </div>
}
