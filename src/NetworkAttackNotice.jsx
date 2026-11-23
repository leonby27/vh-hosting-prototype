import { AnimatedBlock } from './hosting-motion.jsx'
import { PageAlert } from './ui/feedback.jsx'

export default function NetworkAttackNotice({ domains, dismissed, onConnect, onDismiss }) {
  const visibleDomains = domains.slice(0, 2).join(', ')
  const remaining = domains.length - 2
  const targets = remaining > 0 ? `${visibleDomains} и ещё ${remaining}` : visibleDomains

  return (
    <div className="network-attack-slot">
      <AnimatedBlock open={!dismissed && domains.length > 0}>
        <div className="network-attack-notice">
          <PageAlert
            title={`На ${domains.length === 1 ? 'сайт' : 'сайты'} ${targets} идёт DDoS-атака`}
            description={`Подключите защиту от DDoS, чтобы ${domains.length === 1 ? 'сайт открывался' : 'сайты открывались'} посетителям.`}
            action={{ label: 'Подключить защиту', onClick: onConnect }}
            onDismiss={onDismiss}
          />
        </div>
      </AnimatedBlock>
    </div>
  )
}
