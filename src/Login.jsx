import { useEffect, useId, useRef, useState } from 'react'
import { AnimatedBlock } from './hosting-motion.jsx'
import { Alert, Button, Dialog, Icon, IconButton, Link, ModalClose, SegmentedOptions, Surface, TextField } from './ui/index.js'
import logo from './assets/login/logo.svg'
import vk from './assets/login/vk.svg'
import google from './assets/login/google.svg'
import appStore from './assets/login/app-store.svg'
import googlePlay from './assets/login/google-play.svg'
import captchaImage from './assets/login/captcha.png'
import mailIcon from './assets/login/mail.svg'
import profileIcon from './assets/login/profile.svg'
import warningIcon from './assets/login/warning.svg'
import './login.css'

const demoLogin = 'cp299493'
const demoPassword = 'Example1'
const demoCredentials = { login: 'twadmin', password: 'twadmin' }
const registrationHref = 'https://timeweb.com/ru/services/hosting/'
const tabs = [
  { value: 'panel', label: 'Панель управления' },
  { value: 'mail', label: 'Почта' },
]
const providers = [['ВК', vk], ['Google', google]]
const stores = [
  ['App Store', appStore, 'https://apps.apple.com/app/apple-store/id1128343483'],
  ['Google Play', googlePlay, 'https://play.google.com/store/apps/details?id=com.timeweb.hosting'],
]
const signInAlerts = {
  'blocked-ip': 'Доступ с данного IP адреса запрещен',
  'blocked-country': 'Доступ для данной страны запрещен',
  'wrong-password': 'Логин или пароль указаны неверно',
  'unlinked-account': 'Выбранная вами учетная запись не привязана ни к одному аккаунту в нашей системе. Пожалуйста, выберите другой способ авторизации. После входа в панель вы сможете привязать учетные записи через профиль аккаунта',
}
const recoveryDescription = 'На почту вашего аккаунта будет выслано письмо с дальнейшими инструкциями.'
const passwordDescription = 'Новый пароль должен содержать от 8 до 30 символов, включая как минимум одну букву латинского алфавита и одну цифру.'
const emailTitle = 'Проверьте ваш email'
const emailDescription = 'Мы отправили вам код подтверждения на email, так как вход выполняется с другого IP-адреса.'
const demoCaptchaCodes = ['', 'CV7MN', 'K6RV2', 'WF9LP']

function LoginHeading({ title, description, icon, warning }) {
  return <header className="login-heading">
    {icon && <span className="login-illustration" data-warning={warning || undefined}><img src={icon} alt="" /></span>}
    <h1>{title}</h1>
    {description && <div className="login-description">{description}</div>}
  </header>
}

function LoginCard({ wide, children }) {
  return <Surface appearance="card" padding="none" elevation="100" className="login-card hosting-reveal"
    data-wide={wide || undefined}>
    <div className="login-card-content">{children}</div>
  </Surface>
}

function PasswordField({ label = 'Пароль', autoComplete = 'current-password', ...props }) {
  const [visible, setVisible] = useState(false)
  return <TextField {...props} label={label} hideLabel placeholder={label} autoComplete={autoComplete}
    type={visible ? 'text' : 'password'} trailing={<IconButton size={24}
      label={visible ? 'Скрыть пароль' : 'Показать пароль'} onClick={() => setVisible(value => !value)}
      icon={<Icon name={visible ? 'eyehide-outline' : 'eye-outline'} size={20} />} />} />
}

function CaptchaField({ value, onChange, error }) {
  const id = useId()
  const [challenge, setChallenge] = useState(0)
  return <div className="login-captcha">
    <Surface padding="none" level="background">
      <div className="login-captcha-challenge">
        {challenge ? <span className="login-captcha-sample" aria-label={`Код с картинки ${demoCaptchaCodes[challenge]}`}>
          {demoCaptchaCodes[challenge]}
        </span> : <img className="login-captcha-image" src={captchaImage} width="96" height="36" alt="Код с картинки" />}
        <IconButton size={24} label="Обновить код" icon={<Icon name="refresh-solid" size={20} />}
          onClick={() => {
            setChallenge(current => (current + 1) % demoCaptchaCodes.length)
            onChange('')
            document.getElementById(id)?.focus()
          }} />
      </div>
    </Surface>
    <TextField id={id} hideLabel label="Код с картинки" placeholder="Введите код" autoComplete="off"
      value={value} onChange={event => onChange(event.target.value)} error={error} />
  </div>
}

function ReturnButton({ onClick }) {
  return <Button variant="outline" size={44} onClick={onClick}>Вернуться к авторизации</Button>
}

function SignInForm({ scenario, tab, onTabChange, rememberedLogin, onRecovery, onSignIn, onScenarioChange }) {
  const tabName = useId()
  const alerts = scenario === 'general-errors' ? Object.values(signInAlerts)
    : scenario === 'mail-errors' ? [signInAlerts['blocked-ip'], signInAlerts['wrong-password']]
      : [signInAlerts[scenario]].filter(Boolean)

  return <LoginCard>
    <div>
      <LoginHeading title="Вход в аккаунт" />
      <AnimatedBlock open={alerts.length > 0}>
        <div className="login-stack login-alerts" role={alerts.length ? 'alert' : undefined}>
          {alerts.map(message => <Alert key={message} tone="danger" icon={<img src={warningIcon} width="20" height="20" alt="" />}>{message}</Alert>)}
        </div>
      </AnimatedBlock>
      <div className="login-form-tabs"><SegmentedOptions name={tabName} label="Способ входа" size={40} surface="page" fullWidth
        options={tabs} value={tab} onChange={onTabChange} /></div>
    </div>
    <SignInFields key={tab} scenario={scenario} tab={tab} rememberedLogin={rememberedLogin}
      onRecovery={onRecovery} onSignIn={onSignIn} onScenarioChange={onScenarioChange} />
    {tab === 'mail' ? <div className="login-stores">
      {stores.map(([name, image, href]) => <Button key={name} as="a" href={href} target="_blank" rel="noreferrer"
        variant="neutral-solid" size={44}><img src={image} alt={name} /></Button>)}
    </div> : <div className="login-providers">
      {providers.map(([name, image]) => <Button key={name} variant="neutral-solid" size={44}
        icon={<img src={image} alt="" />} onClick={() => onScenarioChange('unlinked-account')}>{name}</Button>)}
    </div>}
  </LoginCard>
}

function SignInFields({ scenario, tab, rememberedLogin, onRecovery, onSignIn, onScenarioChange }) {
  const captcha = scenario === 'captcha' || scenario === 'mail-errors'
  const [login, setLogin] = useState(() => rememberedLogin || (captcha ? demoLogin : ''))
  const [password, setPassword] = useState(() => captcha ? demoPassword : '')
  const [captchaCode, setCaptchaCode] = useState('')
  const [submitted, setSubmitted] = useState(scenario === 'field-errors')
  const isMail = tab === 'mail'
  const loginError = submitted && !login.trim() ? 'Поле логин не заполнено' : ''
  const passwordError = submitted && !password ? 'Поле пароль не заполнено' : ''
  const disabled = (captcha && !captchaCode.trim()) ||
    (scenario === 'empty' && (!login.trim() || !password)) || Boolean(loginError || passwordError)

  function submit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (!login.trim() || !password) return
    if (login.trim() !== demoCredentials.login || password !== demoCredentials.password) {
      onScenarioChange('wrong-password')
      return
    }
    onSignIn(tab)
  }

  return <form className="login-form" onSubmit={submit} noValidate>
    <div>
      <div className="login-stack">
        <TextField label={isMail ? 'Почта' : 'Логин'} hideLabel placeholder={isMail ? 'Почта' : 'Логин'}
          type={isMail ? 'email' : 'text'} name="username" autoComplete="username" autoCapitalize="none" required
          autoFocus={scenario === 'focused' || scenario === 'general-errors'}
          value={login} onChange={event => setLogin(event.target.value)} error={loginError} />
        <PasswordField name="password" required value={password} onChange={event => setPassword(event.target.value)} error={passwordError} />
        <div><Link href={isMail ? '?login&state=mail-recovery' : '?login&state=recovery'} onClick={event => {
          event.preventDefault()
          onRecovery(login)
        }}>Забыли пароль?</Link></div>
      </div>
      <AnimatedBlock open={captcha}>
        <div className="login-captcha-block"><CaptchaField value={captchaCode} onChange={setCaptchaCode} /></div>
      </AnimatedBlock>
    </div>
    <div className="login-stack">
      <Button type="submit" size={44} disabled={disabled}>{isMail && scenario !== 'mail-errors' ? 'Войти в почту' : 'Войти в панель управления'}</Button>
      <Button as="a" href={registrationHref} target="_blank" rel="noreferrer" variant="outline" size={44}>Зарегистрировать аккаунт</Button>
    </div>
  </form>
}

function RecoveryForm({ initialLogin, onSubmit, onBack }) {
  const [login, setLogin] = useState(initialLogin)
  const [code, setCode] = useState('')
  const [submitted, setSubmitted] = useState(false)
  function submit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (login.trim() && code.trim()) onSubmit(login)
  }
  return <LoginCard>
    <LoginHeading title="Восстановление пароля" description={recoveryDescription} />
    <form className="login-form" onSubmit={submit} noValidate>
      <div className="login-stack">
        <TextField label="Логин" hideLabel placeholder="Логин" autoComplete="username" name="username" required
          value={login} onChange={event => setLogin(event.target.value)}
          error={submitted && !login.trim() ? 'Поле логин не заполнено' : ''} />
        <CaptchaField value={code} onChange={setCode} error={submitted && !code.trim() ? 'Введите код' : ''} />
      </div>
      <div className="login-stack"><Button type="submit" size={44}>Отправить</Button><ReturnButton onClick={onBack} /></div>
    </form>
  </LoginCard>
}

function RecoverySent({ onBack }) {
  const [resent, setResent] = useState(false)
  return <LoginCard>
    <LoginHeading title="Проверьте почту" icon={mailIcon}
      description={<>На почту вашего аккаунта было отправлено письмо с инструкцией по восстановлению пароля. Если вы не получили письмо в течение 5 минут, вы можете{' '}
        <Link href="?login&state=recovery-sent" onClick={event => { event.preventDefault(); setResent(true) }}>Отправить письмо повторно</Link>
        <AnimatedBlock open={resent}><div className="login-resend-status" role="status">{resent && 'Письмо отправлено повторно'}</div></AnimatedBlock>
      </>} />
    <ReturnButton onClick={onBack} />
  </LoginCard>
}

function ChangePassword({ onSignIn, onBack }) {
  const [password, setPassword] = useState(demoPassword)
  const [confirmation, setConfirmation] = useState(demoPassword)
  const [submitted, setSubmitted] = useState(false)
  const validPassword = password.length >= 8 && password.length <= 30 && /[a-z]/i.test(password) && /[0-9]/.test(password)

  function submit(event) {
    event.preventDefault()
    setSubmitted(true)
    if (validPassword && password === confirmation) onSignIn('panel')
  }
  return <LoginCard>
    <LoginHeading title="Смена пароля" description={passwordDescription} />
    <form className="login-form" onSubmit={submit} noValidate>
      <div className="login-stack">
        <PasswordField label="Новый пароль" autoComplete="new-password" value={password}
          onChange={event => setPassword(event.target.value)}
          error={submitted && !validPassword ? 'Введите пароль по указанным требованиям' : ''} />
        <PasswordField label="Повторите пароль" autoComplete="new-password" value={confirmation}
          onChange={event => setConfirmation(event.target.value)}
          error={submitted && password !== confirmation ? 'Пароли не совпадают' : ''} />
      </div>
      <div className="login-stack"><Button type="submit" size={44}>Сменить пароль и войти</Button><ReturnButton onClick={onBack} /></div>
    </form>
  </LoginCard>
}

function SmsConfirmation({ filled, onConfirm, onBack }) {
  const [code, setCode] = useState(filled ? '12345' : '')
  return <LoginCard wide>
    <LoginHeading title="Подтверждение входа по SMS" />
    <form className="login-form" onSubmit={event => { event.preventDefault(); if (code.length === 5) onConfirm('panel') }}>
      <TextField label="Код из SMS" hideLabel placeholder="Введите код" inputMode="numeric" autoComplete="one-time-code"
        value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 5))} />
      <div className="login-stack">
        <Button type="submit" size={44} disabled={code.length !== 5}>Подтвердить и войти</Button>
        <ReturnButton onClick={onBack} />
      </div>
    </form>
  </LoginCard>
}

function EmailConfirmation({ scenario, compact, onConfirm, onBack }) {
  const initialError = scenario === 'email-code-error'
  const [code, setCode] = useState(scenario === 'email-code-filled' || initialError ? '1234' : '')
  const [error, setError] = useState(initialError)
  const [remaining, setRemaining] = useState(scenario === 'email-code-resend' ? 0 : 27)
  const autoFocus = scenario !== 'email-code' && (!compact || !initialError)
  const fieldId = useId()
  const codeInput = useRef(null)

  useEffect(() => {
    if (autoFocus) codeInput.current?.focus({ preventScroll: true })
    else codeInput.current?.blur()
  }, [autoFocus, compact])

  useEffect(() => {
    if (!remaining) return
    const timer = window.setTimeout(() => setRemaining(seconds => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  function submit(event) {
    event.preventDefault()
    if (code.length !== 4 || error) return
    if (code === '1234' || code === '4321') onConfirm('panel')
    else setError(true)
  }

  const fields = <form className="login-email-form" data-compact={compact} onSubmit={submit}>
    <div className="login-stack">
      <TextField id={fieldId} ref={codeInput} label="Код подтверждения" hideLabel placeholder="Введите код подтверждения"
        inputMode="numeric" autoComplete="one-time-code" value={code}
        onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 4)); setError(false) }}
        error={error ? 'Неверно введён код подтверждения' : ''} />
      {remaining ? <span className="login-email-timer"><Icon name="clock-solid" size={16} />
        Отправить код повторно через {remaining} сек.
      </span> : <div><Link href="?login&state=email-code-resend" onClick={event => {
        event.preventDefault()
        setRemaining(27)
        setCode('')
        setError(false)
        document.getElementById(fieldId)?.focus()
      }}>Отправить код</Link></div>}
    </div>
    <div className="login-email-actions">
      <Button variant="neutral" size={compact ? 44 : 40} onClick={onBack}>Отменить</Button>
      <Button type="submit" size={compact ? 44 : 40} disabled={code.length !== 4 || error}>Подтвердить</Button>
    </div>
  </form>

  if (compact) return <section className="login-email-mobile">
    <div className="login-email-close"><ModalClose onClick={onBack} /></div>
    <LoginHeading title={emailTitle} description={emailDescription} />
    {fields}
  </section>

  return <Dialog open width={480} title={emailTitle} description={emailDescription} closeOnBackdrop={!code} onClose={onBack}>{fields}</Dialog>
}

export default function Login({ scenario, compact, onScenarioChange, onSignIn }) {
  const [tab, setTab] = useState(() => ['mail', 'mail-errors', 'mail-recovery'].includes(scenario) ? 'mail' : 'panel')
  const [rememberedLogin, setRememberedLogin] = useState(null)
  const emailConfirmation = scenario?.startsWith('email-code')

  function back() {
    setRememberedLogin(null)
    onScenarioChange(tab === 'mail' ? 'mail' : 'initial')
  }

  function changeTab(nextTab) {
    setTab(nextTab)
    setRememberedLogin(null)
    onScenarioChange(nextTab === 'mail' ? 'mail' : 'initial')
  }

  function recover(login) {
    setRememberedLogin(login)
    onScenarioChange(tab === 'mail' ? 'mail-recovery' : 'recovery')
  }

  let content
  switch (scenario) {
    case 'recovery':
      content = <RecoveryForm initialLogin={rememberedLogin ?? demoLogin}
        onSubmit={login => { setRememberedLogin(login); onScenarioChange('recovery-sent') }} onBack={back} />
      break
    case 'recovery-sent':
      content = <RecoverySent onBack={back} />
      break
    case 'change-password':
      content = <ChangePassword onSignIn={onSignIn} onBack={back} />
      break
    case 'sms':
    case 'sms-filled':
      content = <SmsConfirmation key={scenario} filled={scenario === 'sms-filled'} onConfirm={onSignIn} onBack={back} />
      break
    case 'mail-recovery':
      content = <LoginCard>
        <LoginHeading title="Обратитесь к администратору" icon={profileIcon}
          description="Для восстановления пароля от почты свяжитесь с администратором своего домена" />
        <ReturnButton onClick={back} />
      </LoginCard>
      break
    case 'deactivated':
      content = <LoginCard wide>
        <LoginHeading title="Аккаунт деактивирован" icon={warningIcon} warning
          description={<>
            <p>К сожалению, аккаунт, в который вы пытаетесь войти, был деактивирован по истечению срока хранения данных на неоплаченном аккаунте.</p>
            <p>Если вы случайно оплатили деактивированный аккаунт, то вам необходимо создать новый аккаунт и обратиться в информационную поддержку из обратной связи для переноса денежных средств на новый аккаунт. Приносим извинения за возможные неудобства.</p>
          </>} />
      </LoginCard>
      break
    default:
      content = <SignInForm scenario={emailConfirmation ? 'initial' : scenario}
        tab={tab} onTabChange={changeTab} rememberedLogin={rememberedLogin}
        onRecovery={recover} onSignIn={onSignIn} onScenarioChange={onScenarioChange} />
  }

  const confirmation = emailConfirmation && <EmailConfirmation key={scenario} scenario={scenario}
    compact={compact} onConfirm={onSignIn} onBack={back} />

  return <div className="login-page" data-compact={compact}>
    {(!compact || !emailConfirmation) && <img className="login-logo" src={logo} width="125" height="32" alt="Timeweb" />}
    <div className="login-layout">{compact && emailConfirmation ? confirmation : content}</div>
    {!compact && confirmation}
  </div>
}
