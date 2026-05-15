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
  lmsrB: number
  options: IssueOption[]
  tickets: Ticket[]
}

// LMSR 비용 함수: C(q) = b × ln(Σ exp(q_i / b))
function lmsrCost(shares: number[], b: number): number {
  const maxQ = Math.max(...shares)
  const sumExp = shares.reduce((acc, q) => acc + Math.exp((q - maxQ) / b), 0)
  return b * (Math.log(sumExp) + maxQ / b)
}

// 매수 시 실제 지불 픽 계산
function calcBuyCost(currentShares: number[], optionIdx: number, deltaShares: number, b: number): number {
  const before = lmsrCost(currentShares, b)
  const after = lmsrCost(
    currentShares.map((q, i) => (i === optionIdx ? q + deltaShares : q)),
    b
  )
  return after - before
}

// 픽을 입력했을 때 실제로 받을 수 있는 티켓 수 역산 (이진 탐색)
function calcTicketsFromPoints(currentShares: number[], optionIdx: number, points: number, b: number): number {
  let lo = 0, hi = points * 10
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    const cost = calcBuyCost(currentShares, optionIdx, mid, b)
    if (cost < points) lo = mid
    else hi = mid
  }
  return lo
}

// 매수 후 확률 계산
function calcPriceAfter(currentShares: number[], optionIdx: number, deltaShares: number, b: number): number {
  const newShares = currentShares.map((q, i) => (i === optionIdx ? q + deltaShares : q))
  const maxQ = Math.max(...newShares)
  const sumExp = newShares.reduce((acc, q) => acc + Math.exp((q - maxQ) / b), 0)
  return Math.exp((newShares[optionIdx] - maxQ) / b) / sumExp
}

export default function TradePanel({ issueId, issueType, lmsrB, options: initialOptions, tickets: initialTickets }: TradePanelProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [options, setOptions] = useState<IssueOption[]>(initialOptions)

  const sorted = [...options].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const hasTickets = tickets.length > 0
  const selectedOption = sorted.find(o => o.id === selectedId)
  const selectedOptionIdx = sorted.findIndex(o => o.id === selectedId)
  const selectedTicket = tickets.find(t => t.option_id === selectedId)

  const currentShares = sorted.map(o => o.shares ?? 0)

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: userData }, { data: ticketData }, { data: optionData }] = await Promise.all([
      supabase.from('users').select('point_balance').eq('id', user.id).single(),
      supabase.from('tickets').select('*').eq('user_id', user.id).eq('issue_id', issueId),
      supabase.from('issue_options').select('*').eq('issue_id', issueId).order('order_index', { ascending: true }),
    ])
    if (userData) setBalance(userData.point_balance)
    if (ticketData) setTickets(ticketData)
    if (optionData) setOptions(optionData)
  }

  useEffect(() => {
    fetchUserData()
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

    await fetchUserData()
    router.refresh()
    setSelectedId(null); setAmount('')
  }

  // 슬리피지 미리보기 계산
  const slippagePreview = (() => {
    if (!selectedOption || selectedOptionIdx < 0) return null
    const pts = parseInt(amount)
    if (!pts || pts <= 0) return null

    if (mode === 'buy') {
      const estTickets = calcTicketsFromPoints(currentShares, selectedOptionIdx, pts, lmsrB)
      const priceBefore = selectedOption.price
      const priceAfter = calcPriceAfter(currentShares, selectedOptionIdx, estTickets, lmsrB)
      const priceDiff = Math.round((priceAfter - priceBefore) * 100)
      const isHighImpact = Math.abs(priceDiff) >= 5

      // 제로섬 기준 예상 수령액: 투입 픽 / 현재 확률
      const estPayout = Math.floor(pts / priceBefore)
      const profit = estPayout - pts

      return { mode: 'buy' as const, estPayout, profit, priceBefore: Math.round(priceBefore * 100), priceAfter: Math.round(priceAfter * 100), priceDiff, isHighImpact }
    } else {
      // 매도: 보유 티켓의 현재 가치 (투입 픽 × 현재 확률 / 평균 매수 확률)
      const avgPrice = selectedTicket?.avg_price ?? selectedOption.price
      const estReturn = Math.round(pts * (selectedOption.price / avgPrice))
      return { mode: 'sell' as const, estReturn }
    }
  })()

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

          // binary: yes=100-no%, no=no.price*100 / multi: 각자 price 비율
          let percent: number
          if (isBinary) {
            const noOpt = sorted.find(o => o.option_type === 'no')
            const noPercent = Math.round((noOpt?.price ?? 0.5) * 100)
            percent = isYes ? (100 - noPercent) : noPercent
          } else {
            const totalPrice = sorted.reduce((s, o) => s + o.price, 0) || 1
            percent = Math.round((opt.price / totalPrice) * 100)
          }

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
      {slippagePreview && (
        <div style={{
          background: slippagePreview.mode === 'buy' && slippagePreview.isHighImpact ? '#FFF7ED' : '#F8F9FA',
          border: `1px solid ${slippagePreview.mode === 'buy' && slippagePreview.isHighImpact ? '#FED7AA' : '#E5E7EB'}`,
          borderRadius: '10px', padding: '12px', marginBottom: '16px',
        }}>
          {slippagePreview.mode === 'buy' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>맞추면 받는 픽</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.textPrimary }}>{slippagePreview.estPayout.toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>예상 수익</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.yes }}>+{slippagePreview.profit.toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>확률 변화</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: slippagePreview.isHighImpact ? '#EA580C' : Colors.textSecondary }}>
                  {slippagePreview.priceBefore}% → {slippagePreview.priceAfter}%
                  {' '}
                  <span style={{ color: slippagePreview.priceDiff > 0 ? Colors.yes : Colors.no }}>
                    ({slippagePreview.priceDiff > 0 ? '+' : ''}{slippagePreview.priceDiff}%p)
                  </span>
                </span>
              </div>
              {slippagePreview.isHighImpact && (
                <p style={{ fontSize: '11px', color: '#EA580C', margin: '8px 0 0', fontWeight: 600 }}>
                  ⚠️ 이 거래로 확률이 크게 변합니다
                </p>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: Colors.textTertiary }}>예상 환급</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.textPrimary }}>{slippagePreview.estReturn.toLocaleString()}P</span>
            </div>
          )}
        </div>
      )}

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

      {/* binary 게이지바 */}
      {issueType === 'binary' && (() => {
        const noOpt = sorted.find(o => o.option_type === 'no')
        const yesOpt = sorted.find(o => o.option_type === 'yes')
        const noPercent = Math.round((noOpt?.price ?? 0.5) * 100)
        const yesPercent = 100 - noPercent
        return (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: Colors.yes }}>{yesPercent}%</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: Colors.no }}>{noPercent}%</span>
            </div>
            <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '8px' }}>
              <div style={{ width: `${yesPercent}%`, background: Colors.yes, transition: 'width 0.5s' }} />
              <div style={{ width: `${noPercent}%`, background: Colors.no, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: Colors.yes }}>{yesOpt?.label ?? '픽'}</span>
              <span style={{ fontSize: '11px', color: Colors.no }}>{noOpt?.label ?? '패스'}</span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
