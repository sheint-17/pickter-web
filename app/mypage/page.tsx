import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User } from 'lucide-react'
import { Colors } from '@/constants/colors'
import { TierBadge } from '@/components/ui/badge'
import { UserTier, TicketWithRelations, SettlementWithRelations } from '@/types'
import NicknameEditor from './NicknameEditor'
import { LogoutButton } from './LogoutButton'

export default async function MyPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users').select('*').eq('id', user.id).single()

  const { data: tickets } = await supabase
    .from('tickets')
    .select('*, issues(title, closes_at, status), issue_options(label, price, option_type)')
    .eq('user_id', user.id)

  const { data: settlements } = await supabase
    .from('settlements')
    .select('*, issues!settlements_issue_id_fkey(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const { data: settlementsFull } = await supabase
    .from('settlements')
    .select('is_correct, issues!settlements_issue_id_fkey(category)')
    .eq('user_id', user.id)

  const statMap: Record<string, { total: number; correct: number }> = {}
  for (const s of settlementsFull ?? []) {
    const cat = (s.issues as { category: string } | null)?.category
    if (!cat) continue
    if (!statMap[cat]) statMap[cat] = { total: 0, correct: 0 }
    statMap[cat].total++
    if (s.is_correct) statMap[cat].correct++
  }
  const categoryStats = Object.entries(statMap)
    .filter(([, v]) => v.total > 0)
    .map(([cat, v]) => ({
      category: cat, total: v.total, correct: v.correct,
      rate: Math.round((v.correct / v.total) * 100),
    }))
    .sort((a, b) => b.rate - a.rate)
  const oracleCategories = categoryStats.filter(s => s.total >= 10 && s.rate >= 70)

  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('earned_at, badges!user_badges_badge_id_fkey(code, name, description)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  return (
    <main style={{ padding: '24px 16px', maxWidth: '680px', margin: '0 auto' }}>

      {/* 프로필 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, #7B2FBE 0%, #5A1F96 100%)',
        borderRadius: '18px', padding: '24px', marginBottom: '16px',
        boxShadow: '0 4px 16px rgba(123,47,190,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7B2FBE 0%, #00B37D 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <User size={24} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              {profile?.nickname}
            </p>
            <TierBadge tier={(profile?.tier as UserTier) ?? 'Unranked'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'RP', value: profile?.rp_total ?? 0 },
            { label: '픽 잔액', value: `${(profile?.point_balance ?? 0).toLocaleString()}P` },
          ].map((stat) => (
            <div key={stat.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.15)',
              borderRadius: '12px', padding: '14px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 3px', letterSpacing: '-0.5px' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0, fontWeight: 500 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <NicknameEditor
        currentNickname={profile?.nickname ?? ''}
        nicknameChangedAt={profile?.nickname_changed_at ?? null}
      />

      {userBadges && userBadges.length > 0 && <BadgeSection badges={userBadges as any} />}

      {/* 보유 티켓 */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>
          🎫 보유 티켓
        </h2>
        {tickets && tickets.length > 0 ? (
          tickets.map((ticket: TicketWithRelations) => (
            <Link key={ticket.id} href={`/issue/${(ticket as any).issue_id}`}
              style={{ textDecoration: 'none', display: 'block', marginBottom: '8px' }}>
              <div style={{
                background: Colors.white, borderRadius: '16px', padding: '16px',
                border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: Colors.textPrimary, margin: '0 0 6px' }}>
                  {ticket.issues?.title}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: ticket.issue_options?.option_type === 'yes' ? Colors.yes : Colors.no }}>
                    {ticket.issue_options?.option_type === 'yes' ? '픽' : '패스'} {Math.floor(ticket.quantity)}장
                  </span>
                  <span style={{ fontSize: '13px', color: Colors.textTertiary }}>
                    평균 {Math.round(ticket.avg_price * 100)}P
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p style={{ color: Colors.textTertiary, fontSize: '14px' }}>보유 티켓이 없어요</p>
        )}
      </div>

      {/* 정산 내역 */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>
          📊 최근 정산 내역
        </h2>
        {settlements && settlements.length > 0 ? (
          settlements.map((s: SettlementWithRelations) => (
            <div key={s.id} style={{
              background: Colors.white, borderRadius: '16px', padding: '16px', marginBottom: '8px',
              border: '1px solid #F0F0F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: Colors.textPrimary, margin: '0 0 6px' }}>
                {s.issues?.title}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: s.is_correct ? Colors.yes : Colors.no }}>
                  {s.is_correct ? '✅ 적중' : '❌ 미적중'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: s.point_profit > 0 ? Colors.yes : Colors.textTertiary }}>
                  {s.point_profit > 0 ? `+${s.point_profit.toLocaleString()}P` : '0P'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: Colors.textTertiary, fontSize: '14px' }}>정산 내역이 없어요</p>
        )}
      </div>

      <PickterReport categoryStats={categoryStats} oracleCategories={oracleCategories} />

      {/* 로그아웃 */}
      <LogoutButton />

    </main>
  )
}

const BADGE_ICON: Record<string, string> = {
  underdog_hero: '🔥', oracle_politics: '🔮', oracle_economy: '🔮',
  oracle_ent: '🔮', oracle_sports: '🔮', oracle_tech: '🔮',
  gm_council: '⚖️', hall_of_fame: '🌟',
}

interface UserBadge {
  earned_at: string
  badges: { code: string; name: string; description: string | null } | null
}

function BadgeSection({ badges }: { badges: UserBadge[] }) {
  const hasUnderdog = badges.some(b => b.badges?.code === 'underdog_hero')
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '12px' }}>🏅 내 배지</h2>
      <div style={{ background: Colors.white, borderRadius: '16px', padding: '16px 20px', border: `1px solid ${Colors.border}` }}>
        {hasUnderdog && (
          <div style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #F7B731 100%)', borderRadius: '12px', padding: '12px 16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🔥</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: '0 0 2px' }}>언더독 히어로</p>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>30% 미만 확률 선택지 적중 · RP +20 보상</p>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {badges.map((ub, i) => {
            const badge = ub.badges
            if (!badge) return null
            const icon = BADGE_ICON[badge.code] ?? '🏅'
            const isUnderdog = badge.code === 'underdog_hero'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '20px', background: isUnderdog ? '#FFF3E0' : Colors.primaryLight, border: `1px solid ${isUnderdog ? '#FFCC80' : '#E0D0F8'}` }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: isUnderdog ? '#E65100' : Colors.primary }}>{badge.name}</p>
                  {badge.description && <p style={{ fontSize: '10px', color: Colors.textTertiary, margin: 0 }}>{badge.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '엔터',
  sports: '스포츠', tech: 'IT', social: '사회', etc: '기타',
}

type CategoryStat = { category: string; total: number; correct: number; rate: number }

function PickterReport({ categoryStats, oracleCategories }: { categoryStats: CategoryStat[]; oracleCategories: CategoryStat[] }) {
  return (
    <div style={{ marginTop: '8px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '16px' }}>📈 픽터 리포트</h2>
      {categoryStats.length === 0 ? (
        <p style={{ fontSize: '14px', color: Colors.textTertiary }}>아직 정산된 예측이 없어요</p>
      ) : (
        <div style={{ background: Colors.white, borderRadius: '20px', padding: '24px', border: `1px solid ${Colors.border}`, marginBottom: '12px' }}>
          {categoryStats.map(({ category, total, correct, rate }) => {
            const barColor = rate >= 70 ? Colors.yes : rate >= 50 ? '#F59E0B' : Colors.no
            const isOracle = total >= 10 && rate >= 70
            return (
              <div key={category} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: Colors.textPrimary }}>{CATEGORY_KO[category] ?? category}</span>
                    {isOracle && <span style={{ fontSize: '11px', fontWeight: 700, color: '#7B2FBE', background: Colors.primaryLight, padding: '2px 7px', borderRadius: '10px' }}>🔮 Oracle</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: Colors.textTertiary }}>{correct}/{total}회</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: barColor, minWidth: '38px', textAlign: 'right' }}>{rate}%</span>
                  </div>
                </div>
                <div style={{ width: '100%', height: '8px', background: Colors.background, borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${rate}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ background: oracleCategories.length > 0 ? Colors.primaryLight : Colors.background, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${oracleCategories.length > 0 ? '#E0D0F8' : Colors.border}` }}>
        {oracleCategories.length > 0 ? (
          <>
            <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.primary, margin: '0 0 4px' }}>🔮 Oracle 배지 달성 조건 충족!</p>
            <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: 0 }}>{oracleCategories.map(s => CATEGORY_KO[s.category] ?? s.category).join(', ')} 카테고리에서 Oracle 자격을 갖췄어요</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', fontWeight: 600, color: Colors.textSecondary, margin: '0 0 4px' }}>🔮 Oracle 배지 조건</p>
            <p style={{ fontSize: '12px', color: Colors.textTertiary, margin: 0 }}>한 카테고리에서 <strong>10회 이상</strong> 참여 + <strong>70% 이상</strong> 적중률</p>
          </>
        )}
      </div>
    </div>
  )
}
