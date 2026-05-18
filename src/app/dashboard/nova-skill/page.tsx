import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NovaSkillForm } from './NovaSkillForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NovaSkillPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile.data?.role === 'admin'

  const { data: areas } = await supabase
    .from('areas_direito')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/skills" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Skills MD
        </Link>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Compartilhar Skill</h1>
      <p className="text-sm text-zinc-500 mb-8">Compartilhe um arquivo .md de skill para a comunidade jurídica.</p>
      <NovaSkillForm areas={areas ?? []} userId={user.id} isAdmin={isAdmin} />
    </div>
  )
}
