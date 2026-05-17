@AGENTS.md

# PICKTER — CLAUDE.md

> Claude 채팅(설계·기획 세션)에서 참조하는 규칙 파일.
> 코딩 작업 규칙은 AGENTS.md를 참조할 것.

---

## 🔌 연결된 MCP 도구 (매 세션 자동 사용 가능)

| 도구 | 용도 |
|------|------|
| **파일시스템 MCP** | 프로젝트 파일 직접 읽기·쓰기. 경로: `D:\Works\Project\pickter-web` |
| **Supabase MCP** | DB 스키마 조회, SQL 실행, 테이블 데이터 확인. project_id: `lychveomvaodtjadqsxj` |

- 파일 수정 요청 시 Claude Code 프롬프트를 전달하는 대신 **파일시스템 MCP로 직접 수정**한다.
- DB 마이그레이션(컬럼 추가 등) SQL은 **Supabase MCP로 직접 실행**한다.
- 단, No-Touch Zone(RPC 함수, 트리거, RLS)은 MCP로도 절대 건드리지 않는다.

## 🔑 외부 API 키

| 서비스 | 키 위치 | 용도 |
|--------|---------|------|
| **Unsplash** | `.env.local` → `UNSPLASH_ACCESS_KEY` | 이슈 썸네일 자동 검색. API Route: `/api/admin/unsplash-thumbnail?keyword=검색어` |
| **Gemini** | `.env.local` → `GEMINI_API_KEY` | AI 이슈 제안 (크롤링 분석). 모델: Gemini 2.5 Flash Lite |
| **Kakao** | `.env.local` → `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 로그인 + 카카오톡 공유 |

- Unsplash 썸네일은 `/api/admin/unsplash-thumbnail` Route를 통해서만 호출한다 (키 노출 방지).
- bash 환경(MCP)에서 Unsplash API 직접 호출은 네트워크 제한으로 불가. SQL로 직접 URL 삽입할 것.

---

## 🚫 절대 건드리지 말 것 (No-Touch Zone)

설계 논의 중에도 아래 항목은 변경을 제안하지 않는다.
단, 2026-05-16 보안 패치로 아래 항목 전부 검토·수정 완료.
**이후에도 함부로 건드리지 않는다.**

- `execute_trade` / `settle_issue` RPC 함수 로직
- DB 트리거 전체 (trg_protect_user_sensitive_cols, trg_update_rp_total 등)
- RLS 정책 전체
- Supabase Auth PKCE Flow 설정
- `proxy.ts` 미들웨어
- `pickter.trusted_rpc` 세션 변수 패턴 (신뢰된 RPC 마커)
- idempotency_key UNIQUE 제약

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
| Bronze | 100 ~ 299 |
| Silver | 300 ~ 1,499 |
| Gold | 1,500 ~ 3,999 |
| Platinum | 4,000 ~ 9,999 |
| Diamond | 10,000 ~ 24,999 |
| Grandmaster | 25,000+ (상위 1%) |

---

## 🚧 MVP 제외 기능

아래는 v2 예정. 설계 논의 시 MVP 범위와 명확히 구분할 것.

- 소셜 카피 트레이딩
- 그랜드마스터 평의회 투표 UI
- AI 자동 정산
- React Native 앱 버전

---

## UI 아이콘 규칙

- 이모지(emoji) 사용 금지. 단, 기존에 이미 사용 중인 곳은 유지.
- 아이콘이 필요한 경우 **lucide-react** 아이콘 컴포넌트를 사용한다.
- 예외: 랭킹 메달(1~3위), 출석 버튼처럼 이미 lucide-react로 구현된 패턴을 따른다.

---

## 기술 스택

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

## 📋 현재 개발 상태 (2026-05-16 기준)

### 완료
- 구글·카카오 OAuth 로그인, GNB, 카테고리 바
- 홈 화면 (피처드 캐러셀, 이슈 그리드, 급상승 사이드바, TOP3 랭킹)
- 이슈 상세 + TradePanel (binary/multi 통합)
- N선택 이슈 (multi) 지원
- 정산 시스템 + RP·티어 갱신
- 마이페이지 + 픽터 리포트
- 랭킹, 출석체크, 알림, 유저 이슈 제안
- AI vs 인간 챌린지, 언더독 배지
- 검색 페이지 (/search?q=)
- AuthModal (팝업 로그인)
- 공유 카드 3종 (@vercel/og) + 카카오톡 공유
- Vercel 배포 + pickter.co.kr 도메인 연결
- LMSR 슬리피지 정확한 계산 + 픽켓 시스템
- AI 이슈 제안 (크롤링 + Gemini) — 비활성화 중
- **[2026-05-16] 보안 전면 패치 (C1-C6·H1-H4·M1-M3)**
  - RLS 전면 재설계, users 민감 컬럼 보호 트리거
  - settle_issue 6단 가드, TradePanel 중복 클릭 방지
  - idempotency_key 원장 시스템, ledger 정합성 구조
  - 출석 RPC화 (check_in_today), 제안 보증금 escrow
  - admin_logs 통일, price_history 중복 제거
  - 오픈 전 테스트 데이터 전수 초기화

### 오픈 직전 남은 작업
- [ ] 새 계정 로그인 후 admin_promote_user() 호출
- [ ] 오픈 이슈 15개 등록 (lmsr_b=50)
- [ ] 전체 QA (매수→매도→정산)
- [ ] 계급 배지 SVG 디자인 적용
- [ ] 언더독 공유 카드 자동 발송 연결

### v2 (다음 스프린트)
- signup_bonus 백필, multi LMSR 정공법
- AI 이슈 제안 탭 재활성화
- React Native 앱 버전
