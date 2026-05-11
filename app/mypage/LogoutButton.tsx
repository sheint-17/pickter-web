'use client'

import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: '100%',
        padding: '13px',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        background: 'white',
        color: '#EF4444',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: '24px',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}
    >
      로그아웃
    </button>
  )
}
