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

export type CreateIssueState = {
  success: boolean
  error?: string
} | null

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
  const yesLabel = (formData.get('yes_label') as string)?.trim()
  const noLabel = (formData.get('no_label') as string)?.trim()
  const thumbnailUrl = (formData.get('thumbnail_url') as string)?.trim() || null

  if (!title) return { success: false, error: '제목을 입력해주세요' }
  if (!closesAtRaw) return { success: false, error: '마감일시를 입력해주세요' }
  if (!yesLabel) return { success: false, error: '픽 선택지 label을 입력해주세요' }
  if (!noLabel) return { success: false, error: '패스 선택지 label을 입력해주세요' }
  if (![50, 100, 200].includes(lmsrB)) return { success: false, error: 'b값이 올바르지 않아요' }

  const closesAt = new Date(closesAtRaw + ':00+09:00').toISOString()

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .insert({
      title,
      category,
      lmsr_b: lmsrB,
      closes_at: closesAt,
      status: 'active',
      created_by: adminUser.id,
      thumbnail_url: thumbnailUrl,
    })
    .select()
    .single()

  if (issueError) return { success: false, error: issueError.message }

  const { error: optionsError } = await supabase
    .from('issue_options')
    .insert([
      { issue_id: issue.id, option_type: 'yes', label: yesLabel, price: 0.5 },
      { issue_id: issue.id, option_type: 'no', label: noLabel, price: 0.5 },
    ])

  if (optionsError) {
    await supabase.from('issues').delete().eq('id', issue.id)
    return { success: false, error: optionsError.message }
  }

  revalidatePath('/admin')
  revalidatePath('/')

  return { success: true }
}

export type ProposalActionState = { success: boolean; error?: string } | null

export async function approveProposal(proposalId: string): Promise<ProposalActionState> {
  const supabase = await makeAdminClient()
  const adminUser = await assertAdmin(supabase)
  if (!adminUser) return { success: false, error: '관리자 권한이 필요해요' }

  const { data: proposal, error: fetchError } = await supabase
    .from('issue_proposals')
    .select('title, category, description, user_id')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) return { success: false, error: '제안을 찾을 수 없어요' }

  let meta: { closes_at: string; lmsr_b: number; yes_label: string; no_label: string }
  try {
    meta = JSON.parse(proposal.description ?? '{}')
  } catch {
    return { success: false, error: '제안 데이터가 올바르지 않아요' }
  }

  if (!meta.closes_at || !meta.yes_label || !meta.no_label) {
    return { success: false, error: '제안 데이터가 불완전해요' }
  }

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .insert({
      title: proposal.title,
      category: proposal.category as IssueCategory,
      lmsr_b: meta.lmsr_b ?? 100,
      closes_at: meta.closes_at,
      status: 'active',
      created_by: adminUser.id,
    })
    .select()
    .single()

  if (issueError) return { success: false, error: issueError.message }

  const { error: optionsError } = await supabase
    .from('issue_options')
    .insert([
      { issue_id: issue.id, option_type: 'yes', label: meta.yes_label, price: 0.5 },
      { issue_id: issue.id, option_type: 'no', label: meta.no_label, price: 0.5 },
    ])

  if (optionsError) {
    await supabase.from('issues').delete().eq('id', issue.id)
    return { success: false, error: optionsError.message }
  }

  await supabase
    .from('issue_proposals')
    .update({ status: 'approved', issue_id: issue.id, updated_at: new Date().toISOString() })
    .eq('id', proposalId)

  revalidatePath('/admin')
  revalidatePath('/')
  revalidatePath('/propose')

  return { success: true }
}

export async function rejectProposal(proposalId: string): Promise<ProposalActionState> {
  const supabase = await makeAdminClient()
  const adminUser = await assertAdmin(supabase)
  if (!adminUser) return { success: false, error: '관리자 권한이 필요해요' }

  const { error } = await supabase
    .from('issue_proposals')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', proposalId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin')
  revalidatePath('/propose')

  return { success: true }
}
