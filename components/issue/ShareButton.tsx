'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  issueId: string
  title: string
  pick: number
  pass: number
  category: string
  participants: number
}

export function ShareButton({ issueId, title, pick, pass, category, participants }: ShareButtonProps) {
  const handleShare = async () => {
    const ogUrl = `https://www.pickter.co.kr/api/og/issue?title=${encodeURIComponent(title)}&pick=${pick}&pass=${pass}&category=${encodeURIComponent(category)}&participants=${participants}`
    const shareUrl = `https://www.pickter.co.kr/issue/${issueId}`
    const shareText = `${title}\n픽 ${pick}% vs 패스 ${pass}%\n\n지금 예측에 참여하세요!`

    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl })
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl)
      alert('링크가 복사됐어요!')
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '999px',
        fontSize: '13px', fontWeight: 600,
        background: 'transparent', border: '1px solid #E5E7EB',
        color: '#555', cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Share2 size={14} strokeWidth={2} />
      공유하기
    </button>
  )
}
