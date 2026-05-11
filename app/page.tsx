// app/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Issue } from '@/types'
import HomeClient from './HomeClient'

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. 진행 중인 이슈 전체
  const { data: issues } = await supabase
    .from('issues')
    .select('*, issue_options!issue_options_issue_id_fkey(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // 2. 급상승 이슈: total_volume 상위 3개
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

  // 3. TOP 3 랭킹
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
    />
  )
}
