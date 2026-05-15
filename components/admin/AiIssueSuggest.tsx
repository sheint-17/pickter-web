'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '연예',
  sports: '스포츠', tech: '테크', social: '사회', etc: '기타',
}

const CATEGORY_LIST = Object.entries(CATEGORY_KO)

interface Option { label: string; order_index: number }

interface Suggestion {
  title: string
  category: string
  issue_type: 'binary' | 'multi'
  options: Option[]
  resolution_rules: string
  lmsr_b: number
  thumbnail_keyword: string
  thumbnail_url: string | null
  source_url: string
  source_title: string
  reason: string
}

interface Meta {
  total_crawled: number
  new_articles: number
  skipped: number
  suggested: number
}

// ─── 단일 제안 카드 ───────────────────────────────────────
function SuggestionCard({
  item,
  index,
  onRegister,
  onSkip,
}: {
  item: Suggestion
  index: number
  onRegister: (s: Suggestion) => Promise<boolean>
  onSkip: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Suggestion>({ ...item })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [thumbError, setThumbError] = useState(false)

  const updateOption = (i: number, label: string) => {
    setDraft(d => ({
      ...d,
      options: d.options.map((o, idx) => idx === i ? { ...o, label } : o),
    }))
  }

  const handleRegister = async () => {
    setLoading(true)
    const success = await onRegister(draft)
    setLoading(false)
    if (success) setDone(true)
  }

  if (done) return null

  const cardStyle: React.CSSProperties = {
    background: Colors.white,
    border: `1px solid ${Colors.border}`,
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '12px',
  }

  const fieldLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: Colors.textTertiary,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${Colors.border}`,
    borderRadius: '8px',
    padding: '8px 10px',
    fontSize: '14px',
    color: Colors.textPrimary,
    background: Colors.background,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
    minHeight: '60px',
    fontFamily: 'inherit',
  }

  return (
    <div style={cardStyle}>
      {/* 썸네일 */}
      {draft.thumbnail_url && !thumbError ? (
        <div style={{ position: 'relative', width: '100%', height: '120px' }}>
          <img
            src={draft.thumbnail_url}
            alt={draft.title}
            onError={() => setThumbError(true)}
            style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
          />
          {/* 썸네일 키워드 오버레이 */}
          <div style={{
            position: 'absolute', bottom: '6px', right: '8px',
            fontSize: '10px', color: 'rgba(255,255,255,0.8)',
            background: 'rgba(0,0,0,0.4)', borderRadius: '4px', padding: '2px 6px',
          }}>
            {draft.thumbnail_keyword}
          </div>
        </div>
      ) : (
        /* 썸네일 없을 때 카테고리 컬러 플레이스홀더 */
        <div style={{
          width: '100%', height: '60px',
          background: `linear-gradient(135deg, ${Colors.primaryLight}, ${Colors.border})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '12px', color: Colors.textTertiary }}>
            {draft.thumbnail_keyword ? `"${draft.thumbnail_keyword}" — 이미지 없음` : '썸네일 없음'}
          </span>
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* 헤더: 번호 + 출처 + 스킵 버튼 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: Colors.primary,
              background: Colors.primaryLight, borderRadius: '6px',
              padding: '2px 8px', marginRight: '8px',
            }}>
              #{index + 1}
            </span>
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '11px', color: Colors.textTertiary, textDecoration: 'underline' }}
            >
              {item.source_title.length > 30 ? item.source_title.slice(0, 30) + '…' : item.source_title}
            </a>
          </div>
          <button
            onClick={onSkip}
            style={{
              fontSize: '12px', color: Colors.textTertiary,
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
            }}
          >
            건너뛰기
          </button>
        </div>

        {/* AI 선택 이유 */}
        <div style={{
          fontSize: '12px', color: Colors.textSecondary,
          background: Colors.background, borderRadius: '6px',
          padding: '6px 10px', marginBottom: '12px',
        }}>
          {item.reason}
        </div>

        {/* 편집 / 보기 토글 */}
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <p style={fieldLabelStyle}>이슈 제목</p>
              <input
                style={inputStyle}
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                maxLength={100}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <p style={fieldLabelStyle}>카테고리</p>
                <select
                  style={{ ...inputStyle }}
                  value={draft.category}
                  onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                >
                  {CATEGORY_LIST.map(([val, ko]) => (
                    <option key={val} value={val}>{ko}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={fieldLabelStyle}>유동성 (lmsr_b)</p>
                <select
                  style={{ ...inputStyle }}
                  value={draft.lmsr_b}
                  onChange={e => setDraft(d => ({ ...d, lmsr_b: Number(e.target.value) }))}
                >
                  {[50, 100, 200].map(v => (
                    <option key={v} value={v}>{v} ({v === 50 ? '소형' : v === 100 ? '중형' : '대형'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p style={fieldLabelStyle}>썸네일 키워드 (영어)</p>
              <input
                style={inputStyle}
                value={draft.thumbnail_keyword ?? ''}
                onChange={e => setDraft(d => ({ ...d, thumbnail_keyword: e.target.value, thumbnail_url: null }))}
                placeholder="예: soccer player celebration"
              />
              <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: '4px 0 0' }}>
                키워드 변경 시 등록 후 썸네일이 자동 적용돼요
              </p>
            </div>

            <div>
              <p style={fieldLabelStyle}>선택지</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {draft.options.map((opt, i) => (
                  <input
                    key={i}
                    style={inputStyle}
                    value={opt.label}
                    onChange={e => updateOption(i, e.target.value)}
                    placeholder={`선택지 ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <p style={fieldLabelStyle}>정산 규칙</p>
              <textarea
                style={textareaStyle}
                value={draft.resolution_rules}
                onChange={e => setDraft(d => ({ ...d, resolution_rules: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: Colors.textPrimary, margin: '0 0 8px' }}>
              {draft.title}
            </p>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px', background: Colors.background,
                borderRadius: '6px', padding: '2px 8px', color: Colors.textSecondary,
              }}>
                {CATEGORY_KO[draft.category] ?? draft.category}
              </span>
              <span style={{
                fontSize: '11px', background: Colors.background,
                borderRadius: '6px', padding: '2px 8px', color: Colors.textSecondary,
              }}>
                {draft.issue_type === 'binary' ? '이진' : '다지선다'} · b={draft.lmsr_b}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
              {draft.options.map((opt, i) => (
                <span key={i} style={{
                  fontSize: '13px',
                  color: i === 0 ? Colors.yes : i === 1 ? Colors.no : Colors.textSecondary,
                  fontWeight: 600,
                  background: i === 0 ? '#E6FAF3' : i === 1 ? '#FFF0F3' : Colors.background,
                  borderRadius: '6px', padding: '3px 10px',
                }}>
                  {opt.label}
                </span>
              ))}
            </div>

            {draft.resolution_rules && (
              <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: '0 0 4px' }}>
                {draft.resolution_rules}
              </p>
            )}
          </div>
        )}

        {/* 액션 버튼 */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => setEditing(e => !e)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: `1px solid ${Colors.border}`,
              background: Colors.background,
              fontSize: '13px', color: Colors.textSecondary,
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {editing ? '미리보기' : '수정'}
          </button>
          <button
            onClick={handleRegister}
            disabled={loading}
            style={{
              flex: 2, padding: '8px', borderRadius: '8px',
              border: 'none',
              background: loading ? Colors.border : Colors.primary,
              fontSize: '13px', color: Colors.white,
              cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700,
            }}
          >
            {loading ? '등록 중…' : 'draft로 등록'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────
export default function AiIssueSuggest() {
  const router = useRouter()
  const [status, setStatus]               = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([])
  const [meta, setMeta]                   = useState<Meta | null>(null)
  const [message, setMessage]             = useState('')
  const [error, setError]                 = useState('')
  const [registerError, setRegisterError] = useState('')

  const handleCrawl = async () => {
    setStatus('loading')
    setError('')
    setMessage('')
    setSuggestions([])
    setMeta(null)

    try {
      const res  = await fetch('/api/admin/crawl-suggest', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? '오류가 발생했어요')
        setStatus('error')
        return
      }

      setSuggestions(data.suggestions ?? [])
      setMeta(data.meta ?? null)
      setMessage(data.message ?? '')
      setStatus('done')
    } catch {
      setError('네트워크 오류가 발생했어요')
      setStatus('error')
    }
  }

  const handleRegister = async (s: Suggestion) => {
    setRegisterError('')
    try {
      // 썸네일 키워드가 수정됐고 thumbnail_url이 없는 경우 → Unsplash 재검색
      let thumbnailUrl = s.thumbnail_url
      if (!thumbnailUrl && s.thumbnail_keyword) {
        const thumbRes = await fetch(
          `/api/admin/unsplash-thumbnail?keyword=${encodeURIComponent(s.thumbnail_keyword)}`
        )
        if (thumbRes.ok) {
          const thumbData = await thumbRes.json()
          thumbnailUrl = thumbData.url ?? null
        }
      }

      const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      const { data: issue, error: issueErr } = await supabase
        .from('issues')
        .insert({
          title: s.title,
          category: s.category,
          status: 'draft',
          issue_type: s.issue_type,
          lmsr_b: s.lmsr_b,
          resolution_rules: s.resolution_rules || null,
          thumbnail_url: thumbnailUrl ?? null,
          closes_at: closesAt,
        })
        .select('id')
        .single()

      if (issueErr || !issue) {
        setRegisterError('이슈 등록 실패: ' + (issueErr?.message ?? ''))
        return false
      }

      const optionsToInsert = s.options.map(opt => ({
        issue_id: issue.id,
        label: opt.label,
        option_type: s.issue_type === 'binary'
          ? (opt.order_index === 0 ? 'yes' : 'no')
          : String(opt.order_index + 1),
        order_index: opt.order_index,
        price: s.issue_type === 'binary' ? 0.5 : 1 / s.options.length,
        shares: 0,
      }))

      const { error: optErr } = await supabase.from('issue_options').insert(optionsToInsert)
      if (optErr) {
        setRegisterError('선택지 등록 실패: ' + optErr.message)
        return false
      }

      router.refresh()
      return true
    } catch (e) {
      setRegisterError('예상치 못한 오류가 발생했어요')
      console.error(e)
      return false
    }
  }

  const handleSkip = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* 크롤링 실행 버튼 */}
      <div style={{
        background: Colors.background,
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <p style={{ fontSize: '13px', color: Colors.textSecondary, margin: '0 0 12px' }}>
          커뮤니티 최신 인기글을 수집해 AI가 픽터 이슈를 제안해요.<br />
          이미 수집한 글은 자동으로 제외돼요. 썸네일은 Unsplash에서 자동으로 가져와요.
        </p>
        <button
          onClick={handleCrawl}
          disabled={status === 'loading'}
          style={{
            width: '100%', padding: '12px',
            borderRadius: '10px', border: 'none',
            background: status === 'loading' ? Colors.border : Colors.primary,
            color: Colors.white, fontSize: '14px', fontWeight: 700,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          }}
        >
          {status === 'loading' ? '크롤링 중… (10~20초)' : 'AI 이슈 제안 받기'}
        </button>
      </div>

      {/* 오류 */}
      {error && (
        <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>
          {error}
        </p>
      )}
      {registerError && (
        <p style={{ color: Colors.no, fontSize: '13px', marginBottom: '12px' }}>
          {registerError}
        </p>
      )}

      {/* 크롤링 결과 메타 */}
      {meta && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {[
            { label: '총 수집',   value: meta.total_crawled },
            { label: '신규',      value: meta.new_articles,  highlight: true },
            { label: '중복 스킵', value: meta.skipped },
            { label: 'AI 제안',   value: meta.suggested,     highlight: true },
          ].map(item => (
            <div key={item.label} style={{
              flex: 1, minWidth: '70px',
              background: item.highlight ? Colors.primaryLight : Colors.background,
              borderRadius: '8px', padding: '8px 12px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: item.highlight ? Colors.primary : Colors.textPrimary, margin: 0 }}>
                {item.value}
              </p>
              <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: 0 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 새 글 없음 */}
      {message && suggestions.length === 0 && (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          {message}
        </p>
      )}

      {/* 픽터 이슈 없음 */}
      {status === 'done' && !message && suggestions.length === 0 && (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          현재 픽터 이슈로 적합한 글이 없어요. 잠시 후 다시 시도해 주세요.
        </p>
      )}

      {/* 제안 카드 목록 */}
      {suggestions.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', color: Colors.textSecondary, marginBottom: '12px' }}>
            총 <strong style={{ color: Colors.primary }}>{suggestions.length}개</strong> 이슈가 제안됐어요.
            수정 후 draft로 등록하세요.
          </p>
          {suggestions.map((s, i) => (
            <SuggestionCard
              key={`${s.source_url}-${i}`}
              item={s}
              index={i}
              onRegister={handleRegister}
              onSkip={() => handleSkip(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
