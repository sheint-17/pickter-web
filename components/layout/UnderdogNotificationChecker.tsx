'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { UnderdogModal } from './UnderdogModal'

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', etc: '기타',
}

export function UnderdogNotificationChecker() {
  const [modal, setModal] = useState<{
    notificationId: string
    nickname: string
    issueTitle: string
    percent: number
    category: string
  } | null>(null)

  useEffect(() => {
    // 이미 로그인된 상태로 진입한 경우
    checkUnderdogNotification()

    // 비로그인 → 로그인 시 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkUnderdogNotification()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUnderdogNotification() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, reference_id')
      .eq('user_id', user.id)
      .eq('type', 'underdog')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!notifications || notifications.length === 0) return
    const notif = notifications[0]

    const [
      { data: profile },
      { data: issue },
      { data: settlement },
    ] = await Promise.all([
      supabase.from('users').select('nickname').eq('id', user.id).single(),
      supabase.from('issues').select('title, category').eq('id', notif.reference_id).single(),
      supabase.from('settlements')
        .select('option_id')
        .eq('user_id', user.id)
        .eq('issue_id', notif.reference_id)
        .eq('is_correct', true)
        .eq('is_underdog', true)
        .single(),
    ])

    // 매수 시 확률: tickets avg_price 기준
    let percent = 0
    if (settlement?.option_id) {
      const { data: ticket } = await supabase
        .from('tickets')
        .select('avg_price')
        .eq('user_id', user.id)
        .eq('issue_id', notif.reference_id)
        .eq('option_id', settlement.option_id)
        .single()
      percent = ticket ? Math.round(Number(ticket.avg_price) * 100) : 0
    }

    setModal({
      notificationId: notif.id,
      nickname: profile?.nickname ?? '예언자',
      issueTitle: issue?.title ?? '이슈',
      percent,
      category: CATEGORY_KO[issue?.category ?? ''] ?? '기타',
    })
  }

  if (!modal) return null

  return (
    <UnderdogModal
      notificationId={modal.notificationId}
      nickname={modal.nickname}
      issueTitle={modal.issueTitle}
      percent={modal.percent}
      category={modal.category}
      onClose={() => setModal(null)}
    />
  )
}
