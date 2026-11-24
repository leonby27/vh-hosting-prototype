import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

const plotWidth = 373
const plotHeight = 126
const markerRadius = 3
const markerInset = markerRadius + 1
const animationDuration = 280

// Sample coordinates from the dashboard's CPU chart in Figma.
const cpuPoints = [
  [4, 122], [24, 87], [43, 94], [62, 4], [81, 26], [100, 15], [119, 57],
  [139, 54], [158, 75], [177, 54], [196, 28], [215, 55], [234, 61], [254, 102],
  [273, 67], [292, 86], [311, 60], [330, 12], [350, 28], [369, 6],
]

const mobileCpuCrop = 64
const mobileCpuTop = 70
const mobilePlotHeight = 193

function getPlot(metric, compact, highLoad) {
  if (metric.value === 'CPU') {
    const points = compact ? cpuPoints.slice(3).map(([x, y]) => [
      Math.max(markerInset, (x - mobileCpuCrop) * plotWidth / (plotWidth - mobileCpuCrop)),
      (y + mobileCpuTop) * plotHeight / mobilePlotHeight,
    ]) : cpuPoints

    return { points, warning: compact || highLoad ? 1 : 0 }
  }

  const values = compact ? metric.values.slice(0, 17) : metric.values
  return {
    points: values.map((value, index) => [
      markerInset + (plotWidth - 2 * markerInset) * index / (values.length - 1),
      plotHeight - markerInset - (plotHeight - 2 * markerInset) * value / metric.limit,
    ]),
    warning: 0,
  }
}

export default function DashboardMetricPlot({ metric, compact, highLoad }) {
  const id = useId()
  const target = useMemo(() => getPlot(metric, compact, highLoad), [metric, compact, highLoad])
  const [frame, setFrame] = useState(target)
  const current = useRef(target)

  useLayoutEffect(() => {
    const start = current.current
    if (start === target) return

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let animation

    function show(next) {
      current.current = next
      setFrame(next)
    }

    function finish() {
      cancelAnimationFrame(animation)
      show(target)
    }

    if (motion.matches || start.points.length !== target.points.length) {
      show(target)
      return
    }

    const startedAt = performance.now()

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / animationDuration)
      if (progress === 1) {
        finish()
        return
      }

      const eased = 1 - (1 - progress) ** 3
      show({
        points: start.points.map(([x, y], index) => {
          const [nextX, nextY] = target.points[index]
          return [x + (nextX - x) * eased, y + (nextY - y) * eased]
        }),
        warning: start.warning + (target.warning - start.warning) * eased,
      })
      animation = requestAnimationFrame(tick)
    }

    function updateMotion(event) {
      if (event.matches) finish()
    }

    animation = requestAnimationFrame(tick)
    motion.addEventListener('change', updateMotion)
    return () => {
      cancelAnimationFrame(animation)
      motion.removeEventListener('change', updateMotion)
    }
  }, [target])

  const threshold = compact ? (mobileCpuTop + 46) * plotHeight / mobilePlotHeight : 46
  const thresholdOffset = threshold / plotHeight
  const { points, warning } = frame
  const line = points.map(point => point.join(',')).join(' ')
  const area = `${points[0][0]},${plotHeight} ${line} ${points.at(-1)[0]},${plotHeight}`
  const warningColor = `color-mix(in srgb, var(--hosting-warning-text) ${warning * 100}%, currentColor)`

  return <div className="dashboard-metric-plot" style={{ '--dashboard-plot-warning': warningColor }}>
    <svg viewBox={`0 0 ${plotWidth} ${plotHeight}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`${id}-stroke`} gradientUnits="userSpaceOnUse" x2="0" y2={plotHeight}>
          <stop offset={thresholdOffset} stopColor="var(--dashboard-plot-warning)" />
          <stop offset={thresholdOffset} stopColor="currentColor" />
        </linearGradient>
        <linearGradient id={`${id}-fill`} gradientUnits="userSpaceOnUse" x2="0" y2={plotHeight}>
          <stop offset="0" stopColor="var(--dashboard-plot-warning)" stopOpacity="0.2" />
          <stop offset={thresholdOffset} stopColor="var(--dashboard-plot-warning)" stopOpacity="0.14" />
          <stop offset={thresholdOffset} stopColor="currentColor" stopOpacity="0.14" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id}-fill)`} />
      <polyline points={line} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {!compact && <line x1={markerInset} x2={plotWidth - markerInset} y1={threshold} y2={threshold}
        stroke="var(--hosting-warning-text)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" opacity={warning} />}
    </svg>
    <svg className="dashboard-metric-points" fill="var(--hosting-surface)" strokeWidth="2">
      {points.map(([x, y], index) => <circle key={index} cx={`${100 * x / plotWidth}%`} cy={`${100 * y / plotHeight}%`}
        r={markerRadius} stroke={y < threshold ? 'var(--dashboard-plot-warning)' : 'currentColor'} />)}
    </svg>
  </div>
}
