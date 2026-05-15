'use client'

import { useState, useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { Issue, IssueCategory } from '@/types'
import AdminIssueList from '@/components/admin/AdminIssueList'
import AdminIssueEdit from '@/components/admin/AdminIssueEdit'
// import AiIssueSuggest from '@/components/admin/AiIssueSuggest' // AI 제안 탭 비활성화
import AdminLogs from '@/components/admin/AdminLogs'
import AdminDashboard from '@/components/admin/AdminDashboard'
import { createIssue, CreateIssueState, approveProposal, rejectProposal } from './actions'

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '연예',
  sports: '스포츠', tech: '테크', social: '사회', etc: '기타',
}

interface Proposal {
  id: string
  title: string
  category: string
  description: string | null
  created_at: string
  users: { nickname: string; tier: string } | null
}

function ProposalReviewList({ proposals }: { proposals: Proposal[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handle = (id: string, fn: (id: string) => Promise<{ success: boolean; error?: string } | null>) => {
    setActioningId(id)
    setError('')
    startTransition(async () => {
      const res = await fn(id)
      setActioningId(null)
      if (res && !res.success) setError(res.error ?? '오류가 발생했어요')
      else router.refresh()
    })
  }

  if (proposals.length === 0) {
    return <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '40px' }}>검토할 제안이 없어요</p>
  }

  return (
    <div>
      {error && <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
      {proposals.map(p => {
        let meta: Record<string, string | number> = {}
        try { meta = JSON.parse(p.description ?? '{}') } catch { /* empty */ }
        const loading = isPending && actioningId === p.id

        return (
          <div key={p.id} style={{
            background: Colors.white, borderRadius: '12px',
            padding: '16px', marginBottom: '12px',
            border: `1px solid ${Colors.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: Colors.textPrimary, margin: 0 }}>
                {p.title}
              </p>
              <span style={{ fontSize: '12px', color: Colors.textTertiary, flexShrink: 0, marginLeft: '8px' }}>
                {p.users?.nickname} · {p.users?.tier}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: '0 0 10px' }}>
              {CATEGORY_KO[p.category] ?? p.category}
              {meta.closes_at ? ` · 마감 ${new Date(meta.closes_at as string).toLocaleDateString('ko-KR')}` : ''}
              {meta.lmsr_b ? ` · b=${meta.lmsr_b}` : ''}
            </p>
            {(meta.yes_label || meta.no_label) && (
              <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: '0 0 12px' }}>
                <span style={{ color: Colors.yes, fontWeight: 600 }}>픽</span> {meta.yes_label as string}
                {'  '}
                <span style={{ color: Colors.no, fontWeight: 600 }}>패스</span> {meta.no_label as string}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handle(p.id, approveProposal)}
                disabled={loading}
                style={{
                  flex: 1, padding: '9px',
                  background: Colors.yes, color: Colors.white,
                  border: 'none', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading && actioningId === p.id ? '처리 중...' : '승인 및 개설'}
              </button>
              <button
                onClick={() => handle(p.id, rejectProposal)}
                disabled={loading}
                style={{
                  padding: '9px 16px',
                  background: Colors.background, color: Colors.no,
                  border: `1px solid ${Colors.no}`, borderRadius: '8px',
                  fontSize: '13px', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                거절
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'politics', label: '정치' },
  { value: 'economy', label: '경제' },
  { value: 'entertainment', label: '연예' },
  { value: 'sports', label: '스포츠' },
  { value: 'tech', label: '테크' },
  { value: 'social', label: '사회' },
  { value: 'etc', label: '기타' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: `1px solid #E5E7EB`, borderRadius: '8px',
  fontSize: '14px', color: Colors.textPrimary,
  background: Colors.white, boxSizing: 'border-box', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600,
  color: Colors.textSecondary, display: 'block', marginBottom: '6px',
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function IssueCreateForm() {
  const [state, formAction, isPending] = useActionState<CreateIssueState, FormData>(createIssue, null)
  const [formKey, setFormKey] = useState(0)

  return (
    <div>
      {state?.success && (
        <div style={{
          background: '#F0FFF8', border: `1px solid ${Colors.yes}`,
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: Colors.yes }}>이슈가 개설되었어요</p>
          <button onClick={() => setFormKey(k => k + 1)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: Colors.yes, fontWeight: 600,
          }}>
            다시 개설하기
          </button>
        </div>
      )}
      {state?.error && (
        <div style={{
          background: '#FFF0F0', border: `1px solid ${Colors.no}`,
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: Colors.no }}>{state.error}</p>
        </div>
      )}

      <form key={formKey} action={formAction}>
        <div style={{ background: Colors.white, borderRadius: '16px', padding: '20px', border: `1px solid #E5E7EB` }}>
          <FieldRow label="제목">
            <input name="title" type="text" placeholder="예: 트럼프, 2026년 안에 탄핵될까?" style={inputStyle} required />
          </FieldRow>
          <FieldRow label="카테고리">
            <select name="category" defaultValue="politics" style={inputStyle}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="마감일시 (KST)">
            <input name="closes_at" type="datetime-local" style={inputStyle} required />
          </FieldRow>
          <FieldRow label="썸네일 URL (선택)">
            <input name="thumbnail_url" type="url" placeholder="https://example.com/image.jpg" style={inputStyle} />
          </FieldRow>
          <FieldRow label="LMSR b값">
            <div style={{ display: 'flex', gap: '8px' }}>
              {[50, 100, 200].map(b => (
                <label key={b} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', padding: '10px', borderRadius: '8px',
                  border: `1px solid #E5E7EB`, cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600, color: Colors.textPrimary,
                }}>
                  <input type="radio" name="lmsr_b" value={b} defaultChecked={b === 100} style={{ accentColor: Colors.primary }} />
                  {b}
                </label>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: '6px 0 0' }}>b가 클수록 가격 변동이 완만해요</p>
          </FieldRow>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}><span style={{ color: Colors.yes }}>픽</span> 선택지 label</label>
              <input name="yes_label" type="text" placeholder="예: 탄핵된다" style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}><span style={{ color: Colors.no }}>패스</span> 선택지 label</label>
              <input name="no_label" type="text" placeholder="예: 탄핵 안 된다" style={inputStyle} required />
            </div>
          </div>
          <FieldRow label="정산 규칙 (선택)">
            <textarea
              name="resolution_rules" rows={4}
              placeholder={`예: 2026년 12월 31일 23:59 KST 기준, 선거관리위원회 공식 발표 결과를 따릅니다.\n결과가 모호한 경우 그랜드마스터 평의회에서 최종 확정합니다.`}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '96px', lineHeight: '1.5', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: '6px 0 0' }}>
              이슈 상세 페이지에 접었다 펼 수 있는 섹션으로 표시돼요
            </p>
          </FieldRow>
          <button
            type="submit" disabled={isPending || state?.success === true}
            style={{
              width: '100%', padding: '14px',
              background: state?.success ? Colors.background : Colors.primary,
              color: state?.success ? Colors.textTertiary : Colors.white,
              border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 700,
              cursor: isPending || state?.success ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? '개설 중...' : state?.success ? '개설 완료' : '이슈 개설'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── 탭 타입 정의 ─────────────────────────────────────────
type TabType = 'dashboard' | 'ai' | 'create' | 'settle' | 'edit' | 'review' | 'logs'

export default function AdminTabs({
  issues,
  proposals,
}: {
  issues: Issue[]
  proposals: Proposal[]
}) {
  const [tab, setTab] = useState<TabType>('dashboard')

  const tabs: { key: TabType; label: string; badge?: number }[] = [
    { key: 'dashboard', label: '📊 대시보드' },
    // { key: 'ai',     label: 'AI 제안' }, // AI 제안 탭 비활성화
    { key: 'create', label: '이슈 개설' },
    { key: 'settle', label: '이슈 관리' },
    { key: 'edit',   label: '이슈 수정' },
    { key: 'review', label: '제안 검토', badge: proposals.length },
    { key: 'logs',   label: '로그' },
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '9px 4px',
    background: active ? Colors.primary : Colors.white,
    color: active ? Colors.white : Colors.textSecondary,
    border: `1px solid ${active ? Colors.primary : '#E5E7EB'}`,
    borderRadius: '8px', fontSize: '13px', fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
        {tabs.map(t => (
          <button key={t.key} style={tabStyle(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label}
            {t.badge ? (
              <span style={{
                marginLeft: '5px', background: Colors.no, color: Colors.white,
                borderRadius: '10px', padding: '1px 6px', fontSize: '11px',
              }}>
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* display none으로 state 유지 */}
      <div style={{ display: tab === 'dashboard' ? 'block' : 'none' }}><AdminDashboard /></div>
      {/* <div style={{ display: tab === 'ai' ? 'block' : 'none' }}><AiIssueSuggest /></div> */} {/* AI 제안 탭 비활성화 */}
      <div style={{ display: tab === 'create' ? 'block' : 'none' }}><IssueCreateForm /></div>
      <div style={{ display: tab === 'settle' ? 'block' : 'none' }}><AdminIssueList issues={issues} /></div>
      <div style={{ display: tab === 'edit'   ? 'block' : 'none' }}><AdminIssueEdit issues={issues} /></div>
      <div style={{ display: tab === 'review' ? 'block' : 'none' }}><ProposalReviewList proposals={proposals} /></div>
      <div style={{ display: tab === 'logs'   ? 'block' : 'none' }}><AdminLogs /></div>
    </div>
  )
}
