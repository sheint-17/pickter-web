'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

type Period = '1h' | '6h' | '1d' | 'all'

const PERIODS: { label: string; value: Period }[] = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '1D', value: '1d' },
  { label: 'ALL', value: 'all' },
]

const PERIOD_MS: Record<Period, number | null> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  'all': null,
}

interface ChartPoint {
  time: string
  percent: number
  percent2?: number
}

interface Props {
  issueId: string
  yesOptionId: string
  // multi 이슈일 때 2번째 선택지 ID + 레이블
  secondOptionId?: string
  secondOptionLabel?: string
  firstOptionLabel?: string
  height?: number
}

function formatTime(iso: string, period: Period): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const month = d.getMonth() + 1
  const day = d.getDate()
  if (period === '1h' || period === '6h') return `${hh}:${mm}`
  if (period === '1d') return `${month}/${day} ${hh}:${mm}`
  return `${month}/${day}`
}

function getTickIndices(data: ChartPoint[], maxTicks = 6): number[] {
  if (data.length <= maxTicks) return data.map((_, i) => i)
  const step = Math.floor(data.length / (maxTicks - 1))
  const indices = Array.from({ length: maxTicks - 1 }, (_, i) => i * step)
  indices.push(data.length - 1)
  return indices
}

function getYDomain(data: ChartPoint[], hasSecond: boolean): [number, number] {
  if (data.length === 0) return [0, 100]
  const values = data.flatMap(d => hasSecond ? [d.percent, d.percent2 ?? d.percent] : [d.percent])
  const min = Math.min(...values)
  const max = Math.max(...values)
  const lo = Math.max(0, Math.floor((min - 5) / 5) * 5)
  const hi = Math.min(100, Math.ceil((max + 5) / 5) * 5)
  return [lo, hi]
}

// 커스텀 툴팁 — multi는 두 값 모두 표시
function CustomTooltip({ active, payload, label, firstLabel, secondLabel }: {
  active?: boolean
  payload?: { value: number; dataKey: string }[]
  label?: string
  firstLabel?: string
  secondLabel?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1A1A1A', borderRadius: '8px', padding: '8px 12px',
      fontSize: '12px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    }}>
      <div style={{ color: '#999', marginBottom: '4px', fontSize: '11px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 600, fontSize: '13px', color: i === 0 ? Colors.yes : '#A78BFA', marginTop: '2px' }}>
          <span style={{ fontSize: '11px', fontWeight: 400, marginRight: '4px' }}>
            {i === 0 ? (firstLabel ?? '1위') : (secondLabel ?? '2위')}
          </span>
          {p.value}%
        </div>
      ))}
    </div>
  )
}

export default function PriceChart({ issueId, yesOptionId, secondOptionId, firstOptionLabel, secondOptionLabel, height = 240 }: Props) {
  const [period, setPeriod] = useState<Period>('all')
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  const isMulti = !!secondOptionId

  useEffect(() => {
    setLoading(true)
    const ms = PERIOD_MS[period]
    const since = ms ? new Date(Date.now() - ms).toISOString() : null

    const fetchOption = (optionId: string) => {
      let q = supabase
        .from('price_history')
        .select('price, recorded_at')
        .eq('issue_id', issueId)
        .eq('option_id', optionId)
        .order('recorded_at', { ascending: true })
      if (since) q = q.gte('recorded_at', since)
      return q
    }

    const queries = [fetchOption(yesOptionId)]
    if (secondOptionId) queries.push(fetchOption(secondOptionId))

    Promise.all(queries).then(([res1, res2]) => {
      const rows1 = res1.data ?? []
      const rows2 = res2?.data ?? []

      // time 기준으로 머지
      const timeMap: Record<string, ChartPoint> = {}
      rows1.forEach(r => {
        const t = formatTime(r.recorded_at, period)
        timeMap[t] = { time: t, percent: Math.round(Number(r.price) * 100) }
      })
      rows2.forEach(r => {
        const t = formatTime(r.recorded_at, period)
        if (timeMap[t]) timeMap[t].percent2 = Math.round(Number(r.price) * 100)
        else timeMap[t] = { time: t, percent: 0, percent2: Math.round(Number(r.price) * 100) }
      })

      const points = Object.values(timeMap).sort((a, b) => a.time.localeCompare(b.time))
      setData(points)
      setLoading(false)
    })
  }, [issueId, yesOptionId, secondOptionId, period])

  const chartData = data.length >= 2 ? data : []
  const isEmpty = chartData.length < 2
  const yDomain = getYDomain(chartData, isMulti)
  const tickIndices = new Set(getTickIndices(chartData, 6))

  const yTicks: number[] = []
  for (let v = yDomain[0]; v <= yDomain[1]; v += 5) yTicks.push(v)

  const periodButtons = (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
      {PERIODS.map(p => (
        <button key={p.value} onClick={() => setPeriod(p.value)} style={{
          padding: '3px 10px', borderRadius: '6px', border: 'none',
          background: period === p.value ? Colors.textPrimary : 'transparent',
          color: period === p.value ? '#fff' : Colors.textTertiary,
          fontSize: '12px', fontWeight: period === p.value ? 600 : 400,
          cursor: 'pointer', letterSpacing: '0.3px', transition: 'all 0.15s',
        }}>{p.label}</button>
      ))}
    </div>
  )

  const commonAxisProps = {
    tickIndices, chartData, yDomain, yTicks,
  }

  return (
    <div style={{ width: '100%', marginBottom: '24px' }}>
      {periodButtons}

      {/* 범례 (multi만) */}
      {isMulti && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: Colors.textSecondary }}>
            <div style={{ width: '24px', height: '2.5px', background: Colors.yes, borderRadius: '2px' }} />
            {firstOptionLabel ?? '1위'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: Colors.textSecondary }}>
            <div style={{ width: '24px', height: '2.5px', background: '#A78BFA', borderRadius: '2px' }} />
            {secondOptionLabel ?? '2위'}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '13px', color: Colors.textTertiary }}>로딩 중...</span>
        </div>
      ) : isEmpty ? (
        <div style={{
          height: `${height}px`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '8px',
          background: Colors.background,
          borderRadius: '12px',
        }}>
          <span style={{ fontSize: '24px' }}>📊</span>
          <span style={{ fontSize: '13px', color: Colors.textTertiary }}>첫 번째 예측이 차트를 만들어요</span>
        </div>
      ) : isMulti ? (
        // ── Multi: LineChart 2개 라인 ──────────────────────────
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid horizontal vertical={false} stroke={Colors.border} strokeDasharray="3 3" strokeWidth={0.8} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: Colors.textTertiary }} tickLine={false} axisLine={false}
                tickFormatter={(_, index) => tickIndices.has(index) ? chartData[index]?.time ?? '' : ''} interval={0} />
              <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 11, fill: Colors.textTertiary }}
                tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={36} />
              <Tooltip
                content={<CustomTooltip firstLabel={firstOptionLabel} secondLabel={secondOptionLabel} />}
                cursor={{ stroke: Colors.textTertiary, strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Line type="monotone" dataKey="percent" stroke={Colors.yes} strokeWidth={2.5}
                dot={false} activeDot={{ r: 4, fill: Colors.yes, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="percent2" stroke="#A78BFA" strokeWidth={2.5}
                dot={false} activeDot={{ r: 4, fill: '#A78BFA', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // ── Binary: 기존 AreaChart ─────────────────────────────
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={Colors.yes} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={Colors.yes} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal vertical={false} stroke={Colors.border} strokeDasharray="3 3" strokeWidth={0.8} />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: Colors.textTertiary }} tickLine={false} axisLine={false}
                tickFormatter={(_, index) => tickIndices.has(index) ? chartData[index]?.time ?? '' : ''} interval={0} />
              <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 11, fill: Colors.textTertiary }}
                tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={36} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: Colors.textTertiary, strokeWidth: 1, strokeDasharray: '4 2' }} />
              <Area type="monotone" dataKey="percent" stroke={Colors.yes} strokeWidth={2}
                fill="url(#yesGradient)" dot={false} activeDot={{ r: 4, fill: Colors.yes, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
