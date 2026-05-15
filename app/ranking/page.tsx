// app/ranking/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Colors } from '@/constants/colors'
import { TierBadge, TierIcon } from '@/components/ui/badge'
import { UserTier } from '@/types'
import TierRoadmap from '@/components/layout/TierRoadmap'

function RankMedal({ index }: { index: number }) {
  if (index === 0) return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill="#FFF8E0" stroke="#FFD700" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#FFD700"/>
      <circle cx="14" cy="14" r="6" fill="#FFE55C"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#B8860B" fontFamily="sans-serif">1</text>
    </svg>
  )
  if (index === 1) return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill="#F4F4F4" stroke="#C0C0C0" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#C0C0C0"/>
      <circle cx="14" cy="14" r="6" fill="#DDDDDD"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#666" fontFamily="sans-serif">2</text>
    </svg>
  )
  if (index === 2) return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill="#FDF0E6" stroke="#CD7F32" strokeWidth="2"/>
      <circle cx="14" cy="14" r="9" fill="#CD7F32"/>
      <circle cx="14" cy="14" r="6" fill="#E8A060"/>
      <text x="14" y="18" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7A3F10" fontFamily="sans-serif">3</text>
    </svg>
  )
  return (
    <span style={{
      width: '28px', textAlign: 'center', fontSize: '13px',
      fontWeight: 700, color: Colors.textTertiary, flexShrink: 0,
      display: 'inline-block',
    }}>
      {index + 1}
    </span>
  )
}

export default async function RankingPage() {
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

  const { data: users } = await supabase
    .from('users')
    .select('id, nickname, tier, rp_total')
    .order('rp_total', { ascending: false })
    .limit(50)

  return (
    <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>
        랭킹
      </h2>

      {/* 티어 순서도 */}
      <TierRoadmap />

      {/* 랭킹 목록 */}
      {users && users.length > 0 ? (
        users.map((user, index) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: index < 3 ? Colors.white : Colors.white,
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '8px',
              border: index === 0
                ? `1.5px solid #FFD700`
                : index === 1
                ? `1.5px solid #C0C0C0`
                : index === 2
                ? `1.5px solid #CD7F32`
                : `1px solid ${Colors.border}`,
            }}
          >
            {/* 메달 */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px' }}>
              <RankMedal index={index} />
            </div>

            {/* 티어 아이콘 */}
            <TierIcon tier={(user.tier as UserTier) ?? 'Unranked'} size={28} />

            {/* 닉네임 */}
            <span style={{
              flex: 1,
              fontSize: '15px',
              fontWeight: 600,
              color: Colors.textPrimary,
            }}>
              {user.nickname}
            </span>

            {/* RP */}
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
