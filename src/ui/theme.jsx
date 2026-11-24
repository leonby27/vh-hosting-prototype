import { collection } from '../../colors.json'
import shadows from './shadows.json'
import { lightTokens, darkTokens } from './hosting-theme.js'
import '../styles.css'
import '../hosting-shell.css'
import './ui.css'

const tokenPaths = {
  background: 'Base/Background',
  surface: 'Base/On Background',
  panel: 'Base/Surface',
  elevated: 'Base/On Surface',
  text: 'Text/Primary',
  muted: 'Text/Secondary Dark',
  link: 'Text/Accent',
  'link-hover': 'Text/Accent Hover',
  accent: 'Base/Accent',
  'accent-light': 'Base/Accent Light',
  focus: 'Base/Accent Bright',
  line: 'Base/Line/Default Line',
  'line-warning': 'Base/Line/Warning',
  white: 'Mono/White',
  'mono-dark': 'Mono/Dark',
  header: 'Base/Header',
  'menu-hover': 'List/Item Hover',
  'menu-selected': 'List/Item Selected',
  'switch-disabled': 'Form Controls/Switcher/Disable',
  'switch-disabled-thumb': 'Form Controls/Switcher/Disable Toggle',
  'radio-line': 'Form Controls/Radio/Inactive',
  'radio-hover': 'Form Controls/Radio/Hover',
  'radio-fill': 'Form Controls/Radio/Active',
  'progress-fill': 'Progress Line/Accent',
  'progress-warning': 'Progress Line/Warning',
  'progress-empty': 'Progress Line/Empty',
  'tooltip-bg': 'Tooltip/Back',
  'tooltip-text': 'Tooltip/Content',
  'button-disabled-fill': 'Buttons/Disable/Back',
  'button-disabled-content': 'Buttons/Disable/Content',
  'danger-text': 'Buttons/Outline Red/Content',
  'success-text': 'Buttons/Outline Green/Content',
}

export const buttonTones = ['accent', 'danger', 'success']
const alertColors = { info: 'Blue', neutral: 'Gray', danger: 'Red', success: 'Green' }
const buttonColors = { accent: 'Blue', danger: 'Red', success: 'Green' }
const modes = Object.fromEntries(collection.modes.map(mode => [mode.name.toLowerCase(), mode.modeId]))
const variables = new Map(collection.variables.map(variable => [variable.name, variable]))

function theme(mode) {
  const values = {}
  const hosting = mode === 'dark' ? darkTokens : lightTokens
  const dark = mode === 'dark'
  const set = (token, path) => {
    const value = variables.get(path)?.valuesByMode[modes[mode]]?.hex
    if (value) values['--vh-' + token] = value
  }

  for (const [token, path] of Object.entries(tokenPaths)) set(token, path)
  if (dark) {
    set('link', 'Base/Accent Bright Hover')
    set('link-hover', 'Base/Accent Bright')
  }

  for (const [tone, color] of Object.entries(alertColors)) {
    set(`alert-${tone}-bg`, `Alerts/${color} Back`)
    set(`alert-${tone}-icon`, `Alerts/${color} Icon`)
  }

  const applyButton = (variant, path, tone) => {
    const token = tone ? `button-${variant}-${tone}` : `button-${variant}`
    set(`${token}-back`, `${path}/Back`)
    set(`${token}-hover`, `${path}/${variant === 'inverse' ? 'Back hover' : 'Back Hover'}`)
    set(`${token}-text`, `${path}/Content`)
    set(`${token}-border`, `${path}/Border`)
  }

  for (const variant of ['primary', 'secondary', 'outline']) {
    for (const [tone, color] of Object.entries(buttonColors)) {
      applyButton(variant, `Buttons/${variant[0].toUpperCase()}${variant.slice(1)} ${color}`, tone)
    }
  }
  applyButton('neutral', 'Buttons/Neutral')
  applyButton('neutral-solid', 'Buttons/Neutral solid')
  applyButton('dark', 'Buttons/Dark')
  applyButton('dark-solid', 'Buttons/Dark solid')
  applyButton('inverse', 'Buttons/Inverse')

  // Keep the current product palette as the default palette of the shared button.
  const buttonRoles = {
    'primary-accent': ['primary-back', 'primary-hover', 'light'],
    'primary-success': ['network-green', 'network-green-hover', 'light'],
    'primary-danger': ['plan-danger', 'plan-danger-hover', 'light'],
    neutral: ['neutral-back', 'neutral-hover', 'title', 'neutral-border'],
    'outline-accent': ['plan-outline-back', 'plan-outline-hover', 'link-text', 'plan-outline-border'],
  }
  const colorParts = ['back', 'hover', 'text', 'border']
  for (const [button, roles] of Object.entries(buttonRoles)) {
    roles.forEach((role, index) => {
      const key = `--vh-button-${button}-${colorParts[index]}`
      values[key] = hosting[`--hosting-${role}`] ?? `var(--hosting-${role}, var(--vh-white))`
    })
  }

  set('button-pressed-primary', 'Buttons/Pressed Overlay/Primary')
  set('button-pressed-secondary', 'Buttons/Pressed Overlay/Secondary')
  set('button-pressed-inverse', 'Buttons/Pressed Overlay/Inverse')
  set('button-pressed-dark', 'Buttons/Pressed Overlay/Dark Buttons')

  shadows.filter(shadow => shadow.dark === dark).forEach((shadow, index) => {
    values[`--vh-shadow-${(index + 1) * 100}`] = shadow.css
  })
  return values
}

export const vhThemes = { light: { ...lightTokens, ...theme('light') }, dark: { ...darkTokens, ...theme('dark') } }

export function VHTheme({ theme = 'light', style, ...props }) {
  return <div {...props} data-vh-theme={theme} style={{ ...vhThemes[theme], '--hosting-light': 'var(--vh-white)', ...style }} />
}
