import { AnimatedBlock } from './hosting-motion.jsx'
import { PageAlert } from './ui/feedback.jsx'

const domainPlural = new Intl.PluralRules('ru')
const domainForms = { one: 'домен', few: 'домена', many: 'доменов', other: 'домена' }

export default function NetworkAttackNotice({ domains, dismissed, onConnect, onDismiss, summarizeDomains = false }) {
  const visibleCount = summarizeDomains ? 1 : 2
  const visibleDomains = domains.slice(0, visibleCount).join(', ')
  const remaining = domains.length - visibleCount
  const remainingLabel = summarizeDomains ? `${remaining} ${domainForms[domainPlural.select(remaining)]}` : remaining
  const targets = remaining > 0 ? `${visibleDomains} и ещё ${remainingLabel}` : visibleDomains
  const titleTarget = summarizeDomains ? targets : `${domains.length === 1 ? 'сайт' : 'сайты'} ${targets}`

  return (
    <div className="network-attack-slot">
      <AnimatedBlock open={!dismissed && domains.length > 0}>
        <div className="network-attack-notice">
          <PageAlert
            title={`На ${titleTarget} идёт DDoS-атака`}
            description={`Подключите защиту от DDoS, чтобы ${domains.length === 1 ? 'сайт открывался' : 'сайты открывались'} посетителям.`}
            action={{ label: 'Подключить защиту', onClick: onConnect }}
            onDismiss={onDismiss}
          />
        </div>
      </AnimatedBlock>
    </div>
  )
}
