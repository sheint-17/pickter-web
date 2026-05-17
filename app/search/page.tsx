import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Issue } from '@/types'
import { IssueGrid } from '@/components/pickter/issue-grid'

interface Props {
  searchParams: Promise<{ q?: string }>
}

// 한글 카테고리명 → DB enum 매핑
const CATEGORY_MAP: Record<string, string> = {
  '정치': 'politics',
  '경제': 'economy',
  '연예': 'entertainment',
  '엔터': 'entertainment',
  '스포츠': 'sports',
  '테크': 'tech',
  'it': 'tech',
  'IT': 'tech',
  '사회': 'social',
  '기타': 'etc',
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component에서는 쿠키 쓰기 불가 — 무시 */ }
        },
      },
    }
  )

  let issues: Issue[] = []

  if (query) {
    // 카테고리 매핑 (한글 → enum)
    const mappedCategory = CATEGORY_MAP[query] ?? CATEGORY_MAP[query.toLowerCase()] ?? null

    const [
      { data: byTitle },
      { data: byTag },
      { data: byCategory },
    ] = await Promise.all([
      // 1) 제목 검색
      supabase
        .from('issues')
        .select('*, issue_options!issue_options_issue_id_fkey(*)')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .order('total_volume', { ascending: false }),

      // 2) 태그 검색
      supabase
        .from('issues')
        .select('*, issue_options!issue_options_issue_id_fkey(*)')
        .eq('status', 'active')
        .contains('tags', [query])
        .order('total_volume', { ascending: false }),

      // 3) 카테고리 검색 (한글 매핑 성공 시)
      mappedCategory
        ? supabase
            .from('issues')
            .select('*, issue_options!issue_options_issue_id_fkey(*)')
            .eq('status', 'active')
            .eq('category', mappedCategory)
            .order('total_volume', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    // 중복 제거 후 합치기
    const merged = [...(byTitle ?? []), ...(byTag ?? []), ...(byCategory ?? [])]
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

      {query && issues.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF', fontSize: '15px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🔍</div>
          <p style={{ fontWeight: 600, color: '#555', marginBottom: '6px' }}>
            &quot;{query}&quot; 관련 이슈가 없어요
          </p>
          <p>다른 키워드로 검색해보세요</p>
        </div>
      )}

      {issues.length > 0 && <IssueGrid issues={issues} />}
    </div>
  )
}
