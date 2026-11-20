import { Icon, Link } from '../ui/index.js'
import { designSystemChangelog } from './changelog.js'

const dateFormat = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeZone: 'UTC' })

export function Changelog() {
  if (!designSystemChangelog.length) {
    return <div className="catalog-preview catalog-changelog-empty">
      <div className="catalog-changelog-empty-icon">
        <Icon name="history-outline" size={28} />
      </div>
      <h3>Записей пока нет</h3>
      <p>Здесь будут появляться изменения компонентов дизайн-системы.</p>
    </div>
  }

  return <div className="catalog-example-flow">
    {designSystemChangelog.map(({ date, title, changes }) => <article key={date} className="catalog-preview catalog-changelog-entry">
      <header>
        <time dateTime={date}>{dateFormat.format(new Date(date))}</time>
        <h3>{title}</h3>
      </header>
      <ul>
        {changes.map(({ id, label, text }) => <li key={`${id}-${text}`}>
          <Link href={`#component=${id}`}>{label}</Link>
          <p>{text}</p>
        </li>)}
      </ul>
    </article>)}
  </div>
}
