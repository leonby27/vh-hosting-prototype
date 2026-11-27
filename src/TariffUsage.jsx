import { ProgressBar } from './ui/feedback.jsx'

const sites = { label: 'Сайтов', used: 14, limit: 20 }
const disk = { label: 'Диск', used: 4, limit: 30, unit: ' ГБ' }
const tariffUsage = [sites, disk, { label: 'Нагрузка на CPU', used: 0, limit: 1200 }]
const dashboardDisk = { ...disk, used: 14 }
const fullDashboardDisk = { ...disk, used: 28, tone: 'warning' }
const dashboardOtherUsage = [
  { ...sites, label: 'Сайты', used: 3 },
  { label: 'БД', used: 2, limit: 3 },
]

export default function TariffUsage({ className, dashboard = false, diskWarning = false, tariffCpu = 0 }) {
  const usage = dashboard ? [diskWarning ? fullDashboardDisk : dashboardDisk, ...dashboardOtherUsage]
    : tariffUsage.map(item => item === tariffUsage[2] ? { ...item, used: tariffCpu } : item)
  return <div className={className}>
    {usage.map(({ label, used, limit, unit = '', tone }) => (
      <div key={label} data-tone={tone}>
        <div><span>{label}</span><b>{used} из {limit}{unit}</b></div>
        <ProgressBar label={label} value={used} max={limit} />
      </div>
    ))}
  </div>
}
