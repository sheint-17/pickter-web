'use client'

import { useState } from 'react'
import { Colors } from '@/constants/colors'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function PickterGuide() {
  const [open, setOpen] = useState(false)

  const items = [
    {
      icon: '📊',
      title: '% = 커뮤니티 예측 확률',
      desc: '픽 55%는 커뮤니티가 이 사건이 일어날 확률을 55%로 보고 있다는 뜻이에요. 픽 + 패스는 항상 100%예요.',
    },
    {
      icon: '💰',
      title: '포인트를 투자하면 배당률만큼 돌려받아요',
      desc: '확률이 낮을수록 배당률이 높아요. 예) 확률 50% → ×2.0배 / 확률 25% → ×4.0배. 실제 배당률은 다른 사람들의 거래에 따라 실시간으로 변해요.',
    },
    {
      icon: '🏆',
      title: '정답 시 투자금 × 배당률 수령',
      desc: '정답이 확정되면 투자한 포인트에 배당률을 곱한 만큼 받아요. 오답이면 투자금은 돌아오지 않아요.',
    },
    {
      icon: '🏃',
      title: 'RUN — 패널티 감수하고 나갈 수 있어요',
      desc: '마음이 바보면 RUN 탭에서 런할 수 있어요. 단, 참여 포인트의 25%가 패널티로 소멸돼요. 신중하게 PICK 하세요!',
    },
  ]

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden', marginTop: '12px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: Colors.white,
          border: 'none', cursor: 'pointer',
          fontSize: '14px', fontWeight: 600, color: Colors.textSecondary,
        }}
      >
        <span>📖 이 시장은 어떻게 작동하나요?</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div style={{ padding: '4px 16px 16px', background: '#FAFAFA', borderTop: '1px solid #F0F0F0' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', paddingTop: '14px' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 4px' }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
