import React, { useRef, useState } from 'react'
import { formatDate, daysBetween, WORDS_PER_LINE } from '../../utils'
import type { Book, Reading } from '../../../../shared/types'

const TW = 700, TH = 95, PL = 48, PR = 20, PT = 10, PB = 12
const IW = TW - PL - PR
const IH = TH - PT - PB

const MONTH_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

export interface Segment {
  startTs: number
  endTs: number
  startDate: string
  endDate: string
  wpd: number
  title: string
  author: string
  days: number
  inProgress: boolean
}

function niceMax(v: number): number {
  const mag = Math.pow(10, Math.floor(Math.log10(v || 1)))
  const n = v / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag
}

function getXTicks(xMin: number, xMax: number): { ts: number; label: string }[] {
  const spanDays = (xMax - xMin) / 86400000
  const ticks: { ts: number; label: string }[] = []

  if (spanDays > 365 * 2) {
    const y0 = new Date(xMin).getUTCFullYear()
    const y1 = new Date(xMax).getUTCFullYear()
    for (let y = y0; y <= y1; y++) {
      const ts = Date.UTC(y, 0, 1)
      if (ts >= xMin && ts <= xMax) ticks.push({ ts, label: String(y) })
    }
  } else {
    const d0 = new Date(xMin)
    let y = d0.getUTCFullYear()
    let m = d0.getUTCMonth()
    while (true) {
      const ts = Date.UTC(y, m, 1)
      if (ts > xMax) break
      if (ts >= xMin) ticks.push({ ts, label: `${MONTH_SHORT[m]}'${String(y).slice(2)}` })
      m++
      if (m > 11) { m = 0; y++ }
    }
  }

  return ticks
}

export function buildSegments(books: Book[]): Segment[] {
  const segments: Segment[] = []
  const todayStr = new Date().toISOString().split('T')[0]
  const todayTs = new Date(todayStr).getTime()

  for (const book of books) {
    if ((book.additionalData.pages ?? 0) === 0) continue
    const done = book.readings.filter(
      (r): r is Reading & { endDate: string } =>
        r.completed === true && !!r.startDate && !!r.endDate
    )
    for (const r of done) {
      const words = (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE
      const days = daysBetween(r.startDate, r.endDate)
      segments.push({
        startTs: new Date(r.startDate).getTime(),
        endTs: new Date(r.endDate).getTime(),
        startDate: r.startDate, endDate: r.endDate,
        wpd: words / days, title: book.title, author: book.author, days,
        inProgress: false,
      })
    }
    for (const r of book.readings) {
      if (!r.startDate || r.endDate || r.completed === false) continue
      const words = (book.additionalData.pages ?? 0) * (book.additionalData.linesPerPage ?? 30) * WORDS_PER_LINE
      const days = daysBetween(r.startDate, todayStr)
      segments.push({
        startTs: new Date(r.startDate).getTime(),
        endTs: todayTs,
        startDate: r.startDate, endDate: todayStr,
        wpd: words / days, title: book.title, author: book.author, days,
        inProgress: true,
      })
    }
  }

  segments.sort((a, b) => a.startTs - b.startTs)
  return segments
}

export default function WPDChart({ segments }: { segments: Segment[] }): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  const [xZoom, setXZoom] = useState<{ min: number; max: number } | null>(null)

  React.useEffect(() => {
    if (initializedRef.current || segments.length === 0) return
    initializedRef.current = true
    const aMaxTs = Math.max(...segments.map((s) => s.endTs))
    const aMinTs = Math.min(...segments.map((s) => s.startTs))
    const oneYearAgo = aMaxTs - 365 * 86400000
    if (oneYearAgo > aMinTs) setXZoom({ min: oneYearAgo, max: aMaxTs })
  }, [segments])

  if (segments.length === 0) {
    return <p className="stats-empty">Sin datos suficientes.</p>
  }

  const allMinTs = Math.min(...segments.map((s) => s.startTs))
  const allMaxTs = Math.max(...segments.map((s) => s.endTs))
  const totalSpan = allMaxTs - allMinTs
  const oneYearAgo = allMaxTs - 365 * 86400000
  const defaultZoom = oneYearAgo > allMinTs ? { min: oneYearAgo, max: allMaxTs } : null

  const xMin = xZoom?.min ?? allMinTs
  const xMax = xZoom?.max ?? allMaxTs
  const xSpan = Math.max(xMax - xMin, 86400000)

  const visible = segments.filter((s) => s.endTs >= xMin && s.startTs <= xMax)
  const maxWpd = visible.length > 0 ? Math.max(...visible.map((s) => s.wpd)) : 1000
  const yMax = niceMax(maxWpd)

  const tsToX = (ts: number): number => PL + ((ts - xMin) / xSpan) * IW
  const wpdToY = (wpd: number): number => PT + IH * (1 - wpd / yMax)

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => Math.round(f * yMax))
  const xTicks = getXTicks(xMin, xMax)

  const zoomedSpan = xMax - xMin
  const thumbFrac = totalSpan > 0 ? zoomedSpan / totalSpan : 1
  const scrollableSpan = totalSpan - zoomedSpan
  const thumbLeft = scrollableSpan > 0 ? ((xMin - allMinTs) / scrollableSpan) * (1 - thumbFrac) : 0

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>): void => {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg || totalSpan === 0) return
    const rect = svg.getBoundingClientRect()
    const frac = Math.max(0, Math.min(1, (((e.clientX - rect.left) / rect.width) * TW - PL) / IW))
    const curMin = xZoom?.min ?? allMinTs
    const curMax = xZoom?.max ?? allMaxTs
    const span = curMax - curMin
    const factor = e.deltaY > 0 ? 1.25 : 0.8
    const newSpan = Math.min(Math.max(factor * span, Math.min(30 * 86400000, totalSpan)), totalSpan)
    const pivot = curMin + frac * span
    let newMin = pivot - frac * newSpan
    let newMax = pivot + (1 - frac) * newSpan
    if (newMin < allMinTs) { newMax = Math.min(allMaxTs, newMax + allMinTs - newMin); newMin = allMinTs }
    if (newMax > allMaxTs) { newMin = Math.max(allMinTs, newMin - (newMax - allMaxTs)); newMax = allMaxTs }
    setXZoom(newSpan >= totalSpan * 0.99 ? null : { min: newMin, max: newMax })
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>): void => {
    const svg = svgRef.current
    if (!svg || visible.length === 0) return
    const rect = svg.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * TW
    const svgY = ((e.clientY - rect.top) / rect.height) * TH
    const mouseTs = xMin + ((svgX - PL) / IW) * xSpan

    let best = -1
    let bestDist = Infinity
    visible.forEach((s, i) => {
      const sy = wpdToY(s.wpd)
      const clampedTs = Math.max(s.startTs, Math.min(s.endTs, mouseTs))
      const dx = tsToX(clampedTs) - svgX
      const dy = sy - svgY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < bestDist) { bestDist = dist; best = i }
    })

    if (best >= 0 && bestDist < 12) {
      setHoveredIdx(best)
      setTooltipPos({ x: e.clientX, y: e.clientY })
    } else {
      setHoveredIdx(null)
      setTooltipPos(null)
    }
  }

  const handleMouseLeave = (): void => {
    setHoveredIdx(null)
    setTooltipPos(null)
  }

  const handleThumbMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    const track = trackRef.current
    if (!track || scrollableSpan <= 0) return
    const rect = track.getBoundingClientRect()
    const startClientX = e.clientX
    const capturedXMin = xMin
    const capturedZoomedSpan = zoomedSpan

    const onMouseMove = (me: MouseEvent): void => {
      const dx = (me.clientX - startClientX) / rect.width
      const newMin = Math.max(allMinTs, Math.min(allMaxTs - capturedZoomedSpan, capturedXMin + dx * totalSpan))
      setXZoom({ min: newMin, max: newMin + capturedZoomedSpan })
    }
    const onMouseUp = (): void => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    const track = trackRef.current
    if (!track || scrollableSpan <= 0) return
    const rect = track.getBoundingClientRect()
    const f = (e.clientX - rect.left) / rect.width
    const newThumbLeft = Math.max(0, Math.min(1 - thumbFrac, f - thumbFrac / 2))
    const newMin = allMinTs + (newThumbLeft / (1 - thumbFrac)) * scrollableSpan
    setXZoom({ min: newMin, max: newMin + zoomedSpan })
  }

  const hs = hoveredIdx !== null ? visible[hoveredIdx] : null

  return (
    <div className="stats-chart-wrap">
      <svg
        ref={svgRef}
        className="stats-chart-svg"
        viewBox={`0 0 ${TW} ${TH}`}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="wpd-seg-grad" x1={PL} y1="0" x2={PL + IW} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>

        {yTicks.map((v, i) => {
          const y = wpdToY(v)
          const label = v >= 1000 ? `${Math.round(v / 1000)}K` : String(v)
          return (
            <g key={i}>
              {i > 0 && (
                <line x1={PL} y1={y} x2={PL + IW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              )}
              <text x={PL - 5} y={y + 3} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="end">
                {label}
              </text>
            </g>
          )
        })}

        {xTicks.map(({ ts, label }, i) => {
          const x = tsToX(ts)
          return (
            <g key={i}>
              <line x1={x} y1={PT} x2={x} y2={PT + IH} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={x} y={PT + IH + 10} fontSize="8" fill="rgba(255,255,255,0.3)" textAnchor="middle">
                {label}
              </text>
            </g>
          )
        })}

        <line x1={PL} y1={PT} x2={PL} y2={PT + IH} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        <line x1={PL} y1={PT + IH} x2={PL + IW} y2={PT + IH} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

        {visible.map((s, i) => {
          const x1 = Math.max(PL, tsToX(s.startTs))
          const x2 = Math.min(PL + IW, tsToX(s.endTs))
          const y = wpdToY(s.wpd)
          const h = hoveredIdx === i
          return (
            <line
              key={i}
              x1={x1} y1={y}
              x2={x2} y2={y}
              stroke={s.inProgress ? (h ? '#22d3ee' : '#06b6d4') : (h ? '#93c5fd' : 'url(#wpd-seg-grad)')}
              strokeWidth={h ? 3 : 2}
              strokeOpacity={h ? 1 : 0.7}
              strokeLinecap="round"
              strokeDasharray={s.inProgress ? '5 3' : undefined}
            />
          )
        })}

        {hs && (
          <line
            x1={Math.max(PL, tsToX(hs.startTs))} y1={PT}
            x2={Math.max(PL, tsToX(hs.startTs))} y2={PT + IH}
            stroke="rgba(147,197,253,0.25)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
      </svg>

      {hs && tooltipPos && (
        <div
          className="stats-tooltip"
          style={{
            left: tooltipPos.x + 14 + 240 > window.innerWidth ? tooltipPos.x - 14 - 240 : tooltipPos.x + 14,
            top: tooltipPos.y - 56,
          }}
        >
          <div className="stats-tooltip-title">{hs.title}</div>
          <div className="stats-tooltip-muted">{hs.author}</div>
          <div className="stats-tooltip-row">
            <span>{Math.round(hs.wpd).toLocaleString('es-CO')} pal/día</span>
            <span className="stats-tooltip-muted">{hs.days} días</span>
          </div>
          <div className="stats-tooltip-muted">
            {formatDate(hs.startDate)} → {hs.inProgress ? 'hoy' : formatDate(hs.endDate)}
            {hs.inProgress && ' · en progreso'}
          </div>
        </div>
      )}

      {xZoom && (
        <div className="chart-scroll-row">
          <div ref={trackRef} className="chart-scrollbar" onClick={handleTrackClick}>
            <div
              className="chart-scrollbar-thumb"
              style={{ width: `${thumbFrac * 100}%`, left: `${thumbLeft * 100}%` }}
              onMouseDown={handleThumbMouseDown}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button className="stats-zoom-reset" onClick={() => setXZoom(defaultZoom)}>↺</button>
        </div>
      )}
    </div>
  )
}
