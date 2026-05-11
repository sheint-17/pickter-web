'use client'

import { useAuthModal } from './AuthModalProvider'

export function GNBAuthButtons() {
  const { openLogin, openSignup } = useAuthModal()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        onClick={openLogin}
        style={{
          padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
          background: 'transparent', color: '#171717',
          border: '1px solid #E5E7EB', cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        로그인
      </button>
      <button
        onClick={openSignup}
        style={{
          padding: '8px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
          background: '#7B2FBE', color: 'white',
          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        가입
      </button>
    </div>
  )
}
