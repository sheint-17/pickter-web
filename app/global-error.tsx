'use client'

import { useEffect } from 'react'
import { Colors } from '@/constants/colors'

const KAKAO_CHANNEL_ID = '_nrxlsX'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message ?? '글로벌 오류',
        stack: error.stack ?? '',
        digest: error.digest ?? '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        isGlobal: true,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#F5F5F5' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '32px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>🚨</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px' }}>
            서비스 오류가 발생했어요
          </h1>
          <p style={{ fontSize: '14px', color: '#555', margin: '0 0 24px', lineHeight: 1.6 }}>
            불편을 드려 죄송합니다.<br />
            빠르게 복구하겠습니다.
          </p>

          {error.digest && (
            <div style={{
              background: '#EBEBEB', borderRadius: '8px',
              padding: '8px 14px', marginBottom: '24px',
              fontSize: '11px', color: '#999', fontFamily: 'monospace',
            }}>
              오류 코드: {error.digest}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '360px' }}>
            <button
              onClick={reset}
              style={{
                width: '100%', padding: '13px',
                background: '#7B2FBE', color: '#fff',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              다시 시도하기
            </button>
            <button
              onClick={() => window.open(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat`, '_blank')}
              style={{
                width: '100%', padding: '13px',
                background: '#FEE500', color: '#191919',
                border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              카카오톡으로 문의하기
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
