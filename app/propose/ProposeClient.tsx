'use client'

import { useState, useActionState } from 'react'
import { Colors } from '@/constants/colors'
import { IssueCategory } from '@/types'
import { submitProposal, SubmitProposalState } from './actions'

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'politics', label: '정치' },
  { value: 'economy', label: '경제' },
  { value: 'entertainment', label: '연예' },
  { value: 'sports', label: '스포츠' },
  { value: 'tech', label: '테크' },
  { value: 'social', label: '사회' },
  { value: 'etc', label: '기타' },
]

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '연예',
  sports: '스포츠', tech: '테크', social: '사회', etc: '기타',
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: '검토 중',  color: '#B45309', bg: '#FFFBEB' },
  approved: { label: '승인됨',  color: Colors.yes, bg: '#F0FFF8' },
  rejected: { label: '거절됨',  color: Colors.no,  bg: '#FFF0F0' },
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: `1px solid ${Colors.border}`, borderRadius: '8px',
  fontSize: '14px', color: Colors.textPrimary,
  background: Colors.white, boxSizing: 'border-box', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: Colors.textSecondary,
  display: 'block', marginBottom: '6px',
}

interface Proposal {
  id: string
  title: string
  category: string
  status: string
  created_at: string
}

export default function ProposeClient({ myProposals }: { myProposals: Proposal[] }) {
  const [state, formAction, isPending] = useActionState<SubmitProposalState, FormData>(
    submitProposal, null
  )
  const [formKey, setFormKey] = useState(0)

  return (
    <div>
      {/* 제안 폼 */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '12px' }}>
        ✍️ 이슈 제안하기
      </h2>

      {state?.success && (
        <div style={{
          background: '#F0FFF8', border: `1px solid ${Colors.yes}`,
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: Colors.yes }}>
            ✅ 제안이 접수됐어요! 관리자 검토 후 개설돼요.
          </p>
          <button
            onClick={() => setFormKey(k => k + 1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: Colors.yes, fontWeight: 600 }}
          >
            다시 제안
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
        <div style={{
          background: Colors.white, borderRadius: '16px',
          padding: '20px', border: `1px solid ${Colors.border}`, marginBottom: '24px',
        }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>제목</label>
            <input name="title" type="text" placeholder="예: 손흥민, 올 시즌 20골 달성할까?" style={inputStyle} required />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>카테고리</label>
            <select name="category" defaultValue="sports" style={inputStyle}>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>마감일시 (KST)</label>
            <input name="closes_at" type="datetime-local" style={inputStyle} required />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>LMSR b값</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[50, 100, 200].map(b => (
                <label key={b} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', padding: '10px', borderRadius: '8px',
                  border: `1px solid ${Colors.border}`, cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600, color: Colors.textPrimary,
                }}>
                  <input type="radio" name="lmsr_b" value={b} defaultChecked={b === 100}
                    style={{ accentColor: Colors.primary }} />
                  {b}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}><span style={{ color: Colors.yes }}>픽</span> 선택지</label>
              <input name="yes_label" type="text" placeholder="예: 달성한다" style={inputStyle} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}><span style={{ color: Colors.no }}>패스</span> 선택지</label>
              <input name="no_label" type="text" placeholder="예: 못 한다" style={inputStyle} required />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || state?.success === true}
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
            {isPending ? '제안 중...' : state?.success ? '제안 완료 ✓' : '제안하기'}
          </button>
        </div>
      </form>

      {/* 내 제안 목록 */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '12px' }}>
        📋 내 제안 목록
      </h2>

      {myProposals.length === 0 ? (
        <p style={{ fontSize: '14px', color: Colors.textTertiary }}>아직 제안한 이슈가 없어요</p>
      ) : (
        myProposals.map(p => {
          const info = STATUS_INFO[p.status] ?? STATUS_INFO.pending
          return (
            <div key={p.id} style={{
              background: Colors.white, borderRadius: '12px',
              padding: '14px 16px', marginBottom: '8px',
              border: `1px solid ${Colors.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px', fontWeight: 600, color: Colors.textPrimary,
                  margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.title}
                </p>
                <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: 0 }}>
                  {CATEGORY_KO[p.category] ?? p.category} · {new Date(p.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: info.color, background: info.bg,
                padding: '4px 10px', borderRadius: '20px',
                marginLeft: '12px', flexShrink: 0,
              }}>
                {info.label}
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}
