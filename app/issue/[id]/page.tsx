export const dynamic = 'force-dynamic'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { CategoryBadge } from '@/components/ui/badge'
import { Issue, IssueOption, Ticket } from '@/types'
import BackButton from '@/components/layout/BackButton'
import TradePanel from '@/components/issue/TradePanel'
import PriceChart from '@/components/issue/PriceChart'
import CommunityTabs from '@/components/issue/CommunityTabs'
import { ShareButton } from '@/components/issue/ShareButton'
import ResolutionRules from '@/components/issue/ResolutionRules'
import BinaryProbBar from '@/components/issue/BinaryProbBar'

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', other: '기타',
}

export default async function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* Server Component에서는 쿠키 쓰기 불가 — 무시 */ }
        },
      },
    }
  )

  const { data: issue } = await supabase
    .from('issues')
    .select('*, issue_options!issue_options_issue_id_fkey(*)')
    .order('order_index', { referencedTable: 'issue_options', ascending: true })
    .eq('id', id)
    .single() as { data: (Issue & { resolution_rules?: string | null }) | null }

  if (!issue) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tickets }, { data: rawJournals }, { data: userProfile }, { data: allTickets }] = await Promise.all([
    supabase.from('tickets').select('*').eq('issue_id', id).eq('user_id', user?.id ?? ''),
    supabase.from('prediction_journals').select(`
      id, user_id, content, is_correct, rp_bonus, created_at,
      users!prediction_journals_user_id_fkey(nickname),
      issue_options!prediction_journals_option_id_fkey(option_type, label)
    `).eq('issue_id', id).order('created_at', { ascending: false }),
    user ? supabase.from('users').select('nickname').eq('id', user.id).single() : Promise.resolve({ data: null }),
    supabase.from('tickets').select('user_id, option_id').eq('issue_id', id).gt('quantity', 0),
  ])

  const journalIds = (rawJournals ?? []).map(j => j.id)
  const { data: likes } = journalIds.length > 0
    ? await supabase.from('journal_likes').select('journal_id, user_id').in('journal_id', journalIds)
    : { data: [] as { journal_id: string; user_id: string }[] }

  const likeCounts: Record<string, number> = {}
  const userLikedSet = new Set<string>()
  for (const like of likes ?? []) {
    likeCounts[like.journal_id] = (likeCounts[like.journal_id] ?? 0) + 1
    if (user && like.user_id === user.id) userLikedSet.add(like.journal_id)
  }
  const journals = (rawJournals ?? []).map(j => ({ ...j, like_count: likeCounts[j.id] ?? 0, liked_by_me: userLikedSet.has(j.id) }))
  const hasExistingJournal = journals.some(j => j.user_id === user?.id)

  const sortedOptions = [...(issue.issue_options ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)) as IssueOption[]
  const isBinary = issue.issue_type !== 'multi'
  const yesOption = sortedOptions.find(o => o.option_type === 'yes')
  const noOption  = sortedOptions.find(o => o.option_type === 'no')

  const communityYesOpt = isBinary
    ? (yesOption ? { id: yesOption.id, label: yesOption.label, option_type: 'yes' } : null)
    : (sortedOptions[0] ? { id: sortedOptions[0].id, label: sortedOptions[0].label, option_type: '1' } : null)
  const communityNoOpt = isBinary
    ? (noOption ? { id: noOption.id, label: noOption.label, option_type: 'no' } : null)
    : (sortedOptions[1] ? { id: sortedOptions[1].id, label: sortedOptions[1].label, option_type: '2' } : null)

  const currentPosition: 'yes' | 'no' | 'none' = (() => {
    if (!tickets || !yesOption || !noOption) return 'none'
    if (tickets.some(t => t.option_id === yesOption.id && t.quantity > 0)) return 'yes'
    if (tickets.some(t => t.option_id === noOption.id && t.quantity > 0)) return 'no'
    return 'none'
  })()

  const closesAt = new Date(issue.closes_at)
  const now = new Date()
  const diffMs = closesAt.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const timeLeft = diffDays > 0 ? `${diffDays}일 후 마감` : diffHours > 0 ? `${diffHours}시간 후 마감` : '마감됨'

  const CATEGORY_EMOJI: Record<string, string> = {
    politics: '🏛️', economy: '📈', entertainment: '🎤',
    sports: '⚽', tech: '💻', social: '🌍', etc: '🎲',
  }

  const pickPercent = yesOption ? Math.round(yesOption.price * 100) : 50
  const passPercent = 100 - pickPercent
  const categoryKo  = CATEGORY_KO[issue.category] ?? '기타'

  const thumbnail = issue.thumbnail_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={issue.thumbnail_url} alt={issue.title}
      style={{ width: '64px', height: '64px', borderRadius: '14px', objectFit: 'cover', objectPosition: 'center top', flexShrink: 0 }} />
  ) : (
    <div style={{ width: '64px', height: '64px', borderRadius: '14px', flexShrink: 0, background: Colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
      {CATEGORY_EMOJI[issue.category] ?? '🎲'}
    </div>
  )

  const resolutionRules = issue.resolution_rules ?? null
  const lmsrB = issue.lmsr_b ?? 100

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px' }}>
      <BackButton />

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
        {thumbnail}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: Colors.textPrimary, margin: '0 0 10px', lineHeight: 1.3 }}>
            {issue.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <CategoryBadge category={issue.category} />
            <span style={{ fontSize: '13px', color: Colors.textTertiary }}>{timeLeft}</span>
            <span style={{ fontSize: '13px', color: Colors.textTertiary }}>·</span>
            <span style={{ fontSize: '13px', color: Colors.textTertiary }}>{issue.participant_count ?? 0}명 참여</span>
            <ShareButton
              issueId={issue.id}
              title={issue.title}
              pick={pickPercent}
              pass={passPercent}
              category={categoryKo}
              participants={issue.participant_count ?? 0}
            />
          </div>
        </div>
      </div>

      {/* 모바일: 1컬럼 */}
      <div className="issue-mobile-layout">
        <div style={{ marginBottom: '16px' }}>
          {(yesOption || sortedOptions[0]) && (
            <PriceChart
              issueId={issue.id}
              yesOptionId={(yesOption ?? sortedOptions[0]).id}
              firstOptionLabel={isBinary ? undefined : sortedOptions[0]?.label}
              secondOptionId={!isBinary && sortedOptions[1] ? sortedOptions[1].id : undefined}
              secondOptionLabel={!isBinary && sortedOptions[1] ? sortedOptions[1].label : undefined}
              height={200}
            />
          )}
        </div>
        {isBinary && yesOption && noOption && (
          <div style={{ marginBottom: '16px' }}>
            <BinaryProbBar
              issueId={issue.id}
              yesOptionId={yesOption.id}
              noOptionId={noOption.id}
              yesLabel={yesOption.label ?? '픽'}
              noLabel={noOption.label ?? '패스'}
              initialYesPrice={Number(yesOption.price)}
            />
          </div>
        )}
        <div style={{ marginBottom: '16px' }}>
          <TradePanel
            issueId={issue.id}
            issueType={isBinary ? 'binary' : 'multi'}
            lmsrB={lmsrB}
            options={sortedOptions}
            tickets={(tickets as Ticket[]) ?? []}
          />
        </div>
        {resolutionRules && (
          <div style={{ marginBottom: '16px' }}>
            <ResolutionRules rules={resolutionRules} />
          </div>
        )}
        {communityYesOpt && communityNoOpt && (
          <CommunityTabs
            issueId={issue.id}
            issueStatus={issue.status}
            currentUserId={user?.id ?? null}
            currentNickname={(userProfile as { nickname: string } | null)?.nickname ?? null}
            currentPosition={currentPosition}
            journals={journals as any}
            hasExistingJournal={hasExistingJournal}
            yesOption={communityYesOpt}
            noOption={communityNoOpt}
            allTickets={(allTickets ?? []) as { user_id: string; option_id: string }[]}
          />
        )}
      </div>

      {/* 데스크탑: 2컬럼 */}
      <div className="issue-detail-grid issue-desktop-layout">

        <div className="issue-chart">
          {(yesOption || sortedOptions[0]) && (
            <PriceChart
                issueId={issue.id}
                yesOptionId={(yesOption ?? sortedOptions[0]).id}
                firstOptionLabel={isBinary ? undefined : sortedOptions[0]?.label}
                secondOptionId={!isBinary && sortedOptions[1] ? sortedOptions[1].id : undefined}
                secondOptionLabel={!isBinary && sortedOptions[1] ? sortedOptions[1].label : undefined}
                height={240}
            />
          )}
        </div>

        <div className="issue-trade-panel">
          <TradePanel
            issueId={issue.id}
            issueType={isBinary ? 'binary' : 'multi'}
            lmsrB={lmsrB}
            options={sortedOptions}
            tickets={(tickets as Ticket[]) ?? []}
          />
        </div>

        <div className="issue-prob">
          {isBinary && yesOption && noOption && (
            <BinaryProbBar
              issueId={issue.id}
              yesOptionId={yesOption.id}
              noOptionId={noOption.id}
              yesLabel={yesOption.label ?? '픽'}
              noLabel={noOption.label ?? '패스'}
              initialYesPrice={Number(yesOption.price)}
            />
          )}

          {!isBinary && (
            <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #F0F0F0', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sortedOptions.map((opt, idx) => {
                  const totalPrice = sortedOptions.reduce((s, o) => s + o.price, 0) || 1
                  const percent = Math.round((opt.price / totalPrice) * 100)
                  const isTop = idx === 0
                  return (
                    <div key={opt.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '14px', fontWeight: isTop ? 700 : 500, color: Colors.textPrimary }}>{opt.label}</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: isTop ? '#7B2FBE' : Colors.textSecondary }}>{percent}%</span>
                      </div>
                      <div style={{ height: '6px', background: '#F0F0F0', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: isTop ? '#7B2FBE' : '#C4B5FD', borderRadius: '999px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {resolutionRules && (
            <div style={{ marginTop: '16px' }}>
              <ResolutionRules rules={resolutionRules} />
            </div>
          )}
        </div>

        <div className="issue-community">
          {communityYesOpt && communityNoOpt && (
            <CommunityTabs
              issueId={issue.id}
              issueStatus={issue.status}
              currentUserId={user?.id ?? null}
              currentNickname={(userProfile as { nickname: string } | null)?.nickname ?? null}
              currentPosition={currentPosition}
              journals={journals as any}
              hasExistingJournal={hasExistingJournal}
              yesOption={communityYesOpt}
              noOption={communityNoOpt}
              allTickets={(allTickets ?? []) as { user_id: string; option_id: string }[]}
            />
          )}
        </div>

      </div>
    </div>
  )
}
