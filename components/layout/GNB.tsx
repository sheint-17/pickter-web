'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Bell, Wallet, Search } from 'lucide-react'
import { Colors } from '@/constants/colors'
import type { UserTier } from '@/types'
import { GNBSearch } from './GNBSearch'
import { GNBAuthButtons } from './GNBAuthButtons'
import { supabase } from '@/lib/supabase'

const tierEmoji: Record<UserTier, string> = {
  Unranked: '',
  Bronze: '🥉',
  Silver: '🥈',
  Gold: '🥇',
  Platinum: '💠',
  Diamond: '💎',
  Grandmaster: '👑',
}

export default function GNB() {
  const [isMobile, setIsMobile] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [profile, setProfile] = useState<{ tier: UserTier; point_balance: number } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) return

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
      setUnreadCount(count ?? 0)
      setProfile(profileData)
      return user
    }

    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null

    fetchUser().then((user) => {
      if (!user) return
      // users 테이블 실시간 구독 (포인트·티어 변경 감지)
      realtimeChannel = supabase
        .channel(`gnb-user-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'users',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          const updated = payload.new as { tier: UserTier; point_balance: number }
          setProfile({ tier: updated.tier, point_balance: updated.point_balance })
        })
        .subscribe()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })
    return () => {
      subscription.unsubscribe()
      if (realtimeChannel) supabase.removeChannel(realtimeChannel)
    }
  }, [])

  const iconBtn = (size: number) => ({
    position: 'relative' as const,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: `${size}px`, height: `${size}px`,
    borderRadius: '50%', textDecoration: 'none',
    background: Colors.background, border: `1px solid ${Colors.border}`,
    flexShrink: 0 as const,
  })

  const btnSize = isMobile ? 34 : 40
  const iconSize = isMobile ? 15 : 18

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      height: '60px',
      background: Colors.white, borderBottom: `1px solid ${Colors.border}`, zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto', width: '100%',
        padding: isMobile ? '0 12px' : '0 24px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '100%', boxSizing: 'border-box',
        gap: '12px',
      }}>

        {/* 로고 */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', flexShrink: 0 }}>
          <svg width={isMobile ? 22 : 28} height={isMobile ? 22 : 28} viewBox="0 0 22 22" fill="none">
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
          <span style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>
            <span style={{ color: '#7B2FBE' }}>PICK</span><span style={{ color: '#00B37D' }}>TER</span>
          </span>
        </Link>

        {/* 검색바 — 데스크탑만 */}
        {!isMobile && (
          <div style={{ flex: 1, maxWidth: '480px', margin: '0 auto' }}>
            <GNBSearch />
          </div>
        )}

        {/* 우측 액션 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', flexShrink: 0 }}>
          {user ? (
            <>
              {/* 티어 배지 — 데스크탑만 */}
              {!isMobile && profile && profile.tier !== 'Unranked' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '6px 14px', borderRadius: '999px',
                  background: Colors.tier[profile.tier], color: Colors.white,
                  fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
                }}>
                  {tierEmoji[profile.tier]} {profile.tier}
                </span>
              )}

              {/* 포인트 */}
              {profile && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: isMobile ? '4px 10px' : '6px 14px',
                  borderRadius: '999px',
                  background: Colors.background, color: Colors.textPrimary,
                  fontSize: isMobile ? '12px' : '14px', fontWeight: 700,
                  border: `1px solid ${Colors.border}`, whiteSpace: 'nowrap',
                }}>
                  <Wallet size={isMobile ? 12 : 15} color="#7B2FBE" strokeWidth={2} />
                  {profile.point_balance.toLocaleString()}P
                </span>
              )}

              {/* 모바일: 검색 아이콘 */}
              {isMobile && (
                <Link href="/search" style={iconBtn(btnSize)}>
                  <Search size={iconSize} color="#555" strokeWidth={2} />
                </Link>
              )}

              {/* 알림 */}
              <Link href="/notifications" style={iconBtn(btnSize)}>
                <Bell size={iconSize} color="#555" strokeWidth={2} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: '0px', right: '0px',
                    minWidth: '14px', height: '14px', background: Colors.no,
                    color: Colors.white, fontSize: '9px', fontWeight: 700,
                    borderRadius: '8px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 3px', lineHeight: 1,
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* 아바타 */}
              <Link href="/mypage" style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                  width: `${btnSize}px`, height: `${btnSize}px`,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7B2FBE 0%, #00B37D 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={isMobile ? 14 : 16} color="#fff" />
                </div>
              </Link>
            </>
          ) : (
            <>
              {/* 모바일 비로그인: 검색 아이콘 + 로그인/가입 버튼 */}
              {isMobile && (
                <Link href="/search" style={iconBtn(btnSize)}>
                  <Search size={iconSize} color="#555" strokeWidth={2} />
                </Link>
              )}
              <GNBAuthButtons />
            </>
          )}
        </div>

      </div>
    </header>
  )
}
