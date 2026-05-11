'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type UpdateNicknameState = {
  success: boolean
  error?: string
  newNickname?: string
} | null

export async function updateNickname(
  _prev: UpdateNicknameState,
  formData: FormData
): Promise<UpdateNicknameState> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요해요' }

  const nickname = (formData.get('nickname') as string)?.trim()

  if (!nickname) return { success: false, error: '닉네임을 입력해주세요' }
  if (nickname.length < 2 || nickname.length > 12) {
    return { success: false, error: '닉네임은 2~12자로 입력해주세요' }
  }
  if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
    return { success: false, error: '한글, 영문, 숫자, 밑줄(_)만 사용 가능해요' }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, nickname_changed_at')
    .eq('id', user.id)
    .single()

  if (profile?.nickname === nickname) {
    return { success: false, error: '현재 닉네임과 동일해요' }
  }

  if (profile?.nickname_changed_at) {
    const daysSince =
      (Date.now() - new Date(profile.nickname_changed_at).getTime()) / (24 * 60 * 60 * 1000)
    if (daysSince < 30) {
      const daysLeft = Math.ceil(30 - daysSince)
      return { success: false, error: `${daysLeft}일 후에 변경 가능해요` }
    }
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('nickname', nickname)
    .maybeSingle()

  if (existing) return { success: false, error: '이미 사용 중인 닉네임이에요' }

  const { error } = await supabase
    .from('users')
    .update({
      nickname,
      nickname_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/mypage')

  return { success: true, newNickname: nickname }
}
