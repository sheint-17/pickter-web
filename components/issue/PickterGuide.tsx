'use client'

import { useState } from 'react'
import { Colors } from '@/constants/colors'

export default function PickterGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: Colors.white,
      border: '1px solid #E5E7EB',
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
          📖 이 시장은 어떻게 작동하나요?
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
          borderTop: '1px solid #F3F4F6',
        }}>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>📊</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  % = 커뮤니티 예측 확률
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  픽 55%는 커뮤니티가 이 사건이 일어날 확률을 55%로 보고 있다는 뜻이에요.
                  픽 + 패스는 항상 100%예요.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>🎟️</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  포인트 → 픽켓으로 변환돼요
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  포인트를 넣으면 픽켓을 받아요. 확률이 낮을수록 같은 포인트로 픽켓을 더 많이 받아요.
                  <br />
                  예) 확률 50% → 100P로 픽켓 200개 / 확률 25% → 100P로 픽켓 400개
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>🏆</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  정답 시 픽켓 1개 = 1포인트
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  정답이 확정되면 픽켓 1개당 1포인트를 받아요. 픽켓이 많을수록 더 많이 받아요.
                  <br />
                  오답이면 픽켓은 0포인트가 돼요.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>🔄</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  정산 전에 매도할 수 있어요
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  확률이 올랐을 때 팔면 수익 (픽켓 × 현재 확률), 내렸을 때 팔면 손절이에요.
                  마감 1시간 전부터는 매도만 가능해요.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
