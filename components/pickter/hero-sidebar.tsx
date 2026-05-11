"use client"

import { TrendingUp, Flame, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import type { TrendingIssue, TopRanker } from "@/app/HomeClient"

const TIER_COLOR: Record<string, string> = {
  Grandmaster: '#7B2FBE', Diamond: '#4FC3F7', Platinum: '#00C4CC',
  Gold: '#FFD700', Silver: '#C0C0C0', Bronze: '#CD7F32', Unranked: '#AAAAAA',
}

const MEDAL: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

interface Props {
  trendingIssues: TrendingIssue[]
  topRankers: TopRanker[]
}

export function HeroSidebar({ trendingIssues, topRankers }: Props) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>

      {/* 급상승 이슈 */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-orange-500" />
          급상승 이슈
        </h3>
        {trendingIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">데이터 없음</p>
        ) : (
          <div className="space-y-3">
            {trendingIssues.map((item, index) => (
              <div
                key={item.id}
                className="group cursor-pointer flex items-start gap-2"
                onClick={() => router.push(`/issue/${item.id}`)}
              >
                <span className="flex-shrink-0 text-sm font-bold text-muted-foreground w-4 mt-0.5">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold" style={{ color: '#00B37D' }}>
                      {item.percent}%
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      {item.volume.toLocaleString()}P
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP 3 랭킹 — flex:1 로 남은 공간 채움 */}
      <div className="bg-card rounded-xl border border-border p-4" style={{ flex: 1 }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            이번 주 TOP 3
          </h3>
          <button
            onClick={() => router.push('/ranking')}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            더보기
          </button>
        </div>
        {topRankers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {topRankers.map((ranker, index) => (
              <div key={ranker.id} className="flex items-center gap-2 py-1">
                <span className="text-base w-6 flex-shrink-0">{MEDAL[index]}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate block">
                    {ranker.nickname}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: TIER_COLOR[ranker.tier] ?? '#AAAAAA',
                      background: `${TIER_COLOR[ranker.tier] ?? '#AAAAAA'}18`,
                    }}
                  >
                    {ranker.tier}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ranker.rp_total.toLocaleString()}RP
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
