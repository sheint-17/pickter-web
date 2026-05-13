"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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

interface ChatMsg {
  id: string
  nickname: string
  message: string
  position: 'yes' | 'no' | 'none'
}

const DUMMY_CHART = [
  { percent: 50 }, { percent: 55 }, { percent: 62 }, { percent: 58 },
  { percent: 65 }, { percent: 70 }, { percent: 68 }, { percent: 74 },
  { percent: 71 }, { percent: 75 },
]

const DUMMY_CHATS: Omit<ChatMsg, 'id'>[] = [
  { nickname: 'wcup_nerd', message: '프랑스 우승 확률 너무 높게 잡힌 거 아님?', position: 'no' },
  { nickname: 'notfinadvice', message: 'GPT-5 올해 안에 무조건 나옴 ㄹㅇ', position: 'yes' },
  { nickname: 'quant_vibes', message: '연준 금리 인하 시그널 이미 나왔음', position: 'yes' },
  { nickname: '역배당장인', message: '트럼프 탄핵은 역배당 노리기 딱 좋은 이슈', position: 'yes' },
  { nickname: 'ai_doomer', message: 'AI 기술주 거품 언제 터지냐 진짜', position: 'yes' },
  { nickname: '뉴스읽는곰', message: '손흥민 사우디 안 감 절대로', position: 'no' },
  { nickname: 'kpop_oracle', message: '스파이더맨 흥행 당연하지 MCU잖아', position: 'yes' },
  { nickname: 'throwaway99', message: '비트코인 반감기 사이클 보면 답 나옴', position: 'yes' },
  { nickname: 'wcup_nerd', message: '음바페 부상 변수 있어서 61%도 높음', position: 'no' },
  { nickname: '역배당장인', message: '역배 노리는 사람 나만 있음? ㅋㅋ', position: 'no' },
]

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

function LiveChatBox({ issueId }: { issueId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const loopIdx = useRef(0)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const init = DUMMY_CHATS.slice(0, 3).map((m, i) => ({ ...m, id: `init-${i}` }))
    queueMicrotask(() => setMessages(init))
    loopIdx.current = 3

    const channel = supabase
      .channel(`carousel-chat-${issueId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'issue_chats',
        filter: `issue_id=eq.${issueId}`,
      }, (payload) => {
        const row = payload.new as { id: string; nickname: string; message: string; position: string }
        setMessages(prev => [...prev, {
          id: row.id, nickname: row.nickname, message: row.message,
          position: (row.position as 'yes' | 'no' | 'none') ?? 'none',
        }].slice(-8))
      })
      .subscribe()

    const timer = setInterval(() => {
      const next = DUMMY_CHATS[loopIdx.current % DUMMY_CHATS.length]
      loopIdx.current += 1
      setMessages(prev => [...prev, { ...next, id: `loop-${loopIdx.current}` }].slice(-8))
    }, 2800)

    return () => { clearInterval(timer); supabase.removeChannel(channel) }
  }, [issueId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48px', background: 'linear-gradient(to bottom, #ffffff 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
      <div ref={chatRef} style={{ height: '100%', overflowY: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '6px', paddingTop: '24px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', animation: 'slideUp 0.35s ease-out' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, flexShrink: 0, color: msg.position === 'yes' ? '#00B37D' : msg.position === 'no' ? '#FF4D6D' : '#9CA3AF' }}>{msg.nickname}</span>
            <span style={{ fontSize: '11px', color: '#555', lineHeight: 1.4, wordBreak: 'break-all' }}>{msg.message}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
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
        setChartCache(prev => ({ ...prev, [issue.id]: { data: points.length >= 5 ? points : DUMMY_CHART, dummy: points.length < 5 } }))
      })
  }, [issues, currentIndex, chartCache])

  // closes_at이 바뀔 때마다 diffDays 계산 (Date.now는 effect 안에서만)
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
  const chart = chartCache[issue.id] ?? { data: DUMMY_CHART, dummy: true }
  const yDomain = getYDomain(chart.data)
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

      {/* 2컬럼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {/* 좌측 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '1px' }}>픽</div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#00B37D', lineHeight: 1 }}>{yesPercent}%</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '1px' }}>패스</div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#FF4D6D', lineHeight: 1 }}>{noPercent}%</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '6px' }}>
              <div style={{ width: `${yesPercent}%`, background: '#00B37D', transition: 'width 0.5s' }} />
              <div style={{ width: `${noPercent}%`, background: '#FF4D6D', transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '10px', color: '#00B37D', fontWeight: 600 }}>{yesOption?.label ?? '픽'}</span>
              <span style={{ fontSize: '10px', color: '#FF4D6D', fontWeight: 600 }}>{noOption?.label ?? '패스'}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '8px', flex: 1 }}>
            <div style={{ height: '110px' }}>
              <LiveChatBox issueId={issue.id} />
            </div>
          </div>
        </div>

        {/* 우측: 차트 */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ flex: 1, position: 'relative', minHeight: '180px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart.data} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                <YAxis domain={yDomain} hide />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#D1D5DB', strokeWidth: 1, strokeDasharray: '4 2' }} />
                <Line type="monotone" dataKey="percent" stroke="#00B37D" strokeWidth={2.5}
                  dot={false} activeDot={{ r: 4, fill: '#00B37D', stroke: 'white', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
            {chart.dummy && <span style={{ position: 'absolute', bottom: 0, right: 0, fontSize: '9px', color: '#D1D5DB' }}>* 샘플</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#9CA3AF' }}>
              <Users size={12} />
              <span>{(issue.participant_count ?? 0).toLocaleString()}명</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: '#00B37D', color: 'white', border: 'none', cursor: 'pointer' }}>픽</button>
              </Link>
              <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none' }}>
                <button style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, background: 'white', color: '#FF4D6D', border: '1px solid #FF4D6D', cursor: 'pointer' }}>패스</button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 도트 네비게이션 */}
      {issues.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px' }}>
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
