'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { updateNickname, UpdateNicknameState } from '@/app/mypage/actions'

export default function OnboardingPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<UpdateNicknameState, FormData>(
    updateNickname,
    null
  )

  useEffect(() => {
    if (state?.success) {
      router.replace('/')
    }
  }, [state, router])

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: Colors.background,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: Colors.white,
        borderRadius: '24px',
        padding: '40px 32px',
        border: `1px solid ${Colors.border}`,
        textAlign: 'center',
      }}>
        {/* 로고 */}
        <div style={{
          fontSize: '28px',
          fontWeight: 900,
          color: Colors.primary,
          letterSpacing: '-1px',
          marginBottom: '8px',
        }}>
          PICKTER
        </div>

        {/* 타이틀 */}
        <h1 style={{
          fontSize: '20px',
          fontWeight: 800,
          color: Colors.textPrimary,
          margin: '0 0 8px',
        }}>
          닉네임을 설정해주세요
        </h1>
        <p style={{
          fontSize: '14px',
          color: Colors.textTertiary,
          margin: '0 0 32px',
          lineHeight: '1.5',
        }}>
          픽터에서 사용할 닉네임이에요.<br />
          설정 후 30일간 변경할 수 없어요.
        </p>

        {/* 폼 */}
        <form action={formAction}>
          <input
            name="nickname"
            type="text"
            placeholder="닉네임 입력 (2~12자)"
            maxLength={12}
            autoFocus
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1.5px solid ${state?.error ? Colors.no : Colors.border}`,
              borderRadius: '12px',
              fontSize: '16px',
              color: Colors.textPrimary,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '8px',
              textAlign: 'center',
              fontWeight: 600,
            }}
          />

          {state?.error && (
            <p style={{
              fontSize: '13px',
              color: Colors.no,
              margin: '0 0 12px',
            }}>
              {state.error}
            </p>
          )}

          <p style={{
            fontSize: '12px',
            color: Colors.textTertiary,
            margin: '0 0 20px',
          }}>
            한글·영문·숫자·밑줄(_) 사용 가능
          </p>

          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '14px',
              background: Colors.primary,
              color: Colors.white,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? '저장 중...' : '픽터 시작하기'}
          </button>
        </form>
      </div>
    </div>
  )
}
