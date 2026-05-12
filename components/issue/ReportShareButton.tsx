'use client'

import { Share2 } from 'lucide-react'

interface ReportShareButtonProps {
  nickname: string
  tier: string
  rp: number
  accuracy: number
  best: string
  count: number
}

export function ReportShareButton({ nickname, tier, rp, accuracy, best, count }: ReportShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = `https://www.pickter.co.kr`
    const shareText = `${nickname}님의 픽터 리포트\n${tier} 등급 · 적중률 ${accuracy}% · ${count}회 예측\n최강 분야: ${best}\n\n나도 예측 도전하기 👇`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${nickname}의 픽터 리포트`,
          text: shareText,
          url: shareUrl,
        })
      } catch {}
    } else {
      await navigator.clipboard.writeText(
        `${shareText}\n${shareUrl}`
      )
      alert('리포트 링크가 복사됐어요!')
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 20px', borderRadius: '999px',
        fontSize: '14px', fontWeight: 700,
        background: '#7B2FBE', color: 'white',
        border: 'none', cursor: 'pointer',
        transition: 'opacity 0.15s',
        width: '100%', justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <Share2 size={15} strokeWidth={2} />
      내 리포트 공유하기
    </button>
  )
}
