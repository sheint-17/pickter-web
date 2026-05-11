import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/login', '/callback', '/search', '/ranking']

// 로그인 필수 경로 (prefix 기준)
const PROTECTED_PREFIXES = ['/mypage', '/admin', '/propose', '/attendance', '/notifications', '/ai-challenge']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // /issue/[id] 는 공개 (상세 보기는 누구나)
  if (pathname.startsWith('/issue/')) return response

  // 공개 경로는 그냥 통과
  if (PUBLIC_PATHS.includes(pathname)) return response

  // 보호 경로만 인증 체크
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (!isProtected) return response

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
