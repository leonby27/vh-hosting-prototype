import { useRef, useState } from 'react'
import { Button, Choice, Dialog, Pagination, PopoverMenu, SearchField, SortHeader, TableFrame, TextField } from './ui/index.js'
import { ProtectionFaq } from './SitesProtectionUI.jsx'
import folderIcon from './assets/my-sites/folder.svg'
import lowSpeedIcon from './assets/my-sites/speed-low.svg'
import highSpeedIcon from './assets/my-sites/speed-high.svg'
import createIcon from './assets/my-sites/create.svg'
import searchIcon from './assets/my-sites/search.svg'
import faqIcon from './assets/my-sites/faq.svg'
import './my-sites.css'

const pageSize = 10
const standardDetails = 'PHP 7.1 - Python 3.4 - HTTP'
const alternativeDetails = 'PHP 7.2 - Python 3.4 - HTTPS'
const longDetails = 'PHP 7.1 - Python long name 3.4 - HTTP'
const paused = 'Сайт приостановлен'
const nameOrder = new Intl.Collator('ru', { numeric: true })
const initialSites = [
  { name: 'velegram-2022', comment: 'Комментарий к сайту, который был оставлен пользователем', details: longDetails,
    domains: ['velegram-basketball-spb.ru', 'basketball-spb.ru', 'shop.basketball-spb.ru', 'timeweb.ru', 'coconote.ru', 'myreviews.ru'] },
  { name: 'Gigma', fast: true, details: `${longDetails} long name`, domains: ['goocle.ru'] },
  { name: 'TV Apple Guideline', details: alternativeDetails },
  { name: 'HellpoGames', domains: ['hellpogames.ru'] },
  { name: 'TV Apple Guideline', paused: true, domains: ['something.ru', 'www.something.ru'] },
  { name: 'Wonderfull the long name example web', domains: ['wonderfull.ru'] },
  { name: 'MonsterWeb', domains: ['monsterweb.ru'] },
  { name: 'TV Apple Guideline', paused: true, fast: true, details: alternativeDetails },
  { name: 'HellpoGames', domains: ['hellpogames.ru'] },
  { name: 'Something', domains: ['something.ru', 'www.something.ru'] },
  ...Array.from({ length: 90 }, (_, index) => ({
    name: `Сайт ${index + 11}`,
    domains: [`site-${index + 11}.example`],
  })),
].map((site, index) => ({ id: index + 1, domains: [], details: standardDetails, ...site }))

const questions = [
  { id: 'place', title: 'Как разместить сайт?', answer: 'Создайте сайт, загрузите его файлы в папку сайта через файловый менеджер и привяжите домен.' },
  { id: 'php', title: 'Как изменить версию PHP?', answer: 'Откройте настройки нужного сайта, выберите версию PHP и сохраните изменения.' },
  { id: 'restore', title: 'Как восстановить сайт?', answer: 'В разделе «Резервные копии» выберите копию за нужную дату и восстановите файлы сайта. Если сайт использует базу данных, проверьте и её резервную копию.' },
]

function SiteDomains({ domains, attackedDomains, renderAttackMark }) {
  if (!domains.length) return <span className="my-sites-no-domains">Нет привязанных доменов</span>

  const primary = domains.find(domain => attackedDomains.includes(domain)) ?? domains[0]
  const additional = domains.filter(domain => domain !== primary)
  const additionalUnderAttack = additional.some(domain => attackedDomains.includes(domain))

  return <div className="my-sites-domains">
    <span className="my-sites-domain">
      <span className="my-sites-truncate" title={primary}>{primary}</span>
      {attackedDomains.includes(primary) && renderAttackMark()}
    </span>
    {additional.length > 0 && (
      <PopoverMenu className="my-sites-more-domains" panelClassName="my-sites-domain-menu" panelLabel="Привязанные домены"
        renderTrigger={props => (
          <Button {...props} variant="neutral" size={24} aria-label={`Ещё ${additional.length} привязанных доменов`}
            rightIcon={additionalUnderAttack ? renderAttackMark() : undefined}>
            и ещё +{additional.length}
          </Button>
        )}>
        {() => <ul className="my-sites-domain-menu-list">{additional.map(domain => (
          <li key={domain}>{domain}{attackedDomains.includes(domain) && renderAttackMark()}</li>
        ))}</ul>}
      </PopoverMenu>
    )}
  </div>
}

export default function MySites({ attackedDomains = [], renderAttackMark }) {
  const [sites, setSites] = useState(initialSites)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState(new Set())
  const [sort, setSort] = useState({ field: 'name', direction: 'none' })
  const [dialog, setDialog] = useState(null)
  const [newName, setNewName] = useState('')
  const nextId = useRef(initialSites.length + 1)
  const search = query.trim().toLocaleLowerCase('ru')
  const filtered = sites.filter(site => [site.name, ...site.domains].some(value => value.toLocaleLowerCase('ru').includes(search)))
  const sorted = sort.direction === 'none' ? filtered : filtered.toSorted((first, second) => {
    const order = sort.field === 'speed' ? Number(Boolean(first.fast)) - Number(Boolean(second.fast)) : nameOrder.compare(first.name, second.name)
    return sort.direction === 'ascending' ? order : -order
  })
  const count = Math.ceil(sorted.length / pageSize)
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize)
  const selectedCount = visible.filter(site => selection.has(site.id)).length
  const allSelected = visible.length > 0 && selectedCount === visible.length

  function selectSites(ids, checked) {
    setSelection(current => {
      const next = new Set(current)
      ids.forEach(id => checked ? next.add(id) : next.delete(id))
      return next
    })
  }

  function changeSort(field, direction) {
    setSort({ field, direction })
    setPage(1)
  }

  function createSite(event) {
    event.preventDefault()
    const name = newName.trim()
    if (!name) return
    const site = { id: nextId.current++, name, domains: [], details: standardDetails }
    setSites(current => [site, ...current])
    setQuery('')
    setSort({ field: 'name', direction: 'none' })
    setPage(1)
    setNewName('')
    setDialog(null)
  }

  return <div className="my-sites-content">
    <div className="my-sites-toolbar">
      <SearchField size={40} label="Поиск по сайтам и доменам" placeholder="Поиск…" value={query}
        icon={<img src={searchIcon} alt="" />} onChange={event => { setQuery(event.target.value); setPage(1) }} />
      <Button variant="outline" size={40} onClick={() => setDialog('transfer')}>Перенести сайт</Button>
      <Button size={40} icon={<img src={createIcon} alt="" />} onClick={() => setDialog('create')}>Создать сайт</Button>
    </div>

    <TableFrame className="my-sites-table-frame" scrollable={false}>
      <table className="my-sites-table" aria-label="Мои сайты">
        <colgroup><col className="my-sites-check-column" /><col /><col className="my-sites-speed-column" /><col className="my-sites-domain-column" /><col className="my-sites-details-column" /></colgroup>
        <thead>
          <tr>
            <th scope="col"><Choice as="span" size={20} aria-label="Выбрать сайты на этой странице" disabled={!visible.length}
              checked={allSelected} indeterminate={selectedCount > 0 && !allSelected}
              onChange={event => selectSites(visible.map(site => site.id), event.target.checked)} /></th>
            <SortHeader direction={sort.field === 'name' ? sort.direction : 'none'} onChange={direction => changeSort('name', direction)}>Сайт</SortHeader>
            <SortHeader className="my-sites-speed-cell" sortType="number" direction={sort.field === 'speed' ? sort.direction : 'none'}
              onChange={direction => changeSort('speed', direction)}>Скорость</SortHeader>
            <th scope="col">Привязанные домены</th>
            <th className="my-sites-details-cell" scope="col">Детали</th>
          </tr>
        </thead>
        <tbody>
          {visible.map(site => (
            <tr key={site.id} data-selected={selection.has(site.id) || undefined}>
              <td><Choice as="span" size={20} aria-label={`Выбрать сайт ${site.name}`} checked={selection.has(site.id)}
                onChange={event => selectSites([site.id], event.target.checked)} /></td>
              <th scope="row">
                <div className="my-sites-name">
                  <img src={folderIcon} alt="" />
                  <div>
                    <span className="my-sites-truncate" title={site.name}>{site.name}</span>
                    {(site.paused || site.comment) && <p className="my-sites-truncate my-sites-note" data-paused={site.paused} title={site.comment}>
                      {site.paused ? paused : site.comment}
                    </p>}
                    <p className="my-sites-compact-details my-sites-note">{site.details}</p>
                  </div>
                </div>
              </th>
              <td className="my-sites-speed-cell">
                <img src={site.fast ? highSpeedIcon : lowSpeedIcon} alt={site.fast ? 'Скорость 100%' : 'Скорость 30%'} />
              </td>
              <td><SiteDomains domains={site.domains} attackedDomains={attackedDomains} renderAttackMark={renderAttackMark} /></td>
              <td className="my-sites-details-cell"><span className="my-sites-truncate" title={site.details}>{site.details}</span></td>
            </tr>
          ))}
          {!visible.length && <tr><td colSpan={5} className="my-sites-empty">Сайты не найдены</td></tr>}
        </tbody>
      </table>
    </TableFrame>

    <div className="my-sites-pagination"><Pagination page={page} count={count} onChange={setPage} label="Страницы списка сайтов" /></div>
    <ProtectionFaq questions={questions} icon={<img src={faqIcon} alt="" />} />

    <Dialog open={dialog === 'create'} title="Создать сайт" onClose={() => { setNewName(''); setDialog(null) }}>
      <form className="my-sites-create-form" onSubmit={createSite}>
        <TextField label="Название сайта" value={newName} required onChange={event => setNewName(event.target.value)} />
        <Button type="submit" disabled={!newName.trim()}>Создать сайт</Button>
      </form>
    </Dialog>
    <Dialog open={dialog === 'transfer'} title="Перенести сайт" onClose={() => setDialog(null)}
      description="Чтобы перенести сайт с другого хостинга, загрузите его файлы и базу данных, а затем привяжите домен. За помощью с переносом можно обратиться в поддержку."
      actions={<Button as="a" href="https://timeweb.com/ru/contacts/" target="_blank" rel="noopener noreferrer">Обратиться в поддержку</Button>} />
  </div>
}
