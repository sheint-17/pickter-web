'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Colors } from '@/constants/colors'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DashboardStats {
  totalUsers: number
  todaySignups: number
  weekSignups: number
  activeIssues: number
  todayTrades: number
  todayAttendance: number
  onlineUsers: number
  tierDistribution: { tier: string; count: number }[]
  recentUsers: { nickname: string; tier: string; created_at: string }[]
}

const TIER_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster']

function StatCard({
  label, value, sub, accent, icon,
}: {
  label: string; value: string | number; sub?: string; accent?: string; icon: string
}) {
  return (
    <div style={{
      background: Colors.white, border: `1px solid ${Colors.border}`,
      borderRadius: '12px', padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: Colors.cardShadow,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: Colors.textTertiary, fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: accent ?? Colors.textPrimary, lineHeight: 1 }}>
        {value.toLocaleString()}
      </div>
      {sub && <div style={{ fontSize: '12px', color: Colors.textTertiary }}>{sub}</div>}
    </div>
  )
}

function TierBar({ tier, count, max }: { tier: string; count: number; max: number }) {
  const color = Colors.tier[tier as keyof typeof Colors.tier] ?? Colors.textTertiary
  const pct = max > 0 ? Math.max((count / max) * 100, 2) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <div style={{ width: '80px', fontSize: '12px', fontWeight: 600, color, flexShrink: 0 }}>{tier}</div>
      <div style={{ flex: 1, height: '8px', background: Colors.background, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
      </div>
      <div style={{ width: '36px', textAlign: 'right', fontSize: '12px', color: Colors.textSecondary }}>{count}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchStats = useCallback(async () => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).toISOString()

    const [
      { count: totalUsers },
      { count: todaySignups },
      { count: weekSignups },
      { count: activeIssues },
      { count: todayTrades },
      { count: todayAttendance },
      { data: tierData },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('trades').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('attended_at', now.toISOString().slice(0, 10)),
      supabase.from('users').select('tier'),
      supabase.from('users').select('nickname, tier, created_at').order('created_at', { ascending: false }).limit(5),
    ])

    const tierMap: Record<string, number> = {}
    for (const u of tierData ?? []) {
      tierMap[u.tier] = (tierMap[u.tier] ?? 0) + 1
    }
    const tierDistribution = TIER_ORDER.map(t => ({ tier: t, count: tierMap[t] ?? 0 }))

    setStats(prev => ({
      totalUsers: totalUsers ?? 0,
      todaySignups: todaySignups ?? 0,
      weekSignups: weekSignups ?? 0,
      activeIssues: activeIssues ?? 0,
      todayTrades: todayTrades ?? 0,
      todayAttendance: todayAttendance ?? 0,
      onlineUsers: prev?.onlineUsers ?? 0, // presence 카운트는 유지
      tierDistribution,
      recentUsers: recentUsers ?? [],
    }))
    setLastUpdated(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()

    // GNB가 이미 'global-presence' 채널을 subscribe 중이므로
    // 새 채널을 만들지 않고 3초마다 기존 채널의 presenceState를 폴링
    const syncInterval = setInterval(() => {
      const channels = supabase.getChannels()
      const globalCh = channels.find(
        ch => (ch as any).topic === 'realtime:global-presence'
      )
      if (globalCh) {
        const state = globalCh.presenceState()
        const count = Object.keys(state).length
        setStats(prev => prev ? { ...prev, onlineUsers: count } : prev)
      }
    }, 3_000)

    // 30초마다 DB 지표 갱신
    const interval = setInterval(fetchStats, 30_000)

    return () => {
      clearInterval(syncInterval)
      clearInterval(interval)
    }
  }, [fetchStats])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: Colors.textTertiary }}>
        대시보드 로딩 중...
      </div>
    )
  }

  if (!stats) return null

  const maxTierCount = Math.max(...stats.tierDistribution.map(t => t.count), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: Colors.textPrimary }}>서비스 현황</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: Colors.textTertiary }}>
              {lastUpdated.toLocaleTimeString('ko-KR')} 기준 (30초 자동갱신)
            </span>
          )}
          <button
            onClick={fetchStats}
            style={{
              fontSize: '12px', padding: '5px 12px',
              background: Colors.primaryLight, color: Colors.primary,
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 핵심 지표 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard icon="👥" label="총 가입자" value={stats.totalUsers} sub="누적 전체" />
        <StatCard icon="🟢" label="동시 접속" value={stats.onlineUsers} sub="Realtime 기준" accent={Colors.yes} />
        <StatCard icon="🆕" label="오늘 가입" value={stats.todaySignups} sub={`이번 주 ${stats.weekSignups}명`} accent={Colors.primary} />
        <StatCard icon="🔥" label="진행 중 이슈" value={stats.activeIssues} sub="active 상태" />
        <StatCard icon="📊" label="오늘 거래" value={stats.todayTrades} sub="매수+매도 합산" accent="#F59E0B" />
        <StatCard icon="✅" label="오늘 출석" value={stats.todayAttendance} sub="출석체크 완료" />
      </div>

      {/* 하단 2컬럼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* 티어 분포 */}
        <div style={{
          background: Colors.white, border: `1px solid ${Colors.border}`,
          borderRadius: '12px', padding: '16px 20px', boxShadow: Colors.cardShadow,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '14px' }}>
            🏆 티어 분포
          </div>
          {stats.tierDistribution.map(({ tier, count }) => (
            <TierBar key={tier} tier={tier} count={count} max={maxTierCount} />
          ))}
        </div>

        {/* 최근 가입자 */}
        <div style={{
          background: Colors.white, border: `1px solid ${Colors.border}`,
          borderRadius: '12px', padding: '16px 20px', boxShadow: Colors.cardShadow,
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '14px' }}>
            🆕 최근 가입자
          </div>
          {stats.recentUsers.length === 0 ? (
            <p style={{ color: Colors.textTertiary, fontSize: '13px' }}>가입자 없음</p>
          ) : (
            stats.recentUsers.map((u, i) => {
              const tierColor = Colors.tier[u.tier as keyof typeof Colors.tier] ?? Colors.textTertiary
              const timeAgo = getTimeAgo(u.created_at)
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: i < stats.recentUsers.length - 1 ? `1px solid ${Colors.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: tierColor, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: Colors.textPrimary }}>{u.nickname}</span>
                    <span style={{ fontSize: '11px', color: tierColor, fontWeight: 600 }}>{u.tier}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: Colors.textTertiary }}>{timeAgo}</span>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}

function getTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}
