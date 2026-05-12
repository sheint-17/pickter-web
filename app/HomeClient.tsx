'use client'

import { useState, useEffect } from 'react'
import { Issue } from '@/types'
import { FeaturedCarousel } from '@/components/pickter/featured-carousel'
import { HeroSidebar } from '@/components/pickter/hero-sidebar'
import { IssueGrid } from '@/components/pickter/issue-grid'

export interface TrendingIssue {
  id: string
  title: string
  percent: number
  volume: number
}

export interface TopRanker {
  id: string
  nickname: string
  tier: string
  rp_total: number
}

interface Props {
  issues: Issue[]
  trendingIssues: TrendingIssue[]
  topRankers: TopRanker[]
  activeCategory: string
}

const categoryTitle: Record<string, string> = {
  hot: '🔥 인기 이슈',
  all: '전체 이슈',
  politics: '🏛️ 정치',
  economy: '💹 경제',
  entertainment: '🎬 엔터테인먼트',
  sports: '⚽ 스포츠',
  tech: '💻 IT · 테크',
  social: '🧑‍🤝‍🧑 사회 · 문화',
  other: '🗂️ 기타',
}

export default function HomeClient({ issues, trendingIssues, topRankers, activeCategory }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isHeroCategory = activeCategory === 'hot' || activeCategory === 'all'

  return (
    <div style={{
      width: '100%',
      maxWidth: '1280px',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: isMobile ? '16px 12px' : '24px',
      boxSizing: 'border-box',
    }}>

      {/* 히어로 섹션: hot/all일 때만 캐러셀 + 사이드바 표시 */}
      {isHeroCategory && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'stretch',
        }}>
          <FeaturedCarousel />
          {/* 모바일에서는 사이드바 숨김 (이슈 카드로 충분) */}
          {!isMobile && (
            <HeroSidebar
              trendingIssues={trendingIssues}
              topRankers={topRankers}
            />
          )}
        </div>
      )}

      {/* 이슈 그리드 */}
      <section>
        <h2 style={{
          fontSize: isMobile ? '17px' : '20px',
          fontWeight: 700,
          marginBottom: '16px',
          color: '#171717',
        }}>
          {categoryTitle[activeCategory] ?? '진행 중인 이슈'}
        </h2>
        <IssueGrid issues={issues} />
      </section>
    </div>
  )
}
