'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy, CalendarCheck, Swords, LogOut } from 'lucide-react'

const categories = [
  { id: 'hot', label: '🔥 인기' },
  { id: 'all', label: '전체' },
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'entertainment', label: '엔터' },
  { id: 'sports', label: '스포츠' },
  { id: 'tech', label: 'IT' },
  { id: 'society', label: '사회' },
  { id: 'other', label: '기타' },
]

const menuItems = [
  { icon: Trophy,       label: '랭킹',   href: '/ranking' },
  { icon: CalendarCheck, label: '출석',   href: '/attendance' },
  { icon: Swords,       label: 'AI 대결', href: '/ai-challenge' },
]

const pillStyle = {
  padding: '6px 14px', borderRadius: '999px',
  fontSize: '13px', fontWeight: 500,
  whiteSpace: 'nowrap' as const, cursor: 'pointer',
  background: 'transparent', border: '1px solid #E5E7EB',
  color: '#555', textDecoration: 'none', display: 'inline-flex',
  alignItems: 'center', gap: '5px',
}

export default function CategoryBar() {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user))
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '48px', gap: '8px' }}>

      {/* 카테고리 탭 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        flex: 1, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {categories.map(cat => (
          <button key={cat.id} style={pillStyle}>{cat.label}</button>
        ))}
      </div>

      {/* 넓은 화면 */}
      {!isMobile && (
        <>
          <div style={{ width: '1px', height: '20px', background: '#E5E7EB', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {menuItems.map(({ icon: Icon, label, href }) => (
              <Link key={href} href={href} style={{ ...pillStyle, textDecoration: 'none' }}>
                <Icon size={14} strokeWidth={2} />
                {label}
              </Link>
            ))}
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                style={{ ...pillStyle, color: '#EF4444', borderColor: '#FECACA' }}
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
          <button onClick={() => setOpen(p => !p)} style={pillStyle}>
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
              {isLoggedIn && (
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
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
