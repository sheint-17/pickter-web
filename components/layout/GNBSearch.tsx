'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GNBSearch() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <>
      <style>{`
        .gnb-search-input {
          background: #EFEFEF !important;
          background-color: #EFEFEF !important;
        }
        .gnb-search-input:-webkit-autofill,
        .gnb-search-input:-webkit-autofill:hover,
        .gnb-search-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #EFEFEF inset !important;
          background-color: #EFEFEF !important;
        }
      `}</style>
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '44px',
          background: '#EFEFEF',
          border: `1px solid ${focused ? '#9CA3AF' : '#D1D5DB'}`,
          borderRadius: '10px',
          padding: '0 16px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
      >
        <Search size={16} style={{ flexShrink: 0, color: '#9CA3AF', pointerEvents: 'none' }} />
        <input
          type="text"
          className="gnb-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="이슈 검색..."
          style={{
            flex: 1,
            height: '100%',
            background: '#EFEFEF',
            backgroundColor: '#EFEFEF',
            border: 'none',
            outline: 'none',
            fontSize: '15px',
            color: '#1A1A1A',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            appearance: 'none',
          }}
        />
      </form>
    </>
  )
}
