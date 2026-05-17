'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function checkIn(): Promise<{
  success: boolean
  error?: string
  rpGiven?: number
  streak?: number
  isWeekBonus?: boolean
}> {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요해요' }

  // 모든 출석 처리 로직은 check_in_today RPC 1개로 통합 (C5)
  //   - 서버 timezone(Asia/Seoul) 기준 today
  //   - users FOR UPDATE 잠금 → 동시 호출 race 차단
  //   - attendance UNIQUE + idempotency_key 두 겹 방어
  //   - RP 부여까지 같은 트랜잭션
  const { data, error } = await supabase.rpc('check_in_today', { p_user_id: user.id })

  if (error) {
    if (error.code === '23505' || error.message?.includes('이미 출석')) {
      return { success: false, error: '오늘은 이미 출석했어요' }
    }
    if (error.message?.includes('차단된 계정')) {
      return { success: false, error: '차단된 계정입니다' }
    }
    return { success: false, error: error.message ?? '출석 처리 중 오류가 발생했어요' }
  }

  revalidatePath('/attendance')
  revalidatePath('/mypage')

  return {
    success: true,
    rpGiven: data.rp_given,
    streak: data.streak,
    isWeekBonus: data.is_week_bonus,
  }
}
