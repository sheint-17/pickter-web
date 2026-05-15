// app/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Issue } from '@/types'
import HomeClient from './HomeClient'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const activeCategory = category ?? 'hot'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component에서는 쿠키 쓰기 불가 — 무시 */ }
        },
      },
    }
  )

  // DB 카테고리 ID 매핑 (CategoryBar id → DB enum)
  const categoryMap: Record<string, string> = {
    politics: 'politics',
    economy: 'economy',
    entertainment: 'entertainment',
    sports: 'sports',
    tech: 'tech',
    social: 'social',
    other: 'other',
  }

  // 이슈 쿼리 — hot/all은 필터 없음, 나머지는 category 필터
  let issueQuery = supabase
    .from('issues')
    .select('*, issue_options!issue_options_issue_id_fkey(*)')
    .eq('status', 'active')

  if (activeCategory === 'hot') {
    // 인기: participant_count 내림차순
    issueQuery = issueQuery.order('participant_count', { ascending: false })
  } else if (activeCategory === 'all') {
    issueQuery = issueQuery.order('created_at', { ascending: false })
  } else if (categoryMap[activeCategory]) {
    issueQuery = issueQuery
      .eq('category', categoryMap[activeCategory])
      .order('created_at', { ascending: false })
  } else {
    issueQuery = issueQuery.order('created_at', { ascending: false })
  }

  const { data: issues } = await issueQuery

  // 급상승 이슈: total_volume 상위 3개
  const { data: trendingRaw } = await supabase
    .from('issues')
    .select('id, title, total_volume, issue_options!issue_options_issue_id_fkey(option_type, price)')
    .eq('status', 'active')
    .order('total_volume', { ascending: false })
    .limit(3)

  const trendingIssues = (trendingRaw ?? []).map(issue => {
    const yesOption = (issue.issue_options as { option_type: string; price: number }[])
      .find(o => o.option_type === 'yes')
    return {
      id: issue.id,
      title: issue.title,
      percent: Math.round((yesOption?.price ?? 0.5) * 100),
      volume: issue.total_volume ?? 0,
    }
  })

  // TOP 3 랭킹
  const { data: topRankers } = await supabase
    .from('users')
    .select('id, nickname, tier, rp_total')
    .order('rp_total', { ascending: false })
    .limit(3)

  return (
    <HomeClient
      issues={(issues as Issue[]) ?? []}
      trendingIssues={trendingIssues}
      topRankers={(topRankers ?? []) as { id: string; nickname: string; tier: string; rp_total: number }[]}
      activeCategory={activeCategory}
    />
  )
}
