import { useState } from 'react'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Button, Icon, Select } from '../ui/index.js'
import { Example } from './Preview.jsx'

const states = [
  { value: 'default', label: 'Default' },
  { value: 'hover', label: 'Hover' },
  { value: 'pressed', label: 'Pressed' },
  { value: 'focus', label: 'Focus' },
  { value: 'loading', label: 'Loader' },
  { value: 'disabled', label: 'Disabled' },
]

const iconPositions = [
  { value: 'none', label: 'Без иконок' },
  { value: 'left', label: 'Иконка слева' },
  { value: 'right', label: 'Иконка справа' },
  { value: 'both', label: 'Иконки с обеих сторон' },
  { value: 'only', label: 'Только иконка' },
]

const sizes = [48, 40, 32, 24].map(value => ({ value, label: `${value} px` }))

const colorVariants = [
  { variant: 'primary', label: 'Primary' },
  { variant: 'secondary', label: 'Secondary' },
  { variant: 'outline', label: 'Outline' },
]

const neutralVariants = [
  { variant: 'neutral', label: 'Neutral outline' },
  { variant: 'neutral-solid', label: 'Neutral solid' },
]

const darkVariants = [
  { variant: 'dark', label: 'Dark default' },
  { variant: 'dark-solid', label: 'Dark solid' },
  { variant: 'inverse', label: 'Inverse' },
]

const buttonGroups = [
  {
    title: 'Overview',
    variants: [
      { variant: 'primary', tone: 'accent', label: 'Primary' },
      { variant: 'secondary', tone: 'success', label: 'Secondary' },
      { variant: 'outline', tone: 'danger', label: 'Outline' },
      ...neutralVariants,
    ],
  },
  { title: 'Синие', tone: 'accent', variants: colorVariants },
  { title: 'Зелёные', tone: 'success', variants: colorVariants },
  { title: 'Красные', tone: 'danger', variants: colorVariants },
  { title: 'Нейтральные', variants: neutralVariants },
  { title: 'Dark и Inverse', variants: darkVariants, className: 'catalog-button-dark-samples' },
]

export function ButtonExample() {
  const [state, setState] = useState('default')
  const [iconPosition, setIconPosition] = useState('none')
  const [size, setSize] = useState(40)
  const iconOnly = iconPosition === 'only'
  const iconSize = size >= 40 ? 20 : 16
  const leftIcon = ['left', 'both', 'only'].includes(iconPosition) && <Icon name="add-solid" size={iconSize} />
  const rightIcon = ['right', 'both'].includes(iconPosition) && <Icon name="arrowright-outline" size={iconSize} />

  return <div className="catalog-example-flow">
    <div className="catalog-toolbar" role="group" aria-label="Параметры примеров кнопок">
      <Select label="Состояние" options={states} value={state} onChange={setState} />
      <Select label="Иконки" options={iconPositions} value={iconPosition} onChange={setIconPosition} />
      <Select label="Размер" options={sizes} value={size} onChange={setSize} />
    </div>
    {buttonGroups.map(group => <Example key={group.title} title={group.title} className={group.className}>
      <AnimatedBlock>
        <div className="catalog-row catalog-centered">
          {group.variants.map(({ variant, tone = group.tone, label }) => (
            <Button key={label} variant={variant} tone={tone} size={size}
              data-preview-state={state} loading={state === 'loading'} disabled={state === 'disabled'}
              icon={leftIcon} rightIcon={rightIcon} iconOnly={iconOnly} aria-label={iconOnly ? label : undefined}>
              {iconOnly ? null : label}
            </Button>
          ))}
        </div>
      </AnimatedBlock>
    </Example>)}
  </div>
}
