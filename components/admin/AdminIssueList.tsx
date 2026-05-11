// components/admin/AdminIssueList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { Issue, IssueOption } from '@/types'

interface AdminIssueListProps {
  issues: Issue[]
}

export default function AdminIssueList({ issues }: AdminIssueListProps) {
  const router = useRouter()
  // 정산 처리 중인 이슈 ID
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSettle(issueId: string, correctOptionId: string) {
    setLoadingId(issueId)
    setError('')

    const { error: settleError } = await supabase.rpc('settle_issue', {
      p_issue_id: issueId,
      p_correct_option: correctOptionId,
    })

    setLoadingId(null)

    if (settleError) {
      setError(settleError.message)
      return
    }

    router.refresh()
  }

  return (
    <div>
      {/* 에러 메시지 */}
      {error && (
        <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {issues.map((issue) => (
        <div
          key={issue.id}
          style={{
            background: Colors.white,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            border: `1px solid ${Colors.border}`,
          }}
        >
          {/* 이슈 제목 */}
          <p style={{ fontSize: '15px', fontWeight: 600, color: Colors.textPrimary, marginBottom: '12px' }}>
            {issue.title}
          </p>

          {/* 선택지 버튼 — 정답 선택 */}
          <p style={{ fontSize: '12px', color: Colors.textTertiary, marginBottom: '8px' }}>
            정답 선택지를 눌러 정산하세요
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {issue.issue_options?.map((option: IssueOption) => (
              <button
                key={option.id}
                onClick={() => handleSettle(issue.id, option.id)}
                disabled={loadingId === issue.id}
                style={{
                  padding: '10px 16px',
                  background: option.option_type === 'yes' ? Colors.yes : Colors.no,
                  color: Colors.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loadingId === issue.id ? 'not-allowed' : 'pointer',
                  opacity: loadingId === issue.id ? 0.7 : 1,
                }}
              >
                {loadingId === issue.id ? '정산 중...' : `✓ ${option.label} 정답`}
              </button>
            ))}
          </div>
        </div>
      ))}

      {issues.length === 0 && (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '40px' }}>
          정산할 이슈가 없어요
        </p>
      )}
    </div>
  )
}