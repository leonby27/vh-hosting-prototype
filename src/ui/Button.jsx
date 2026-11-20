import './button-appearances.css'

const buttonSizes = { 'site-activation': 44, 'top-up': 48, checkout: 48, 'compact-outline': 32 }

export function Button({ as: Element = 'button', href, variant = 'primary', tone = 'accent', size,
  loading = false, disabled, icon, rightIcon, children, className = '', type = 'button', style, onClick,
  appearance = 'default', pressable = true, ...props }) {
  const isButton = Element === 'button'
  const inactive = disabled || loading
  const token = ['primary', 'secondary', 'outline'].includes(variant) ? `${variant}-${tone}` : variant
  const colors = {
    '--vh-button-back': `var(--vh-button-${token}-back, transparent)`,
    '--vh-button-hover': `var(--vh-button-${token}-hover)`,
    '--vh-button-text': `var(--vh-button-${token}-text)`,
    '--vh-button-border': `var(--vh-button-${token}-border, transparent)`,
  }

  return <Element {...props} type={isButton ? type : undefined} href={isButton || inactive ? undefined : href}
    disabled={isButton ? inactive : undefined} aria-disabled={!isButton && inactive ? true : props['aria-disabled']}
    aria-busy={loading || props['aria-busy']} onClick={inactive ? undefined : onClick}
    className={['vh-action vh-button vh-focus',
      pressable && 'hosting-pressable', className].filter(Boolean).join(' ')}
    data-appearance={appearance} data-size={size ?? buttonSizes[appearance] ?? 40}
    data-variant={variant} data-tone={tone} data-loading={loading || undefined}
    style={{ ...colors, ...style }}>
    {loading ? <span className="vh-spinner" aria-hidden="true" /> : icon}
    {children}
    {!loading && rightIcon}
  </Element>
}

export function IconButton({ label, icon, children, appearance = 'icon', pressable = false, ...props }) {
  return <Button aria-label={label} variant="neutral" appearance={appearance} pressable={pressable} icon={icon} {...props}>{children}</Button>
}
