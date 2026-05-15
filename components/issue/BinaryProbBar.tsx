// components/issue/BinaryProbBar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface BinaryProbBarProps {
  issueId: string
  yesOptionId: string
  noOptionId: string
  yesLabel?: string
  noLabel?: string
  initialYesPrice: number
}

export default function BinaryProbBar({
  issueId, yesOptionId, noOptionId, yesLabel = '픽', noLabel = '패스', initialYesPrice
}: BinaryProbBarProps) {
  const noPercent0 = Math.round((1 - Number(initialYesPrice)) * 100)
  const [noPercent, setNoPercent] = useState(noPercent0)
  const yesPercent = 100 - noPercent
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }
    channelRef.current = supabase
      .channel(`prob-bar-${issueId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'issue_options', filter: `issue_id=eq.${issueId}` },
        (payload) => {
          const updated = payload.new as { id: string; price: number }
          if (updated.id === noOptionId) {
            setNoPercent(Math.round(Number(updated.price) * 100))
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [issueId, noOptionId])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>픽</div>
          <span style={{ fontSize: '36px', fontWeight: 900, color: '#00B37D', lineHeight: 1 }}>{yesPercent}%</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>패스</div>
          <span style={{ fontSize: '36px', fontWeight: 900, color: '#FF4D6D', lineHeight: 1 }}>{noPercent}%</span>
        </div>
      </div>
      <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '12px' }}>
        <div style={{ width: `${yesPercent}%`, background: '#00B37D', transition: 'width 0.5s' }} />
        <div style={{ width: `${noPercent}%`, background: '#FF4D6D', transition: 'width 0.5s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <span style={{ fontSize: '12px', color: '#00B37D', fontWeight: 600 }}>{yesLabel}</span>
        <span style={{ fontSize: '12px', color: '#FF4D6D', fontWeight: 600 }}>{noLabel}</span>
      </div>
    </div>
  )
}
