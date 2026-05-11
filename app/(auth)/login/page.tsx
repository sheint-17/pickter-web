'use client'

import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  
  async function handleGoogleLogin() {
    console.log('버튼 클릭됨!')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })
    console.log('data:', data)
    console.log('error:', error)
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>
        PICK<span style={{ color: '#7B2FBE' }}>TER</span>
      </h1>
      <p style={{ color: '#999' }}>예측이 계급이 되는 곳</p>
      <button
        onClick={handleGoogleLogin}
        style={{
          padding: '12px 24px',
          background: '#7B2FBE',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
        }}
      >
        구글로 시작하기
      </button>
    </main>
  )
}