'use client'

import { useState, useTransition } from 'react'
import { Colors } from '@/constants/colors'
import { checkIn } from './actions'

interface Props {
  checkedInToday: boolean
  streak: number
  last7Days: string[]
  attendedDates: string[]
}

export default function AttendanceClient({
  checkedInToday,
  streak: initialStreak,
  last7Days,
  attendedDates: initialAttended,
}: Props) {
  const [done, setDone] = useState(checkedInToday)
  const [streak, setStreak] = useState(initialStreak)
  const [attended, setAttended] = useState(new Set(initialAttended))
  const [reward, setReward] = useState<{ rpGiven: number; isWeekBonus: boolean } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const today = last7Days[last7Days.length - 1]

  const handleCheckIn = () => {
    startTransition(async () => {
      const res = await checkIn()
      if (res.success && res.rpGiven !== undefined && res.streak !== undefined) {
        setDone(true)
        setStreak(res.streak)
        setAttended(prev => new Set([...prev, today]))
        setReward({ rpGiven: res.rpGiven!, isWeekBonus: res.isWeekBonus! })
      } else {
        setErrorMsg(res.error ?? '오류가 발생했어요')
      }
    })
  }

  const dayLabels = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <main style={{ padding: '16px', maxWidth: '480px', margin: '0 auto' }}>

      {/* 헤더 */}
      <h1 style={{
        fontSize: '20px', fontWeight: 800, color: Colors.textPrimary,
        marginBottom: '4px',
      }}>
        출석 체크
      </h1>
      <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '20px', marginTop: 0 }}>
        {today}
      </p>

      {/* 연속 출석 카드 */}
      <div style={{
        background: done ? Colors.primary : Colors.white,
        borderRadius: '20px',
        padding: '28px 24px',
        marginBottom: '16px',
        border: done ? 'none' : `1px solid ${Colors.border}`,
        textAlign: 'center',
        transition: 'background 0.3s',
      }}>
        <p style={{ fontSize: '40px', margin: '0 0 4px' }}>
          {done ? '🔥' : '💤'}
        </p>
        <p style={{
          fontSize: '36px', fontWeight: 900, margin: '0 0 4px',
          color: done ? Colors.white : Colors.primary,
        }}>
          {streak}일
        </p>
        <p style={{
          fontSize: '14px', fontWeight: 600, margin: 0,
          color: done ? 'rgba(255,255,255,0.8)' : Colors.textSecondary,
        }}>
          연속 출석
        </p>

        {/* 7일 진척도 */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px',
        }}>
          {last7Days.map((date, i) => {
            const isAttended = attended.has(date)
            const isToday = date === today
            return (
              <div key={date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: isAttended
                    ? (done ? 'rgba(255,255,255,0.9)' : Colors.primary)
                    : (done ? 'rgba(255,255,255,0.2)' : Colors.background),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px',
                  border: isToday && !isAttended
                    ? `2px solid ${done ? 'white' : Colors.primary}`
                    : 'none',
                  transition: 'background 0.3s',
                }}>
                  {isAttended ? '✓' : ''}
                </div>
                <span style={{
                  fontSize: '10px',
                  color: done ? 'rgba(255,255,255,0.6)' : Colors.textTertiary,
                }}>
                  {dayLabels[new Date(date + 'T12:00:00').getDay() === 0 ? 6 : new Date(date + 'T12:00:00').getDay() - 1]}
                </span>
              </div>
            )
          })}
        </div>

        {/* 7일 보너스 안내 */}
        <p style={{
          fontSize: '12px', marginTop: '12px', marginBottom: 0,
          color: done ? 'rgba(255,255,255,0.7)' : Colors.textTertiary,
        }}>
          7일 연속 출석 시 +5 RP 보너스
        </p>
      </div>

      {/* 보상 메시지 */}
      {reward && (
        <div style={{
          background: reward.isWeekBonus ? '#FFF8E1' : Colors.primaryLight,
          borderRadius: '12px', padding: '14px 18px', marginBottom: '16px',
          border: `1px solid ${reward.isWeekBonus ? '#FFD700' : Colors.primary}`,
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: Colors.textPrimary }}>
            {reward.isWeekBonus ? '🎉 7일 연속 출석 달성!' : '✅ 출석 완료!'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: Colors.textSecondary }}>
            {reward.isWeekBonus
              ? `+1 RP + 보너스 +5 RP = +${reward.rpGiven} RP 지급`
              : `+${reward.rpGiven} RP 지급`}
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {errorMsg && (
        <div style={{
          background: '#FFF0F0', borderRadius: '12px', padding: '14px 18px', marginBottom: '16px',
          border: `1px solid ${Colors.no}`, textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: Colors.no }}>{errorMsg}</p>
        </div>
      )}

      {/* 출석 버튼 */}
      <button
        onClick={handleCheckIn}
        disabled={done || isPending}
        style={{
          width: '100%', padding: '16px',
          background: done ? Colors.background : Colors.primary,
          color: done ? Colors.textTertiary : Colors.white,
          border: done ? `1px solid ${Colors.border}` : 'none',
          borderRadius: '14px', fontSize: '16px', fontWeight: 700,
          cursor: done || isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {isPending ? '처리 중...' : done ? '오늘 출석 완료 ✓' : '출석하기 +1 RP'}
      </button>

      {!done && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: Colors.textTertiary, marginTop: '12px' }}>
          매일 자정 초기화 · 7일 연속 달성 시 +5 RP 추가 지급
        </p>
      )}

    </main>
  )
}
