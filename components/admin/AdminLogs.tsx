'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Colors } from '@/constants/colors'

interface AdminLog {
  id: string
  level: 'info' | 'warn' | 'error'
  source: string
  message: string
  detail: Record<string, unknown> | null
  created_at: string
}

const LEVEL_COLOR = {
  info:  { bg: '#F0FFF8', text: '#00B37D', border: '#A7F3D0' },
  warn:  { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  error: { bg: '#FFF0F0', text: '#EF4444', border: '#FECACA' },
}

const LEVEL_LABEL = { info: '정보', warn: '경고', error: '오류' }

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all')

  const fetchLogs = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setLogs(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  const counts = {
    all:   logs.length,
    info:  logs.filter(l => l.level === 'info').length,
    warn:  logs.filter(l => l.level === 'warn').length,
    error: logs.filter(l => l.level === 'error').length,
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const filterBtnStyle = (active: boolean, level?: 'info' | 'warn' | 'error'): React.CSSProperties => {
    const color = level ? LEVEL_COLOR[level] : null
    return {
      padding: '5px 12px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
      border: active && color ? `1px solid ${color.border}` : `1px solid ${Colors.border}`,
      background: active && color ? color.bg : active ? Colors.background : 'transparent',
      color: active && color ? color.text : active ? Colors.textPrimary : Colors.textTertiary,
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p style={{ fontSize: '13px', color: Colors.textSecondary, margin: 0 }}>
          최근 7일 로그 · 최대 100건 표시
        </p>
        <button
          onClick={fetchLogs}
          style={{
            padding: '6px 14px', borderRadius: '8px',
            border: `1px solid ${Colors.border}`, background: Colors.background,
            fontSize: '12px', color: Colors.textSecondary, cursor: 'pointer', fontWeight: 600,
          }}
        >
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>
          전체 {counts.all}
        </button>
        <button style={filterBtnStyle(filter === 'error', 'error')} onClick={() => setFilter('error')}>
          오류 {counts.error}
        </button>
        <button style={filterBtnStyle(filter === 'warn', 'warn')} onClick={() => setFilter('warn')}>
          경고 {counts.warn}
        </button>
        <button style={filterBtnStyle(filter === 'info', 'info')} onClick={() => setFilter('info')}>
          정보 {counts.info}
        </button>
      </div>

      {/* 로그 목록 */}
      {loading ? (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
          불러오는 중...
        </p>
      ) : filtered.length === 0 ? (
        <p style={{ color: Colors.textTertiary, textAlign: 'center', marginTop: '40px', fontSize: '14px' }}>
          로그가 없어요
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(log => {
            const c = LEVEL_COLOR[log.level]
            const isExpanded = expanded === log.id
            return (
              <div
                key={log.id}
                style={{
                  background: Colors.white,
                  border: `1px solid ${Colors.border}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {/* 요약 행 */}
                <div
                  onClick={() => log.detail ? setExpanded(isExpanded ? null : log.id) : null}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px',
                    cursor: log.detail ? 'pointer' : 'default',
                  }}
                >
                  {/* 레벨 배지 */}
                  <span style={{
                    fontSize: '11px', fontWeight: 700,
                    color: c.text, background: c.bg,
                    border: `1px solid ${c.border}`,
                    borderRadius: '6px', padding: '2px 7px',
                    flexShrink: 0,
                  }}>
                    {LEVEL_LABEL[log.level]}
                  </span>

                  {/* 출처 */}
                  <span style={{ fontSize: '11px', color: Colors.textTertiary, flexShrink: 0 }}>
                    {log.source}
                  </span>

                  {/* 메시지 */}
                  <span style={{ fontSize: '13px', color: Colors.textPrimary, flex: 1, minWidth: 0 }}>
                    {log.message}
                  </span>

                  {/* 시각 */}
                  <span style={{ fontSize: '11px', color: Colors.textTertiary, flexShrink: 0 }}>
                    {formatTime(log.created_at)}
                  </span>

                  {/* 펼치기 화살표 */}
                  {log.detail && (
                    <span style={{ fontSize: '11px', color: Colors.textTertiary, flexShrink: 0 }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* 상세 내용 */}
                {isExpanded && log.detail && (
                  <div style={{
                    borderTop: `1px solid ${Colors.border}`,
                    padding: '10px 14px',
                    background: Colors.background,
                  }}>
                    <pre style={{
                      fontSize: '12px', color: Colors.textSecondary,
                      margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      fontFamily: 'monospace',
                    }}>
                      {JSON.stringify(log.detail, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
