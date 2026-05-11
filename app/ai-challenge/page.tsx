import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Colors } from '@/constants/colors'

// TODO: AI 실제 베팅 기능 연동 시 이 값을 동적으로 교체 예정
const AI_ACCURACY = 50

const CATEGORY_KO: Record<string, string> = {
  politics: '정치', economy: '경제', entertainment: '연예',
  sports: '스포츠', tech: '테크', social: '사회', etc: '기타',
}

const CATEGORY_EMOJI: Record<string, string> = {
  politics: '🏛️', economy: '📈', entertainment: '🎤',
  sports: '⚽', tech: '💻', social: '🌍', etc: '🎲',
}

interface CategoryStat {
  category: string
  total: number
  correct: number
  accuracy: number
}

function AccuracyBar({ label, color, percent, align }: {
  label: string
  color: string
  percent: number
  align: 'left' | 'right'
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: align === 'left' ? 'flex-start' : 'flex-end', gap: '4px' }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color }}>{label}</span>
      <div style={{ width: '100%', height: '8px', background: Colors.border, borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', background: color, borderRadius: '999px',
          width: `${percent}%`,
          marginLeft: align === 'right' ? 'auto' : undefined,
          float: align === 'right' ? 'right' : undefined,
        }} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 800, color }}>{percent}%</span>
    </div>
  )
}

export default async function AiChallengePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: rows } = await supabase
    .from('settlements')
    .select('is_correct, issues!settlements_issue_id_fkey(category)')

  const settlements = (rows ?? []) as { is_correct: boolean; issues: { category: string } | null }[]

  const totalAll = settlements.length
  const correctAll = settlements.filter(s => s.is_correct).length
  const humanAccuracy = totalAll > 0 ? Math.round((correctAll / totalAll) * 100) : 0

  // 카테고리별 집계
  const statMap = new Map<string, { total: number; correct: number }>()
  for (const s of settlements) {
    const cat = s.issues?.category ?? 'etc'
    const cur = statMap.get(cat) ?? { total: 0, correct: 0 }
    statMap.set(cat, {
      total: cur.total + 1,
      correct: cur.correct + (s.is_correct ? 1 : 0),
    })
  }
  const categoryStats: CategoryStat[] = Array.from(statMap.entries())
    .map(([category, { total, correct }]) => ({
      category,
      total,
      correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)

  const humanWins = humanAccuracy > AI_ACCURACY
  const tied = humanAccuracy === AI_ACCURACY

  return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      {/* 헤더 */}
      <h1 style={{ fontSize: '20px', fontWeight: 800, color: Colors.textPrimary, marginBottom: '4px' }}>
        🤖 AI vs 인간 챌린지
      </h1>
      <p style={{ fontSize: '13px', color: Colors.textTertiary, marginBottom: '28px' }}>
        픽터 AI와 인간 픽터들의 예측 적중률 대결
      </p>

      {/* 메인 스코어보드 */}
      <div style={{
        background: Colors.white, borderRadius: '20px',
        border: `1px solid ${Colors.border}`,
        padding: '24px 20px', marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* AI */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '6px' }}>🤖</div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textSecondary, margin: '0 0 4px' }}>픽터 AI</p>
            <p style={{ fontSize: '32px', fontWeight: 900, color: Colors.primary, margin: 0 }}>
              {AI_ACCURACY}%
            </p>
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: Colors.textTertiary }}>VS</span>
            {tied ? (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                background: Colors.background, color: Colors.textSecondary,
                borderRadius: '20px', border: `1px solid ${Colors.border}`,
              }}>
                동률
              </span>
            ) : (
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                background: humanWins ? '#F0FFF8' : Colors.primaryLight,
                color: humanWins ? Colors.yes : Colors.primary,
                borderRadius: '20px',
              }}>
                {humanWins ? '인간 우세' : 'AI 우세'}
              </span>
            )}
          </div>

          {/* 인간 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '6px' }}>👥</div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: Colors.textSecondary, margin: '0 0 4px' }}>인간 픽터</p>
            <p style={{
              fontSize: '32px', fontWeight: 900, margin: 0,
              color: totalAll === 0 ? Colors.textTertiary : humanWins ? Colors.yes : Colors.no,
            }}>
              {totalAll === 0 ? '-' : `${humanAccuracy}%`}
            </p>
          </div>
        </div>

        {totalAll > 0 && (
          <p style={{ fontSize: '12px', color: Colors.textTertiary, textAlign: 'center', margin: '16px 0 0' }}>
            총 {totalAll.toLocaleString()}번의 정산 결과 기준
          </p>
        )}
        {totalAll === 0 && (
          <p style={{ fontSize: '12px', color: Colors.textTertiary, textAlign: 'center', margin: '16px 0 0' }}>
            아직 정산된 이슈가 없어요
          </p>
        )}
      </div>

      {/* 승자 배너 */}
      {!tied && totalAll > 0 && (
        <div style={{
          background: humanWins ? '#F0FFF8' : Colors.primaryLight,
          border: `1px solid ${humanWins ? Colors.yes : Colors.primary}`,
          borderRadius: '14px', padding: '14px 18px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '22px' }}>{humanWins ? '🏆' : '🤖'}</span>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: humanWins ? Colors.yes : Colors.primary }}>
              현재 {humanWins ? '인간이' : 'AI가'} 이기고 있어요!
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: Colors.textTertiary }}>
              차이: {Math.abs(humanAccuracy - AI_ACCURACY)}%p
            </p>
          </div>
        </div>
      )}

      {/* 카테고리별 비교 */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '14px' }}>
        카테고리별 비교
      </h2>

      {categoryStats.length === 0 ? (
        <div style={{
          background: Colors.white, borderRadius: '14px',
          border: `1px solid ${Colors.border}`,
          padding: '32px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '13px', color: Colors.textTertiary, margin: 0 }}>
            아직 데이터가 없어요
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categoryStats.map(stat => {
            const diff = stat.accuracy - AI_ACCURACY
            return (
              <div key={stat.category} style={{
                background: Colors.white, borderRadius: '14px',
                border: `1px solid ${Colors.border}`,
                padding: '16px',
              }}>
                {/* 카테고리 제목 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: Colors.textPrimary }}>
                    {CATEGORY_EMOJI[stat.category]} {CATEGORY_KO[stat.category] ?? stat.category}
                  </span>
                  <span style={{ fontSize: '11px', color: Colors.textTertiary }}>
                    {stat.total}건 정산
                  </span>
                </div>

                {/* AI vs 인간 바 */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AccuracyBar label="AI" color={Colors.primary} percent={AI_ACCURACY} align="left" />
                  <div style={{ width: '1px', background: Colors.border, alignSelf: 'stretch', flexShrink: 0 }} />
                  <AccuracyBar label="인간" color={stat.accuracy > AI_ACCURACY ? Colors.yes : Colors.no} percent={stat.accuracy} align="right" />
                </div>

                {/* 결과 */}
                <p style={{ fontSize: '11px', color: Colors.textTertiary, margin: '10px 0 0', textAlign: 'center' }}>
                  {diff > 0
                    ? `인간이 ${diff}%p 앞서요`
                    : diff < 0
                    ? `AI가 ${Math.abs(diff)}%p 앞서요`
                    : '동률이에요'}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <p style={{ fontSize: '11px', color: Colors.textTertiary, textAlign: 'center', marginTop: '24px', lineHeight: 1.6 }}>
        * AI 적중률은 현재 50%로 고정되어 있습니다.<br />
        실제 AI 베팅 기능 연동 후 실시간 업데이트 예정입니다.
      </p>
    </main>
  )
}
