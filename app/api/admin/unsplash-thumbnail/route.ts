// ============================================================
// Unsplash 썸네일 API — 비활성화 (AI 이슈 제안 탭과 함께 비활성화)
// 재활성화 시 아래 주석 해제
// ============================================================

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ url: null })
}

/*
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const keyword = req.nextUrl.searchParams.get('keyword')
  if (!keyword) return NextResponse.json({ url: null })

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) return NextResponse.json({ url: null })

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return NextResponse.json({ url: null })

    const data = await res.json()
    const url = data?.results?.[0]?.urls?.regular ?? null
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}
*/
