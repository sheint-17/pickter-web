'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'
import { Issue, IssueOption } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  draft: 'DRAFT', active: '진행중', closed: '마감', resolved: '정산완료',
}
const STATUS_COLOR: Record<string, string> = {
  draft: '#9CA3AF', active: Colors.yes, closed: Colors.no, resolved: Colors.primary,
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminIssueEdit({ issues }: { issues: Issue[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [resolutionRules, setResolutionRules] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [optionLabels, setOptionLabels] = useState<{ id: string; label: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const selectIssue = (issue: Issue) => {
    setSelectedId(issue.id)
    setTitle(issue.title)
    setClosesAt(toLocalDatetimeValue(issue.closes_at))
    setResolutionRules(issue.resolution_rules ?? '')
    setThumbnailUrl(issue.thumbnail_url ?? '')
    setOptionLabels(
      [...(issue.issue_options ?? [])]
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((o: IssueOption) => ({ id: o.id, label: o.label }))
    )
    setError('')
    setSuccess(false)
  }

  const handleDelete = async () => {
    if (!selectedId) return
    if (!confirm('이 이슈를 삭제할까요? 이 작업은 되돌릴 수 없어요.')) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('issues')
      .delete()
      .eq('id', selectedId)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSelectedId(null)
    router.refresh()
  }

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    setError('')
    setSuccess(false)

    // 이슈 제목·마감일·정산규칙·썸네일 수정
    const { error: issueErr } = await supabase
      .from('issues')
      .update({
        title,
        closes_at: new Date(closesAt).toISOString(),
        resolution_rules: resolutionRules.trim() || null,
        thumbnail_url: thumbnailUrl.trim() || null,
      })
      .eq('id', selectedId)

    if (issueErr) { setError(issueErr.message); setSaving(false); return }

    // 선택지 라벨 수정
    for (const opt of optionLabels) {
      const { error: optErr } = await supabase
        .from('issue_options')
        .update({ label: opt.label })
        .eq('id', opt.id)
      if (optErr) { setError(optErr.message); setSaving(false); return }
    }

    setSaving(false)
    setSuccess(true)
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: `1px solid ${Colors.border}`, borderRadius: '8px',
    fontSize: '14px', color: Colors.textPrimary,
    background: Colors.white, boxSizing: 'border-box', outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px', fontWeight: 600,
    color: Colors.textTertiary, display: 'block', marginBottom: '6px',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

      {/* 좌측: 이슈 목록 */}
      <div>
        <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textTertiary, marginBottom: '10px' }}>
          이슈 선택
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '600px', overflowY: 'auto' }}>
          {issues.map(issue => (
            <button
              key={issue.id}
              onClick={() => selectIssue(issue)}
              style={{
                textAlign: 'left', padding: '12px 14px',
                borderRadius: '10px', border: `1px solid ${selectedId === issue.id ? Colors.primary : Colors.border}`,
                background: selectedId === issue.id ? Colors.primaryLight : Colors.white,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                  borderRadius: '4px', color: STATUS_COLOR[issue.status] ?? '#9CA3AF',
                  border: `1px solid ${STATUS_COLOR[issue.status] ?? '#9CA3AF'}`,
                  flexShrink: 0,
                }}>
                  {STATUS_LABEL[issue.status] ?? issue.status}
                </span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: Colors.textPrimary, margin: 0, lineHeight: 1.4 }}>
                {issue.title}
              </p>
            </button>
          ))}
          {issues.length === 0 && (
            <p style={{ fontSize: '13px', color: Colors.textTertiary, textAlign: 'center', marginTop: '40px' }}>
              이슈가 없어요
            </p>
          )}
        </div>
      </div>

      {/* 우측: 수정 폼 */}
      <div>
        {selectedId ? (
          <div style={{ background: Colors.white, borderRadius: '12px', padding: '20px', border: `1px solid ${Colors.border}` }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textTertiary, marginBottom: '16px' }}>
              이슈 수정
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>제목</label>
              <input
                style={inputStyle}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>마감일시 (KST)</label>
              <input
                type="datetime-local"
                style={inputStyle}
                value={closesAt}
                onChange={e => setClosesAt(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>정산 기준</label>
              <textarea
                style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                value={resolutionRules}
                onChange={e => setResolutionRules(e.target.value)}
                placeholder="예) 영진위 통합전산망 기준 5월 25일 23:59 누적 관객 수"
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>썸네일 URL</label>
              <input
                style={inputStyle}
                value={thumbnailUrl}
                onChange={e => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />
              {thumbnailUrl && (
                <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${Colors.border}`, aspectRatio: '16/9', background: Colors.background }}>
                  <img
                    src={thumbnailUrl}
                    alt="썸네일 미리보기"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>선택지</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {optionLabels.map((opt, i) => (
                  <input
                    key={opt.id}
                    style={inputStyle}
                    value={opt.label}
                    onChange={e => setOptionLabels(prev =>
                      prev.map((o, idx) => idx === i ? { ...o, label: e.target.value } : o)
                    )}
                    placeholder={`선택지 ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: '13px', color: Colors.no, marginBottom: '12px' }}>{error}</p>
            )}
            {success && (
              <p style={{ fontSize: '13px', color: Colors.yes, marginBottom: '12px' }}>저장됐어요!</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '12px',
                background: saving ? Colors.border : Colors.primary,
                color: Colors.white, border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '저장 중...' : '저장하기'}
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              style={{
                width: '100%', padding: '12px', marginTop: '8px',
                background: 'none', color: Colors.no,
                border: `1px solid ${Colors.no}`, borderRadius: '8px',
                fontSize: '14px', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              이슈 삭제
            </button>
          </div>
        ) : (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: Colors.textTertiary, fontSize: '13px',
          }}>
            좌측에서 이슈를 선택하세요
          </div>
        )}
      </div>
    </div>
  )
}
