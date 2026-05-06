import { createClient } from '@/lib/supabase/server'
import { ConsultaClient } from './ConsultaClient'

export const dynamic = 'force-dynamic'

export default async function ConsultaPage() {
  const supabase = createClient()

  const [{ data: categorias }, { data: subcategorias }, { data: subniveis }, { data: areas }] = await Promise.all([
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = user
    ? (await supabase.from('profiles').select('role').eq('id', user.id).single()).data?.role === 'admin'
    : false

  return (
    <ConsultaClient
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
      isAdmin={isAdmin}
      isLoggedIn={!!user}
    />
  )
}
