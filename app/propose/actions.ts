'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { IssueCategory } from '@/types'

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
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
}

export type SubmitProposalState = { success: boolean; error?: string } | null

export async function submitProposal(
  _prev: SubmitProposalState,
  formData: FormData
): Promise<SubmitProposalState> {
  const cookieStore = await cookies()
  const supabase = makeSupabase(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요해요' }

  const title = (formData.get('title') as string)?.trim()
  const category = formData.get('category') as IssueCategory
  const closesAtRaw = formData.get('closes_at') as string
  const lmsrB = parseInt(formData.get('lmsr_b') as string)
  const yesLabel = (formData.get('yes_label') as string)?.trim()
  const noLabel = (formData.get('no_label') as string)?.trim()

  if (!title) return { success: false, error: '제목을 입력해주세요' }
  if (!closesAtRaw) return { success: false, error: '마감일시를 입력해주세요' }
  if (!yesLabel) return { success: false, error: '픽 선택지를 입력해주세요' }
  if (!noLabel) return { success: false, error: '패스 선택지를 입력해주세요' }
  if (![50, 100, 200].includes(lmsrB)) return { success: false, error: 'b값이 올바르지 않아요' }

  const closesAt = new Date(closesAtRaw + ':00+09:00').toISOString()
  const description = JSON.stringify({ closes_at: closesAt, lmsr_b: lmsrB, yes_label: yesLabel, no_label: noLabel })

  // 보증금 차감 + 제안 INSERT 를 1개 트랜잭션으로 통합 (H2)
  //   - Silver 등급 검증
  //   - 50P 차감
  //   - issue_proposals.point_deposited = 50
  //   - ledger 행 + idempotency_key 자동
  const { error } = await supabase.rpc('submit_proposal', {
    p_title: title,
    p_category: category,
    p_description: description,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/propose')
  return { success: true }
}
