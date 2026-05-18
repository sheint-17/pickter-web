import { Colors } from '@/constants/colors'
import { CategoryBadge } from '@/components/ui/badge'
import { Issue } from '@/types'
import Link from 'next/link'
import { Users } from 'lucide-react'

const CATEGORY_EMOJI: Record<string, string> = {
  politics: '🏛️',
  economy: '📈',
  entertainment: '🎤',
  sports: '⚽',
  tech: '💻',
  social: '🌍',
  etc: '🎲',
}

interface IssueCardProps {
  issue: Issue
}

export default function IssueCard({ issue }: IssueCardProps) {
  const yesOption = issue.issue_options?.find((o) => o.option_type === 'yes')
  const noOption = issue.issue_options?.find((o) => o.option_type === 'no')
  const yesPercent = yesOption ? Math.round(yesOption.price * 100) : 50
  const noPercent = 100 - yesPercent

  const closesAt = new Date(issue.closes_at)
  const now = new Date()
  const diffMs = closesAt.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  let timeLeft: string
  let timeColor: string
  if (diffMs <= 0) {
    timeLeft = '마감'
    timeColor = Colors.no
  } else if (diffHours < 24) {
    timeLeft = `${diffHours}시간 후 마감`
    timeColor = Colors.no
  } else {
    timeLeft = `${diffDays}일 후 마감`
    timeColor = Colors.textTertiary
  }

  const emoji = CATEGORY_EMOJI[issue.category] ?? '🎲'

  const thumbnail = issue.thumbnail_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={issue.thumbnail_url}
      alt={issue.title}
      referrerPolicy="no-referrer"
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
      background: Colors.primaryLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '18px',
    }}>
      {emoji}
    </div>
  )

  return (
    <Link
      href={`/issue/${issue.id}`}
      className="issue-card"
      style={{
        display: 'block',
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '10px',
        border: '1px solid #EEEEEE',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        textDecoration: 'none',
        overflow: 'hidden',
      }}
    >
      {/* 카테고리 + 마감 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CategoryBadge category={issue.category} />
          {issue.source === 'user' && (
            <span style={{
              fontSize: '11px', fontWeight: 500,
              padding: '2px 8px', borderRadius: '20px',
              background: '#EEEDFE', color: '#3C3489',
            }}>유저 제안</span>
          )}
        </div>
        <span style={{ fontSize: '11px', color: timeColor, fontWeight: diffHours < 24 ? 700 : 500 }}>{timeLeft}</span>
      </div>

      {/* 썸네일 + 제목 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {thumbnail}
        <p style={{ fontSize: '14px', fontWeight: 600, color: Colors.textPrimary, margin: 0, lineHeight: 1.4 }}>
          {issue.title}
        </p>
      </div>

      {/* 확률 게이지 */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', borderRadius: '999px', overflow: 'hidden', height: '6px', background: Colors.background }}>
          <div style={{ width: `${yesPercent}%`, background: Colors.yes }} />
          <div style={{ width: `${noPercent}%`, background: Colors.no }} />
        </div>
      </div>

      {/* 퍼센트 + 참여자 수 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: Colors.textTertiary, fontSize: '12px' }}>
          <Users size={13} />
          <span>{(issue.participant_count ?? 0).toLocaleString()}명</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: Colors.yes }}>픽 {yesPercent}%</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: Colors.no }}>패스 {noPercent}%</span>
        </div>
      </div>
    </Link>
  )
}
