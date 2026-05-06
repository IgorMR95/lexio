import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NovoPromptForm } from './NovoPromptForm'

export const dynamic = 'force-dynamic'

export default async function NovoPromptPage() {
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Novo Prompt</h1>
        <p className="text-zinc-500 text-sm mt-1">Compartilhe um prompt jurídico com a comunidade</p>
      </div>
      <NovoPromptForm
        categorias={categorias ?? []}
        subcategorias={subcategorias ?? []}
        subniveis={subniveis ?? []}
        areas={areas ?? []}
        userId={user.id}
      />
    </div>
  )
}
