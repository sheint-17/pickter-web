import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { TierBadge } from '@/components/ui/badge'
import { UserTier } from '@/types'
import ProposeClient from './ProposeClient'

const SILVER_PLUS = ['Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster']

export default async function ProposePage() {
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

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, tier')
    .eq('id', user.id)
    .single()

  const isSilverPlus = profile?.tier && SILVER_PLUS.includes(profile.tier)

  const { data: myProposals } = await supabase
    .from('issue_proposals')
    .select('id, title, category, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main style={{ padding: '16px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color: Colors.textPrimary, marginBottom: '4px' }}>
        이슈 제안
      </h1>
      <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '20px', marginTop: 0 }}>
        Silver 이상 유저가 직접 이슈를 제안할 수 있어요
      </p>

      {isSilverPlus ? (
        <ProposeClient myProposals={myProposals ?? []} />
      ) : (
        <div style={{
          background: Colors.white, borderRadius: '16px',
          padding: '32px 24px', border: `1px solid ${Colors.border}`,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '28px', marginBottom: '12px' }}>🔒</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '8px' }}>
            Silver 등급 이상만 제안 가능해요
          </p>
          <p style={{ fontSize: '13px', color: Colors.textSecondary, marginBottom: '16px' }}>
            현재 등급: <TierBadge tier={(profile?.tier as UserTier) ?? 'Unranked'} />
          </p>
          <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: 0 }}>
            예측에 참여해 RP를 쌓으면 등급이 올라가요
          </p>
        </div>
      )}
    </main>
  )
}
