import { createClient } from '@/lib/supabase/server'
import { PromptsClient } from './PromptsClient'

export const dynamic = 'force-dynamic'

export default async function PromptsPage() {
  const supabase = createClient()

  const [
    { data: categorias },
    { data: subcategorias },
    { data: subniveis },
    { data: areas },
    { data: prompts },
  ] = await Promise.all([
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
    supabase
      .from('prompts')
      .select(`
        *,
        categorias_principais(id, nome, slug),
        subcategorias(id, nome, slug),
        subniveis(id, nome, slug),
        areas_direito(id, nome, slug)
      `)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false }),
  ])

  return (
    <PromptsClient
      initialPrompts={prompts ?? []}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
    />
  )
}
