// components/issue/TradePanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { IssueOption, Ticket } from '@/types'

interface TradePanelProps {
  issueId: string
  issueType: 'binary' | 'multi'
  options: IssueOption[]
  tickets: Ticket[]
}

export default function TradePanel({ issueId, issueType, options, tickets }: TradePanelProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)

  const sorted = [...options].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const hasTickets = tickets.length > 0
  const selectedOption = sorted.find(o => o.id === selectedId)
  const selectedTicket = tickets.find(t => t.option_id === selectedId)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('users').select('point_balance').eq('id', user.id).single()
        .then(({ data }) => { if (data) setBalance(data.point_balance) })
    })
  }, [])

  async function handleTrade() {
    if (!selectedId || !amount) return
    const pointAmount = parseInt(amount)
    if (mode === 'buy' && pointAmount < 10) { setError('최소 10픽 이상 입력해주세요'); return }

    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요해요'); setLoading(false); return }

    const { error: tradeError } = await supabase.rpc('execute_trade', {
      p_user_id: user.id,
      p_issue_id: issueId,
      p_option_id: selectedId,
      p_trade_type: mode,
      p_point_amount: pointAmount,
      p_user_ip: '0.0.0.0',
    })

    setLoading(false)
    if (tradeError) {
      setError(tradeError.message.replace(/(\d+\.\d+)/g, m => Math.floor(parseFloat(m)).toString()))
      return
    }

    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) supabase.from('users').select('point_balance').eq('id', u.id).single()
      .then(({ data }) => { if (data) setBalance(data.point_balance) })
    router.refresh()
    setSelectedId(null); setAmount('')
  }

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', background: Colors.white }}>

      {/* 매수 / 매도 탭 */}
      <div style={{ display: 'flex', marginBottom: '16px', background: '#F0F0F0', borderRadius: '10px', padding: '3px', gap: '3px' }}>
        <button onClick={() => { setMode('buy'); setSelectedId(null); setAmount('') }}
          style={{ flex: 1, padding: '9px', background: mode === 'buy' ? Colors.white : 'transparent', color: mode === 'buy' ? Colors.primary : Colors.textTertiary, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
          매수
        </button>
        {hasTickets && (
          <button onClick={() => { setMode('sell'); setSelectedId(null); setAmount('') }}
            style={{ flex: 1, padding: '9px', background: mode === 'sell' ? Colors.white : 'transparent', color: mode === 'sell' ? Colors.primary : Colors.textTertiary, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
            매도
          </button>
        )}
      </div>

      {/* 선택지 버튼들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {sorted.map(opt => {
          const isBinary = issueType === 'binary'
          const isYes = opt.option_type === 'yes'
          const isNo  = opt.option_type === 'no'
          const ticket = tickets.find(t => t.option_id === opt.id)
          const percent = Math.round(opt.price * 100)

          // 색상: binary는 기존 yes/no 컬러, multi는 보라
          const activeColor = isBinary
            ? (isYes ? Colors.yes : isNo ? Colors.no : Colors.primary)
            : Colors.primary
          const isSelected = selectedId === opt.id

          return (
            <button
              key={opt.id}
              onClick={() => setSelectedId(opt.id)}
              style={{
                width: '100%', padding: '14px 16px',
                background: isSelected ? activeColor : `${activeColor}18`,
                color: isSelected ? Colors.white : activeColor,
                border: `2px solid ${activeColor}`,
                borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '15px', fontWeight: 700 }}>
                {isBinary ? (isYes ? '픽' : '패스') : opt.label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {mode === 'sell' && ticket && (
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>보유 {Math.floor(ticket.quantity)}장</span>
                )}
                <span style={{ fontSize: '16px', fontWeight: 800 }}>{percent}%</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 매도 모드 - 보유 티켓 정보 */}
      {mode === 'sell' && selectedOption && selectedTicket && (
        <div style={{ background: Colors.primaryLight, borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: Colors.primary }}>
          보유 티켓: {Math.floor(selectedTicket.quantity)}장 · 평균 매수가: {Math.round(selectedTicket.avg_price * 100)}P · 현재가: {Math.round(selectedOption.price * 100)}P
        </div>
      )}

      {/* 금액 입력 */}
      <div style={{ marginBottom: '8px' }}>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="투자할 픽(P) 입력"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
      </div>

      {/* 빠른 입력 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[100, 500, 1000].map(v => (
          <button key={v} onClick={() => setAmount(String(parseInt(amount || '0') + v))}
            style={{ flex: 1, padding: '6px 12px', background: '#F9F9F9', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: Colors.textSecondary }}>
            +{v.toLocaleString()}P
          </button>
        ))}
      </div>

      {/* 슬리피지 미리보기 */}
      {selectedOption && (() => {
        const pts = parseInt(amount)
        if (!pts || pts <= 0) return null
        if (mode === 'buy') {
          const estTickets = Math.floor(pts / selectedOption.price)
          const estPayout = estTickets * 100
          const profit = estPayout - pts
          const roi = Math.round((profit / pts) * 100)
          return (
            <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: '0 0 16px', lineHeight: 1.5 }}>
              예상 티켓 {estTickets.toLocaleString()}장 · 적중 시 +{estPayout.toLocaleString()}픽{' '}
              <span style={{ color: Colors.yes }}>(+{roi.toLocaleString()}%)</span>
            </p>
          )
        }
        return <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: '0 0 16px' }}>예상 환급 {pts.toLocaleString()}픽</p>
      })()}

      {/* 에러 */}
      {error && <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {/* 실행 버튼 */}
      {selectedOption && (
        <button onClick={handleTrade} disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: issueType === 'binary'
              ? (selectedOption.option_type === 'yes' ? Colors.yes : Colors.no)
              : Colors.primary,
            color: Colors.white, border: 'none',
            borderRadius: '12px', fontSize: '16px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, marginTop: '4px',
          }}>
          {loading ? '처리 중...' : `${selectedOption.label || (selectedOption.option_type === 'yes' ? '픽' : '패스')} ${amount || 0}픽 ${mode === 'buy' ? '매수' : '매도'}`}
        </button>
      )}

      {/* 잔액 */}
      {balance !== null && (
        <p style={{ fontSize: '12px', color: Colors.textTertiary, textAlign: 'center', margin: '14px 0 0' }}>
          현재 보유: <span style={{ fontWeight: 700, color: Colors.textSecondary }}>{balance.toLocaleString()}P</span>
        </p>
      )}
    </div>
  )
}
