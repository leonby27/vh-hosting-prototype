import { AnimatedBlock } from './hosting-motion.jsx'
import { PageAlert } from './ui/feedback.jsx'

const visibleDomainLimit = 2

export default function NetworkAttackNotice({ bannerDomains: domains, addToProtection, onRequestAdd, dismissed, onConnect, onDismiss }) {
  const visibleDomains = domains.slice(0, visibleDomainLimit).join(', ')
  const remaining = domains.length - visibleDomainLimit
  const targets = remaining > 0 ? `${visibleDomains} и ещё ${remaining}` : visibleDomains
  const titleTarget = `${domains.length === 1 ? 'сайт' : 'сайты'} ${targets}`
  const purpose = `чтобы ${domains.length === 1 ? 'сайт открывался' : 'сайты открывались'} посетителям.`
  const action = addToProtection ? 'Добавить в защиту' : 'Подключить защиту'
  const description = addToProtection
    ? `Добавьте ${domains.length === 1 ? 'домен' : 'домены'} в защиту от DDoS, ${purpose}`
    : `Подключите защиту от DDoS, ${purpose}`

  return (
    <div className="network-attack-slot">
      <AnimatedBlock open={!dismissed && domains.length > 0}>
        <div className="network-attack-notice">
          <PageAlert
            title={`На ${titleTarget} идёт DDoS-атака`}
            description={description}
            action={{ label: action, onClick: () => {
              if (addToProtection) onRequestAdd()
              onConnect()
            } }}
            onDismiss={onDismiss}
          />
        </div>
      </AnimatedBlock>
    </div>
  )
}
