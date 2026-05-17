'use client'

import { Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { UnderdogModal } from '@/components/layout/UnderdogModal'

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', etc: '기타',
}

export function UnderdogShareButton() {
  const [modal, setModal] = useState<{
    notificationId: string
    nickname: string
    issueTitle: string
    percent: number
    category: string
  } | null>(null)

  async function handleClick() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data: settlements }] = await Promise.all([
      supabase.from('users').select('nickname').eq('id', user.id).single(),
      supabase.from('settlements')
        .select('option_id, issue_id, issues!settlements_issue_id_fkey(title, category)')
        .eq('user_id', user.id)
        .eq('is_correct', true)
        .eq('is_underdog', true)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    if (!settlements || settlements.length === 0) return
    const s = settlements[0] as any

    const { data: ticket } = await supabase
      .from('tickets')
      .select('avg_price')
      .eq('user_id', user.id)
      .eq('issue_id', s.issue_id)
      .eq('option_id', s.option_id)
      .single()

    // 읽은 알림도 다시 볼 수 있도록 notificationId는 임시값
    setModal({
      notificationId: 'mypage-share',
      nickname: profile?.nickname ?? '예언자',
      issueTitle: s.issues?.title ?? '이슈',
      percent: ticket ? Math.round(Number(ticket.avg_price) * 100) : 0,
      category: CATEGORY_KO[s.issues?.category ?? ''] ?? '기타',
    })
  }

  return (
    <>
      <button onClick={handleClick}
        style={{
          background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: '8px', padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', fontWeight: 700, color: 'white', cursor: 'pointer', flexShrink: 0,
        }}>
        <Share2 size={14} />
        공유
      </button>
      {modal && (
        <UnderdogModal
          {...modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
