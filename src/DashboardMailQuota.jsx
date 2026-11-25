import { useId, useRef, useState } from 'react'
import { AssetIcon, Button, IconButton, ModalClose, ModalFrame, Switch, TextField } from './ui/index.js'
import minusIcon from './assets/plan-changes/minus.svg'
import plusIcon from './assets/dashboard/mail-quota-plus.svg'
import { formatTopUpAmount } from './balance-top-up-states.js'
import './dashboard-mail-quota.css'

export const mailQuotaStorageKey = 'vh-dashboard-mail-quota'
const defaultSettings = { amount: 20, autoIncrease: false }
const pricePerGigabyte = 49
const maximumQuota = Math.floor(Number.MAX_SAFE_INTEGER / pricePerGigabyte)

export function readMailQuota(storageKey = mailQuotaStorageKey) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey))
    if (Number.isSafeInteger(saved?.amount) && saved.amount >= 1 && saved.amount <= maximumQuota &&
      typeof saved.autoIncrease === 'boolean') return saved
  } catch {
    // The demo can still run without browser storage.
  }
  return defaultSettings
}

export default function DashboardMailQuota({ settings, used, onClose, onSave }) {
  const id = useId()
  const dialog = useRef(null)
  const [amount, setAmount] = useState(String(settings.amount))
  const [autoIncrease, setAutoIncrease] = useState(settings.autoIncrease)
  const quantity = Number(amount)
  const minimum = Math.max(1, Math.ceil(used))
  const valid = amount !== '' && quantity >= minimum && quantity <= maximumQuota
  const changed = quantity !== settings.amount || autoIncrease !== settings.autoIncrease
  const error = amount !== '' && !valid ? (quantity < minimum ? `Минимум ${minimum} Гб` : 'Слишком большое число') : ''
  const stepFrom = valid ? quantity : Math.max(minimum, settings.amount)

  function close() {
    dialog.current.close()
  }

  function step(delta) {
    setAmount(String(Math.max(minimum, Math.min(maximumQuota, stepFrom + delta))))
  }

  function save(event) {
    event.preventDefault()
    if (!valid || !changed) return
    onSave({ amount: quantity, autoIncrease })
    close()
  }

  return (
    <ModalFrame ref={dialog} className="hosting-dialog hosting-dialog--sheet dashboard-mail-quota" aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`} onClose={onClose}>
      <ModalClose className="mail-quota-close" onClick={close} autoFocus />
      <form className="mail-quota-form" onSubmit={save}>
        <div className="mail-quota-body">
          <div className="mail-quota-heading">
            <h2 id={`${id}-title`} className="hosting-dialog-title">Почтовая квота</h2>
            <p id={`${id}-description`} className="mail-quota-description">Размер дискового пространства для почты</p>
          </div>
          <div className="mail-quota-entry">
            <div className="mail-quota-controls">
              <TextField className="mail-quota-field" size={40} label="Почтовая квота, Гб" hideLabel
                value={amount} inputMode="numeric" caption="Гб" error={error} onChange={event => {
                  if (/^\d*$/.test(event.target.value)) setAmount(event.target.value)
                }} />
              <div className="mail-quota-steps" role="group" aria-label="Изменить почтовую квоту">
                <IconButton appearance="default" size={40} iconOnly label="Уменьшить на 1 Гб" onClick={() => step(-1)}
                  disabled={stepFrom <= minimum} icon={<AssetIcon src={minusIcon} monochrome size={20} tone="icon-primary" />} />
                <IconButton appearance="default" size={40} iconOnly label="Увеличить на 1 Гб" onClick={() => step(1)}
                  disabled={stepFrom >= maximumQuota} icon={<AssetIcon src={plusIcon} monochrome size={20} tone="icon-primary" />} />
              </div>
            </div>
            <output className="mail-quota-price" aria-live="polite">{valid ? `${formatTopUpAmount(quantity * pricePerGigabyte)} ₽ / месяц` : '—'}</output>
          </div>
          <Switch className="mail-quota-auto vh-focus" trackAfter checked={autoIncrease} onClick={() => setAutoIncrease(current => !current)}
            aria-labelledby={`${id}-automatic`} aria-describedby={`${id}-threshold`}>
            <span className="mail-quota-auto-copy">
              <span id={`${id}-automatic`}>Увеличивать квоту на 1 Гб автоматически</span>
              <span id={`${id}-threshold`}>при достижении порога в 95%</span>
            </span>
          </Switch>
        </div>
        <div className="mail-quota-actions">
          <Button variant="outline" size={40} onClick={close}>Отменить</Button>
          <Button appearance="dashboard" size={40} type="submit" disabled={!changed || !valid}>Сохранить</Button>
        </div>
      </form>
    </ModalFrame>
  )
}
