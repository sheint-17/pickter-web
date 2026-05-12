import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// /api/og/issue?title=손흥민+이적&pick=27&pass=73&category=스포츠&participants=210
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title        = searchParams.get('title')        ?? '이슈 제목'
  const pick         = parseInt(searchParams.get('pick') ?? '50')
  const pass         = parseInt(searchParams.get('pass') ?? '50')
  const category     = searchParams.get('category')     ?? '기타'
  const participants = searchParams.get('participants')  ?? '0'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 상단 보라색 바 */}
        <div style={{
          width: '100%', height: '8px',
          background: 'linear-gradient(90deg, #7B2FBE, #00B37D)',
          display: 'flex',
        }} />

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          padding: '48px 64px',
        }}>
          {/* 로고 + 카테고리 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '26px', fontWeight: 900, display: 'flex' }}>
              <span style={{ color: '#7B2FBE' }}>PICK</span>
              <span style={{ color: '#00B37D' }}>TER</span>
            </div>
            <div style={{
              background: '#F3E8FF', color: '#7B2FBE',
              padding: '6px 18px', borderRadius: '999px',
              fontSize: '16px', fontWeight: 700, display: 'flex',
            }}>
              {category}
            </div>
          </div>

          {/* 이슈 제목 */}
          <div style={{
            fontSize: '42px', fontWeight: 800,
            color: '#0D0D0D', lineHeight: 1.3,
            marginBottom: '48px', display: 'flex',
            maxWidth: '900px',
          }}>
            {title}
          </div>

          {/* 확률 표시 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px', display: 'flex' }}>픽 (Yes)</div>
              <div style={{ fontSize: '72px', fontWeight: 900, color: '#00B37D', lineHeight: 1, display: 'flex' }}>
                {pick}%
              </div>
            </div>

            <div style={{
              width: '2px', height: '80px',
              background: '#E5E7EB', display: 'flex',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px', display: 'flex' }}>패스 (No)</div>
              <div style={{ fontSize: '72px', fontWeight: 900, color: '#FF4D6D', lineHeight: 1, display: 'flex' }}>
                {pass}%
              </div>
            </div>
          </div>

          {/* 게이지 바 */}
          <div style={{
            width: '100%', height: '16px',
            borderRadius: '999px', overflow: 'hidden',
            display: 'flex', marginBottom: '24px',
          }}>
            <div style={{ width: `${pick}%`, height: '100%', background: '#00B37D', display: 'flex' }} />
            <div style={{ width: `${pass}%`, height: '100%', background: '#FF4D6D', display: 'flex' }} />
          </div>

          {/* 참여자 + URL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '18px', color: '#6B7280', display: 'flex', gap: '6px' }}>
              <span>👥</span>
              <span>{parseInt(participants).toLocaleString()}명 참여 중</span>
            </div>
            <div style={{ fontSize: '18px', color: '#9CA3AF', display: 'flex' }}>
              pickter.co.kr
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
