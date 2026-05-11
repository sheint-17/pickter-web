// components/layout/BackButton.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Colors } from '@/constants/colors'

export default function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: Colors.textPrimary,
        fontSize: '15px',
        fontWeight: 600,
        padding: '0',
        marginBottom: '16px',
      }}
    >
      ← 뒤로
    </button>
  )
}