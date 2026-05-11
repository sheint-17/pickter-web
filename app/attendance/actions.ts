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
  pointGiven?: number
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

  const { data: attendance, error: insertError } = await supabase
    .from('attendance')
    .insert({ user_id: user.id, attended_at: today, point_given: 100 })
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return { success: false, error: '오늘은 이미 출석했어요' }
    }
    return { success: false, error: '출석 처리 중 오류가 발생했어요' }
  }

  const { data: records } = await supabase
    .from('attendance')
    .select('attended_at')
    .eq('user_id', user.id)
    .order('attended_at', { ascending: false })
    .limit(100)

  const streak = calcStreak(records ?? [], today)
  const isWeekBonus = streak % 7 === 0
  const pointGiven = isWeekBonus ? 600 : 100

  if (isWeekBonus) {
    await supabase
      .from('attendance')
      .update({ point_given: pointGiven })
      .eq('id', attendance.id)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('point_balance')
    .eq('id', user.id)
    .single()

  const newBalance = (profile?.point_balance ?? 0) + pointGiven

  await supabase
    .from('users')
    .update({ point_balance: newBalance, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  await supabase
    .from('point_history')
    .insert({
      user_id: user.id,
      amount: pointGiven,
      reason: isWeekBonus ? '출석 체크 (7일 연속 보너스)' : '출석 체크',
      reference_id: attendance.id,
      balance_after: newBalance,
    })

  revalidatePath('/attendance')
  revalidatePath('/mypage')

  return { success: true, pointGiven, streak, isWeekBonus }
}
