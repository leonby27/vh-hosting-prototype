import icons from './icons.json'

const assets = import.meta.glob('../assets/design-system/*.svg', {
  eager: true,
  import: 'default',
  query: '?url&no-inline',
})

export const iconNames = Object.keys(icons)

export function Icon({ name, src = assets[`../assets/design-system/${name}.svg`], size = icons[name], label, className = '' }) {
  if (!src) return null
  const style = { width: size, height: size, '--vh-icon-image': `url("${src}")` }
  return <span className={`vh-icon vh-icon-mask ${className}`} style={style} role={label ? 'img' : undefined}
    aria-label={label} aria-hidden={label ? undefined : true} />
}

export function AssetIcon({ src, monochrome = false, size = 16, intrinsic = false, label, tone, className = '' }) {
  if (!src) return null
  if (!monochrome) return <img className={`vh-asset-icon ${className}`.trim()} src={src} width={size} height={size}
    style={{ '--vh-asset-icon-size': `${size}px` }} alt={label ?? ''} />

  return <span className={`vh-asset-icon vh-asset-icon-mask ${className}`.trim()}
    data-intrinsic={intrinsic || undefined} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}
    style={{
      '--vh-asset-icon': `url("${src}")`,
      '--vh-asset-icon-size': intrinsic ? 'auto' : `${size}px`,
      '--vh-asset-icon-color': tone && `var(--hosting-${tone})`,
    }}>
    {intrinsic && <img src={src} alt="" />}
  </span>
}
