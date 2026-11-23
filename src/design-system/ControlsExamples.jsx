import { useId, useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Calendar, Chip, Choice, Icon, MultiSelect, SearchField, Select, Stepper, TextField } from '../ui/index.js'
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
  { value: 'default', label: 'С рамкой' },
  { value: 'toolbar', label: 'Без рамки' },
  { value: 'surface', label: 'С фоном карточки' },
]
const selectStateOptions = selectStates.map(({ id, label }) => ({ value: id, label }))
export function SelectExample() {
  const [state, setState] = useState('empty')
  const [size, setSize] = useState(44)
  const [variant, setVariant] = useState('default')
  const [values, setValues] = useState({})
  const [selectedPlans, setSelectedPlans] = useState([])
  const { value, disabled, hint, error, previewState } = selectStates.find(option => option.id === state)
  const sampleKey = `${variant}-${state}`

  function select(next) {
    setValues(current => ({ ...current, [sampleKey]: next }))
  }

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примера селекта">
      <Select label="Состояние" options={selectStateOptions} value={state} onChange={setState} />
      <Select label="Высота поля" options={fieldSizes} value={size} onChange={setSize} />
      <Select label="Оформление" options={selectVariants} value={variant} onChange={setVariant} />
    </div>
    <Example title="С чекбоксами">
      <div className="catalog-field-sample">
        <MultiSelect label="Тарифы" size={size} variant={variant} placeholder="Все тарифы" options={plans}
          value={selectedPlans} onChange={setSelectedPlans} />
      </div>
    </Example>
    <Example title="С одним вариантом" contrast={variant === 'toolbar'}>
      <AnimatedBlock>
        <div className="catalog-field-sample">
          <Select key={sampleKey} variant={variant} label="Тариф" size={size} options={plans}
            value={values[sampleKey] ?? value} onChange={select}
            onClear={state === 'clear' ? () => select('') : undefined}
            disabled={disabled} hint={hint} error={error ?? ''} previewState={previewState} />
        </div>
      </AnimatedBlock>
    </Example>
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

const chipFilters = [
  ['Все', 12, 'list-solid'],
  ['Осталось меньше семи дней', 4, 'clock-solid'],
  ['Заблокированы', 2, 'ban-outline'],
  ['С автопополнением', 6, 'wallete-solid'],
]
const chipSizes = [28, 32, 36, 40, 44].map(value => ({ value, label: `${value} px` }))
const chipContentOptions = [
  { value: 'left', label: 'Иконка слева' },
  { value: 'count', label: 'Цифра справа' },
]
const chipStates = [
  { value: 'default', label: 'Default' },
  { value: 'hover', label: 'Hover' },
  { value: 'pressed', label: 'Pressed' },
  { value: 'focus', label: 'Focus' },
  { value: 'disabled', label: 'Disabled' },
]

export function ChipExample() {
  const [selected, setSelected] = useState(chipFilters[0][0])
  const [size, setSize] = useState(32)
  const [content, setContent] = useState([])
  const [state, setState] = useState('default')
  const showIcon = content.includes('left')
  const showCount = content.includes('count')

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примера чипов">
      <Select label="Состояние" options={chipStates} value={state} onChange={setState} />
      <Select label="Размер" options={chipSizes} value={size} onChange={setSize} />
      <OptionsSelect label="Наполнение" emptyLabel="По умолчанию" options={chipContentOptions} value={content} onChange={setContent} />
    </div>
    <Example title="Быстрые фильтры">
      <AnimatedBlock>
        <div className="catalog-row catalog-centered" role="group" aria-label="Фильтры клиентов">
          {chipFilters.map(([label, count, icon]) => <Chip key={label} selected={label === selected} onSelect={() => setSelected(label)}
            size={size} icon={showIcon ? <Icon name={icon} size={16} /> : undefined}
            count={showCount ? count : undefined}
            previewState={state} disabled={state === 'disabled'}>
            {label}
          </Chip>)}
        </div>
      </AnimatedBlock>
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
