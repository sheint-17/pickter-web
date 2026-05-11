import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Issue } from '@/types'
import { IssueGrid } from '@/components/pickter/issue-grid'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''

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

  let issues: Issue[] = []

  if (query) {
    // 제목 검색 (ilike)
    const { data: byTitle } = await supabase
      .from('issues')
      .select('*, issue_options!issue_options_issue_id_fkey(*)')
      .eq('status', 'active')
      .ilike('title', `%${query}%`)
      .order('total_volume', { ascending: false })

    // 태그 검색 (tags 배열에 포함)
    const { data: byTag } = await supabase
      .from('issues')
      .select('*, issue_options!issue_options_issue_id_fkey(*)')
      .eq('status', 'active')
      .contains('tags', [query])
      .order('total_volume', { ascending: false })

    // 중복 제거 후 합치기
    const merged = [...(byTitle ?? []), ...(byTag ?? [])]
    const seen = new Set<string>()
    issues = merged.filter(i => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      return true
    }) as Issue[]
  }

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      {/* 검색 헤더 */}
      <div style={{ marginBottom: '24px' }}>
        {query ? (
          <>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#171717', marginBottom: '6px' }}>
              #{query} 검색 결과
            </h1>
            <p style={{ fontSize: '14px', color: '#9CA3AF' }}>
              {issues.length > 0 ? `${issues.length}개의 이슈를 찾았어요` : '검색 결과가 없어요'}
            </p>
          </>
        ) : (
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#171717' }}>
            검색어를 입력해주세요
          </h1>
        )}
      </div>

      {/* 결과 없을 때 */}
      {query && issues.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          color: '#9CA3AF', fontSize: '15px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontWeight: 600, color: '#555', marginBottom: '6px' }}>
            &quot;{query}&quot; 관련 이슈가 없어요
          </p>
          <p>다른 키워드로 검색해보세요</p>
        </div>
      )}

      {/* 검색 결과 그리드 */}
      {issues.length > 0 && <IssueGrid issues={issues} />}
    </div>
  )
}
