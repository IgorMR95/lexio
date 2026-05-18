import { createClient } from '@/lib/supabase/server'
import { SkillsClient } from './SkillsClient'

export const revalidate = 60

export default async function SkillsPage() {
  const supabase = createClient()

  // Batch 1 — metadados + rankings (sem buscar as skills em si)
  const [
    { data: areas },
    { data: topSemana },
    { data: topAllTimeRaw },
    { data: destaques },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from('areas_direito').select('*').eq('ativo', true).order('ordem'),
    (supabase as any)
      .from('skills_destaques_semana')
      .select('*, areas_direito(nome)')
      .limit(10),
    (supabase as any)
      .from('skill_votos_contagem')
      .select('skill_id, total_votos')
      .order('total_votos', { ascending: false })
      .limit(20),
    (supabase as any)
      .from('skills')
      .select('id, titulo, descricao, tipo, areas_direito(nome)')
      .eq('destaque', true)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(20),
    (supabase as any)
      .from('skills')
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
      .from('v_ranking_skill_autores')
      .select('autor_id, total_skills')
      .order('total_skills', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_skill_autores')
      .select('autor_id, total_destaques')
      .order('total_destaques', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_skill_votos')
      .select('autor_id, total_votos')
      .order('total_votos', { ascending: false })
      .limit(5),
    (supabase as any)
      .from('v_ranking_skill_autores')
      .select('autor_id, skills_semana')
      .order('skills_semana', { ascending: false })
      .limit(5),
    topAllTimeRaw && topAllTimeRaw.length > 0
      ? (supabase as any)
          .from('skills')
          .select('id, titulo, descricao, tipo, areas_direito(nome)')
          .in('id', topAllTimeRaw.map((v: any) => v.skill_id))
          .in('status', ['ativo', 'aprovado'])
      : Promise.resolve({ data: [] }),
  ])

  // Montar top all-time
  let topAllTime: any[] = []
  if (topAllTimeRaw && topAllTimeRaw.length > 0 && topAllTimeData) {
    const votoMap = Object.fromEntries(topAllTimeRaw.map((v: any) => [v.skill_id, v.total_votos]))
    topAllTime = topAllTimeData
      .map((s: any) => ({ ...s, total_votos: votoMap[s.id] ?? 0 }))
      .sort((a: any, b: any) => b.total_votos - a.total_votos)
  }

  // Perfis dos autores dos rankings
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
    topAprovados: buildRanking(rankingAprovados ?? [], 'total_skills'),
    topDestaques: buildRanking(rankingDestaques ?? [], 'total_destaques'),
    topVotados: buildRanking(rankingVotos ?? [], 'total_votos'),
    topPublicadores: buildRanking(rankingSemana ?? [], 'skills_semana'),
  }

  return (
    <SkillsClient
      totalCount={totalCount ?? 0}
      areas={areas ?? []}
      topSemana={topSemana ?? []}
      topAllTime={topAllTime}
      destaques={destaques ?? []}
      usuariosDestaque={usuariosDestaque}
    />
  )
}
