import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const maxDuration = 60

// ─── 크롤링 대상 사이트 ───────────────────────────────────
const SOURCES = [
  { id: 'dcinside',   name: '디시인사이드', url: 'https://m.dcinside.com/board/hit',                                      encoding: 'utf-8',  maxItems: 8  },
  { id: 'fmkorea',    name: '에펨코리아',   url: 'https://www.fmkorea.com/best',                                          encoding: 'utf-8',  maxItems: 8  },
  { id: 'ruliweb',    name: '루리웹',       url: 'https://bbs.ruliweb.com/best/humor_only',                               encoding: 'utf-8',  maxItems: 8  },
  { id: 'ppomppu',    name: '뽐뿌',         url: 'https://www.ppomppu.co.kr/hot.php',                                     encoding: 'euc-kr', maxItems: 5  },
  { id: 'clien',      name: '클리앙',       url: 'https://www.clien.net/service/group/board_all?&od=T33&category=0',     encoding: 'utf-8',  maxItems: 5  },
  { id: 'bobaedream', name: '보배드림',     url: 'https://www.bobaedream.co.kr/list?code=best',                           encoding: 'utf-8',  maxItems: 5  },
  { id: 'humoruniv',  name: '웃긴대학',     url: 'https://m.humoruniv.com/board/list.html?table=pds&st=day',              encoding: 'euc-kr', maxItems: 5  },
]

// ─── HTML → 링크+제목 추출 ────────────────────────────────
function extractArticles(html: string, baseUrl: string) {
  const results: { title: string; url: string }[] = []
  const seen = new Set<string>()
  const linkRe = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([^<]{5,150})<\/a>/gi
  const skipRe = /^(더보기|more|로그인|회원가입|home|공지|이전|다음|전체|\d+)$/i

  let m
  while ((m = linkRe.exec(html)) !== null) {
    const rawHref = m[1].trim()
    const title   = m[2].replace(/\s+/g, ' ').trim()

    if (title.length < 8) continue
    if (skipRe.test(title)) continue
    if (/javascript:|mailto:/.test(rawHref)) continue

    let absoluteUrl = rawHref
    if (rawHref.startsWith('//'))       absoluteUrl = 'https:' + rawHref
    else if (rawHref.startsWith('/'))   absoluteUrl = new URL(baseUrl).origin + rawHref
    else if (!rawHref.startsWith('http')) continue

    if (seen.has(absoluteUrl)) continue
    seen.add(absoluteUrl)
    results.push({ title, url: absoluteUrl })
  }

  return results.slice(0, 20)
}

// ─── 단일 사이트 크롤링 ───────────────────────────────────
async function crawlSite(src: typeof SOURCES[0]) {
  try {
    const res = await fetch(src.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []

    const html = src.encoding === 'euc-kr'
      ? new TextDecoder('euc-kr').decode(await res.arrayBuffer())
      : await res.text()

    return extractArticles(html, src.url).slice(0, src.maxItems).map(a => ({
      ...a,
      source: src.id,
      sourceName: src.name,
    }))
  } catch {
    console.warn(`[crawl] ${src.name} 실패, 스킵`)
    return []
  }
}

// ─── 잘린 JSON 복구 ──────────────────────────────────────
// 문자열 내부의 { } 를 무시하고, 실제로 닫힌 마지막 객체 위치를 찾는다.
function findLastCompleteObjectEnd(text: string): number {
  let inString = false
  let escape = false
  let depth = 0
  let lastCompleteEnd = -1

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (escape) { escape = false; continue }
    if (ch === '\\' && inString) { escape = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) lastCompleteEnd = i  // 배열 최상위 객체 하나 완성
    }
  }

  return lastCompleteEnd
}

function recoverPartialJson(raw: string): unknown[] {
  const cleaned = raw.replace(/```json|```/g, '').trim()

  // 1. 정상 파싱 시도
  try {
    return JSON.parse(cleaned)
  } catch { /* 잘린 경우 → 아래에서 복구 */ }

  // 2. 배열 시작 확인
  const arrayStart = cleaned.indexOf('[')
  if (arrayStart === -1) return []
  const content = cleaned.slice(arrayStart)

  // 3. 문자열 내부를 무시하고 마지막으로 완성된 객체 끝 위치 탐색
  const lastEnd = findLastCompleteObjectEnd(content)
  if (lastEnd === -1) return []

  const candidate = content.slice(0, lastEnd + 1) + ']'
  try {
    const recovered = JSON.parse(candidate)
    console.warn(`[crawl-suggest] JSON 잘림 복구: ${recovered.length}개 항목 추출`)
    return recovered
  } catch {
    return []
  }
}

// ─── Gemini API 호출 ──────────────────────────────────────
function buildSystemPrompt(today: string) {
  return `당신은 픽터(Pickter)의 이슈 기획자입니다.
픽터는 한국의 집단지성 예측 플랫폼으로, 유저들이 포인트로 이슈 결과를 예측합니다.
오늘 날짜는 ${today}입니다. 정산 규칙의 날짜는 반드시 오늘 이후로 설정하세요.

[좋은 픽터 이슈 조건]
1. 결과가 Yes/No 또는 여러 선택지 중 하나로 명확히 판정 가능한 것
2. 한국 대중의 관심사 (정치, 연예, 스포츠, 경제, 사회, IT)
3. 결과 확인 시점이 명확한 것 (특정 날짜·이벤트 기준)
4. 유저가 직관·분석으로 예측 가능한 것 (순전한 운 제외)
5. 한국 정서에 맞게 질문을 자연스럽게 변형해도 됨

[제외 조건]
- 사행성·음란·혐오 내용
- 결과 확인이 불가능하거나 너무 모호한 것
- 광고·홍보성 내용
- 단순 유머·짤방 (예측 요소 없음)
- 게임 관련 이슈 (게임 출시, 업데이트, 캐릭터 등 게임 자체에 관한 것 전부 제외)
- 게임 회사의 게임 관련 사업 계획도 제외

[카테고리 균형 — 반드시 준수]
총 30개 이상 제안하되, 아래 카테고리별 목표 수량을 채워주세요.

- 정치(politics): 5~6개
- 경제(economy): 5~6개 (게임 회사 주가·실적은 가능, 게임 자체는 제외)
- 연예·엔터(entertainment): 5~6개
- 스포츠(sports): 5~6개
- 사회(social): 5~6개
- IT·테크(tech): 3~4개 (게임 제외, AI·반도체·앱·서비스·플랫폼만)
- 기타(etc): 1~2개

resolution_rules는 간결하게 2~3문장으로 작성하세요.
반드시 JSON 배열만 출력하고, 다른 텍스트나 마크다운 코드블록은 절대 포함하지 마세요.

[JSON 형식]
[
  {
    "title": "이슈 제목 (예측 질문 형태, 50자 이내)",
    "category": "politics|economy|entertainment|sports|tech|social|etc 중 하나",
    "issue_type": "binary 또는 multi",
    "options": [{"label": "선택지1", "order_index": 0}, {"label": "선택지2", "order_index": 1}],
    "resolution_rules": "정산 기준 (2~3문장, 날짜는 오늘 이후로)",
    "lmsr_b": 100,
    "source_url": "참고한 원문 URL",
    "source_title": "원문 제목",
    "reason": "픽터 이슈로 적합한 이유 한 줄"
  }
]

binary일 때 options: [{"label":"픽","order_index":0},{"label":"패스","order_index":1}]
lmsr_b 기준: 소형(지역·마이너) = 50, 중형(일반) = 100, 대형(전국적 관심) = 200`
}

async function callGemini(articleList: string, today: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemPrompt(today) }] },
      contents: [{
        role: 'user',
        parts: [{ text: `오늘(${today}) 한국 커뮤니티 인기글 목록입니다. 게임 이슈는 제외하고 카테고리 균형을 맞춰 30개 이상 픽터 이슈를 JSON으로만 응답해주세요.\n\n${articleList}` }],
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 32000,
        responseMimeType: 'application/json',
      },
    }),
    signal: AbortSignal.timeout(55000),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText}`)
  }

  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

// ─── POST /api/admin/crawl-suggest ───────────────────────
export async function POST() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  )

  // 로그 저장 헬퍼
  const saveLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    detail?: Record<string, unknown>
  ) => {
    await supabase.from('admin_logs').insert({ level, source: 'crawl-suggest', message, detail: detail ?? null })
  }

  // 관리자 인증
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증 필요' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '권한 없음' }, { status: 403 })

  const today = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric',
  })

  // 7개 사이트 병렬 크롤링
  const crawlResults = await Promise.all(SOURCES.map(crawlSite))
  const allArticles  = crawlResults.flat()

  if (allArticles.length === 0) {
    await saveLog('error', '크롤링 결과 없음 — 모든 사이트 실패')
    return NextResponse.json({ error: '크롤링된 글이 없어요' }, { status: 500 })
  }

  // 기존 URL 필터
  const allUrls = allArticles.map(a => a.url)
  const { data: existingRows } = await supabase.from('crawled_articles').select('url').in('url', allUrls)
  const existingUrls = new Set((existingRows ?? []).map((r: { url: string }) => r.url))
  const newArticles  = allArticles.filter(a => !existingUrls.has(a.url))

  if (newArticles.length === 0) {
    await saveLog('info', '새로운 글 없음 — 중복 스킵', { total: allArticles.length })
    return NextResponse.json({ suggestions: [], message: '새로운 글이 없어요. 잠시 후 다시 시도해 주세요.' })
  }

  // Gemini 호출 — 입력 글 최대 35개로 제한 (처리 시간 단축)
  const articleList = newArticles
    .slice(0, 35)
    .map((a, i) => `${i + 1}. [${a.sourceName}] ${a.title}\nURL: ${a.url}`)
    .join('\n\n')

  let rawText = ''
  try {
    rawText = await callGemini(articleList, today)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await saveLog('error', 'Gemini API 호출 실패', { error: msg })
    return NextResponse.json({ error: 'Gemini API 오류' }, { status: 500 })
  }

  // JSON 파싱 (잘려도 복구)
  const suggestions = recoverPartialJson(rawText)

  if (suggestions.length === 0) {
    await saveLog('error', 'Gemini 응답 파싱 완전 실패', { raw: rawText.slice(0, 500) })
    return NextResponse.json({ error: 'Gemini 응답 파싱 실패' }, { status: 500 })
  }

  // 잘림 감지
  const wasTruncated = (() => {
    try { JSON.parse(rawText.replace(/```json|```/g, '').trim()); return false } catch { return true }
  })()

  // 크롤링 URL 이력 저장
  await supabase.from('crawled_articles').upsert(
    newArticles.map(a => ({ url: a.url, source: a.source, title: a.title })),
    { onConflict: 'url', ignoreDuplicates: true }
  )

  // 7일 지난 로그 자동 삭제
  await supabase.from('admin_logs').delete()
    .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // 30일 지난 크롤링 이력 삭제
  await supabase.from('crawled_articles').delete()
    .lt('crawled_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // 성공 로그 저장
  await saveLog(
    wasTruncated ? 'warn' : 'info',
    wasTruncated
      ? `Gemini 응답 잘림 — ${suggestions.length}개 복구됨`
      : `AI 이슈 제안 완료 — ${suggestions.length}개`,
    {
      total_crawled: allArticles.length,
      new_articles: newArticles.length,
      skipped: existingUrls.size,
      suggested: suggestions.length,
      truncated: wasTruncated,
    }
  )

  return NextResponse.json({
    suggestions,
    meta: {
      total_crawled: allArticles.length,
      new_articles:  newArticles.length,
      skipped:       existingUrls.size,
      suggested:     suggestions.length,
    },
  })
}
