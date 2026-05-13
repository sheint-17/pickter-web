'use client'

import { useState } from 'react'
import { Colors } from '@/constants/colors'

export default function ResolutionRules({ rules }: { rules: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: Colors.white,
      border: `1px solid #E5E7EB`,
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 700, color: Colors.textPrimary }}>
          📋 정산 규칙
        </span>
        <span style={{
          fontSize: '12px',
          color: Colors.textTertiary,
          transition: 'transform 0.2s',
          display: 'inline-block',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {open && (
        <div style={{
          padding: '0 16px 16px',
          borderTop: `1px solid #F3F4F6`,
        }}>
          <p style={{
            fontSize: '13px',
            color: Colors.textSecondary,
            lineHeight: '1.7',
            whiteSpace: 'pre-wrap',
            margin: '12px 0 0',
          }}>
            {rules}
          </p>
        </div>
      )}
    </div>
  )
}
