import { useState } from 'react'
import { Colors, Typography } from '../DesignSystemTokens.jsx'
import { AnimatedBlock } from '../hosting-motion.jsx'
import { Icon, SearchField, Select, Surface, iconNames } from '../ui/index.js'
import { Example } from './Preview.jsx'

const iconStyles = [
  { value: 'all', label: 'Все стили' },
  { value: 'solid', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
]

export function IconsExample() {
  const [filter, setFilter] = useState('')
  const [style, setStyle] = useState('all')
  const query = filter.trim().toLowerCase()
  const icons = iconNames.filter(name =>
    (style === 'all' ? /-(solid|outline)$/.test(name) : name.endsWith(`-${style}`)) && name.includes(query))
  return <div className="catalog-example-flow">
    <div className="catalog-toolbar catalog-icons-toolbar">
      <SearchField label="Поиск по иконкам" placeholder="Название иконки" value={filter}
        onChange={event => setFilter(event.target.value)} />
      <Select label="Стиль иконок" hideLabel options={iconStyles} value={style} onChange={setStyle} />
    </div>
    <Example>
      <AnimatedBlock>
        {icons.length ? <ul className="catalog-icons" aria-label="Иконки">
          {icons.map(name => <li key={name}><Icon name={name} /><code>{name}</code></li>)}
        </ul> : <p role="status" className="catalog-date">Иконки не найдены</p>}
      </AnimatedBlock>
    </Example>
  </div>
}

export function ColorsExample() {
  return <Example title="Цветовые токены"><Colors /></Example>
}

export function TypographyExample() {
  return <Example title="Стили текста"><Typography /></Example>
}

export function ShadowsExample() {
  return <Example contrast>
    <div className="catalog-grid catalog-shadow-samples">
      {[100, 200, 300].map(level => <Surface key={level} elevation={level} level="elevated">Short shadow {level}</Surface>)}
    </div>
  </Example>
}
