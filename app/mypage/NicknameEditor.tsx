'use client'

import { useState, useActionState, useEffect } from 'react'
import { Colors } from '@/constants/colors'
import { updateNickname, UpdateNicknameState } from './actions'

interface Props {
  currentNickname: string
  nicknameChangedAt: string | null
}

export default function NicknameEditor({ currentNickname, nicknameChangedAt }: Props) {
  const [open, setOpen] = useState(false)
  const [displayNickname, setDisplayNickname] = useState(currentNickname)
  const [state, formAction, isPending] = useActionState<UpdateNicknameState, FormData>(
    updateNickname,
    null
  )

  useEffect(() => {
    if (state?.success && state.newNickname) {
      setDisplayNickname(state.newNickname)
      setOpen(false)
    }
  }, [state])

  const daysLeft = (() => {
    if (!nicknameChangedAt) return 0
    const elapsed = (Date.now() - new Date(nicknameChangedAt).getTime()) / (24 * 60 * 60 * 1000)
    return elapsed < 30 ? Math.ceil(30 - elapsed) : 0
  })()

  const canChange = daysLeft === 0

  return (
    <div style={{
      background: Colors.white, borderRadius: '16px',
      padding: '16px 20px', marginBottom: '16px',
      border: `1px solid ${Colors.border}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: '0 0 2px' }}>닉네임</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, margin: 0 }}>
            {displayNickname}
          </p>
        </div>

        {canChange ? (
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              padding: '8px 14px',
              background: open ? Colors.background : Colors.primaryLight,
              color: open ? Colors.textTertiary : Colors.primary,
              border: `1px solid ${open ? Colors.border : Colors.primaryLight}`,
              borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {open ? '취소' : '변경'}
          </button>
        ) : (
          <span style={{
            fontSize: '12px', color: Colors.textTertiary,
            background: Colors.background, padding: '6px 10px',
            borderRadius: '8px', border: `1px solid ${Colors.border}`,
          }}>
            {daysLeft}일 후 변경 가능
          </span>
        )}
      </div>

      {open && (
        <form action={formAction} style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              name="nickname"
              type="text"
              placeholder="새 닉네임 입력 (2~12자)"
              maxLength={12}
              autoFocus
              style={{
                flex: 1, padding: '10px 12px',
                border: `1px solid ${Colors.border}`,
                borderRadius: '8px', fontSize: '14px',
                color: Colors.textPrimary, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '10px 16px',
                background: Colors.primary, color: Colors.white,
                border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 700,
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isPending ? '저장 중' : '저장'}
            </button>
          </div>

          {state?.error && (
            <p style={{
              fontSize: '12px', color: Colors.no,
              margin: '8px 0 0',
            }}>
              {state.error}
            </p>
          )}

          <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: '6px 0 0' }}>
            한글·영문·숫자·밑줄(_) · 변경 후 30일간 재변경 불가
          </p>
        </form>
      )}
    </div>
  )
}
