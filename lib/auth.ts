import { supabase } from './supabase'

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/callback`,
      skipBrowserRedirect: false,
    },
  })
  if (error) console.error('구글 로그인 오류:', error.message)
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) console.error('로그아웃 오류:', error.message)
}