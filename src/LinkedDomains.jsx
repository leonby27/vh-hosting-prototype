import { useId, useRef, useState } from 'react'
import { Button, Tooltip } from './ui/index.js'
import { AnimatedBlock } from './hosting-motion.jsx'
import { SitesIcon } from './SitesProtectionUI.jsx'
import domainLinkIcon from './assets/dashboard/arrow-out.svg'
import './linked-domains.css'

function DomainEntry({ name, marker, linkIcon }) {
  return (
    <div className="linked-domain-entry">
      <span title={name}>{name}</span>
      {marker}
      {linkIcon && <Tooltip placement="top" content="Перейти на сайт">
        {id => <a className="linked-domain-link" href={`https://${name}`} target="_blank"
          rel="noopener noreferrer" aria-label={`Открыть ${name} в новой вкладке`} aria-describedby={id}>
          <SitesIcon src={linkIcon} color="icon-primary" />
        </a>}
      </Tooltip>}
    </div>
  )
}

export default function LinkedDomains({ domains, siteName, summaryOnly, reserveCounterSpace, linkIcon = domainLinkIcon, renderMarker, moreMarker, onToggle }) {
  const listId = useId()
  const list = useRef(null)
  const moreButton = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [first, ...others] = domains
  const more = others.length > 0 ? `и ещё +${others.length}` : null
  const label = first ?? 'Нет привязанных доменов'

  function expandDomains(event) {
    onToggle?.(event.currentTarget, true)
    setExpanded(true)
    if (event.detail === 0) {
      requestAnimationFrame(() => list.current?.querySelector('a')?.focus({ preventScroll: true }))
    }
  }

  if (summaryOnly) {
    return (
      <div className="linked-domains linked-domains-summary">
        <span title={first}>{label}</span>
        {more && <span className="linked-domains-count">{more}</span>}
      </div>
    )
  }

  if (!more) {
    return <div className="linked-domains">{first ? <DomainEntry name={first} marker={renderMarker?.(first)}
      linkIcon={reserveCounterSpace ? undefined : linkIcon} /> : label}</div>
  }

  return (
    <div className="linked-domains linked-domains-disclosure" data-expanded={expanded}>
      <div className="linked-domains-summary">
        <DomainEntry name={first} marker={renderMarker?.(first)} linkIcon={expanded ? linkIcon : undefined} />
        <Button appearance="text" pressable={false}
          ref={moreButton}
          className="linked-domains-trigger"
          aria-label={`${more} · показать домены сайта ${siteName}`}
          aria-controls={listId}
          aria-expanded={expanded}
          hidden={expanded}
          rightIcon={moreMarker}
          onClick={expandDomains}
        >{more}</Button>
      </div>
      <AnimatedBlock open={expanded || Boolean(reserveCounterSpace)}>
        <div className="linked-domains-extra">
          <div id={listId} ref={list} hidden={reserveCounterSpace && !expanded} onClick={event => event.stopPropagation()}>
            <ul className="linked-domains-list">
              {others.map(name => <li key={name}><DomainEntry name={name} marker={renderMarker?.(name)} linkIcon={linkIcon} /></li>)}
            </ul>
            <Button appearance="text" pressable={false} className="linked-domains-collapse" onClick={() => {
              onToggle?.(moreButton.current, false)
              setExpanded(false)
              requestAnimationFrame(() => moreButton.current?.focus({ preventScroll: true }))
            }}>Свернуть список</Button>
          </div>
        </div>
      </AnimatedBlock>
    </div>
  )
}
