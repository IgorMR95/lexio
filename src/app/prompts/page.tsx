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
      .select(`*, categorias_principais(id, nome, slug), subcategorias(id, nome, slug), subniveis(id, nome, slug), areas_direito(id, nome, slug)`)
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

  // Buscar nomes dos autores separadamente
  const autorIds = Array.from(new Set((prompts ?? []).map((p: any) => p.autor_id).filter(Boolean)))
  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
  if (autorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', autorIds)
    profiles?.forEach((p: any) => { profileMap[p.id] = p })
  }

  const promptsWithAuthor = (prompts ?? []).map((p: any) => ({
    ...p,
    profiles: profileMap[p.autor_id] ?? null,
  }))

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

  // ── Rankings de usuários ──

  // Top 5: mais prompts aprovados (all-time)
  const { data: topAprovadosRaw } = await (supabase as any)
    .from('prompts')
    .select('autor_id')
    .in('status', ['ativo', 'aprovado'])

  const topAprovadosMap: Record<string, number> = {}
  ;(topAprovadosRaw ?? []).forEach((p: any) => {
    if (p.autor_id) topAprovadosMap[p.autor_id] = (topAprovadosMap[p.autor_id] ?? 0) + 1
  })
  const topAprovadosIds = Object.entries(topAprovadosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Top 5: mais prompts destaque
  const { data: topDestaquesRaw } = await (supabase as any)
    .from('prompts')
    .select('autor_id')
    .eq('destaque', true)
    .in('status', ['ativo', 'aprovado'])

  const topDestaquesMap: Record<string, number> = {}
  ;(topDestaquesRaw ?? []).forEach((p: any) => {
    if (p.autor_id) topDestaquesMap[p.autor_id] = (topDestaquesMap[p.autor_id] ?? 0) + 1
  })
  const topDestaquesIds = Object.entries(topDestaquesMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Top 5: mais curtidas recebidas (all-time)
  const { data: votosRaw } = await (supabase as any)
    .from('prompt_votos')
    .select('prompt_id')

  // Para curtidas precisamos cruzar votos → prompts → autor
  const votoPorPrompt: Record<string, number> = {}
  ;(votosRaw ?? []).forEach((v: any) => {
    votoPorPrompt[v.prompt_id] = (votoPorPrompt[v.prompt_id] ?? 0) + 1
  })

  const votosAutorMap: Record<string, number> = {}
  ;(topAprovadosRaw ?? []).forEach((p: any) => {
    // topAprovadosRaw has autor_id + we need prompt id — fetch separately
  })

  // Busca prompts com autor_id e seus totais de votos
  const { data: promptsVotosRaw } = await (supabase as any)
    .from('prompts')
    .select('id, autor_id')
    .in('status', ['ativo', 'aprovado'])

  const votosAutor: Record<string, number> = {}
  ;(promptsVotosRaw ?? []).forEach((p: any) => {
    if (p.autor_id && votoPorPrompt[p.id]) {
      votosAutor[p.autor_id] = (votosAutor[p.autor_id] ?? 0) + votoPorPrompt[p.id]
    }
  })
  const topVotadosIds = Object.entries(votosAutor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Top 5: mais ativos na semana (publicações nos últimos 7 dias)
  const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: semanaRaw } = await (supabase as any)
    .from('prompts')
    .select('autor_id')
    .in('status', ['ativo', 'aprovado'])
    .gte('created_at', umaSemanaAtras)

  const semanaMap: Record<string, number> = {}
  ;(semanaRaw ?? []).forEach((p: any) => {
    if (p.autor_id) semanaMap[p.autor_id] = (semanaMap[p.autor_id] ?? 0) + 1
  })
  const topPublicadoresIds = Object.entries(semanaMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  // Buscar perfis de todos os IDs únicos necessários
  const allUserIds = Array.from(new Set([
    ...topAprovadosIds,
    ...topDestaquesIds,
    ...topVotadosIds,
    ...topPublicadoresIds,
  ]))

  const userProfileMap: Record<string, any> = {}
  if (allUserIds.length > 0) {
    const { data: userProfiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, instituicao')
      .in('id', allUserIds)
    ;(userProfiles ?? []).forEach((p: any) => { userProfileMap[p.id] = p })
  }

  const buildRanking = (ids: string[], countMap: Record<string, number>) =>
    ids.map(id => ({
      id,
      full_name: userProfileMap[id]?.full_name ?? null,
      email: userProfileMap[id]?.email ?? null,
      avatar_url: userProfileMap[id]?.avatar_url ?? null,
      instituicao: userProfileMap[id]?.instituicao ?? null,
      total: countMap[id] ?? 0,
    }))

  const usuariosDestaque = {
    topAprovados: buildRanking(topAprovadosIds, topAprovadosMap),
    topDestaques: buildRanking(topDestaquesIds, topDestaquesMap),
    topVotados: buildRanking(topVotadosIds, votosAutor),
    topPublicadores: buildRanking(topPublicadoresIds, semanaMap),
  }

  return (
    <PromptsClient
      initialPrompts={promptsWithAuthor}
      categorias={categorias ?? []}
      subcategorias={subcategorias ?? []}
      subniveis={subniveis ?? []}
      areas={areas ?? []}
      melhores={{
        topSemana: topSemana ?? [],
        topAllTime,
        destaques: destaques ?? [],
      }}
      usuariosDestaque={usuariosDestaque}
    />
  )
}
