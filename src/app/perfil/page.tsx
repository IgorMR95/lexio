import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PerfilClient } from './PerfilClient'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const { data: meusPrompts } = await supabase
    .from('prompts')
    .select('id, titulo, status, created_at, internacional, idioma')
    .eq('autor_id', user.id)
    .order('created_at', { ascending: false })

  const { data: meusGrupos } = await (supabase as any)
    .from('grupo_membros')
    .select('papel, joined_at, grupos(id, nome, descricao, tipo, criado_por)')
    .eq('user_id', user.id)

  return (
    <PerfilClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile}
      meusPrompts={meusPrompts ?? []}
      meusGrupos={meusGrupos ?? []}
    />
  )
}
