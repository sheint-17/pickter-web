'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { IssueCategory } from '@/types'

async function makeAdminClient() {
  const cookieStore = await cookies()
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

async function assertAdmin(supabase: Awaited<ReturnType<typeof makeAdminClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export type CreateIssueState = { success: boolean; error?: string } | null

export async function createIssue(
  _prev: CreateIssueState,
  formData: FormData
): Promise<CreateIssueState> {
  const supabase = await makeAdminClient()
  const adminUser = await assertAdmin(supabase)
  if (!adminUser) return { success: false, error: '관리자 권한이 필요해요' }

  const title = (formData.get('title') as string)?.trim()
  const category = formData.get('category') as IssueCategory
  const closesAtRaw = formData.get('closes_at') as string
  const lmsrB = parseInt(formData.get('lmsr_b') as string)
  const issueType = (formData.get('issue_type') as string) || 'binary'
  const thumbnailUrl = (formData.get('thumbnail_url') as string)?.trim() || null
  const resolutionRules = (formData.get('resolution_rules') as string)?.trim() || null

  if (!title) return { success: false, error: '제목을 입력해주세요' }
  if (!closesAtRaw) return { success: false, error: '마감일시를 입력해주세요' }
  if (![50, 100, 200].includes(lmsrB)) return { success: false, error: 'b값이 올바르지 않아요' }

  // 선택지 구성
  let optionsToInsert: { option_type: string; label: string; price: number; order_index: number }[] = []

  if (issueType === 'binary') {
    const yesLabel = (formData.get('yes_label') as string)?.trim()
    const noLabel = (formData.get('no_label') as string)?.trim()
    if (!yesLabel) return { success: false, error: '픽 선택지를 입력해주세요' }
    if (!noLabel) return { success: false, error: '패스 선택지를 입력해주세요' }
    optionsToInsert = [
      { option_type: 'yes', label: yesLabel, price: 0.5, order_index: 0 },
      { option_type: 'no',  label: noLabel,  price: 0.5, order_index: 1 },
    ]
  } else {
    // N선택지: 개수 제한 없음. multi_option_0, multi_option_1, ... 순서대로 수집
    const labels: string[] = []
    let idx = 0
    while (true) {
      const val = (formData.get(`multi_option_${idx}`) as string | null)?.trim()
      if (val === null || val === undefined) break  // 해당 인덱스 없으면 종료
      if (val) labels.push(val)
      idx++
    }
    if (labels.length < 2) return { success: false, error: '선택지를 최소 2개 입력해주세요' }

    // 균등 확률 배분 (합이 1이 되도록)
    const equalPrice = parseFloat((1 / labels.length).toFixed(4))
    optionsToInsert = labels.map((label, i) => ({
      option_type: String(i + 1),
      label,
      price: equalPrice,
      order_index: i,
    }))
  }

  const closesAt = new Date(closesAtRaw + ':00+09:00').toISOString()

  // 1) draft INSERT
  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .insert({
      title,
      category,
      lmsr_b: lmsrB,
      closes_at: closesAt,
      status: 'draft',
      issue_type: issueType,
      created_by: adminUser.id,
      thumbnail_url: thumbnailUrl,
      resolution_rules: resolutionRules,
    })
    .select()
    .single()

  if (issueError) return { success: false, error: issueError.message }

  // 2) 선택지 INSERT
  const { error: optionsError } = await supabase
    .from('issue_options')
    .insert(optionsToInsert.map(o => ({ ...o, issue_id: issue.id })))

  if (optionsError) {
    await supabase.from('issues').delete().eq('id', issue.id)
    return { success: false, error: optionsError.message }
  }

  // 3) active 전환 → trg_record_initial_price_history 트리거 작동
  const { error: activateError } = await supabase
    .from('issues')
    .update({ status: 'active' })
    .eq('id', issue.id)

  if (activateError) {
    await supabase.from('issue_options').delete().eq('issue_id', issue.id)
    await supabase.from('issues').delete().eq('id', issue.id)
    return { success: false, error: activateError.message }
  }

  await supabase.rpc('admin_log_action', {
    p_action: 'create_issue',
    p_message: `이슈 생성: ${title}`,
    p_detail: { issue_id: issue.id, category, lmsr_b: lmsrB, issue_type: issueType, option_count: optionsToInsert.length, closes_at: closesAt },
  })

  revalidatePath('/admin')
  revalidatePath('/')
  return { success: true }
}

export type ProposalActionState = { success: boolean; error?: string } | null

export async function approveProposal(proposalId: string): Promise<ProposalActionState> {
  const supabase = await makeAdminClient()
  const adminUser = await assertAdmin(supabase)
  if (!adminUser) return { success: false, error: '관리자 권한이 필요해요' }

  const { error } = await supabase.rpc('approve_proposal', { p_proposal_id: proposalId })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/propose')
  return { success: true }
}

export async function rejectProposal(proposalId: string): Promise<ProposalActionState> {
  const supabase = await makeAdminClient()
  const adminUser = await assertAdmin(supabase)
  if (!adminUser) return { success: false, error: '관리자 권한이 필요해요' }

  const { error } = await supabase.rpc('reject_proposal', { p_proposal_id: proposalId })
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/propose')
  return { success: true }
}
