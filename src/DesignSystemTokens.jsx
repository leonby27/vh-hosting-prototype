import { useId, useState } from 'react'
import { Button } from './ui/Button.jsx'
import { AnimatedBlock } from './hosting-motion.jsx'
import colors from '../colors.json'
import colorsUrl from '../colors.json?url'
import typography from '../typography.json'
import typographyUrl from '../typography.json?url'

const { collection, paintStyles } = colors
const { textStyles } = typography
const colorGroups = new Map()
for (const variable of collection.variables) {
  const group = variable.name.split('/')[0]
  if (!colorGroups.has(group)) colorGroups.set(group, [])
  colorGroups.get(group).push(variable)
}
const variablesById = new Map(collection.variables.map(variable => [variable.id, variable]))

function Table({ headings, children }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Swatch({ value }) {
  if (value?.type === 'VARIABLE_ALIAS') {
    return <code>{variablesById.get(value.id)?.name ?? value.id}</code>
  }

  if (!value?.hex) return <span aria-label="Нет значения">—</span>

  return (
    <span className="swatch">
      <span className="swatch-sample" style={{ backgroundColor: value.hex }} aria-hidden="true" />
      <code>{value.hex}</code>
    </span>
  )
}

function TokenGroup({ title, count, initiallyOpen = false, children }) {
  const [open, setOpen] = useState(initiallyOpen)
  const id = useId()

  return (
    <div className="catalog-token-group">
      <Button appearance="nav-action" className="catalog-token-toggle" type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        {title} <span>{count}</span>
      </Button>
      <div id={id}><AnimatedBlock open={open}>{children}</AnimatedBlock></div>
    </div>
  )
}

export function Colors() {
  return (
    <section id="colors" aria-label="Цветовые токены">
      <p className="section-meta">
        {collection.variables.length} переменных · {collection.modes.map(mode => mode.name).join(' и ')}
        {' · '}<a href={colorsUrl} download="colors.json">Скачать JSON</a>
      </p>
      {[...colorGroups].map(([group, variables]) => (
        <TokenGroup key={group} title={group} count={variables.length} initiallyOpen={group === 'Base'}>
          <Table headings={['Переменная', ...collection.modes.map(mode => mode.name)]}>
            {variables.map(variable => (
              <tr key={variable.id}>
                <th scope="row">{variable.name}</th>
                {collection.modes.map(mode => (
                  <td key={mode.modeId}><Swatch value={variable.valuesByMode[mode.modeId]} /></td>
                ))}
              </tr>
            ))}
          </Table>
        </TokenGroup>
      ))}
      <TokenGroup title="Стили заливки" count={paintStyles.length}>
        <Table headings={['Стиль', 'Цвет']}>
          {paintStyles.map(style => (
            <tr key={style.id}>
              <th scope="row">{style.name}</th>
              <td>
                <div className="paint-list">
                  {style.paints.map((paint, index) => (
                    <Swatch key={index} value={paint} />
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </TokenGroup>
    </section>
  )
}

function formatMeasure({ unit, value }, space = ' ') {
  if (unit === 'AUTO') return 'normal'
  return unit === 'PERCENT' ? `${value}%` : `${value}${space}px`
}

export function Typography() {
  const families = [...new Set(textStyles.map(style => style.fontName.family))]
  return (
    <section id="typography" aria-label="Типографические токены">
      <p className="section-meta">
        {families.join(', ')} · Стили ({textStyles.length})
        {' · '}<a href={typographyUrl} download="typography.json">Скачать JSON</a>
      </p>
      <Table headings={['Стиль', 'Начертание', 'Пример', 'Размер', 'Высота строки']}>
        {textStyles.map(style => (
          <tr key={style.id}>
            <th scope="row">{style.name}</th>
            <td>{style.fontName.style}</td>
            <td><span style={{
              fontFamily: style.fontName.family,
              fontWeight: { Regular: 400, Medium: 500, Bold: 700 }[style.fontName.style],
              fontSize: style.fontSize,
              lineHeight: formatMeasure(style.lineHeight, ''),
              letterSpacing: formatMeasure(style.letterSpacing, ''),
            }}>Панель хостинга</span></td>
            <td>{style.fontSize} px</td>
            <td>{formatMeasure(style.lineHeight)}</td>
          </tr>
        ))}
      </Table>
    </section>
  )
}
