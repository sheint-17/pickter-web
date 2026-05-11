import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Colors } from '@/constants/colors'
import { Issue } from '@/types'
import AdminTabs from './AdminTabs'

export default async function AdminPage() {
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
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [{ data: issues }, { data: proposals }] = await Promise.all([
    supabase
      .from('issues')
      .select('*, issue_options!issue_options_issue_id_fkey(*)')
      .in('status', ['active', 'closed'])
      .order('created_at', { ascending: false }),
    supabase
      .from('issue_proposals')
      .select('id, title, category, description, created_at, users!issue_proposals_user_id_fkey(nickname, tier)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  return (
    <main style={{ padding: '16px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: Colors.textPrimary, marginBottom: '20px' }}>
        🛠️ 관리자
      </h1>
      <AdminTabs issues={issues as Issue[] ?? []} proposals={(proposals as any) ?? []} />
    </main>
  )
}