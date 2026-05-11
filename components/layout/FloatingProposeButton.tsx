'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const TIER_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Grandmaster']

export function FloatingProposeButton() {
  const [expanded, setExpanded] = useState(false)
  const [tier, setTier] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('tier').eq('id', user.id).single()
        .then(({ data }) => { if (data) setTier(data.tier) })
    })
  }, [])

  const canPropose = tier !== null && TIER_ORDER.indexOf(tier) >= TIER_ORDER.indexOf('Silver')

  const handleClick = () => {
    if (!canPropose) {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
      return
    }
    setExpanded(prev => !prev)
  }

  return (
    <>
      <div style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 999, display: 'flex', alignItems: 'center', gap: '10px', flexDirection: 'row-reverse' }}>

        <div style={{ maxWidth: expanded ? '160px' : '0px', opacity: expanded ? 1 : 0, overflow: 'hidden', transition: 'max-width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease', flexShrink: 0 }}>
          <Link href="/propose" style={{ textDecoration: 'none' }}>
            <div
              style={{ background: 'white', color: '#7B2FBE', fontSize: '14px', fontWeight: 700, padding: '10px 18px', borderRadius: '999px', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', cursor: 'pointer', border: '2px solid #7B2FBE' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F5F0FF'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              💡 이슈 제안하기
            </div>
          </Link>
        </div>

        <div style={{ position: 'relative', flexShrink: 0 }}>
          {!expanded && (
            <div style={{ position: 'absolute', bottom: '70px', right: '0px', background: 'white', color: '#7B2FBE', fontSize: '12px', fontWeight: 700, padding: '7px 12px', borderRadius: '12px', whiteSpace: 'nowrap', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', border: '1.5px solid #E9D5FF', animation: 'fadeInUp 0.3s ease' }}>
              이슈를 제안하세요!
              <div style={{ position: 'absolute', bottom: '-7px', right: '20px', width: '12px', height: '12px', background: 'white', border: '1.5px solid #E9D5FF', borderTop: 'none', borderLeft: 'none', transform: 'rotate(45deg)' }} />
            </div>
          )}

          <div
            onClick={handleClick}
            style={{ width: '64px', height: '64px', cursor: 'pointer', transition: 'transform 0.2s', transform: expanded ? 'rotate(-15deg)' : 'none', filter: 'drop-shadow(0 4px 12px rgba(123,47,190,0.4))' }}
          >
            <img src="/propose-btn.png" alt="이슈 제안하기" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {showToast && (
        <div style={{ position: 'fixed', bottom: '110px', right: '32px', zIndex: 999, background: '#1A1A1A', color: 'white', padding: '12px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', animation: 'fadeInUp 0.25s ease', whiteSpace: 'nowrap' }}>
          🥈 Silver 등급부터 이슈 제안이 가능해요
          <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px', fontWeight: 400 }}>RP를 쌓아 Silver에 도전해보세요!</div>
        </div>
      )}

      <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  )
}
