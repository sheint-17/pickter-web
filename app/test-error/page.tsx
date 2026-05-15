'use client'

import { useState } from 'react'
import { Colors } from '@/constants/colors'

const KAKAO_CHANNEL_ID = '_nrxlsX'

// error.tsx UI 그대로 복제 (미리보기용)
function ErrorPreview() {
  const handleKakao = () => {
    window.open(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat`, '_blank')
  }

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', textAlign: 'center',
      maxWidth: '480px', margin: '0 auto',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
      <h2 style={{ fontSize: '20px', fontWeight: 800, color: Colors.textPrimary, margin: '0 0 8px' }}>
        오류가 발생했어요
      </h2>
      <p style={{ fontSize: '14px', color: Colors.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        일시적인 문제가 발생했습니다.<br />
        잠시 후 다시 시도해주세요.
      </p>
      <div style={{
        background: Colors.background, borderRadius: '8px',
        padding: '8px 14px', marginBottom: '24px',
        fontSize: '11px', color: Colors.textTertiary, fontFamily: 'monospace',
      }}>
        오류 코드: SAMPLE_DIGEST_123
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <button
          onClick={() => alert('다시 시도!')}
          style={{
            width: '100%', padding: '13px',
            background: Colors.primary, color: Colors.white,
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          다시 시도하기
        </button>
        <button
          onClick={handleKakao}
          style={{
            width: '100%', padding: '13px',
            background: '#FEE500', color: '#191919',
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2C5.58 2 2 5.02 2 8.74c0 2.38 1.44 4.47 3.62 5.72l-.7 2.57c-.06.22.18.4.37.28L8.4 15.4c.52.08 1.06.12 1.6.12 4.42 0 8-3.02 8-6.74S14.42 2 10 2z" fill="#191919"/>
          </svg>
          카카오톡으로 문의하기
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            width: '100%', padding: '13px',
            background: 'transparent', color: Colors.textSecondary,
            border: `1px solid ${Colors.border}`, borderRadius: '12px',
            fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  )
}

export default function TestErrorPage() {
  const [show, setShow] = useState(false)

  if (show) return <ErrorPreview />

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '12px',
    }}>
      <p style={{ fontSize: '13px', color: Colors.textTertiary }}>
        에러 화면 미리보기 (개발용 — 오픈 전 삭제)
      </p>
      <button
        onClick={() => setShow(true)}
        style={{
          padding: '10px 24px', background: Colors.no, color: 'white',
          border: 'none', borderRadius: '10px', fontSize: '14px',
          fontWeight: 700, cursor: 'pointer',
        }}
      >
        에러 화면 보기
      </button>
    </div>
  )
}
