import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { User, Bell, Wallet } from 'lucide-react'
import { Colors } from '@/constants/colors'
import type { UserTier } from '@/types'
import { GNBSearch } from './GNBSearch'
import { GNBAuthButtons } from './GNBAuthButtons'

const tierEmoji: Record<UserTier, string> = {
  Unranked: '',
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💠',
  Diamond: '💎',
  Grandmaster: '👑',
}

export default async function GNB() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let unreadCount = 0
  let profile: { tier: UserTier; point_balance: number } | null = null

  if (user) {
    const [{ count }, { data: profileData }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
      supabase
        .from('users')
        .select('tier, point_balance')
        .eq('id', user.id)
        .single(),
    ])
    unreadCount = count ?? 0
    profile = profileData
  }

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '72px',
      background: Colors.white, borderBottom: `1px solid ${Colors.border}`, zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', width: '100%',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', boxSizing: 'border-box',
      }}>

        {/* 로고 */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0, marginRight: '48px' }}>
          <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
            <circle cx="3"  cy="3"  r="3" fill="#B08FE8"/>
            <circle cx="11" cy="3"  r="3" fill="#9B6FDB"/>
            <circle cx="19" cy="3"  r="3" fill="#00B37D"/>
            <circle cx="3"  cy="11" r="3" fill="#9B6FDB"/>
            <circle cx="11" cy="11" r="3" fill="#7B2FBE"/>
            <circle cx="19" cy="11" r="3" fill="#9B6FDB"/>
            <circle cx="3"  cy="19" r="3" fill="#7B2FBE"/>
            <circle cx="11" cy="19" r="3" fill="#9B6FDB"/>
            <circle cx="19" cy="19" r="3" fill="#B08FE8"/>
          </svg>
          <span style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#7B2FBE' }}>PICK</span><span style={{ color: '#00B37D' }}>TER</span>
          </span>
        </Link>

        {/* 검색바 */}
        <div style={{ flex: 1, maxWidth: '480px', margin: '0 auto' }}>
          <GNBSearch />
        </div>

        {/* 우측 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '48px' }}>
          {user ? (
            <>
              {/* 티어 배지 */}
              {profile && profile.tier !== 'Unranked' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '6px 14px', borderRadius: '999px',
                  background: Colors.tier[profile.tier], color: Colors.white,
                  fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {tierEmoji[profile.tier]} {profile.tier}
                </span>
              )}

              {/* 포인트 — Wallet 아이콘 */}
              {profile && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '999px',
                  background: Colors.background, color: Colors.textPrimary,
                  fontSize: '14px', fontWeight: 700,
                  border: `1px solid ${Colors.border}`, whiteSpace: 'nowrap',
                }}>
                  <Wallet size={15} color="#7B2FBE" strokeWidth={2} />
                  {profile.point_balance.toLocaleString()}P
                </span>
              )}

              {/* 알림 — Bell 아이콘 */}
              <Link href="/notifications" style={{
                position: 'relative', display: 'flex', alignItems: 'center',
                justifyContent: 'center', width: '40px', height: '40px',
                borderRadius: '50%', textDecoration: 'none',
                background: Colors.background, border: `1px solid ${Colors.border}`,
              }}>
                <Bell size={18} color="#555" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '0px', right: '0px',
                    minWidth: '16px', height: '16px', background: Colors.no,
                    color: Colors.white, fontSize: '10px', fontWeight: 700,
                    borderRadius: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 4px', lineHeight: 1,
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* 아바타 → 마이페이지 */}
              <Link href="/mypage" style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7B2FBE 0%, #00B37D 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={16} color="#fff" />
                </div>
              </Link>
            </>
          ) : (
            <GNBAuthButtons />
          )}
        </div>

      </div>
    </header>
  )
}
