// components/issue/TradePanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { IssueOption, Ticket } from '@/types'

interface TradePanelProps {
  issueId: string
  issueType: 'binary' | 'multi'
  lmsrB: number
  options: IssueOption[]
  tickets: Ticket[]
  closesAt: string
}

function lmsrCost(shares: number[], b: number): number {
  const maxQ = Math.max(...shares)
  const sumExp = shares.reduce((acc, q) => acc + Math.exp((q - maxQ) / b), 0)
  return b * (Math.log(sumExp) + maxQ / b)
}

function calcBuyCost(currentShares: number[], optionIdx: number, deltaShares: number, b: number): number {
  const before = lmsrCost(currentShares, b)
  const after = lmsrCost(currentShares.map((q, i) => (i === optionIdx ? q + deltaShares : q)), b)
  return after - before
}

function calcPicketsFromPoints(currentShares: number[], optionIdx: number, points: number, b: number): number {
  let lo = 0, hi = points * 10
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2
    if (calcBuyCost(currentShares, optionIdx, mid, b) < points) lo = mid
    else hi = mid
  }
  return lo
}

function calcPriceAfter(currentShares: number[], optionIdx: number, deltaShares: number, b: number): number {
  const newShares = currentShares.map((q, i) => (i === optionIdx ? q + deltaShares : q))
  const maxQ = Math.max(...newShares)
  const sumExp = newShares.reduce((acc, q) => acc + Math.exp((q - maxQ) / b), 0)
  return Math.exp((newShares[optionIdx] - maxQ) / b) / sumExp
}

export default function TradePanel({ issueId, issueType, lmsrB, options: initialOptions, tickets: initialTickets, closesAt }: TradePanelProps) {
  const [mode, setMode] = useState<'buy' | 'sell'>('buy')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')   // 매수: 투자 포인트 / 매도: 환급 포인트 기준
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [options, setOptions] = useState<IssueOption[]>(() =>
    initialOptions.map(o => ({ ...o, price: Number(o.price), shares: Number(o.shares) }))
  )
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialOptions.map(o => [o.id, Number(o.price)]))
  )

  const submitLockRef = useRef(false)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const sorted = [...options].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  const hasTickets = tickets.length > 0
  const selectedOption = sorted.find(o => o.id === selectedId)
  const selectedOptionIdx = sorted.findIndex(o => o.id === selectedId)
  const selectedTicket = tickets.find(t => t.option_id === selectedId)
  const currentShares = sorted.map(o => Number(o.shares) ?? 0)

  async function fetchOptions() {
    const { data } = await supabase
      .from('issue_options').select('*').eq('issue_id', issueId).order('order_index', { ascending: true })
    if (data) {
      const mapped = data.map(o => ({ ...o, price: Number(o.price), shares: Number(o.shares) }))
      setOptions(mapped)
      setPrices(Object.fromEntries(mapped.map(o => [o.id, o.price])))
    }
  }

  async function fetchUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: userData }, { data: ticketData }] = await Promise.all([
      supabase.from('users').select('point_balance').eq('id', user.id).single(),
      supabase.from('tickets').select('*').eq('user_id', user.id).eq('issue_id', issueId).gte('quantity', 1),
    ])
    if (userData) setBalance(userData.point_balance)
    if (ticketData) setTickets(ticketData)
  }

  useEffect(() => { fetchUserData(); fetchOptions() }, [])

  async function handleTrade() {
    if (submitLockRef.current) return
    if (!selectedId || !amount) return

    const inputVal = parseInt(amount)
    if (Number.isNaN(inputVal) || inputVal <= 0) { setError('올바른 수량을 입력해주세요'); return }
    if (mode === 'buy' && inputVal < 1) { setError('최소 1P 이상 입력해주세요'); return }

    // 매도 시 보유 한도 초과 체크
    if (mode === 'sell' && selectedOption) {
      const currentPrice = prices[selectedOption.id] ?? Number(selectedOption.price)
      const heldPickets = Math.floor(Number(selectedTicket?.quantity ?? 0))
      const maxReturn = Math.floor(heldPickets * currentPrice)
      if (inputVal > maxReturn) {
        setError(`최대 ${maxReturn.toLocaleString()}P까지 매도할 수 있어요`)
        return
      }
    }

    if (mode === 'buy') {
      const remaining = new Date(closesAt).getTime() - Date.now()
      if (remaining <= 60 * 60 * 1000) {
        setError('마감 1시간 전부터는 매수가 불가해요. 매도만 가능해요.')
        return
      }
    }

    // 매도 시: 입력값은 "환급 포인트 기준" → 픽켓 수량으로 역산
    let rpcPointAmount = inputVal
    if (mode === 'sell' && selectedOption) {
      const currentPrice = prices[selectedOption.id] ?? Number(selectedOption.price)
      if (currentPrice > 0) {
        // 환급 포인트 ÷ 현재확률 = 픽켓 수량 (RPC가 픽켓 수량을 p_point_amount로 받음)
        const heldPickets = Math.floor(Number(selectedTicket?.quantity ?? 0))
        const picketsByPoint = Math.ceil(inputVal / currentPrice)
        // 보유 픽켓 초과 방지
        rpcPointAmount = Math.min(picketsByPoint, heldPickets)
      }
    }

    submitLockRef.current = true
    setLoading(true); setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('로그인이 필요해요'); return }

      const { data: rpcData, error: tradeError } = await supabase.rpc('execute_trade', {
        p_user_id: user.id,
        p_issue_id: issueId,
        p_option_id: selectedId,
        p_trade_type: mode,
        p_point_amount: rpcPointAmount,
        p_user_ip: null,
      })

      if (tradeError) {
        setError(tradeError.message.replace(/(\d+\.\d+)/g, m => Math.floor(parseFloat(m)).toString()))
        return
      }
      if (rpcData && rpcData.success === false) {
        setError(rpcData.error ?? '거래 실패')
        return
      }

      await fetchUserData()
      await fetchOptions()
      setSelectedId(null)
      setAmount('')
      setToast('거래가 완료되었어요!')
    } finally {
      setLoading(false)
      submitLockRef.current = false
    }
  }

  // 미리보기
  const slippagePreview = (() => {
    if (!selectedOption || selectedOptionIdx < 0) return null
    const pts = parseInt(amount)
    if (!pts || pts <= 0) return null

    if (mode === 'buy') {
      const estPickets = calcPicketsFromPoints(currentShares, selectedOptionIdx, pts, lmsrB)
      const priceBefore = prices[selectedOption.id] ?? selectedOption.price
      const priceAfter = calcPriceAfter(currentShares, selectedOptionIdx, estPickets, lmsrB)
      const priceDiff = Math.round((priceAfter - priceBefore) * 100)
      const estPayout = Math.floor(estPickets)
      return {
        mode: 'buy' as const,
        estPayout,
        profit: estPayout - pts,
        odds: pts > 0 ? estPayout / pts : 0,
        priceBefore: Math.round(priceBefore * 100),
        priceAfter: Math.round(priceAfter * 100),
        priceDiff,
        isHighImpact: Math.abs(priceDiff) >= 5,
      }
    } else {
      // 매도 미리보기: 입력값 = 환급 포인트 기준 그대로 표시
      return { mode: 'sell' as const, estReturn: pts }
    }
  })()

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', background: Colors.white }}>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff',
          padding: '12px 24px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

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

          let percent: number
          if (isBinary) {
            const yesOpt = sorted.find(o => o.option_type === 'yes')
            const yesPercent = yesOpt ? Math.round((prices[yesOpt.id] ?? 0.5) * 100) : 50
            percent = isYes ? yesPercent : (100 - yesPercent)
          } else {
            const totalPrice = sorted.reduce((s, o) => s + (prices[o.id] ?? 0.5), 0) || 1
            percent = Math.round(((prices[opt.id] ?? 0.5) / totalPrice) * 100)
          }

          const activeColor = isBinary ? (isYes ? Colors.yes : isNo ? Colors.no : Colors.primary) : Colors.primary
          const isSelected = selectedId === opt.id

          return (
            <button key={opt.id} onClick={() => setSelectedId(opt.id)}
              style={{
                width: '100%', padding: '14px 16px',
                background: isSelected ? activeColor : `${activeColor}18`,
                color: isSelected ? Colors.white : activeColor,
                border: `2px solid ${activeColor}`, borderRadius: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s',
              }}>
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

      {/* 매도 보유 정보 */}
      {mode === 'sell' && selectedOption && selectedTicket && (() => {
        const heldPickets = Math.floor(Number(selectedTicket.quantity))
        const currentPrice = prices[selectedOption.id] ?? Number(selectedOption.price)
        const avgPrice = Number(selectedTicket.avg_price)
        const currentValue = Math.floor(heldPickets * currentPrice)   // 전량 매도 시 환급액
        const pnl = currentValue - Math.round(avgPrice * heldPickets)
        return (
          <div style={{ background: Colors.primaryLight, borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: Colors.primary }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>현재 가치</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* 전액 버튼: currentValue(환급 포인트) 기준 */}
                <button onClick={() => setAmount(String(currentValue))}
                  style={{ fontSize: '11px', fontWeight: 700, color: Colors.primary, background: Colors.white, border: `1px solid ${Colors.primary}`, borderRadius: '6px', padding: '2px 8px', cursor: 'pointer' }}>
                  전액
                </button>
                <span style={{ fontWeight: 700, color: pnl >= 0 ? Colors.yes : Colors.no }}>
                  {currentValue.toLocaleString()}P
                  <span style={{ fontWeight: 400, fontSize: '12px', color: Colors.textTertiary }}> ({pnl >= 0 ? '+' : ''}{pnl.toLocaleString()}P)</span>
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>맞추면</span>
              <span style={{ fontWeight: 700 }}>{heldPickets.toLocaleString()}P</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>매수 시 확률</span>
              <span style={{ fontWeight: 700 }}>{Math.round(avgPrice * 100)}%</span>
            </div>
          </div>
        )
      })()}

      {/* 금액 입력 */}
      <div style={{ marginBottom: '8px' }}>
        <input type="number" value={amount} onChange={e => {
            const val = e.target.value
            if (mode === 'sell' && selectedOption) {
              const currentPrice = prices[selectedOption.id] ?? Number(selectedOption.price)
              const heldPickets = Math.floor(Number(selectedTicket?.quantity ?? 0))
              const maxReturn = Math.floor(heldPickets * currentPrice)
              if (parseInt(val) > maxReturn) { setAmount(String(maxReturn)); return }
            }
            setAmount(val)
          }}
          placeholder={mode === 'buy' ? '투자할 포인트(P) 입력' : '환급받을 포인트(P) 입력'}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
      </div>

      {/* 빠른 입력 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {[10, 50, 100].map(v => (
          <button key={v} onClick={() => setAmount(String(parseInt(amount || '0') + v))}
            style={{ flex: 1, padding: '6px 12px', background: '#F9F9F9', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: Colors.textSecondary }}>
            +{v.toLocaleString()}P
          </button>
        ))}
      </div>

      {/* 미리보기 */}
      {slippagePreview && (
        <div style={{
          background: slippagePreview.mode === 'buy' && slippagePreview.isHighImpact ? '#FFF7ED' : '#F8F9FA',
          border: `1px solid ${slippagePreview.mode === 'buy' && slippagePreview.isHighImpact ? '#FED7AA' : '#E5E7EB'}`,
          borderRadius: '10px', padding: '12px', marginBottom: '16px',
        }}>
          {slippagePreview.mode === 'buy' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>투자</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.textPrimary }}>{parseInt(amount).toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>배당률</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: Colors.textPrimary }}>×{slippagePreview.odds.toFixed(2)}배</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>맞추면</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.yes }}>
                  {slippagePreview.estPayout.toLocaleString()}P
                  <span style={{ color: Colors.textTertiary, fontWeight: 400 }}> (+{slippagePreview.profit.toLocaleString()}P)</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>확률 변화</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: slippagePreview.isHighImpact ? '#EA580C' : Colors.textSecondary }}>
                  {slippagePreview.priceBefore}% → {slippagePreview.priceAfter}%
                  <span style={{ fontWeight: 400, color: Colors.textTertiary }}> ({slippagePreview.priceDiff >= 0 ? '+' : ''}{slippagePreview.priceDiff}%p)</span>
                </span>
              </div>
              {slippagePreview.isHighImpact && (
                <p style={{ fontSize: '11px', color: '#EA580C', margin: '8px 0 0', fontWeight: 600 }}>⚠️ 이 거래로 확률이 크게 변합니다</p>
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

      {error && <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {/* 실행 버튼 */}
      {selectedOption && (
        <button onClick={handleTrade} disabled={loading}
          style={{
            width: '100%', padding: '16px',
            background: issueType === 'binary' ? (selectedOption.option_type === 'yes' ? Colors.yes : Colors.no) : Colors.primary,
            color: Colors.white, border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px',
          }}>
          {loading ? '처리 중...' : `${selectedOption.label || (selectedOption.option_type === 'yes' ? '픽' : '패스')} ${amount || 0}P ${mode === 'buy' ? '투자' : '매도'}`}
        </button>
      )}

      {balance !== null && (
        <p style={{ fontSize: '12px', color: Colors.textTertiary, textAlign: 'center', margin: '14px 0 0' }}>
          현재 보유: <span style={{ fontWeight: 700, color: Colors.textSecondary }}>{balance.toLocaleString()}P</span>
        </p>
      )}
    </div>
  )
}
