"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Users, ChevronLeft, ChevronRight } from "lucide-react"
import { LineChart, Line, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"

interface IssueOption {
  id: string
  option_type: string
  label: string
  price: number
}

interface FeaturedIssue {
  id: string
  title: string
  category: string
  closes_at: string
  participant_count?: number
  total_volume?: number
  thumbnail_url?: string | null
  issue_options?: IssueOption[]
}

interface ChartEntry {
  data: { percent: number }[]
  dummy: boolean
}

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', etc: '기타',
}

const CATEGORY_EMOJI: Record<string, string> = {
  politics: '🏛️', economy: '📈', entertainment: '🎤',
  sports: '⚽', tech: '💻', social: '🌍', etc: '🎲',
}

function getYDomain(data: { percent: number }[]): [number, number] {
  const values = data.map(d => d.percent)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const lo = Math.max(0, Math.floor((min - 8) / 5) * 5)
  const hi = Math.min(100, Math.ceil((max + 8) / 5) * 5)
  return [lo, hi]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: '#1A1A1A', color: 'white', padding: '5px 10px',
      borderRadius: '6px', fontSize: '13px', fontWeight: 700,
      pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      {payload[0].value}%
    </div>
  )
}

export function FeaturedCarousel() {
  const [issues, setIssues] = useState<FeaturedIssue[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [chartCache, setChartCache] = useState<Record<string, ChartEntry>>({})
  const [diffDays, setDiffDays] = useState(0)

  useEffect(() => {
    supabase.from('issues').select('*, issue_options!issue_options_issue_id_fkey(*)')
      .eq('status', 'active').order('total_volume', { ascending: false }).limit(3)
      .then(({ data }) => { if (data && data.length > 0) setIssues(data as FeaturedIssue[]) })
  }, [])

  useEffect(() => {
    const issue = issues[currentIndex]
    if (!issue || chartCache[issue.id]) return
    const yesOption = issue.issue_options?.find((o: IssueOption) => o.option_type === 'yes')
    if (!yesOption) return
    supabase.from('price_history').select('price, recorded_at')
      .eq('issue_id', issue.id).eq('option_id', yesOption.id)
      .order('recorded_at', { ascending: true }).limit(20)
      .then(({ data }) => {
        const points = (data ?? []).map((r: { price: number }) => ({ percent: Math.round(Number(r.price) * 100) }))
        // 실제 데이터가 5개 미만이면 차트 미표시
        setChartCache(prev => ({ ...prev, [issue.id]: { data: points, dummy: points.length < 5 } }))
      })
  }, [issues, currentIndex, chartCache])

  useEffect(() => {
    const issue = issues[currentIndex]
    if (!issue?.closes_at) return
    const days = Math.max(0, Math.floor(
      (new Date(issue.closes_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))
    queueMicrotask(() => setDiffDays(days))
  }, [issues, currentIndex])

  const nextSlide = useCallback(() => setCurrentIndex(prev => (prev + 1) % Math.max(issues.length, 1)), [issues.length])
  const prevSlide = useCallback(() => setCurrentIndex(prev => (prev - 1 + Math.max(issues.length, 1)) % Math.max(issues.length, 1)), [issues.length])

  useEffect(() => {
    if (!isAutoPlaying || issues.length === 0) return
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide, issues.length])

  if (issues.length === 0) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #F0F0F0', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
        인기 이슈 로딩 중...
      </div>
    )
  }

  const issue = issues[currentIndex]
  if (!issue) return null

  const yesOption = issue.issue_options?.find((o: IssueOption) => o.option_type === 'yes')
  const noOption  = issue.issue_options?.find((o: IssueOption) => o.option_type === 'no')
  const yesPercent = yesOption ? Math.round(yesOption.price * 100) : 50
  const noPercent  = 100 - yesPercent
  const timeLeft = diffDays > 0 ? `${diffDays}일 후 마감` : '마감됨'
  const chart = chartCache[issue.id]
  const hasChart = chart && !chart.dummy && chart.data.length >= 5
  // 실데이터 없으면 현재 확률값 기준선 1개로 표시
  const chartData = hasChart ? chart.data : [{ percent: yesPercent }]
  const yDomain = hasChart ? getYDomain(chart.data) : ([Math.max(0, yesPercent - 20), Math.min(100, yesPercent + 20)] as [number, number])
  const categoryLabel = CATEGORY_KO[issue.category] ?? issue.category
  const emoji = CATEGORY_EMOJI[issue.category] ?? '🎲'

  return (
    <div
      style={{ background: 'white', borderRadius: '16px', border: '1px solid #F0F0F0', padding: '20px', boxSizing: 'border-box' }}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '18px' }}>
        {issue.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issue.thumbnail_url} alt={issue.title} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', flexShrink: 0, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{emoji}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#171717', lineHeight: 1.35, margin: '0 0 6px', letterSpacing: '-0.3px' }}>{issue.title}</h2>
          </Link>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: '#F4F4F5', color: '#555' }}>{categoryLabel}</span>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{timeLeft}</span>
          </div>
        </div>
      </div>

      {/* 확률 + 차트 — 항상 2컬럼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
        {/* 확률 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '1px' }}>픽</div>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#00B37D', lineHeight: 1 }}>{yesPercent}%</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '1px' }}>패스</div>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#FF4D6D', lineHeight: 1 }}>{noPercent}%</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '8px' }}>
              <div style={{ width: `${yesPercent}%`, background: '#00B37D', transition: 'width 0.5s' }} />
              <div style={{ width: `${noPercent}%`, background: '#FF4D6D', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
              <span style={{ fontSize: '11px', color: '#00B37D', fontWeight: 600 }}>{yesOption?.label ?? '픽'}</span>
              <span style={{ fontSize: '11px', color: '#FF4D6D', fontWeight: 600 }}>{noOption?.label ?? '패스'}</span>
            </div>
          </div>
        </div>

        {/* 차트 — 실데이터는 선, 없으면 현재 확률 기준선 */}
        <div style={{ minHeight: '120px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
              <YAxis domain={yDomain} hide />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 2' }} />
              <Line type="monotone" dataKey="percent" stroke="#00B37D" strokeWidth={2.5}
                dot={!hasChart ? { r: 5, fill: '#00B37D', stroke: 'white', strokeWidth: 2 } : false}
                activeDot={{ r: 4, fill: '#00B37D', stroke: 'white', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          {!hasChart && (
            <div style={{ position: 'absolute', bottom: 4, right: 4, fontSize: '10px', color: '#D1D5DB' }}>
              거래 시 차트 표시
            </div>
          )}
        </div>
      </div>

      {/* 하단: 참여자 + 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
          <Users size={13} />
          <span>{(issue.participant_count ?? 0).toLocaleString()}명 참여</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: '#00B37D', color: 'white', border: 'none', cursor: 'pointer' }}>픽</button>
          </Link>
          <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
            <button style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: 'white', color: '#FF4D6D', border: '1px solid #FF4D6D', cursor: 'pointer' }}>패스</button>
          </Link>
        </div>
      </div>

      {/* 도트 네비게이션 */}
      {issues.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {issues.map((_, i) => (
              <button key={i} onClick={() => setCurrentIndex(i)} style={{
                width: i === currentIndex ? '20px' : '6px', height: '6px', borderRadius: '999px', border: 'none', padding: 0,
                background: i === currentIndex ? '#7B2FBE' : '#D1D5DB', cursor: 'pointer', transition: 'all 0.2s',
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={prevSlide} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={13} color="#555" />
            </button>
            <button onClick={nextSlide} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={13} color="#555" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
