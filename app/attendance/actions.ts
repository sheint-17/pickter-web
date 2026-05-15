'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function getKSTDate(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0]
}

function calcStreak(records: { attended_at: string }[], today: string): number {
  const dateSet = new Set(records.map(r => r.attended_at))
  let streak = 0
  const d = new Date(today)
  while (dateSet.has(d.toISOString().split('T')[0])) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

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

  const today = getKSTDate()

  // 출석 기록 INSERT (rp_given: 하루 기본 3 RP)
  const { data: attendance, error: insertError } = await supabase
    .from('attendance')
    .insert({ user_id: user.id, attended_at: today, rp_given: 3 })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: '오늘은 이미 출석했어요' }
    }
    return { success: false, error: '출석 처리 중 오류가 발생했어요' }
  }

  // 연속 출석 계산
  const { data: records } = await supabase
    .from('attendance')
    .select('attended_at')
    .eq('user_id', user.id)
    .order('attended_at', { ascending: false })
    .limit(100)

  const streak = calcStreak(records ?? [], today)
  const isWeekBonus = streak % 7 === 0
  // 하루 3 RP / 7일 연속 보너스 +10 RP → 총 13 RP
  const rpGiven = isWeekBonus ? 13 : 3

  if (isWeekBonus) {
    await supabase
      .from('attendance')
      .update({ rp_given: rpGiven })
      .eq('id', attendance.id)
  }

  // rp_history INSERT → trg_update_rp_total 트리거가 자동으로 rp_total·tier 갱신
  await supabase
    .from('rp_history')
    .insert({
      user_id: user.id,
      amount: rpGiven,
      reason: isWeekBonus ? '출석 체크 (7일 연속 보너스)' : '출석 체크',
    })

  revalidatePath('/attendance')
  revalidatePath('/mypage')

  return { success: true, rpGiven, streak, isWeekBonus }
}
