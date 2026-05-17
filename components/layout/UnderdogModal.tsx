'use client'

import { useState } from 'react'
import { X, Share2 } from 'lucide-react'
import { Colors } from '@/constants/colors'

interface UnderdogModalProps {
  nickname: string
  issueTitle: string
  percent: number
  category: string
  notificationId: string
  onClose: () => void
}

export function UnderdogModal({ nickname, issueTitle, percent, category, notificationId, onClose }: UnderdogModalProps) {
  const [sharing, setSharing] = useState(false)

  const ogUrl = `https://www.pickter.co.kr/api/og/underdog?nickname=${encodeURIComponent(nickname)}&issue=${encodeURIComponent(issueTitle)}&percent=${percent}&category=${encodeURIComponent(category)}`
  const shareUrl = `https://www.pickter.co.kr`

  async function markAsRead() {
    try {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    } catch (e) { /* 무시 */ }
  }

  async function handleClose() {
    await markAsRead()
    onClose()
  }

  async function handleKakaoShare() {
    setSharing(true)
    try {
      if (typeof window !== 'undefined' && (window as any).Kakao) {
        const Kakao = (window as any).Kakao
        if (!Kakao.isInitialized()) {
          Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)
        }
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: `⚡ ${nickname}님이 언더독을 달성했어요!`,
            description: `${percent}% 확률을 뚫었습니다 — ${issueTitle}`,
            imageUrl: ogUrl,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
          },
          buttons: [{ title: '픽터에서 예측하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
        })
      } else {
        await navigator.clipboard.writeText(`⚡ ${percent}% 언더독 달성! — ${issueTitle}\n픽터에서 예측하기: ${shareUrl}`)
        alert('링크가 복사되었어요!')
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={handleClose}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0D0D0D 0%, #1A0A2E 50%, #0D0D0D 100%)',
        borderRadius: '24px', padding: '32px 24px',
        maxWidth: '400px', width: '100%',
        border: '1px solid rgba(123,47,190,0.4)',
        boxShadow: '0 0 60px rgba(123,47,190,0.3)',
        position: 'relative',
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button onClick={handleClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="rgba(255,255,255,0.6)" />
        </button>

        {/* 언더독 배지 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            background: 'rgba(123,47,190,0.2)', border: '1px solid rgba(123,47,190,0.6)',
            borderRadius: '999px', padding: '8px 20px',
            fontSize: '14px', color: '#C084FC', fontWeight: 700,
          }}>
            ⚡ UNDERDOG 달성
          </div>
        </div>

        {/* 확률 숫자 */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '80px', fontWeight: 900, lineHeight: 1, color: '#C084FC' }}>
            {percent}<span style={{ fontSize: '40px', color: 'rgba(255,255,255,0.4)' }}>%</span>
          </div>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', margin: '8px 0 0' }}>확률을 뚫었습니다</p>
        </div>

        {/* 이슈 제목 */}
        <div style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px', padding: '14px 16px',
          textAlign: 'center', marginBottom: '24px',
        }}>
          <p style={{ fontSize: '12px', color: '#7B2FBE', fontWeight: 700, margin: '0 0 6px' }}>{category}</p>
          <p style={{ fontSize: '16px', color: 'white', fontWeight: 700, margin: 0 }}>{issueTitle}</p>
        </div>

        {/* 닉네임 */}
        <p style={{ textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
          <span style={{ color: 'white', fontWeight: 700 }}>{nickname}</span>님의 예언이 적중했어요 🔥
        </p>

        {/* 버튼들 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={handleKakaoShare} disabled={sharing}
            style={{
              width: '100%', padding: '14px',
              background: '#FEE500', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
              cursor: sharing ? 'not-allowed' : 'pointer', opacity: sharing ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
            <Share2 size={18} />
            카카오톡으로 자랑하기
          </button>
          <button onClick={handleClose}
            style={{
              width: '100%', padding: '12px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', fontSize: '14px', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
            }}>
            나중에 볼게요
          </button>
        </div>
      </div>
    </div>
  )
}
