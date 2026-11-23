import { useEffect, useId, useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Button, Icon, SidebarNav } from './ui/index.js'
import { catalogEntries } from './design-system/entries.js'
import './design-system.css'

function currentEntry() {
  const hash = window.location.hash
  const id = hash.startsWith('#component=') ? hash.slice('#component='.length) : hash.slice(1)
  return catalogEntries.find(entry => entry.id === id) ?? catalogEntries[0]
}

const sidebarIcons = import.meta.glob('./assets/catalog-sidebar/*-outline.svg', {
  eager: true,
  import: 'default',
  query: '?url&no-inline',
})

function CatalogIcon({ name, size = 24 }) {
  return <Icon name={`${name}-outline`} src={sidebarIcons[`./assets/catalog-sidebar/${name}-outline.svg`]} size={size} />
}

const catalogNavigation = catalogEntries.map(entry => ({
  id: entry.id,
  label: entry.menuLabel ?? entry.title,
  href: `#component=${entry.id}`,
  icon: <CatalogIcon name={entry.icon} />,
}))
const catalogNavigationGroups = [
  catalogNavigation.filter(item => item.id !== 'changelog'),
  catalogNavigation.filter(item => item.id === 'changelog'),
]

function CatalogNavigation({ current, compact, onNavigate }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  function select(id) {
    setOpen(false)
    onNavigate(id)
  }

  return (
    <aside className="hosting-sidebar catalog-navigation">
      {compact && <Button variant="neutral" className="catalog-navigation-toggle" type="button" aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(value => !value)}>
        <CatalogIcon name="squares-four" size={20} /> Каталог компонентов
        <span className="catalog-navigation-chevron" aria-hidden="true" />
      </Button>}
      <div id={id}>
        <AnimatedBlock open={!compact || open}>
          <div className="hosting-sidebar-inner catalog-navigation-content">
            <SidebarNav label="Компоненты дизайн-системы" groups={catalogNavigationGroups} value={current} onChange={select} />
          </div>
        </AnimatedBlock>
      </div>
    </aside>
  )
}

export default function DesignSystemCatalog({ compact = false }) {
  const [active, setActive] = useState(currentEntry)
  const heading = useRef(null)
  const focusNext = useRef(false)

  useEffect(() => {
    function sync() {
      const next = currentEntry()
      if (next === active) return
      focusNext.current = true
      setActive(next)
    }
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [active])

  useEffect(() => {
    if (!focusNext.current) return
    focusNext.current = false
    heading.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [active])

  function navigate(id) {
    if (id === active.id) {
      heading.current?.focus({ preventScroll: true })
      window.scrollTo(0, 0)
    }
  }

  const { Example } = active
  return (
    <div className="catalog" data-compact={compact}>
      <div className="catalog-layout">
        <CatalogNavigation current={active.id} compact={compact} onNavigate={navigate} />
        <section className="catalog-entry" aria-labelledby="catalog-entry-title">
          <header className="catalog-entry-heading">
            <h1 id="catalog-entry-title" ref={heading} tabIndex={-1}>{active.title}</h1>
          </header>
          <AnimatedBlock><div className="catalog-entry-preview hosting-reveal" key={active.id}><Example /></div></AnimatedBlock>
        </section>
      </div>
    </div>
  )
}
