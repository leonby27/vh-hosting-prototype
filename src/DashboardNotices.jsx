import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, IconButton, PopoverMenu, Surface } from './ui/index.js'
import { AnimatedBlock } from './hosting-motion.jsx'
import migrationIllustration from './assets/dashboard/migration-illustration.png'
import mobileMigrationIllustration from './assets/dashboard/mobile-migration-illustration.png'
import migrationClose from './assets/dashboard/migration-close.svg'
import trialCard from './assets/dashboard/trial-card.svg'
import trialCheck from './assets/dashboard/trial-check.svg'
import trialClose from './assets/dashboard/trial-close.svg'
import trialInfo from './assets/dashboard/trial-info.svg'
import trialInfoMobile from './assets/dashboard/trial-info-mobile.svg'

const trialBenefits = [
  'Экономия до 1 440 ₽ при оплате на 1 год',
  'Домен в подарок при оплате на 1 год',
  'При регистрации домена скидки 50% на SSL',
]

export function DashboardTrialNotice({ onPay, compact }) {
  const [openPanel, setOpenPanel] = useState(null)
  const hoverClose = useRef(null)
  const noticeRef = useRef(null)

  useEffect(() => () => clearTimeout(hoverClose.current), [])

  useLayoutEffect(() => {
    if (!openPanel) return
    const notice = noticeRef.current
    const trigger = notice.querySelector(`.dashboard-trial-${openPanel} > button`)
    const panel = document.getElementById(trigger.getAttribute('aria-controls'))

    function alignPanel() {
      const { left, width } = trigger.getBoundingClientRect()
      const anchor = left - notice.getBoundingClientRect().left + width / 2
      panel.style.setProperty('--dashboard-trial-anchor', `${anchor}px`)
    }

    alignPanel()
    const observer = new ResizeObserver(alignPanel)
    observer.observe(notice)
    observer.observe(notice.querySelector('.dashboard-trial-actions'))
    return () => observer.disconnect()
  }, [openPanel])

  function changePanel(panel, open) {
    setOpenPanel(current => open ? panel : current === panel ? null : current)
  }

  function hoverInfo(event, open) {
    if (event.pointerType !== 'mouse') return
    clearTimeout(hoverClose.current)
    if (open) changePanel('info', true)
    else hoverClose.current = setTimeout(() => changePanel('info', false), 150)
  }

  return (
    <aside ref={noticeRef} className="dashboard-trial-notice" aria-label="Тестовый период">
      <span>Тестовый период закончится через 10 дней</span>
      <div className="dashboard-trial-actions">
        <Button size={24} variant="neutral" onClick={onPay} icon={<img src={trialCard} alt="" />}>
          <span>Оплатить со скидкой -35%</span>
        </Button>
        <div onPointerEnter={event => hoverInfo(event, true)} onPointerLeave={event => hoverInfo(event, false)}>
          <PopoverMenu className="dashboard-trial-info" panelClassName="dashboard-trial-panel" panelLabel="Условия скидки"
            open={openPanel === 'info'} onOpenChange={open => changePanel('info', open)}
            renderTrigger={props => <IconButton {...props} size={24} label="Условия скидки"
              icon={<img src={compact ? trialInfoMobile : trialInfo} alt="" />}
              onClick={event => event.nativeEvent.pointerType === 'mouse' ? changePanel('info', true) : props.onClick(event)} />}>
            {() => <ul>{trialBenefits.map(benefit => <li key={benefit}><img src={trialCheck} alt="" />{benefit}</li>)}</ul>}
          </PopoverMenu>
        </div>
      </div>
      <PopoverMenu className="dashboard-trial-close" panelClassName="dashboard-trial-panel" panelLabel="Как скрыть уведомление"
        open={openPanel === 'close'} onOpenChange={open => changePanel('close', open)}
        renderTrigger={props => <IconButton {...props} size={24} label="Как скрыть уведомление" icon={<img src={trialClose} alt="" />} />}>
        {close => <span>Чтобы скрыть уведомление, <Button appearance="text" pressable={false} onClick={() => { close(); onPay() }}>оплатите</Button> услуги хостинга</span>}
      </PopoverMenu>
    </aside>
  )
}

export function DashboardMigrationBanner({ visible, onMigrate, compact }) {
  const [open, setOpen] = useState(true)

  return (
    <AnimatedBlock open={visible && open}>
      <div className="dashboard-migration-slot">
        <Surface as="section" appearance="card" padding="none" className="dashboard-migration hosting-reveal" aria-label="Перенос на хостинг">
          <span className="dashboard-migration-art">
            <img className="dashboard-migration-illustration" src={compact ? mobileMigrationIllustration : migrationIllustration} alt="" />
          </span>
          <div className="dashboard-migration-copy">
            <h2>Переносите сайты, домены и почту к нам</h2>
            <p>Переносим бесплатно, домены продлеваем по своей цене</p>
          </div>
          <Button className="dashboard-migration-action" variant="neutral" size={compact ? 32 : 40} onClick={onMigrate}>Перенести к нам</Button>
          <IconButton className="dashboard-migration-close" size={32} appearance="icon-on-dark"
            label="Закрыть баннер переноса" icon={<img src={migrationClose} alt="" />} onClick={() => setOpen(false)} />
        </Surface>
      </div>
    </AnimatedBlock>
  )
}
