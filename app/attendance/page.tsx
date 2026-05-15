import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AttendanceClient from './AttendanceClient'

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

export default async function AttendancePage() {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getKSTDate()

  const [
    { data: todayRecord },
    { data: records },
  ] = await Promise.all([
    supabase
      .from('attendance')
      .select('id')
      .eq('user_id', user.id)
      .eq('attended_at', today)
      .maybeSingle(),
    supabase
      .from('attendance')
      .select('attended_at')
      .eq('user_id', user.id)
      .order('attended_at', { ascending: false })
      .limit(100),
  ])

  const streak = calcStreak(records ?? [], today)
  const attendedDates = (records ?? []).map(r => r.attended_at)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const ms = Date.now() + 9 * 60 * 60 * 1000 - (6 - i) * 24 * 60 * 60 * 1000
    return new Date(ms).toISOString().split('T')[0]
  })

  return (
    <AttendanceClient
      checkedInToday={!!todayRecord}
      streak={streak}
      last7Days={last7Days}
      attendedDates={attendedDates}
    />
  )
}
