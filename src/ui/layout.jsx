import { MenuItem } from './navigation.jsx'

export function Surface({ as: Element = 'div', level = 'surface', elevation, appearance, padding, className = '', ...props }) {
  return <Element {...props} className={`vh-surface ${className}`} data-level={level} data-elevation={elevation} data-surface-appearance={appearance} data-surface-padding={padding} />
}

export function PageHeader({ title, description, actions, as: Heading = 'h1' }) {
  return <header className="vh-page-header">
    <div><Heading>{title}</Heading>{description && <p>{description}</p>}</div>
    {actions && <div className="vh-page-actions">{actions}</div>}
  </header>
}

export function AppHeader({ brand, children, actions }) {
  return <header className="vh-app-header">
    <div>{brand}</div>
    <div>{children}{actions}</div>
  </header>
}

export function SidebarNav({ items = [], groups = [items], value, onChange, label = 'Боковое меню', iconOnly = false }) {
  return <nav aria-label={label}>
    {groups.map(group => {
      const { title, items: entries } = Array.isArray(group) ? { items: group } : group
      return <div className="hosting-sidebar-group" key={title ?? entries[0]?.id}>
        {title && <p className="hosting-sidebar-group-title">{title}</p>}
        <ul className="hosting-sidebar-links">
          {entries.map(item => {
            const isLink = item.href && !item.disabled
            return <li key={item.id}>
              <MenuItem as={isLink ? 'a' : 'button'} layout="sidebar" title={iconOnly ? item.label : undefined}
                {...(isLink ? {
                  href: item.href,
                  target: item.target,
                  rel: item.target === '_blank' ? 'noopener noreferrer' : undefined,
                } : { disabled: item.disabled })}
                aria-current={item.id === value ? 'page' : undefined}
                aria-label={iconOnly ? item.label : undefined}
                onClick={event => {
                  if (isLink && (item.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
                  onChange?.(item.id)
                }}>
                {item.icon}<span hidden={iconOnly}>{item.label}</span>
              </MenuItem>
            </li>
          })}
        </ul>
      </div>
    })}
  </nav>
}

export function TableFrame({ label, className = '', scrollable = true, appearance, children }) {
  return <div className={`vh-table-frame ${className}`.trim()} data-scrollable={scrollable || undefined} data-table-appearance={appearance}
    tabIndex={scrollable ? 0 : undefined} role={scrollable ? 'region' : undefined} aria-label={scrollable ? label : undefined}>
    {children}
  </div>
}
