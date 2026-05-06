import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlimentacaoClient } from './AlimentacaoClient'

export const dynamic = 'force-dynamic'

export default async function AlimentacaoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: categorias }, { data: subcategorias }, { data: subniveis }, { data: areas }] = await Promise.all([
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
  ])

  return (
    <AlimentacaoClient
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
      userId={user.id}
    />
  )
}
