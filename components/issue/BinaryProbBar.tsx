// components/issue/BinaryProbBar.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [noPercent, setNoPercent] = useState(Math.round((1 - Number(initialYesPrice)) * 100))
  const yesPercent = 100 - noPercent

  const fetchPrice = useCallback(async () => {
    const { data } = await supabase
      .from('issue_options')
      .select('id, price')
      .eq('issue_id', issueId)
    if (!data) return
    const yesOpt = data.find(o => o.id === yesOptionId)
    if (yesOpt) {
      const yesP = Math.round(Number(yesOpt.price) * 100)
      setNoPercent(100 - yesP)
    }
  }, [issueId, yesOptionId])

  useEffect(() => {
    fetchPrice()
    // 30초마다 폴링 (실시간 구독 대체)
    const interval = setInterval(fetchPrice, 1000)
    return () => clearInterval(interval)
  }, [fetchPrice])

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
