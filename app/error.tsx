'use client'

import { useEffect } from 'react'
import { Colors } from '@/constants/colors'

const KAKAO_CHANNEL_ID = '_nrxlsX'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // admin_logs에 자동 기록
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message ?? '알 수 없는 오류',
        stack: error.stack ?? '',
        digest: error.digest ?? '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    }).catch(() => {}) // 로그 실패해도 UI에 영향 없게
  }, [error])

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
      {/* 아이콘 */}
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>

      <h2 style={{ fontSize: '20px', fontWeight: 800, color: Colors.textPrimary, margin: '0 0 8px' }}>
        오류가 발생했어요
      </h2>
      <p style={{ fontSize: '14px', color: Colors.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        일시적인 문제가 발생했습니다.<br />
        잠시 후 다시 시도해주세요.
      </p>

      {/* 에러 코드 (digest) */}
      {error.digest && (
        <div style={{
          background: Colors.background, borderRadius: '8px',
          padding: '8px 14px', marginBottom: '24px',
          fontSize: '11px', color: Colors.textTertiary, fontFamily: 'monospace',
        }}>
          오류 코드: {error.digest}
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
        <button
          onClick={reset}
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
