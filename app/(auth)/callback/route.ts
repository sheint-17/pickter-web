import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(`${origin}/`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          // ✅ response에 직접 쿠키 심기
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // 신규 유저 체크 — 닉네임이 u_로 시작하면 온보딩으로 이동
  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  console.log('[callback] user.id:', user.id, '| profile:', JSON.stringify(profile))

  // profile이 null이면 트리거 지연 가능성 → 온보딩으로 보냄
  if (!profile || profile?.nickname?.startsWith('u_')) {
    const onboardingResponse = NextResponse.redirect(`${origin}/onboarding`)
    // 쿠키를 온보딩 response에도 동일하게 심기
    response.cookies.getAll().forEach(cookie => {
      onboardingResponse.cookies.set(cookie.name, cookie.value)
    })
    return onboardingResponse
  }

  return response  // ✅ 쿠키 담긴 response 반환
}