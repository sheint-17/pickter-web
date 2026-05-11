"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Issue {
  id: string
  title: string
  category: string
  categoryColor: string
  daysLeft: number
  // binary
  pickPercent: number
  passPercent: number
  // multi
  issueType: 'binary' | 'multi'
  options: { id: string; label: string; percent: number; order_index: number }[]
  totalParticipants: number
  thumbnailUrl?: string | null
  trending?: boolean
  hot?: boolean
}

interface IssueCardProps {
  issue: Issue
  variant?: "default" | "compact"
}

const categoryConfig: Record<string, { bg: string; text: string; emoji: string }> = {
  엔터:   { bg: "bg-pink-100",   text: "text-pink-700",   emoji: "🎤" },
  기타:   { bg: "bg-yellow-100", text: "text-yellow-700", emoji: "🔮" },
  스포츠: { bg: "bg-blue-100",   text: "text-blue-700",   emoji: "⚽" },
  IT:     { bg: "bg-cyan-100",   text: "text-cyan-700",   emoji: "💻" },
  정치:   { bg: "bg-red-100",    text: "text-red-700",    emoji: "🏛️" },
  경제:   { bg: "bg-green-100",  text: "text-green-700",  emoji: "📈" },
  사회:   { bg: "bg-orange-100", text: "text-orange-700", emoji: "🏙️" },
}

function Thumbnail({ url, emoji, size = 'md' }: { url?: string | null; emoji: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8' : 'w-11 h-11'
  const radius = size === 'sm' ? 'rounded-lg' : 'rounded-xl'
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`flex-shrink-0 ${dim} ${radius} object-cover`} />
    )
  }
  return (
    <div className={`flex-shrink-0 ${dim} ${radius} bg-secondary flex items-center justify-center ${size === 'sm' ? 'text-base' : 'text-xl'}`}>
      {emoji}
    </div>
  )
}

// ── Binary 카드 바디 ────────────────────────────────────────────
function BinaryBody({ issue }: { issue: Issue }) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">픽</span>
            <span className="text-xl font-extrabold" style={{ color: '#00B37D' }}>{issue.pickPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-extrabold" style={{ color: '#FF4D6D' }}>{issue.passPercent}%</span>
            <span className="text-xs text-muted-foreground">패스</span>
          </div>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden flex">
          <div className="transition-all duration-500" style={{ width: `${issue.pickPercent}%`, backgroundColor: '#00B37D' }} />
          <div className="transition-all duration-500" style={{ width: `${issue.passPercent}%`, backgroundColor: '#FF4D6D' }} />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{issue.totalParticipants.toLocaleString()}명</span>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" className="h-7 w-12 text-xs text-white hover:opacity-90" style={{ backgroundColor: '#00B37D' }}>픽</Button>
          <Button size="sm" variant="outline" className="h-7 w-12 text-xs hover:text-white"
            style={{ borderColor: '#FF4D6D', color: '#FF4D6D' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FF4D6D'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            패스
          </Button>
        </div>
      </div>
    </>
  )
}

// ── Multi 카드 바디 — 상위 2개 + 나머지 N개 표시 ─────────────────
function MultiBody({ issue }: { issue: Issue }) {
  const sorted = [...issue.options].sort((a, b) => b.percent - a.percent)
  const top2 = sorted.slice(0, 2)
  const rest = sorted.length - 2

  return (
    <>
      <div className="space-y-1.5">
        {top2.map((opt) => (
          <div key={opt.id} className="flex items-center gap-2">
            <span className="text-xs text-foreground font-medium truncate flex-1 min-w-0">{opt.label}</span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* 미니 게이지 */}
              <div style={{ width: '60px', height: '4px', background: '#F0F0F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${opt.percent}%`, height: '100%', background: '#7B2FBE', borderRadius: '999px' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: '#7B2FBE', minWidth: '34px', textAlign: 'right' }}>
                {opt.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          <span>{issue.totalParticipants.toLocaleString()}명</span>
          {rest > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-600" style={{ background: '#F5F0FF', color: '#7B2FBE' }}>
              +{rest}개 선택지
            </span>
          )}
        </div>
        <Button size="sm" className="h-7 px-3 text-xs text-white hover:opacity-90" style={{ backgroundColor: '#7B2FBE' }}>
          예측하기
        </Button>
      </div>
    </>
  )
}

// ── 메인 카드 ───────────────────────────────────────────────────
export function IssueCard({ issue, variant = "default" }: IssueCardProps) {
  const config = categoryConfig[issue.category] || { bg: "bg-gray-100", text: "text-gray-700", emoji: "❓" }

  if (variant === "compact") {
    return (
      <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
        <div className="group flex items-center gap-4 p-3 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
          <Thumbnail url={issue.thumbnailUrl} emoji={config.emoji} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn("text-xs font-medium", config.bg, config.text)}>{issue.category}</Badge>
            </div>
            <p className="text-sm font-medium text-foreground truncate">{issue.title}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{issue.daysLeft}일 후 마감</span>
            {issue.issueType === 'binary' ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold" style={{ color: '#00B37D' }}>픽 {issue.pickPercent}%</span>
                <span className="font-semibold" style={{ color: '#FF4D6D' }}>패스 {issue.passPercent}%</span>
              </div>
            ) : (
              <span className="text-xs font-semibold" style={{ color: '#7B2FBE' }}>
                {issue.options[0]?.label} {issue.options[0]?.percent}%
              </span>
            )}
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/issue/${issue.id}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
      <div className="issue-card group bg-card rounded-xl border border-border hover:shadow-md transition-all cursor-pointer overflow-hidden">
        <div className="p-4">
          {/* 카테고리 + 마감일 */}
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className={cn("text-xs font-medium", config.bg, config.text)}>
              {issue.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{issue.daysLeft}일 후 마감</span>
          </div>

          {/* 썸네일 + 제목 */}
          <div className="flex items-start gap-3 mb-4">
            <Thumbnail url={issue.thumbnailUrl} emoji={config.emoji} size="md" />
            <h3 className="text-base font-bold text-foreground line-clamp-2 flex-1 leading-snug">
              {issue.title}
            </h3>
          </div>

          {/* binary / multi 분기 */}
          {issue.issueType === 'binary' ? (
            <BinaryBody issue={issue} />
          ) : (
            <MultiBody issue={issue} />
          )}
        </div>
      </div>
    </Link>
  )
}
