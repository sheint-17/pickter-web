'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy, CalendarCheck, LogOut, Lightbulb, Settings } from 'lucide-react'

const categories = [
  { id: 'hot', label: '🔥 인기' },
  { id: 'all', label: '전체' },
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'entertainment', label: '엔터' },
  { id: 'sports', label: '스포츠' },
  { id: 'tech', label: 'IT' },
  { id: 'social', label: '사회' },
  { id: 'other', label: '기타' },
]

const menuItems = [
  { icon: Trophy,        label: '랭킹', href: '/ranking' },
  { icon: CalendarCheck, label: '출석', href: '/attendance' },
]

const TIER_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster']

export default function CategoryBar() {
  const [open, setOpen]           = useState(false)
  const [isMobile, setIsMobile]   = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tier, setTier]           = useState<string | null>(null)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [showToast, setShowToast] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'hot'

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      if (!user) return
      supabase.from('users').select('tier, role').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setTier(data.tier)
            setIsAdmin(data.role === 'admin')
          }
        })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session)
      if (!session) {
        setIsAdmin(false)
        setTier(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleCategoryClick = (id: string) => {
    if (pathname !== '/') {
      router.push(`/?category=${id}`)
    } else {
      router.push(`/?category=${id}`, { scroll: false })
    }
  }

  const handleProposeClick = () => {
    setOpen(false)
    const canPropose = tier !== null && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf('Silver')
    if (!canPropose) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }
    router.push('/propose')
  }

  const pillStyle = (isActive: boolean) => ({
    padding: '6px 14px',
    borderRadius: '999px',
    fontSize: '13px',
    fontWeight: isActive ? 700 : 500,
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    background: isActive ? '#171717' : 'transparent',
    border: `1px solid ${isActive ? '#171717' : '#E5E7EB'}`,
    color: isActive ? '#fff' : '#555',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.15s ease',
  })

  const menuPillStyle = {
    padding: '6px 14px', borderRadius: '999px',
    fontSize: '13px', fontWeight: 500,
    whiteSpace: 'nowrap' as const, cursor: 'pointer',
    background: 'transparent', border: '1px solid #E5E7EB',
    color: '#555', textDecoration: 'none', display: 'inline-flex',
    alignItems: 'center', gap: '5px',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', height: '48px', gap: '8px' }}>

        {/* 카테고리 탭 */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <div className="category-tab-scroll" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            overflowX: 'auto', scrollbarWidth: 'none',
            msOverflowStyle: 'none' as const,
            WebkitOverflowScrolling: 'touch',
          }}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={pillStyle(activeCategory === cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* 페이드 아웃 */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '40px',
            background: 'linear-gradient(to right, transparent, white)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* 데스크탑 */}
        {!isMobile && (
          <>
            <div style={{ width: '1px', height: '20px', background: '#E5E7EB', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {menuItems.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} style={{ ...menuPillStyle, textDecoration: 'none' }}>
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </Link>
              ))}

              {/* 이슈 제안 */}
              <button
                onClick={handleProposeClick}
                style={{ ...menuPillStyle, color: '#7B2FBE', borderColor: '#D8B4FE' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F0FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Lightbulb size={14} strokeWidth={2} />
                이슈 제안
              </button>

              {/* 관리자 메뉴 — admin role만 표시 */}
              {isAdmin && (
                <Link
                  href="/admin"
                  style={{ ...menuPillStyle, textDecoration: 'none', color: '#555', borderColor: '#E5E7EB' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = '#F5F5F5'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  <Settings size={14} strokeWidth={2} />
                  관리자
                </Link>
              )}

              {/* 로그아웃 */}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  style={{ ...menuPillStyle, color: '#EF4444', borderColor: '#FECACA' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} strokeWidth={2} />
                  로그아웃
                </button>
              )}
            </div>
          </>
        )}

        {/* 모바일 */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <Link href="/ranking" style={{ ...menuPillStyle, textDecoration: 'none', padding: '6px 10px' }}>
              <Trophy size={14} strokeWidth={2} />
            </Link>
            <Link href="/attendance" style={{ ...menuPillStyle, textDecoration: 'none', padding: '6px 10px' }}>
              <CalendarCheck size={14} strokeWidth={2} />
            </Link>
            <button
              onClick={handleProposeClick}
              style={{ ...menuPillStyle, color: '#7B2FBE', borderColor: '#D8B4FE', padding: '6px 10px' }}
            >
              <Lightbulb size={14} strokeWidth={2} />
            </button>
            {/* 모바일 관리자 아이콘 */}
            {isAdmin && (
              <Link
                href="/admin"
                style={{ ...menuPillStyle, textDecoration: 'none', padding: '6px 10px' }}
              >
                <Settings size={14} strokeWidth={2} />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Silver 미만 토스트 */}
      {showToast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#1A1A1A', color: 'white',
          padding: '12px 20px', borderRadius: '12px',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          whiteSpace: 'nowrap',
        }}>
          Silver 등급부터 이슈 제안이 가능해요
        </div>
      )}
    </>
  )
}
