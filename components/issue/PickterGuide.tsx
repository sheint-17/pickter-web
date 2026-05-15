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
              <span style={{ fontSize: '18px', flexShrink: 0 }}>💰</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  확률이 낮을수록 수익이 커요
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  100픽 투입 시 예상 수령액 = 100 ÷ 현재 확률
                  <br />
                  예) 확률 50% → 맞추면 200픽 / 확률 25% → 맞추면 400픽
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>🏆</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 2px' }}>
                  승자가 패자의 픽을 나눠가져요
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  틀린 사람들의 픽이 맞춘 사람들에게 분배돼요.
                  최종 수익은 총 참여자 수에 따라 달라질 수 있어요.
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
                  확률이 올랐을 때 팔면 수익, 내렸을 때 팔면 손절이에요.
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
