import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// /api/og/underdog?nickname=예언자킹&issue=손흥민+이적&percent=15&category=스포츠
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const nickname = searchParams.get('nickname') ?? '익명 예언자'
  const issue    = searchParams.get('issue')    ?? '이슈 제목'
  const percent  = searchParams.get('percent')  ?? '15'
  const category = searchParams.get('category') ?? '스포츠'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1A0A2E 50%, #0D0D0D 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 배경 글로우 */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(123,47,190,0.3) 0%, transparent 70%)',
          display: 'flex',
        }} />

        {/* PICKTER 로고 */}
        <div style={{
          position: 'absolute', top: '40px', left: '48px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            fontSize: '28px', fontWeight: 900, letterSpacing: '-1px',
            display: 'flex',
          }}>
            <span style={{ color: '#7B2FBE' }}>PICK</span>
            <span style={{ color: '#00B37D' }}>TER</span>
          </div>
        </div>

        {/* 언더독 배지 */}
        <div style={{
          background: 'rgba(123,47,190,0.2)',
          border: '1px solid rgba(123,47,190,0.6)',
          borderRadius: '999px',
          padding: '8px 24px',
          fontSize: '18px',
          color: '#C084FC',
          fontWeight: 700,
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚡ UNDERDOG 적중
        </div>

        {/* 확률 숫자 */}
        <div style={{
          fontSize: '160px',
          fontWeight: 900,
          color: 'white',
          lineHeight: 1,
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '4px',
        }}>
          <span style={{ color: '#C084FC' }}>{percent}</span>
          <span style={{ fontSize: '80px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>%</span>
        </div>

        <div style={{
          fontSize: '24px',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '48px',
          display: 'flex',
        }}>
          확률을 뚫었습니다
        </div>

        {/* 이슈 제목 */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '20px 40px',
          maxWidth: '800px',
          textAlign: 'center',
          marginBottom: '48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{ fontSize: '14px', color: '#7B2FBE', fontWeight: 700, display: 'flex' }}>
            {category}
          </div>
          <div style={{ fontSize: '28px', color: 'white', fontWeight: 700, display: 'flex' }}>
            {issue}
          </div>
        </div>

        {/* 닉네임 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B2FBE, #00B37D)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>
            👤
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '22px', color: 'white', fontWeight: 700, display: 'flex' }}>
              {nickname}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
              pickter.co.kr
            </div>
          </div>
        </div>

        {/* 하단 URL */}
        <div style={{
          position: 'absolute', bottom: '40px', right: '48px',
          fontSize: '16px', color: 'rgba(255,255,255,0.3)',
          display: 'flex',
        }}>
          pickter.co.kr
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
