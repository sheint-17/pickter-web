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

// 포인트를 입력했을 때 받을 수 있는 픽켓 수 역산 (이진 탐색)
function calcPicketsFromPoints(currentShares: number[], optionIdx: number, points: number, b: number): number {
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
  const [options, setOptions] = useState<IssueOption[]>(() =>
    initialOptions.map(o => ({ ...o, price: Number(o.price), shares: Number(o.shares) }))
  )
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialOptions.map(o => [o.id, Number(o.price)]))
  )

  const sorted = [...options].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const hasTickets = tickets.length > 0
  const selectedOption = sorted.find(o => o.id === selectedId)
  const selectedOptionIdx = sorted.findIndex(o => o.id === selectedId)
  const selectedTicket = tickets.find(t => t.option_id === selectedId)

  const currentShares = sorted.map(o => Number(o.shares) ?? 0)

  async function fetchOptions() {
    const { data } = await supabase
      .from('issue_options')
      .select('*')
      .eq('issue_id', issueId)
      .order('order_index', { ascending: true })
    if (data) {
      const mapped = data.map(o => ({ ...o, price: Number(o.price), shares: Number(o.shares) }))
      setOptions(mapped)
      setPrices({ ...Object.fromEntries(mapped.map(o => [o.id, o.price])) })
    }
  }

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: userData }, { data: ticketData }] = await Promise.all([
      supabase.from('users').select('point_balance').eq('id', user.id).single(),
      supabase.from('tickets').select('*').eq('user_id', user.id).eq('issue_id', issueId),
    ])
    if (userData) setBalance(userData.point_balance)
    if (ticketData) setTickets(ticketData)
  }

  useEffect(() => {
    fetchUserData()
    fetchOptions()
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
    await fetchOptions()
    router.refresh()
    setSelectedId(null); setAmount('')
  }

  // 슬리피지 미리보기 계산
  const slippagePreview = (() => {
    if (!selectedOption || selectedOptionIdx < 0) return null
    const pts = parseInt(amount)
    if (!pts || pts <= 0) return null

    if (mode === 'buy') {
      // LMSR 기준 픽켓 수량 계산
      const estPickets = calcPicketsFromPoints(currentShares, selectedOptionIdx, pts, lmsrB)
      const priceBefore = prices[selectedOption.id] ?? selectedOption.price
      const priceAfter = calcPriceAfter(currentShares, selectedOptionIdx, estPickets, lmsrB)
      const priceDiff = Math.round((priceAfter - priceBefore) * 100)
      const isHighImpact = Math.abs(priceDiff) >= 5

      // 픽켓 수량 × 1포인트 = 정답 시 수령액
      const estPayout = Math.floor(estPickets)
      const profit = estPayout - pts

      return { mode: 'buy' as const, estPickets: Math.floor(estPickets), estPayout, profit, priceBefore: Math.round(priceBefore * 100), priceAfter: Math.round(priceAfter * 100), priceDiff, isHighImpact }
    } else {
      // 매도: 픽켓 수량 × 현재 확률
      const currentPrice = prices[selectedOption.id] ?? selectedOption.price
      const estReturn = Math.floor(pts * currentPrice)
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

          // prices state에서 최신 확률 읽기
          let percent: number
          if (isBinary) {
            const yesOpt = sorted.find(o => o.option_type === 'yes')
            const yesPercent = yesOpt ? Math.round((prices[yesOpt.id] ?? 0.5) * 100) : 50
            percent = isYes ? yesPercent : (100 - yesPercent)
          } else {
            const totalPrice = sorted.reduce((s, o) => s + (prices[o.id] ?? 0.5), 0) || 1
            percent = Math.round(((prices[opt.id] ?? 0.5) / totalPrice) * 100)
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
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>
                    {Math.round(Number(ticket.avg_price) * 100)}% 매수
                  </span>
                )}
                <span style={{ fontSize: '16px', fontWeight: 800 }}>{percent}%</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 매도 모드 - 보유 정보 */}
      {mode === 'sell' && selectedOption && selectedTicket && (() => {
        const heldPickets = Math.floor(Number(selectedTicket.quantity))
        const currentPrice = prices[selectedOption.id] ?? Number(selectedOption.price)
        const avgPrice = Number(selectedTicket.avg_price)
        const currentValue = Math.floor(heldPickets * currentPrice)
        const invested = Math.round(avgPrice * heldPickets)
        const pnl = currentValue - invested
        return (
          <div style={{ background: Colors.primaryLight, borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: Colors.primary }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>보유 픽켓</span>
              <span style={{ fontWeight: 700 }}>{heldPickets.toLocaleString()}개</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>매수 시 확률</span>
              <span style={{ fontWeight: 700 }}>{Math.round(avgPrice * 100)}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>전량 매도 시</span>
              <span style={{ fontWeight: 700, color: pnl >= 0 ? Colors.yes : Colors.no }}>
                {currentValue.toLocaleString()}P ({pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}P)
              </span>
            </div>
          </div>
        )
      })()}

      {/* 금액 입력 */}
      <div style={{ marginBottom: '8px' }}>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder={mode === 'buy' ? '투자할 포인트(P) 입력' : '매도할 픽켓 수량 입력'}
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
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>받는 픽켓</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.textPrimary }}>{slippagePreview.estPickets.toLocaleString()}개</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>맞추면 받는 포인트</span>
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
    </div>
  )
}
