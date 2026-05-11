// app/ranking/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Colors } from '@/constants/colors'
import { TierBadge } from '@/components/ui/badge'
import { UserTier } from '@/types'

export default async function RankingPage() {
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

  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, tier, rp_total')
    .order('rp_total', { ascending: false })
    .limit(50)

  return (
    <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>
        🏆 랭킹
      </h2>

      {users && users.length > 0 ? (
        users.map((user, index) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: Colors.white,
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '8px',
              border: `1px solid ${Colors.border}`,
            }}
          >
            <span style={{
              width: '28px',
              fontSize: index < 3 ? '18px' : '14px',
              fontWeight: 700,
              color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : Colors.textTertiary,
              textAlign: 'center',
              flexShrink: 0,
            }}>
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
            </span>

            <TierBadge tier={(user.tier as UserTier) ?? 'Unranked'} />

            <span style={{
              flex: 1,
              fontSize: '15px',
              fontWeight: 600,
              color: Colors.textPrimary,
            }}>
              {user.nickname}
            </span>

            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: Colors.primary,
            }}>
              {user.rp_total.toLocaleString()} RP
            </span>
          </div>
        ))
      ) : (
        <p style={{ color: Colors.textTertiary, fontSize: '14px' }}>랭킹 데이터가 없어요</p>
      )}
    </main>
  )
}
