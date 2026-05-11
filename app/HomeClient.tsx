'use client'

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
}

export default function HomeClient({ issues, trendingIssues, topRankers }: Props) {
  return (
    <div style={{
      width: '100%',
      maxWidth: '1280px',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'stretch',
      }}>
        <FeaturedCarousel />
        <HeroSidebar
          trendingIssues={trendingIssues}
          topRankers={topRankers}
        />
      </div>

      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#171717' }}>
          진행 중인 이슈
        </h2>
        <IssueGrid issues={issues} />
      </section>
    </div>
  )
}
