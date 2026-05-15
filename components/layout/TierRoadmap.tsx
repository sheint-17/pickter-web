'use client'

import { TierIcon } from '@/components/ui/badge'
import { Colors } from '@/constants/colors'
import type { UserTier } from '@/types'

const TIERS: { tier: UserTier; rp: string; color: string }[] = [
  { tier: 'Unranked',    rp: '0~99',      color: '#AAAAAA' },
  { tier: 'Bronze',      rp: '100~999',   color: '#A0622A' },
  { tier: 'Silver',      rp: '1,000~',    color: '#666666' },
  { tier: 'Gold',        rp: '1,500~',    color: '#B8860B' },
  { tier: 'Platinum',    rp: '4,000~',    color: '#0A8F96' },
  { tier: 'Diamond',     rp: '10,000~',   color: '#1272A0' },
  { tier: 'Grandmaster', rp: '25,000+',   color: '#5A1FAA' },
]

export default function TierRoadmap({ currentTier }: { currentTier?: UserTier }) {
  return (
    <div style={{
      background: Colors.white,
      border: `1px solid ${Colors.border}`,
      borderRadius: '16px',
      padding: '20px 16px',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>
        🏅 계급 구조
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '4px', marginBottom: '12px' }}>
        {TIERS.map(({ tier, color }, i) => {
          const isCurrent = tier === currentTier
          const isPast = currentTier
            ? TIERS.findIndex(t => t.tier === currentTier) > i
            : false
          return (
            <div key={tier} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
              {isCurrent ? (
                <div style={{
                  fontSize: '9px', fontWeight: 700,
                  color: Colors.white, background: color,
                  borderRadius: '999px', padding: '2px 6px', whiteSpace: 'nowrap',
                }}>현재</div>
              ) : <div style={{ height: '18px' }} />}

              <div style={{
                opacity: isPast ? 0.35 : 1,
                filter: isCurrent ? `drop-shadow(0 0 6px ${color}88)` : 'none',
              }}>
                <TierIcon tier={tier} size={isCurrent ? 44 : 36} />
              </div>

              <span style={{
                fontSize: tier === 'Grandmaster' ? '8px' : '9px',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? color : isPast ? '#CCCCCC' : Colors.textTertiary,
                textAlign: 'center', whiteSpace: 'nowrap',
              }}>
                {tier}
              </span>
            </div>
          )
        })}
      </div>

      {/* 진행 바 */}
      <div style={{ position: 'relative', height: '4px', background: Colors.border, borderRadius: '999px', margin: '4px 0 12px' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          borderRadius: '999px',
          background: 'linear-gradient(90deg, #CD7F32, #C0C0C0, #FFD700, #00C4CC, #4FC3F7, #7B2FBE)',
          width: currentTier
            ? `${(TIERS.findIndex(t => t.tier === currentTier) / (TIERS.length - 1)) * 100}%`
            : '0%',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* RP 기준 */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {TIERS.map(({ tier, rp, color }) => (
          <div key={tier} style={{ flex: 1, textAlign: 'center' }}>
            <span style={{
              fontSize: '9px',
              color: tier === currentTier ? color : Colors.textTertiary,
              fontWeight: tier === currentTier ? 700 : 400,
            }}>
              {rp}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
