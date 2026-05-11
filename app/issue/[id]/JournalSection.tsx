'use client'

import { useState, useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { submitJournal, SubmitJournalState, toggleLike } from './actions'

interface Journal {
  id: string
  user_id: string
  content: string
  is_correct: boolean | null
  rp_bonus: number
  created_at: string
  like_count: number
  liked_by_me: boolean
  users: { nickname: string } | null
  issue_options: { option_type: string; label: string } | null
}

interface IssueOption {
  id: string
  label: string
  option_type: string
}

interface TicketSummary {
  user_id: string
  option_id: string
}

interface Props {
  issueId: string
  issueStatus: string
  currentUserId: string | null
  journals: Journal[]
  hasExistingJournal: boolean
  yesOption: IssueOption
  noOption: IssueOption
  allTickets: TicketSummary[]
}

function formatDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return '방금 전'
  if (h < 24) return `${h}시간 전`
  return `${d}일 전`
}

export default function JournalSection({
  issueId,
  issueStatus,
  currentUserId,
  journals: initialJournals,
  hasExistingJournal,
  yesOption,
  noOption,
  allTickets,
}: Props) {
  const ticketMap = new Map(allTickets.map(t => [t.user_id, t.option_id]))
  const router = useRouter()
  const [likedIds, setLikedIds] = useState(() =>
    new Set(initialJournals.filter(j => j.liked_by_me).map(j => j.id))
  )
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialJournals.map(j => [j.id, j.like_count]))
  )
  const [likePending, startLikeTransition] = useTransition()

  const [formKey, setFormKey] = useState(0)
  const [state, formAction, isSubmitting] = useActionState<SubmitJournalState, FormData>(
    submitJournal, null
  )

  const handleToggleLike = (journalId: string) => {
    if (!currentUserId) return
    const wasLiked = likedIds.has(journalId)
    setLikedIds(prev => {
      const next = new Set(prev)
      wasLiked ? next.delete(journalId) : next.add(journalId)
      return next
    })
    setLikeCounts(prev => ({ ...prev, [journalId]: (prev[journalId] ?? 0) + (wasLiked ? -1 : 1) }))
    startLikeTransition(async () => {
      await toggleLike(journalId, issueId)
    })
  }

  const handleFormSuccess = () => {
    setFormKey(k => k + 1)
    router.refresh()
  }

  const showForm = currentUserId && !hasExistingJournal && issueStatus === 'active'

  return (
    <div>
      <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '16px' }}>
        총 {initialJournals.length}개의 분석글
      </p>

      {/* 작성 폼 */}
      {showForm && (
        <div style={{
          background: Colors.white, borderRadius: '14px',
          padding: '16px', border: `1px solid ${Colors.border}`,
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: Colors.textSecondary, margin: '0 0 10px' }}>
            내 예측 분석 작성하기
          </p>

          {state?.success ? (
            <div style={{
              background: '#F0FFF8', border: `1px solid ${Colors.yes}`,
              borderRadius: '10px', padding: '12px 14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: Colors.yes }}>
                ✅ 분석글이 등록됐어요! 정산 후 적중 시 RP +10
              </p>
              <button
                onClick={handleFormSuccess}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: Colors.yes }}
              >
                확인
              </button>
            </div>
          ) : (
            <form key={formKey} action={formAction}>
              <input type="hidden" name="issue_id" value={issueId} />

              {/* 픽/패스 선택 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                {[
                  { opt: yesOption, color: Colors.yes, label: '픽' },
                  { opt: noOption, color: Colors.no, label: '패스' },
                ].map(({ opt, color, label }) => (
                  <label key={opt.id} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '9px 12px', borderRadius: '8px',
                    border: `1px solid ${Colors.border}`, cursor: 'pointer',
                    fontSize: '13px', fontWeight: 600, color,
                  }}>
                    <input type="radio" name="option_id" value={opt.id}
                      style={{ accentColor: color }} required />
                    {label} — {opt.label}
                  </label>
                ))}
              </div>

              <textarea
                name="content"
                placeholder="근거와 분석을 자유롭게 작성해 주세요 (10~500자)"
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: `1px solid ${Colors.border}`, borderRadius: '8px',
                  fontSize: '14px', color: Colors.textPrimary,
                  resize: 'vertical', boxSizing: 'border-box', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />

              {state?.error && (
                <p style={{ fontSize: '12px', color: Colors.no, margin: '6px 0 0' }}>{state.error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  marginTop: '10px', width: '100%', padding: '12px',
                  background: Colors.primary, color: Colors.white,
                  border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? '등록 중...' : '분석글 등록'}
              </button>
            </form>
          )}
        </div>
      )}

      {!currentUserId && (
        <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '16px' }}>
          로그인하면 분석글을 작성할 수 있어요
        </p>
      )}

      {hasExistingJournal && issueStatus === 'active' && (
        <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '16px' }}>
          이미 이 이슈에 분석글을 작성했어요
        </p>
      )}

      {/* 분석글 목록 */}
      {initialJournals.length === 0 ? (
        <p style={{ fontSize: '14px', color: Colors.textTertiary }}>아직 분석글이 없어요. 첫 번째로 작성해보세요!</p>
      ) : (
        initialJournals.map(journal => {
          const isLiked = likedIds.has(journal.id)
          const count = likeCounts[journal.id] ?? 0
          const optType = journal.issue_options?.option_type
          const isYes = optType === 'yes'

          const authorOptionId = ticketMap.get(journal.user_id)
          const authorPosition = authorOptionId === yesOption.id ? 'yes'
            : authorOptionId === noOption.id ? 'no'
            : null

          return (
            <div key={journal.id} style={{
              background: Colors.white, borderRadius: '14px',
              padding: '16px', marginBottom: '10px',
              border: `1px solid ${Colors.border}`,
            }}>
              {/* 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: Colors.textPrimary }}>
                    {journal.users?.nickname ?? '?'}
                  </span>
                  {authorPosition && (
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      color: authorPosition === 'yes' ? Colors.yes : Colors.no,
                      border: `1px solid ${authorPosition === 'yes' ? Colors.yes : Colors.no}`,
                      borderRadius: '4px', padding: '1px 5px', lineHeight: 1.4,
                    }}>
                      {authorPosition === 'yes' ? '픽' : '패스'}
                    </span>
                  )}
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: isYes ? Colors.yes : Colors.no,
                    background: isYes ? '#F0FFF8' : '#FFF0F3',
                    padding: '2px 8px', borderRadius: '10px',
                  }}>
                    {isYes ? '픽' : '패스'} — {journal.issue_options?.label}
                  </span>
                  {journal.is_correct === true && (
                    <span style={{
                      fontSize: '11px', fontWeight: 700, color: '#7B2FBE',
                      background: Colors.primaryLight, padding: '2px 8px', borderRadius: '10px',
                    }}>
                      ✅ 적중 +10RP
                    </span>
                  )}
                  {journal.is_correct === false && (
                    <span style={{
                      fontSize: '11px', color: Colors.textTertiary,
                      background: Colors.background, padding: '2px 8px', borderRadius: '10px',
                    }}>
                      ❌ 미적중
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: Colors.textTertiary }}>
                  {formatDate(journal.created_at)}
                </span>
              </div>

              {/* 본문 */}
              <p style={{
                fontSize: '14px', color: Colors.textPrimary,
                lineHeight: 1.6, margin: '0 0 12px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {journal.content}
              </p>

              {/* 공감 버튼 */}
              <button
                onClick={() => handleToggleLike(journal.id)}
                disabled={!currentUserId || likePending}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '5px 12px', borderRadius: '20px',
                  background: isLiked ? Colors.primaryLight : Colors.background,
                  border: `1px solid ${isLiked ? Colors.primary : Colors.border}`,
                  color: isLiked ? Colors.primary : Colors.textTertiary,
                  fontSize: '13px', fontWeight: 600,
                  cursor: currentUserId ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                👍 {count > 0 && count}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}
