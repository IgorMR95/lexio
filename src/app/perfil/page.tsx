import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PerfilClient } from './PerfilClient'

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: meusPrompts },
    { data: meusGrupos },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('prompts')
      .select('id, titulo, status, created_at, internacional, idioma, areas_direito(nome)')
      .eq('autor_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any).from('grupo_membros')
      .select('papel, joined_at, grupos(id, nome, descricao, tipo, criado_por)')
      .eq('user_id', user.id),
  ])

  return (
    <PerfilClient
      user={{ id: user.id, email: user.email ?? '' }}
      profile={profile}
      meusPrompts={meusPrompts ?? []}
      meusGrupos={meusGrupos ?? []}
    />
  )
}
