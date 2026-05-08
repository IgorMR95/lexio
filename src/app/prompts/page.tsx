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
    { data: topSemana },
    { data: topAllTimeRaw },
    { data: destaques },
  ] = await Promise.all([
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
    supabase
      .from('prompts')
      .select(`*, categorias_principais(id, nome, slug), subcategorias(id, nome, slug), subniveis(id, nome, slug), areas_direito(id, nome, slug), profiles(full_name, email)`)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('destaques_semana')
      .select('*, areas_direito(nome)')
      .limit(10),
    (supabase as any)
      .from('prompt_votos_contagem')
      .select('prompt_id, total_votos')
      .order('total_votos', { ascending: false })
      .limit(20),
    (supabase as any)
      .from('prompts')
      .select('id, titulo, descricao_curta, areas_direito(nome)')
      .eq('destaque', true)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Montar top all-time com dados completos dos prompts
  let topAllTime: any[] = []
  if (topAllTimeRaw && topAllTimeRaw.length > 0) {
    const ids = topAllTimeRaw.map((v: any) => v.prompt_id)
    const { data: promptsData } = await (supabase as any)
      .from('prompts')
      .select('id, titulo, descricao_curta, areas_direito(nome)')
      .in('id', ids)
      .in('status', ['ativo', 'aprovado'])
    if (promptsData) {
      const votoMap = Object.fromEntries(topAllTimeRaw.map((v: any) => [v.prompt_id, v.total_votos]))
      topAllTime = promptsData
        .map((p: any) => ({ ...p, total_votos: votoMap[p.id] ?? 0 }))
        .sort((a: any, b: any) => b.total_votos - a.total_votos)
    }
  }

  return (
    <PromptsClient
      initialPrompts={prompts ?? []}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
      melhores={{
        topSemana: topSemana ?? [],
        topAllTime,
        destaques: destaques ?? [],
      }}
    />
  )
}
