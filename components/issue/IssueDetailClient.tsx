// components/issue/IssueDetailClient.tsx
'use client'

import { Colors } from '@/constants/colors'
import { IssueOption, Ticket } from '@/types'
import TradePanel from './TradePanel'
import BinaryProbBar from './BinaryProbBar'
import ResolutionRules from './ResolutionRules'
import PickterGuide from './PickterGuide'

interface Props {
  issueId: string
  isBinary: boolean
  lmsrB: number
  sortedOptions: IssueOption[]
  tickets: Ticket[]
  yesOption: IssueOption | null
  noOption: IssueOption | null
  resolutionRules: string | null
  communitySlot: React.ReactNode
  chartSlot: React.ReactNode
  closesAt: string
}

export default function IssueDetailClient({
  issueId, isBinary, lmsrB, sortedOptions, tickets,
  yesOption, noOption, resolutionRules, communitySlot, chartSlot, closesAt,
}: Props) {

  const probBar = isBinary && yesOption && noOption ? (
    <BinaryProbBar
      issueId={issueId}
      yesOptionId={yesOption.id}
      noOptionId={noOption.id}
      yesLabel={yesOption.label ?? '픽'}
      noLabel={noOption.label ?? '패스'}
      initialYesPrice={Number(yesOption.price)}
    />
  ) : null

  const multiProb = !isBinary ? (
    <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #F0F0F0', padding: '16px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedOptions.map((opt, idx) => {
          const totalPrice = sortedOptions.reduce((s, o) => s + Number(o.price), 0) || 1
          const percent = Math.round((Number(opt.price) / totalPrice) * 100)
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
  ) : null

  return (
    // 단일 레이아웃 — CSS grid로 데스크탑/모바일 모두 처리
    <div className="issue-unified-layout">
      {/* 차트 영역 */}
      <div className="issue-unified-chart">
        {chartSlot}
      </div>

      {/* TradePanel — 단 하나만 렌더링 */}
      <div className="issue-unified-trade">
        <TradePanel
          issueId={issueId}
          issueType={isBinary ? 'binary' : 'multi'}
          lmsrB={lmsrB}
          options={sortedOptions}
          tickets={tickets}
          closesAt={closesAt}
        />
      </div>

      {/* 확률 게이지 */}
      <div className="issue-unified-prob">
        {probBar}
        {multiProb}
        {resolutionRules && <div style={{ marginTop: '8px' }}><ResolutionRules rules={resolutionRules} /></div>}
        <div style={{ marginTop: '8px' }}><PickterGuide /></div>
      </div>

      {/* 커뮤니티 */}
      <div className="issue-unified-community">
        {communitySlot}
      </div>
    </div>
  )
}
