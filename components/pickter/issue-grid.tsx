"use client"

import type { Issue as SupabaseIssue, IssueOption } from "@/types"
import { IssueCard, Issue } from "./issue-card"

const categoryLabel: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', etc: '기타',
}

const categoryColor: Record<string, string> = {
  politics: 'red', economy: 'green', entertainment: 'pink',
  sports: 'blue', tech: 'cyan', social: 'orange', etc: 'yellow',
}

function getTimeLabel(closesAt: string): { label: string; urgent: 'none' | 'day' | 'hour' } {
  const diffMs = new Date(closesAt).getTime() - Date.now()
  if (diffMs <= 0) return { label: '마감', urgent: 'hour' }
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffHours < 24) return { label: `${diffHours}시간 후 마감`, urgent: 'hour' }
  if (diffDays === 1)  return { label: '1일 후 마감',            urgent: 'day'  }
  return { label: `${diffDays}일 후 마감`, urgent: 'none' }
}

function mapToCardIssue(issue: SupabaseIssue): Issue {
  const opts = (issue.issue_options ?? []) as IssueOption[]
  const sorted = [...opts].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  const isBinary = issue.issue_type !== 'multi'
  const yesOption = sorted.find(o => o.option_type === 'yes')
  const pickPercent = yesOption ? Math.round(yesOption.price * 100) : 50
  const passPercent = 100 - pickPercent

  const totalPrice = sorted.reduce((s, o) => s + o.price, 0) || 1
  const multiOptions = sorted.map(o => ({
    id: o.id,
    label: o.label,
    percent: Math.round((o.price / totalPrice) * 100),
    order_index: o.order_index ?? 0,
  }))

  const { label: timeLabel, urgent } = getTimeLabel(issue.closes_at)

  return {
    id: issue.id,
    title: issue.title,
    category: categoryLabel[issue.category] ?? issue.category,
    categoryColor: categoryColor[issue.category] ?? 'yellow',
    timeLabel,
    urgent,
    issueType: isBinary ? 'binary' : 'multi',
    pickPercent,
    passPercent,
    options: multiOptions,
    totalParticipants: issue.participant_count ?? 0,
    thumbnailUrl: issue.thumbnail_url ?? null,
  }
}

interface IssueGridProps {
  issues?: SupabaseIssue[]
}

export function IssueGrid({ issues }: IssueGridProps) {
  const filtered: Issue[] = (issues ?? [])
    .sort((a, b) => (b.participant_count ?? 0) - (a.participant_count ?? 0))
    .map(mapToCardIssue)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.length > 0 ? (
        filtered.map(issue => <IssueCard key={issue.id} issue={issue} variant="default" />)
      ) : (
        <p className="col-span-full text-center text-muted-foreground py-12">이슈가 없습니다.</p>
      )}
    </div>
  )
}
