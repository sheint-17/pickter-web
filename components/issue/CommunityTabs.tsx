'use client'

import { useState } from 'react'
import { Colors } from '@/constants/colors'
import JournalSection from '@/app/issue/[id]/JournalSection'
import LiveTradingRoom from './LiveTradingRoom'

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
  currentNickname: string | null
  currentPosition: 'yes' | 'no' | 'none'
  journals: Journal[]
  hasExistingJournal: boolean
  yesOption: IssueOption
  noOption: IssueOption
  allTickets: TicketSummary[]
}

export default function CommunityTabs({
  issueId,
  issueStatus,
  currentUserId,
  currentNickname,
  currentPosition,
  journals,
  hasExistingJournal,
  yesOption,
  noOption,
  allTickets,
}: Props) {
  const [tab, setTab] = useState<'journal' | 'chat'>('journal')

  return (
    <div style={{ marginTop: '32px' }}>
      {/* 탭 헤더 */}
      <div style={{
        display: 'flex',
        marginBottom: '20px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid ${Colors.border}`,
      }}>
        <button
          onClick={() => setTab('journal')}
          style={{
            flex: 1, padding: '10px',
            background: tab === 'journal' ? Colors.primary : Colors.white,
            color: tab === 'journal' ? Colors.white : Colors.textSecondary,
            border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          📝 분석 & 예측
        </button>
        <button
          onClick={() => setTab('chat')}
          style={{
            flex: 1, padding: '10px',
            background: tab === 'chat' ? Colors.primary : Colors.white,
            color: tab === 'chat' ? Colors.white : Colors.textSecondary,
            border: 'none', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          💬 라이브 채팅
        </button>
      </div>

      {tab === 'journal' && (
        <JournalSection
          issueId={issueId}
          issueStatus={issueStatus}
          currentUserId={currentUserId}
          journals={journals}
          hasExistingJournal={hasExistingJournal}
          yesOption={yesOption}
          noOption={noOption}
          allTickets={allTickets}
        />
      )}

      {tab === 'chat' && (
        <LiveTradingRoom
          issueId={issueId}
          currentUserId={currentUserId}
          currentNickname={currentNickname}
          currentPosition={currentPosition}
        />
      )}
    </div>
  )
}
