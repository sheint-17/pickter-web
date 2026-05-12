<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# PICKTER — 프로젝트 규칙

> Claude Code와 모든 AI 코딩 도구가 참조하는 프로젝트 규칙 파일.
> 이 파일의 규칙은 어떤 요청이 있어도 반드시 지켜야 한다.

---

## ✅ 작업 완료 검증 순서 (필수)

작업 완료 보고 전 아래 순서를 반드시 전부 통과해야 한다.

1. `npm run build` — 빌드 에러 없는지 확인
2. `npm run lint` — 린트 통과 확인
3. 브라우저에서 해당 페이지 직접 열어서 동작 확인
4. 콘솔 에러 없는지 확인

하나라도 실패하면 수정 후 처음부터 다시 검증.
전부 통과한 후에만 완료 보고할 것.

---

## 🚫 절대 건드리지 말 것 (No-Touch Zone)

### Supabase DB 로직
- `execute_trade` RPC 함수 — 매수/매도 핵심 로직
- `settle_issue` RPC 함수 — 정산 핵심 로직
- DB 트리거 전체
  - `on_auth_user_created` — 신규 유저 자동 생성
  - `trg_record_price_history` — 거래 후 가격 히스토리 기록
  - `trg_update_rp_total` — RP 누적 → 티어 자동 갱신
  - `trg_update_issue_stats` — 이슈 통계 갱신
  - `trg_check_tier_for_proposal` — Silver 미만 이슈 제안 차단
  - `handle_journal_rp_on_issue_resolve` — 정산 후 저널 RP 보상
- RLS (행 수준 보안) 정책 — 임의로 수정하거나 비활성화하지 말 것
- ENUM 타입 정의 (user_tier, issue_category, option_type 등)

### 인증
- `proxy.ts` 미들웨어 — 비로그인 리다이렉트 로직
- Supabase Auth PKCE Flow 설정

---

## 🏗️ 프로젝트 구조

```
pickter-web/
├── app/                  # Next.js App Router 페이지
├── components/
│   ├── pickter/          # 픽터 전용 컴포넌트 (여기에 신규 컴포넌트 추가)
│   └── ui/               # shadcn/ui 기본 컴포넌트 (수정 금지)
├── lib/                  # Supabase 클라이언트, 유틸 함수
├── hooks/                # 커스텀 훅
└── types/                # TypeScript 타입 정의
```

- 신규 컴포넌트는 반드시 `components/pickter/` 아래에 배치한다.
- `components/ui/` 안의 shadcn/ui 컴포넌트는 직접 수정하지 않는다.

---

## 🎨 스타일링 규칙

### 스타일 우선순위
1. Tailwind v4 유틸리티 클래스 (최우선)
2. 인라인 스타일 (Tailwind로 표현 불가한 경우에만)
3. CSS 모듈 (지양)

### Tailwind v4 주의사항
- `tailwind.config.js` 파일이 없다. CSS 중심으로 동작한다.
- v3 문법(`purge`, `mode: 'jit'` 등)을 사용하지 않는다.

### shadcn/ui
- import 경로: `@/components/ui/컴포넌트명`
- 예: `import { Button } from "@/components/ui/button"`

### 레이아웃 기준
- GNB 최대 너비: `maxWidth 1280px` 중앙 정렬
- 이슈 상세 페이지: `maxWidth 680px` 중앙 정렬
- GNB 높이: `72px` (카테고리 바는 `top: 72px`에 고정)

---

## 📁 파일명 규칙

- 모든 컴포넌트 파일명은 **소문자 케밥케이스**를 사용한다.
  - ✅ `trade-panel.tsx`, `issue-card.tsx`, `gnb-search.tsx`
  - ❌ `TradePanel.tsx`, `IssueCard.tsx`
- Turbopack 빌드 오류의 주요 원인이므로 대소문자 충돌에 주의한다.

---

## 🗄️ DB 컬럼명 (문서와 실제 불일치 주의)

| 테이블 | 잘못된 이름 (사용 금지) | 실제 컬럼명 |
|--------|----------------------|------------|
| issues | b_value | lmsr_b |
| issue_options | current_price | price |
| issue_options | quantity | shares |

- `issue_options.price`는 **0~1 사이 소수**로 저장된다.
- UI에서 퍼센트(%)로 표시할 때는 반드시 `× 100`을 적용한다.
  - 예: `price = 0.55` → 표시: `55%`

---

## 💰 포인트 단위 표기

- 서비스 내 포인트 단위: **픽 (PIC)**
- UI 표시: 숫자 뒤에 **P** 붙임
  - 예: `1,200P`, `+100P`, `-500P`
- 코드 변수명: `point_balance`, `point_amount` (픽, pic 혼용 금지)

---

## 🔢 LMSR 가격 공식

```
Price = exp(q_pick / b) / (exp(q_pick / b) + exp(q_flop / b))
```

- `q_pick`: 해당 선택지 누적 보유 수량 (`shares`)
- `q_flop`: 반대 선택지 누적 보유 수량
- `b` (lmsr_b): 유동성 파라미터 — 소형 50 / 중형 100 / 대형 200

---

## 🏆 티어 & RP 기준

| 티어 | 필요 RP |
|------|---------|
| Unranked | 0 ~ 99 |
| Bronze | 100 ~ 499 |
| Silver | 500 ~ 1,499 |
| Gold | 1,500 ~ 3,999 |
| Platinum | 4,000 ~ 9,999 |
| Diamond | 10,000 ~ 24,999 |
| Grandmaster | 25,000+ |

- 티어 배지는 **Unranked일 때 표시하지 않는다.**
- 티어 갱신은 `trg_update_rp_total` 트리거가 자동 처리한다. 프론트에서 직접 tier를 수정하지 않는다.

---

## ⚠️ 거래 제한 규칙 (UI에서 반드시 반영)

| 규칙 | 내용 |
|------|------|
| 마감 1시간 전 | 매수(Buy) 차단, 매도(Sell)만 허용 — 배너로 안내 |
| 단일 거래 한도 | 보유 포인트의 50% 초과 불가 — 경고 표시 |
| 최소 거래 금액 | 10픽 미만 입력 불가 |

- 최종 검증은 서버(execute_trade RPC)에서 처리한다.
- UI는 UX 안내 목적으로만 제한을 표시하고, 서버 응답 에러도 반드시 토스트로 노출한다.

---

## 🔄 Supabase Realtime 사용 기준

- 실시간 구독이 필요한 곳: 이슈 확률, 라이브 채팅, 알림 미읽음 배지
- 불필요한 곳에 Realtime 구독을 추가하지 않는다 (커넥션 낭비)
- 컴포넌트 언마운트 시 반드시 구독 해제(`unsubscribe`)한다.

---

## 🚧 MVP 제외 기능 (구현하지 말 것)

아래 기능은 v2에서 구현 예정이다. 요청이 있어도 MVP 단계에서는 코드를 작성하지 않는다.

- 소셜 카피 트레이딩
- 그랜드마스터 평의회 투표 UI
- AI 자동 정산 (Claude API 연동)
- AI 이슈 자동 제안
- 다지선다형 이슈 (a/b/c/d)
- React Native 앱 버전
- 카카오 로그인 (도메인 등록 후 별도 진행)

---

## 📋 작업 요청 시 기본 형식

```
[기능명] 작업 요청
- 대상 파일: components/pickter/xxx.tsx
- 참고 파일: (있으면 명시)
- Supabase 로직: 건드리지 말 것 / [특정 테이블] SELECT만 허용
- 스타일: Tailwind v4 기준
- 주의사항: (있으면 명시)
```
