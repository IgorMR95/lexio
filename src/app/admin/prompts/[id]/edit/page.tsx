import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EditPromptForm } from './EditPromptForm'

export const dynamic = 'force-dynamic'

export default async function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [
    { data: prompt },
    { data: categorias },
    { data: subcategorias },
    { data: subniveis },
    { data: areas },
  ] = await Promise.all([
    supabase.from('prompts').select('*').eq('id', id).single(),
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
  ])

  if (!prompt) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs border border-amber-500/20">Admin</span>
        <h1 className="text-2xl font-bold text-white">Editar Prompt</h1>
      </div>
      <EditPromptForm
        prompt={prompt}
        categorias={categorias ?? []}
        subcategorias={subcategorias ?? []}
        subniveis={subniveis ?? []}
        areas={areas ?? []}
      />
    </div>
  )
}
