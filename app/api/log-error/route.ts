import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, stack, digest, url, userAgent, isGlobal } = body

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
            } catch { /* 무시 */ }
          },
        },
      }
    )

    await supabase.from('admin_logs').insert({
      level: 'error',
      source: isGlobal ? 'global-error' : 'client-error',
      message: message?.slice(0, 500) ?? '알 수 없는 오류',
      detail: {
        digest: digest ?? null,
        url: url ?? null,
        userAgent: userAgent?.slice(0, 200) ?? null,
        stack: stack?.slice(0, 1000) ?? null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
