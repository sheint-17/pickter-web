// components/issue/IssueList.tsx
'use client'

import { useState } from 'react'
import { Issue, IssueCategory } from '@/types'
import IssueCard from './IssueCard'
import CategoryFilter from './CategoryFilter'
import { Colors } from '@/constants/colors'

interface IssueListProps {
  issues: Issue[]
  searchQuery?: string
  onSearchChange?: (q: string) => void
}

export default function IssueList({ issues, searchQuery = '', onSearchChange }: IssueListProps) {
  const [selected, setSelected] = useState<IssueCategory | 'all' | 'hot'>('hot')

  const filtered = (() => {
    const searchFiltered = !searchQuery.trim()
      ? issues
      : issues.filter(issue => issue.title.toLowerCase().includes(searchQuery.trim().toLowerCase()))

    if (selected === 'hot') {
      return [...searchFiltered].sort((a, b) => {
        const pc = (b.participant_count ?? 0) - (a.participant_count ?? 0)
        if (pc !== 0) return pc
        return (b.total_volume ?? 0) - (a.total_volume ?? 0)
      })
    }

    if (selected === 'all') return searchFiltered
    return searchFiltered.filter(issue => issue.category === selected)
  })()

  return (
    <div>
      {onSearchChange !== undefined && (
        <div style={{ position: 'relative', marginBottom: '16px', height: '44px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '15px', pointerEvents: 'none',
          }}>
            🔍
          </span>
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="검색"
            style={{
              width: '100%',
              height: '44px',
              padding: '0 36px 0 38px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              color: Colors.textPrimary,
              background: '#F0F0F0',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '14px', color: Colors.textTertiary, padding: '2px', lineHeight: 1,
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}

      <CategoryFilter selected={selected} onChange={setSelected} />

      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px',
        }}>
          {filtered.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      ) : (
        <p style={{ color: '#999', textAlign: 'center', marginTop: '40px' }}>
          {searchQuery.trim()
            ? `"${searchQuery.trim()}"에 해당하는 이슈가 없어요`
            : '해당 카테고리의 이슈가 없어요'}
        </p>
      )}
    </div>
  )
}
