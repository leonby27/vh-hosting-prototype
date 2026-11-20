import { useId } from 'react'
import { Surface } from '../ui/layout.jsx'

export function Example({ title = 'Overview', children, className, contrast = false }) {
  const id = useId()
  return <section className="catalog-example" aria-labelledby={title ? id : undefined}>
    {title && <h3 id={id}>{title}</h3>}
    <Surface appearance={contrast ? 'outline' : 'card'} level={contrast ? 'background' : 'surface'}
      className={['catalog-preview', className].filter(Boolean).join(' ')}>{children}</Surface>
  </section>
}
