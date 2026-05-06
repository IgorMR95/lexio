import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DadosClient } from './DadosClient'

export const dynamic = 'force-dynamic'

export default async function AdminDadosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ data: areas }, { data: categorias }, { data: subcategorias }] = await Promise.all([
    supabase.from('areas_direito').select('*').order('ordem'),
    supabase.from('categorias_principais').select('*').order('ordem'),
    supabase.from('subcategorias').select('*').order('ordem'),
  ])

  return (
    <DadosClient
      areas={areas ?? []}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
    />
  )
}
