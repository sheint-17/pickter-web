// components/issue/TradePanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { IssueOption, Ticket } from '@/types'
import { useAuthModal } from '@/components/layout/AuthModalProvider'

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
  const [mode, setMode] = useState<'pick' | 'run'>('pick')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
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
  const [netInvested, setNetInvested] = useState<Record<string, number>>({})

  const { openLogin } = useAuthModal()
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
  const currentShares = sorted.map(o => Number(o.shares) ?? 0)

  // RUN: trades 기반 실제 순투입 포인트 (마지막 런 이후 buy 합산)
  const totalInvested = Object.values(netInvested).reduce((a, b) => a + b, 0)

  // RUN 환급액: 픽켓 수량 × 현재확률 × 0.75 (RPC와 동일)
  const runRefund = tickets.reduce((sum, t) => {
    const currentPrice = prices[t.option_id] ?? 0
    const qty = Math.floor(Number(t.quantity))
    return sum + Math.floor(qty * currentPrice * 0.75)
  }, 0)

  // 현재 가치: 픽켓 수량 × 현재확률 (패널티 전)
  const currentValue = tickets.reduce((sum, t) => {
    const currentPrice = prices[t.option_id] ?? 0
    const qty = Math.floor(Number(t.quantity))
    return sum + Math.floor(qty * currentPrice)
  }, 0)

  const runPenalty = totalInvested - runRefund
  const valueDiff = currentValue - totalInvested
  const isBothSides = tickets.length > 1

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

    // 실제 순투입: 마지막 런(sell) 이후의 buy만 합산
    const { data: tradeData } = await supabase
      .from('trades')
      .select('option_id, trade_type, point_amount, created_at')
      .eq('user_id', user.id)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })

    if (tradeData) {
      const invested: Record<string, number> = {}
      const lastSellAt: Record<string, string> = {}
      for (const t of tradeData) {
        if (t.trade_type === 'sell') {
          lastSellAt[t.option_id] = t.created_at
          invested[t.option_id] = 0
        }
      }
      for (const t of tradeData) {
        if (t.trade_type === 'buy') {
          const lastSell = lastSellAt[t.option_id]
          if (!lastSell || t.created_at > lastSell) {
            invested[t.option_id] = (invested[t.option_id] ?? 0) + t.point_amount
          }
        }
      }
      Object.keys(invested).forEach(k => { if ((invested[k] ?? 0) <= 0) delete invested[k] })
      setNetInvested(invested)
    }
  }

  useEffect(() => { fetchUserData(); fetchOptions() }, [])

  async function handlePick() {
    if (submitLockRef.current) return
    if (!selectedId || !amount) return

    const inputVal = parseInt(amount)
    if (Number.isNaN(inputVal) || inputVal < 1) { setError('최소 1P 이상 입력해주세요'); return }

    const remaining = new Date(closesAt).getTime() - Date.now()
    if (remaining <= 60 * 60 * 1000) {
      setError('마감 1시간 전부터는 참여가 불가해요.')
      return
    }

    submitLockRef.current = true
    setLoading(true); setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { openLogin(); setLoading(false); submitLockRef.current = false; return }

      const { data: rpcData, error: tradeError } = await supabase.rpc('execute_trade', {
        p_user_id: user.id,
        p_issue_id: issueId,
        p_option_id: selectedId,
        p_trade_type: 'buy',
        p_point_amount: inputVal,
        p_user_ip: null,
      })

      if (tradeError) {
        setError(tradeError.message.replace(/(\d+\.\d+)/g, m => Math.floor(parseFloat(m)).toString()))
        return
      }
      if (rpcData && rpcData.success === false) {
        setError(rpcData.error ?? '참여 실패')
        return
      }

      await fetchUserData()
      await fetchOptions()
      setSelectedId(null)
      setAmount('')
      setToast('참여가 완료되었어요!')
    } finally {
      setLoading(false)
      submitLockRef.current = false
    }
  }

  async function handleRun() {
    if (submitLockRef.current) return
    if (tickets.length === 0) return

    submitLockRef.current = true
    setLoading(true); setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('로그인이 필요해요'); return }

      for (const ticket of tickets) {
        const heldQty = Math.floor(Number(ticket.quantity))
        if (heldQty < 1) continue

        const { data: rpcData, error: tradeError } = await supabase.rpc('execute_trade', {
          p_user_id: user.id,
          p_issue_id: issueId,
          p_option_id: ticket.option_id,
          p_trade_type: 'sell',
          p_point_amount: heldQty,
          p_user_ip: null,
        })

        if (tradeError) {
          setError(tradeError.message.replace(/(\d+\.\d+)/g, m => Math.floor(parseFloat(m)).toString()))
          setLoading(false); submitLockRef.current = false; return
        }
        if (rpcData && rpcData.success === false) {
          setError(rpcData.error ?? '런 실패')
          setLoading(false); submitLockRef.current = false; return
        }
      }

      await fetchUserData()
      await fetchOptions()
      setMode('pick')
      setToast('런 완료. 포인트가 돌아왔어요.')
    } finally {
      setLoading(false)
      submitLockRef.current = false
    }
  }

  const pickPreview = (() => {
    if (mode !== 'pick' || !selectedOption || selectedOptionIdx < 0) return null
    const pts = parseInt(amount)
    if (!pts || pts <= 0) return null

    const estPickets = calcPicketsFromPoints(currentShares, selectedOptionIdx, pts, lmsrB)
    const priceBefore = prices[selectedOption.id] ?? selectedOption.price
    const priceAfter = calcPriceAfter(currentShares, selectedOptionIdx, estPickets, lmsrB)
    const priceDiff = Math.round((priceAfter - priceBefore) * 100)
    const estPayout = Math.floor(estPickets)
    return {
      estPayout,
      profit: estPayout - pts,
      odds: pts > 0 ? estPayout / pts : 0,
      priceBefore: Math.round(priceBefore * 100),
      priceAfter: Math.round(priceAfter * 100),
      priceDiff,
      isHighImpact: Math.abs(priceDiff) >= 5,
    }
  })()

  const isBinary = issueType === 'binary'

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', background: Colors.white }}>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '12px 24px', borderRadius: '10px',
          fontSize: '14px', fontWeight: 600, zIndex: 9999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {/* PICK / RUN 탭 */}
      <div style={{ display: 'flex', marginBottom: '16px', background: '#F0F0F0', borderRadius: '10px', padding: '3px', gap: '3px' }}>
        <button onClick={() => { setMode('pick'); setSelectedId(null); setAmount('') }}
          style={{ flex: 1, padding: '9px', background: mode === 'pick' ? Colors.white : 'transparent', color: mode === 'pick' ? Colors.primary : Colors.textTertiary, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
          PICK
        </button>
        {hasTickets && (
          <button onClick={() => { setMode('run'); setSelectedId(null); setAmount('') }}
            style={{ flex: 1, padding: '9px', background: mode === 'run' ? '#FCEBEB' : 'transparent', color: mode === 'run' ? '#A32D2D' : Colors.textTertiary, border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}>
            RUN
          </button>
        )}
      </div>

      {/* ── PICK 탭 ── */}
      {mode === 'pick' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {sorted.map(opt => {
              const isYes = opt.option_type === 'yes'
              const isNo = opt.option_type === 'no'
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
                  style={{ width: '100%', padding: '14px 16px', background: isSelected ? activeColor : `${activeColor}18`, color: isSelected ? Colors.white : activeColor, border: `2px solid ${activeColor}`, borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700 }}>
                    {isBinary ? (isYes ? '픽' : '패스') : opt.label}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>{percent}%</span>
                </button>
              )
            })}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="참여할 포인트(P) 입력"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '16px', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
            {[10, 50, 100].map(v => (
              <button key={v} onClick={() => setAmount(String(parseInt(amount || '0') + v))}
                style={{ flex: 1, padding: '6px 12px', background: '#F9F9F9', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: Colors.textSecondary }}>
                +{v.toLocaleString()}P
              </button>
            ))}
          </div>

          {pickPreview && (
            <div style={{ background: pickPreview.isHighImpact ? '#FFF7ED' : '#F8F9FA', border: `1px solid ${pickPreview.isHighImpact ? '#FED7AA' : '#E5E7EB'}`, borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>참여</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.textPrimary }}>{parseInt(amount).toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>배당률</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: Colors.textPrimary }}>×{pickPreview.odds.toFixed(2)}배</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>맞추면</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: Colors.yes }}>
                  {pickPreview.estPayout.toLocaleString()}P
                  <span style={{ color: Colors.textTertiary, fontWeight: 400 }}> (+{pickPreview.profit.toLocaleString()}P)</span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: Colors.textTertiary }}>확률 변화</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: pickPreview.isHighImpact ? '#EA580C' : Colors.textSecondary }}>
                  {pickPreview.priceBefore}% → {pickPreview.priceAfter}%
                  <span style={{ fontWeight: 400, color: Colors.textTertiary }}> ({pickPreview.priceDiff >= 0 ? '+' : ''}{pickPreview.priceDiff}%p)</span>
                </span>
              </div>
              {pickPreview.isHighImpact && (
                <p style={{ fontSize: '11px', color: '#EA580C', margin: '8px 0 0', fontWeight: 600 }}>⚠️ 이 참여로 확률이 크게 변합니다</p>
              )}
            </div>
          )}

          {error && <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          {selectedOption && (
            <button onClick={handlePick} disabled={loading}
              style={{ width: '100%', padding: '16px', background: isBinary ? (selectedOption.option_type === 'yes' ? Colors.yes : Colors.no) : Colors.primary, color: Colors.white, border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
              {loading ? '처리 중...' : `${isBinary ? (selectedOption.option_type === 'yes' ? '픽' : '패스') : selectedOption.label} ${amount || 0}P 참여`}
            </button>
          )}
        </>
      )}

      {/* ── RUN 탭 ── */}
      {mode === 'run' && (
        <>
          {/* 경고 문구 */}
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontSize: '13px', color: '#791F1F', margin: '0 0 2px', fontWeight: 700 }}>
                  런하면 {runPenalty.toLocaleString()}P가 소멸됩니다.
                </p>
                <p style={{ fontSize: '12px', color: '#A32D2D', margin: 0 }}>소신이 있다면 버텨보세요!</p>
              </div>
            </div>
          </div>

          {/* 보유 현황 */}
          <div style={{ background: '#F8F9FA', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
            {tickets.map(t => {
              const opt = sorted.find(o => o.id === t.option_id)
              const invested = netInvested[t.option_id] ?? 0
              const label = opt ? (isBinary ? (opt.option_type === 'yes' ? '픽' : '패스') : opt.label) : '-'
              return (
                <div key={t.option_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: Colors.textSecondary }}>{label} 참여</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: Colors.textPrimary }}>{invested.toLocaleString()}P</span>
                </div>
              )
            })}
            <div style={{ borderTop: '0.5px solid #E5E7EB', marginTop: '6px', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: Colors.textSecondary }}>투자 원금</span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: Colors.textPrimary }}>{totalInvested.toLocaleString()}P</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: Colors.textSecondary }}>현재 가치</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: valueDiff >= 0 ? Colors.yes : Colors.no }}>
                  {currentValue.toLocaleString()}P
                  <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: '4px' }}>
                    ({valueDiff >= 0 ? '+' : ''}{valueDiff.toLocaleString()}P)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 환급 계산 */}
          <div style={{ border: '0.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '0.5px solid #E5E7EB', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: Colors.textSecondary }}>돌려받는 포인트</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary }}>{runRefund.toLocaleString()}P</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: Colors.textSecondary }}>소멸되는 포인트</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: Colors.no }}>-{runPenalty.toLocaleString()}P</span>
            </div>
          </div>

          {error && <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          {/* RUN 버튼 */}
          <button onClick={handleRun} disabled={loading}
            style={{ width: '100%', padding: '16px', background: '#A32D2D', color: Colors.white, border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? '처리 중...' : isBothSides ? '이 방에서 완전히 런하기' : '패널티 감수하고 런하기'}
          </button>
        </>
      )}

      {balance !== null && (
        <p style={{ fontSize: '12px', color: Colors.textTertiary, textAlign: 'center', margin: '14px 0 0' }}>
          현재 보유: <span style={{ fontWeight: 700, color: Colors.textSecondary }}>{balance.toLocaleString()}P</span>
        </p>
      )}
    </div>
  )
}
