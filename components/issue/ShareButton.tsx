'use client'

import { useEffect, useState } from 'react'
import { Share2 } from 'lucide-react'

declare global {
  interface Window { Kakao: any }
}

interface ShareButtonProps {
  issueId: string
  title: string
  pick: number
  pass: number
  category: string
  participants: number
}

const btnStyle: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
  padding: '10px 16px', fontSize: '14px', color: '#1A1A1A',
  background: 'transparent', border: 'none', borderRadius: '8px',
  cursor: 'pointer', textAlign: 'left',
}

export function ShareButton({ issueId, title, pick, pass, category, participants }: ShareButtonProps) {
  const [kakaoReady, setKakaoReady] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)
      setKakaoReady(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js'
    script.async = true
    script.onload = () => {
      window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY)
      setKakaoReady(true)
    }
    document.head.appendChild(script)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  const shareUrl = `https://www.pickter.co.kr/issue/${issueId}`
  const ogUrl = `https://www.pickter.co.kr/api/og/issue?title=${encodeURIComponent(title)}&pick=${pick}&pass=${pass}&category=${encodeURIComponent(category)}&participants=${participants}`

  const handleKakaoShare = () => {
    if (!kakaoReady) return
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: `픽 ${pick}% vs 패스 ${pass}% · ${participants.toLocaleString()}명 참여 • 세상보다 먼저 맞혀라`,
        imageUrl: ogUrl,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [{ title: '예측 참여하기', link: { mobileWebUrl: shareUrl, webUrl: shareUrl } }],
    })
    setShowMenu(false)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    showToast('🔗 링크가 복사됐어요!')
    setShowMenu(false)
  }

  const handleNativeShare = async () => {
    try { await navigator.share({ title, text: `픽 ${pick}% vs 패스 ${pass}%`, url: shareUrl }) } catch {}
    setShowMenu(false)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowMenu(p => !p)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '999px',
          fontSize: '13px', fontWeight: 600,
          background: 'transparent', border: '1px solid #E5E7EB',
          color: '#555', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <Share2 size={14} strokeWidth={2} />
        공유하기
      </button>

      {showMenu && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          zIndex: 9999, background: 'white',
          border: '1px solid #E5E7EB', borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: '8px', minWidth: '160px',
        }}>
          <button onClick={handleKakaoShare} style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE500'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '18px' }}>💬</span> 카카오톡 공유
          </button>
          <button onClick={handleCopyLink} style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = '#F4F4F5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: '18px' }}>🔗</span> 링크 복사
          </button>
          {typeof navigator !== 'undefined' && navigator.share && (
            <button onClick={handleNativeShare} style={btnStyle}
              onMouseEnter={e => e.currentTarget.style.background = '#F4F4F5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: '18px' }}>📤</span> 더 보기
            </button>
          )}
        </div>
      )}

      {showMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setShowMenu(false)} />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 99999, background: '#1A1A1A', color: 'white',
          padding: '12px 20px', borderRadius: '12px',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
