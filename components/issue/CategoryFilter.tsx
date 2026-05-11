// components/issue/CategoryFilter.tsx
'use client'

import { Colors } from '@/constants/colors'
import { IssueCategory } from '@/types'
import { Flame } from 'lucide-react'

const categories: { label: string; value: IssueCategory | 'all' | 'hot'; hot?: boolean }[] = [
  { label: '인기', value: 'hot', hot: true },
  { label: '전체', value: 'all' },
  { label: '정치', value: 'politics' },
  { label: '경제', value: 'economy' },
  { label: '엔터', value: 'entertainment' },
  { label: '스포츠', value: 'sports' },
  { label: 'IT', value: 'tech' },
  { label: '사회', value: 'social' },
  { label: '기타', value: 'etc' },
]

interface CategoryFilterProps {
  selected: IssueCategory | 'all' | 'hot'
  onChange: (category: IssueCategory | 'all' | 'hot') => void
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '12px',
      marginBottom: '12px',
      scrollbarWidth: 'none',
    }}>
      {categories.map((cat) => {
        const isActive = selected === cat.value
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 16px',
              borderRadius: '999px',
              border: `1px solid ${isActive ? Colors.primary : Colors.border}`,
              background: isActive ? Colors.primary : Colors.white,
              color: isActive ? Colors.white : Colors.textSecondary,
              fontSize: '13px',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: isActive ? '0 2px 8px rgba(123,47,190,0.25)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {cat.hot && <Flame size={14} />}
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}
