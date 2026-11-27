import { createRoot } from 'react-dom/client'
import { Link, PageHeader, TableFrame, VHTheme } from './ui/index.js'
import { protectionUpdates } from './network-protection-updates.js'
import './styles.css'
import './ui/ui.css'
import './network-protection-updates.css'

function ProtectionUpdatesPage() {
  return (
    <VHTheme className="protection-updates-page">
      <main className="protection-updates-content">
        <PageHeader title="Доработки сетевой защиты" />
        <TableFrame appearance="surface" scrollable={false}>
          <table className="protection-updates-table" role="table" aria-label="Список доработок сетевой защиты">
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">Пункт</th>
                <th scope="col" role="columnheader">Исходная задача</th>
                <th scope="col" role="columnheader">Комментарий</th>
                <th scope="col" role="columnheader">Где посмотреть</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {protectionUpdates.map(({ id, task, details, comment, links }) => (
                <tr role="row" key={id} id={`point-${id}`}>
                  <th scope="row" role="rowheader" aria-label={`Пункт ${id}`}>{id}</th>
                  <td role="cell" className="protection-updates-task">
                    <p>{task}</p>
                    {details && <ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul>}
                  </td>
                  <td role="cell" className="protection-updates-comment">{comment}</td>
                  <td role="cell" className="protection-updates-review">
                    {links?.length ? (
                      <ul className="protection-updates-links">
                        {links.map(({ href, label, step }) => (
                          <li key={href}>
                            <Link href={href} target="_blank" rel="noopener noreferrer">{label}</Link>
                            {step && <span>{step}</span>}
                          </li>
                        ))}
                      </ul>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableFrame>
      </main>
    </VHTheme>
  )
}

createRoot(document.getElementById('root')).render(<ProtectionUpdatesPage />)
