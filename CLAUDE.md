@AGENTS.md

# PICKTER — CLAUDE.md

> Claude 채팅(설계·기획 세션)에서 참조하는 규칙 파일.
> 코딩 작업 규칙은 AGENTS.md를 참조할 것.

---

## 🔌 연결된 MCP 도구 (매 세션 자동 사용 가능)

| 도구 | 용도 |
|------|------|
| **파일시스템 MCP** | 프로젝트 파일 직접 읽기·쓰기. 경로: `D:\Works\Project\pickter-web` |
| **Supabase MCP** | DB 스키마 조회, SQL 실행, 테이블 데이터 확인 |

- 파일 수정 요청 시 Claude Code 프롬프트를 전달하는 대신 **파일시스템 MCP로 직접 수정**한다.
- DB 마이그레이션(컬럼 추가 등) SQL은 **Supabase MCP로 직접 실행**한다.
- 단, No-Touch Zone(RPC 함수, 트리거, RLS)은 MCP로도 절대 건드리지 않는다.

---

## 🚫 절대 건드리지 말 것 (No-Touch Zone)

설계 논의 중에도 아래 항목은 변경을 제안하지 않는다.

- `execute_trade` / `settle_issue` RPC 함수 로직
- DB 트리거 전체 (on_auth_user_created, trg_update_rp_total 등)
- RLS (행 수준 보안) 정책
- Supabase Auth PKCE Flow 설정
- `proxy.ts` 미들웨어

---

## 🗄️ DB 컬럼명 (실제 기준)

| 테이블 | 잘못된 이름 (사용 금지) | 실제 컬럼명 |
|--------|----------------------|------------|
| issues | b_value | lmsr_b |
| issue_options | current_price | price |
| issue_options | quantity | shares |

- `issue_options.price`는 0~1 소수 (확률값). UI 표시 시 `× 100` 적용.

---

## 💰 포인트 표기 규칙

- 단위명: **픽 (PIC)**
- UI 표시: `1,200P`, `+100P` 형식
- 코드 변수명: `point_balance`, `point_amount`

---

## 🏆 티어 구조

```
Unranked → Bronze → Silver → Gold → Platinum → Diamond → Grandmaster
```

| 티어 | 필요 RP |
|------|---------|
| Unranked | 0 ~ 99 |
| Bronze | 100 ~ 499 |
| Silver | 500 ~ 1,499 |
| Gold | 1,500 ~ 3,999 |
| Platinum | 4,000 ~ 9,999 |
| Diamond | 10,000 ~ 24,999 |
| Grandmaster | 25,000+ (상위 1%) |

---

## 🚧 MVP 제외 기능

아래는 v2 예정. 설계 논의 시 MVP 범위와 명확히 구분할 것.

- 소셜 카피 트레이딩
- 그랜드마스터 평의회 투표 UI
- AI 자동 정산 / AI 이슈 자동 제안
- 다지선다형 이슈 (a/b/c/d)
- React Native 앱 버전
- 카카오 로그인

---

## 🛠️ 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 스타일링 | Tailwind v4 + shadcn/ui + 인라인 스타일 혼용 |
| DB | Supabase (PostgreSQL + Realtime + RPC) |
| 인증 | Supabase Auth (Google OAuth, PKCE Flow) |
| 도메인 | pickter.co.kr |
| 프로젝트 경로 | D:\Works\Project\pickter-web |

---

## 📐 레이아웃 기준

- GNB 최대 너비: `maxWidth 1280px`
- 이슈 상세 페이지: `maxWidth 680px`
- GNB 높이: `72px` / 카테고리 바: `top: 72px` 고정

---

## 🔢 LMSR 가격 공식

```
Price = exp(q_pick / b) / (exp(q_pick / b) + exp(q_flop / b))
```

- `b` (lmsr_b): 소형 50 / 중형 100 / 대형 200

---

## 📋 현재 개발 상태 (2026-05-13 기준)

### 완료
- 구글·카카오 OAuth 로그인, GNB, 카테고리 바
- 홈 화면 (피처드 캐러셀, 이슈 그리드, 급상승 사이드바, TOP3 랭킹)
- 이슈 상세 + TradePanel (binary/multi 통합)
- N선택 이슈 (multi) 지원 — option_type TEXT 변환, order_index 추가
- 정산 시스템 + RP·티어 갱신
- 마이페이지 + 픽터 리포트
- 랭킹, 출석체크, 알림, 유저 이슈 제안
- AI vs 인간 챌린지, 언더독 배지
- 검색 페이지 (/search?q=)
- AuthModal (팝업 로그인)
- 공유 카드 3종 (@vercel/og)
- 카카오톡 공유
- Vercel 배포 + pickter.co.kr 도메인 연결
- 이슈 정산 규칙 (resolution_rules) — DB 컬럼 + 관리자 입력 + 상세 페이지 토글 섹션

### 단기 남은 작업 (v1.2)
- 슬리피지 정확한 계산 (LMSR 공식 프론트 구현)
- 계급 배지 SVG 디자인 적용
- 언더독 적중 시 공유 카드 자동 발송 연결
- 전체 QA
