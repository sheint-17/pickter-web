import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// /api/og/report?nickname=예언자킹&tier=Diamond&rp=11200&accuracy=78&best=엔터&count=42
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nickname = searchParams.get('nickname') ?? '픽터 유저'
  const tier     = searchParams.get('tier')     ?? 'Gold'
  const rp       = searchParams.get('rp')       ?? '0'
  const accuracy = searchParams.get('accuracy') ?? '0'
  const best     = searchParams.get('best')     ?? '전체'
  const count    = searchParams.get('count')    ?? '0'

  const tierConfig: Record<string, { color: string; emoji: string }> = {
    Unranked:    { color: '#9CA3AF', emoji: '' },
    Bronze:      { color: '#CD7F32', emoji: '🥉' },
    Silver:      { color: '#9CA3AF', emoji: '🥈' },
    Gold:        { color: '#F59E0B', emoji: '🥇' },
    Platinum:    { color: '#06B6D4', emoji: '💠' },
    Diamond:     { color: '#7B2FBE', emoji: '💎' },
    Grandmaster: { color: '#F59E0B', emoji: '👑' },
  }
  const tc = tierConfig[tier] ?? tierConfig['Gold']

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1A0A2E 100%)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
          padding: '48px 64px',
        }}
      >
        {/* 배경 글로우 */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px',
          background: `radial-gradient(circle, ${tc.color}33 0%, transparent 70%)`,
          display: 'flex',
        }} />

        {/* 로고 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '26px', fontWeight: 900, display: 'flex' }}>
            <span style={{ color: '#7B2FBE' }}>PICK</span>
            <span style={{ color: '#00B37D' }}>TER</span>
          </div>
          <div style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.4)',
            display: 'flex',
          }}>
            예측 리포트
          </div>
        </div>

        {/* 유저 정보 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B2FBE, #00B37D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
          }}>
            👤
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'white', display: 'flex' }}>
              {nickname}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: `${tc.color}22`,
              border: `1px solid ${tc.color}66`,
              borderRadius: '999px',
              padding: '4px 16px',
              width: 'fit-content',
            }}>
              <span style={{ fontSize: '16px', display: 'flex' }}>{tc.emoji}</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: tc.color, display: 'flex' }}>{tier}</span>
            </div>
          </div>
        </div>

        {/* 스탯 3개 */}
        <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
          {/* 총 RP */}
          <div style={{
            flex: 1,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>누적 RP</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: 'white', display: 'flex' }}>
              {parseInt(rp).toLocaleString()}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', display: 'flex' }}>Rank Point</div>
          </div>

          {/* 전체 적중률 */}
          <div style={{
            flex: 1,
            background: 'rgba(0,179,125,0.1)',
            border: '1px solid rgba(0,179,125,0.3)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(0,179,125,0.7)', display: 'flex' }}>전체 적중률</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: '#00B37D', display: 'flex' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(0,179,125,0.5)', display: 'flex' }}>
              총 {count}회 예측
            </div>
          </div>

          {/* 최강 카테고리 */}
          <div style={{
            flex: 1,
            background: 'rgba(123,47,190,0.1)',
            border: '1px solid rgba(123,47,190,0.3)',
            borderRadius: '20px',
            padding: '28px 32px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{ fontSize: '14px', color: 'rgba(123,47,190,0.7)', display: 'flex' }}>최강 분야</div>
            <div style={{ fontSize: '42px', fontWeight: 900, color: '#C084FC', display: 'flex' }}>
              {best}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(123,47,190,0.5)', display: 'flex' }}>Oracle 분야</div>
          </div>
        </div>

        {/* 하단 */}
        <div style={{
          marginTop: '32px',
          display: 'flex', justifyContent: 'flex-end',
          fontSize: '16px', color: 'rgba(255,255,255,0.25)',
        }}>
          pickter.co.kr
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
