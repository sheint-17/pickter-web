// types/index.ts

export type UserTier =
  | 'Unranked'
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Grandmaster'

export type IssueCategory =
  | 'politics'
  | 'economy'
  | 'entertainment'
  | 'sports'
  | 'tech'
  | 'social'
  | 'etc'

export type IssueStatus =
  | 'draft'
  | 'active'
  | 'closed'
  | 'resolved'
  | 'cancelled'

export type IssueType = 'binary' | 'multi'

// option_type: binary는 'yes'|'no', multi는 '1'|'2'|'3'... (text)
export type OptionType = string

export interface User {
  id: string
  nickname: string
  tier: UserTier
  rp_total: number
  point_balance: number
  provider: string
  created_at: string
}

export interface IssueOption {
  id: string
  issue_id: string
  option_type: OptionType
  label: string
  price: number
  shares: number
  order_index: number
}

export interface Issue {
  id: string
  title: string
  category: IssueCategory
  status: IssueStatus
  issue_type: IssueType
  closes_at: string
  created_at: string
  thumbnail_url?: string | null
  participant_count?: number
  total_volume?: number
  issue_options: IssueOption[]
}

export interface Ticket {
  id: string
  user_id: string
  issue_id: string
  option_id: string
  quantity: number
  avg_price: number
  updated_at: string
}

export interface TicketWithRelations {
  id: string
  quantity: number
  avg_price: number
  issues: { title: string; closes_at: string; status: string }
  issue_options: { label: string; price: number; option_type: string }
}

export interface SettlementWithRelations {
  id: string
  is_correct: boolean
  point_profit: number
  issues: { title: string }
}
