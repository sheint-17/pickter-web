'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

function makeClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )
}

export type SubmitJournalState = { success: boolean; error?: string } | null

export async function submitJournal(
  _prev: SubmitJournalState,
  formData: FormData
): Promise<SubmitJournalState> {
  const cookieStore = await cookies()
  const supabase = makeClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요해요' }

  const issueId  = formData.get('issue_id') as string
  const optionId = formData.get('option_id') as string
  const content  = (formData.get('content') as string)?.trim()

  if (!content)          return { success: false, error: '내용을 입력해주세요' }
  if (content.length < 10)  return { success: false, error: '10자 이상 입력해주세요' }
  if (content.length > 500) return { success: false, error: '500자 이내로 입력해주세요' }
  if (!optionId)         return { success: false, error: '예측 방향을 선택해주세요' }

  // 이미 작성했으면 중복 방지
  const { data: existing } = await supabase
    .from('prediction_journals')
    .select('id')
    .eq('issue_id', issueId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return { success: false, error: '이미 이 이슈에 분석글을 작성했어요' }

  const { error } = await supabase
    .from('prediction_journals')
    .insert({ user_id: user.id, issue_id: issueId, option_id: optionId, content })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/issue/${issueId}`)
  return { success: true }
}

export async function toggleLike(
  journalId: string,
  issueId: string
): Promise<{ liked: boolean }> {
  const cookieStore = await cookies()
  const supabase = makeClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { liked: false }

  const { data: existing } = await supabase
    .from('journal_likes')
    .select('id')
    .eq('journal_id', journalId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await supabase.from('journal_likes').delete().eq('id', existing.id)
    revalidatePath(`/issue/${issueId}`)
    return { liked: false }
  } else {
    await supabase.from('journal_likes').insert({ journal_id: journalId, user_id: user.id })
    revalidatePath(`/issue/${issueId}`)
    return { liked: true }
  }
}
