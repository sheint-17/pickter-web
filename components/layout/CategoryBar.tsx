'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy, CalendarCheck, Swords, LogOut, Lightbulb } from 'lucide-react'

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
  { icon: Trophy,        label: '랭킹',    href: '/ranking' },
  { icon: CalendarCheck, label: '출석',    href: '/attendance' },
]

const TIER_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster']

export default function CategoryBar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [tier, setTier] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
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
      supabase.from('users').select('tier').eq('id', user.id).single()
        .then(({ data }) => { if (data) setTier(data.tier) })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session)
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
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          flex: 1, overflowX: 'auto', scrollbarWidth: 'none',
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

        {/* 넓은 화면 */}
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
              <button
                onClick={handleProposeClick}
                style={{ ...menuPillStyle, color: '#7B2FBE', borderColor: '#D8B4FE' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F0FF')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Lightbulb size={14} strokeWidth={2} />
                이슈 제안
              </button>
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

        {/* 좁은 화면: 더보기 드롭다운 */}
        {isMobile && (
          <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setOpen(p => !p)} style={menuPillStyle}>
              더보기 {open ? '▲' : '▼'}
            </button>
            {open && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                zIndex: 9999, background: 'white',
                border: '1px solid #E5E7EB', borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                padding: '8px', minWidth: '160px',
              }}>
                {menuItems.map(({ icon: Icon, label, href }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 16px', fontSize: '14px',
                      color: '#1A1A1A', borderRadius: '8px', cursor: 'pointer',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F4F4F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Icon size={15} strokeWidth={2} color="#555" />
                      <span>{label}</span>
                    </div>
                  </Link>
                ))}

                {/* 구분선 */}
                <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 8px' }} />

                {/* 이슈 제안하기 */}
                <div
                  onClick={handleProposeClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', fontSize: '14px',
                    color: '#7B2FBE', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F5F0FF')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Lightbulb size={15} strokeWidth={2} />
                  <span>이슈 제안하기</span>
                </div>

                {isLoggedIn && (
                  <>
                    <div style={{ height: '1px', background: '#F0F0F0', margin: '4px 8px' }} />
                    <div
                      onClick={() => { handleLogout(); setOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 16px', fontSize: '14px',
                        color: '#EF4444', borderRadius: '8px', cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LogOut size={15} strokeWidth={2} />
                      <span>로그아웃</span>
                    </div>
                  </>
                )}
              </div>
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
          🥈 Silver 등급부터 이슈 제안이 가능해요
        </div>
      )}
    </>
  )
}
