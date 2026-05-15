"use client"

import { TrendingUp, Flame, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { TierIcon } from '@/components/ui/badge'
import type { TrendingIssue, TopRanker } from "@/app/HomeClient"
import type { UserTier } from '@/types'

function RankMedal({ index }: { index: number }) {
  if (index === 0) return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="13" fill="#FFF8E0" stroke="#FFD700" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#FFD700"/>
      <circle cx="14" cy="14" r="6" fill="#FFE55C"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#B8860B" fontFamily="sans-serif">1</text>
    </svg>
  )
  if (index === 1) return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="13" fill="#F4F4F4" stroke="#C0C0C0" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#C0C0C0"/>
      <circle cx="14" cy="14" r="6" fill="#DDDDDD"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#666" fontFamily="sans-serif">2</text>
    </svg>
  )
  return (
    <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r="13" fill="#FDF0E6" stroke="#CD7F32" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#CD7F32"/>
      <circle cx="14" cy="14" r="6" fill="#E8A060"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7A3F10" fontFamily="sans-serif">3</text>
    </svg>
  )
}

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
                <RankMedal index={index} />
                <TierIcon tier={(ranker.tier as UserTier) ?? 'Unranked'} size={22} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate block">
                    {ranker.nickname}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {ranker.rp_total.toLocaleString()}RP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
