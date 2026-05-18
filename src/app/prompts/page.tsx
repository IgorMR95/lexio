import { createClient } from '@/lib/supabase/server'
import { PromptsClient } from './PromptsClient'

export const revalidate = 60

export default async function PromptsPage() {
  const supabase = createClient()

  // Batch 1 — metadados de filtros + rankings (sem buscar os prompts em si)
  const [
    { data: categorias },
    { data: subcategorias },
    { data: subniveis },
    { data: areas },
    { data: topSemana },
    { data: topAllTimeRaw },
    { data: destaques },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from('categorias_principais').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subcategorias').select('*').eq('ativo', true).order('ordem'),
    supabase.from('subniveis').select('*').eq('ativo', true).order('ordem'),
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
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
    supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ativo', 'aprovado']),
  ])

  // Batch 2 — rankings via views SQL
  const [
    { data: rankingAprovados },
    { data: rankingDestaques },
    { data: rankingVotos },
    { data: rankingSemana },
    { data: topAllTimeData },
  ] = await Promise.all([
    (supabase as any)
      .from('v_ranking_prompt_autores')
      .select('autor_id, total_prompts')
      .order('total_prompts', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_prompt_autores')
      .select('autor_id, total_destaques')
      .order('total_destaques', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_prompt_votos')
      .select('autor_id, total_votos')
      .order('total_votos', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_prompt_autores')
      .select('autor_id, prompts_semana')
      .order('prompts_semana', { ascending: false })
      .limit(5),
    topAllTimeRaw && topAllTimeRaw.length > 0
      ? (supabase as any)
          .from('prompts')
          .select('id, titulo, descricao_curta, areas_direito(nome)')
          .in('id', topAllTimeRaw.map((v: any) => v.prompt_id))
          .in('status', ['ativo', 'aprovado'])
      : Promise.resolve({ data: [] }),
  ])

  // Montar top all-time
  let topAllTime: any[] = []
  if (topAllTimeRaw && topAllTimeRaw.length > 0 && topAllTimeData) {
    const votoMap = Object.fromEntries(topAllTimeRaw.map((v: any) => [v.prompt_id, v.total_votos]))
    topAllTime = topAllTimeData
      .map((p: any) => ({ ...p, total_votos: votoMap[p.id] ?? 0 }))
      .sort((a: any, b: any) => b.total_votos - a.total_votos)
  }

  // Perfis dos autores dos rankings (sem os prompts da listagem)
  const rankingAutorIds = Array.from(new Set([
    ...(rankingAprovados ?? []).map((r: any) => r.autor_id),
    ...(rankingDestaques ?? []).map((r: any) => r.autor_id),
    ...(rankingVotos ?? []).map((r: any) => r.autor_id),
    ...(rankingSemana ?? []).map((r: any) => r.autor_id),
  ]))

  const profileMap: Record<string, any> = {}
  if (rankingAutorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, instituicao')
      .in('id', rankingAutorIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
  }

  const buildRanking = (rows: any[], countField: string) =>
    (rows ?? []).map((r: any) => ({
      id: r.autor_id,
      full_name: profileMap[r.autor_id]?.full_name ?? null,
      email: profileMap[r.autor_id]?.email ?? null,
      avatar_url: profileMap[r.autor_id]?.avatar_url ?? null,
      instituicao: profileMap[r.autor_id]?.instituicao ?? null,
      total: Number(r[countField] ?? 0),
    }))

  const usuariosDestaque = {
    topAprovados: buildRanking(rankingAprovados ?? [], 'total_prompts'),
    topDestaques: buildRanking(rankingDestaques ?? [], 'total_destaques'),
    topVotados: buildRanking(rankingVotos ?? [], 'total_votos'),
    topPublicadores: buildRanking(rankingSemana ?? [], 'prompts_semana'),
  }

  return (
    <PromptsClient
      totalCount={totalCount ?? 0}
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
