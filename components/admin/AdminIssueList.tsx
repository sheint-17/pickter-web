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
    if (settleError) { setError(settleError.message); return }
    router.refresh()
  }

  async function handleActivate(issueId: string) {
    setLoadingId(issueId)
    setError('')
    const { error: err } = await supabase
      .from('issues')
      .update({ status: 'active' })
      .eq('id', issueId)
    setLoadingId(null)
    if (err) { setError(err.message); return }
    router.refresh()
  }

  const draftIssues  = issues.filter(i => i.status === 'draft')
  const activeIssues = issues.filter(i => i.status !== 'draft')

  return (
    <div>
      {error && (
        <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Draft 이슈 */}
      {draftIssues.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textTertiary, marginBottom: '10px' }}>
            DRAFT ({draftIssues.length})
          </p>
          {draftIssues.map(issue => (
            <div key={issue.id} style={{
              background: Colors.background,
              borderRadius: '12px', padding: '16px', marginBottom: '10px',
              border: `1px dashed ${Colors.border}`,
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: Colors.textPrimary, marginBottom: '10px' }}>
                {issue.title}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {issue.issue_options?.map((opt: IssueOption) => (
                  <span key={opt.id} style={{
                    fontSize: '12px', padding: '3px 10px', borderRadius: '6px',
                    background: Colors.white, border: `1px solid ${Colors.border}`,
                    color: Colors.textSecondary,
                  }}>
                    {opt.label}
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleActivate(issue.id)}
                disabled={loadingId === issue.id}
                style={{
                  width: '100%', padding: '10px',
                  background: loadingId === issue.id ? Colors.border : Colors.primary,
                  color: Colors.white, border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 700,
                  cursor: loadingId === issue.id ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingId === issue.id ? '처리 중...' : '🚀 공개하기 (active)'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active / Closed 이슈 — 정산 */}
      {activeIssues.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textTertiary, marginBottom: '10px' }}>
            정산 대기 ({activeIssues.length})
          </p>
          {activeIssues.map(issue => (
            <div key={issue.id} style={{
              background: Colors.white, borderRadius: '12px',
              padding: '16px', marginBottom: '12px',
              border: `1px solid ${Colors.border}`,
            }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: Colors.textPrimary, marginBottom: '12px' }}>
                {issue.title}
              </p>
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
                      color: Colors.white, border: 'none', borderRadius: '8px',
                      fontSize: '14px', fontWeight: 700,
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
        </div>
      )}

      {issues.length === 0 && (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '40px' }}>
          이슈가 없어요
        </p>
      )}
    </div>
  )
}