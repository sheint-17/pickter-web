'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Props {
  isOpen: boolean
  mode: 'login' | 'signup'
  onClose: () => void
  onModeChange: (mode: 'login' | 'signup') => void
}

export function AuthModal({ isOpen, mode, onClose, onModeChange }: Props) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGoogleLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/callback` },
    })
    setLoading(false)
  }

  const handleKakaoLogin = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/callback`,
        scopes: 'profile_nickname profile_image',
      },
    })
    setLoading(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, animation: 'fadeIn 0.2s ease' }} />

      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 1001,
        background: 'white', borderRadius: '20px', padding: '36px 32px',
        width: '100%', maxWidth: '400px', boxSizing: 'border-box',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', animation: 'slideUp 0.25s ease',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF', lineHeight: 1 }}>✕</button>

        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '6px' }}>
            <span style={{ color: '#7B2FBE' }}>PICK</span><span style={{ color: '#00B37D' }}>TER</span>
          </div>
          <p style={{ fontSize: '14px', color: '#9CA3AF', margin: 0 }}>
            {mode === 'login' ? '세상보다 먼저 맞혀라' : '지금 시작하면 1,000P 무료 지급'}
          </p>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', background: '#F4F4F5', borderRadius: '10px', padding: '4px', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map((m) => (
            <button key={m} onClick={() => onModeChange(m)} style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              background: mode === m ? 'white' : 'transparent',
              color: mode === m ? '#171717' : '#9CA3AF',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
              {m === 'login' ? '로그인' : '가입하기'}
            </button>
          ))}
        </div>

        {/* 구글 로그인 */}
        <button onClick={handleGoogleLogin} disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: '10px', border: '1px solid #E5E7EB',
          background: 'white', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '15px', fontWeight: 600, color: '#171717',
          opacity: loading ? 0.7 : 1, marginBottom: '10px',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? '로그인 중...' : 'Google로 계속하기'}
        </button>

        {/* 카카오 로그인 */}
        <button onClick={handleKakaoLogin} disabled={loading} style={{
          width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
          background: '#FEE500', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          fontSize: '15px', fontWeight: 600, color: '#191919',
          opacity: loading ? 0.7 : 1, marginBottom: '20px',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
            <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.68 5.07 4.2 6.48L5.1 21l4.68-2.52c.72.12 1.47.18 2.22.18 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
          </svg>
          카카오로 계속하기
        </button>

        <p style={{ fontSize: '12px', color: '#9CA3AF', textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
          {mode === 'signup' ? '가입 시 픽터의 이용약관 및 개인정보처리방침에 동의합니다' : '계정이 없으신가요?'}{' '}
          {mode === 'login' && (
            <button onClick={() => onModeChange('signup')} style={{ background: 'none', border: 'none', color: '#7B2FBE', fontWeight: 600, cursor: 'pointer', fontSize: '12px', padding: 0 }}>
              가입하기
            </button>
          )}
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -48%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  )
}
