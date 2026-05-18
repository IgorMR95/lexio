import { createClient } from '@/lib/supabase/server'
import { SkillsClient } from './SkillsClient'

export const dynamic = 'force-dynamic'

export default async function SkillsPage() {
  const supabase = createClient()

  const [
    { data: skills },
    { data: areas },
    { data: topSemana },
    { data: topAllTimeRaw },
    { data: destaques },
  ] = await Promise.all([
    (supabase as any)
      .from('skills')
      .select('*, areas_direito(id, nome, slug)')
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false }),
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
  ])

  // ── Rankings de usuários (4 subcategorias) ──

  // Top 5: mais skills aprovadas (all-time)
  const topAprovadosMap: Record<string, number> = {}
  ;(skills ?? []).forEach((s: any) => {
    if (s.autor_id) topAprovadosMap[s.autor_id] = (topAprovadosMap[s.autor_id] ?? 0) + 1
  })
  const topAprovadosIds = Object.entries(topAprovadosMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

  // Top 5: mais skills com destaque
  const { data: skillsDestaquesRaw } = await (supabase as any)
    .from('skills')
    .select('autor_id')
    .eq('destaque', true)
    .in('status', ['ativo', 'aprovado'])
  const topDestaquesSkillMap: Record<string, number> = {}
  ;(skillsDestaquesRaw ?? []).forEach((s: any) => {
    if (s.autor_id) topDestaquesSkillMap[s.autor_id] = (topDestaquesSkillMap[s.autor_id] ?? 0) + 1
  })
  const topDestaquesIds = Object.entries(topDestaquesSkillMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

  // Top 5: mais curtidas recebidas (all-time)
  const { data: skillVotosRaw } = await (supabase as any)
    .from('skill_votos')
    .select('skill_id')
  const votoPorSkill: Record<string, number> = {}
  ;(skillVotosRaw ?? []).forEach((v: any) => {
    votoPorSkill[v.skill_id] = (votoPorSkill[v.skill_id] ?? 0) + 1
  })
  const votosAutorSkill: Record<string, number> = {}
  ;(skills ?? []).forEach((s: any) => {
    if (s.autor_id && votoPorSkill[s.id]) {
      votosAutorSkill[s.autor_id] = (votosAutorSkill[s.autor_id] ?? 0) + votoPorSkill[s.id]
    }
  })
  const topVotadosIds = Object.entries(votosAutorSkill)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

  // Top 5: mais ativos na semana
  const umaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: skillsSemanaRaw } = await (supabase as any)
    .from('skills')
    .select('autor_id')
    .in('status', ['ativo', 'aprovado'])
    .gte('created_at', umaSemanaAtras)
  const semanaSkillMap: Record<string, number> = {}
  ;(skillsSemanaRaw ?? []).forEach((s: any) => {
    if (s.autor_id) semanaSkillMap[s.autor_id] = (semanaSkillMap[s.autor_id] ?? 0) + 1
  })
  const topPublicadoresIds = Object.entries(semanaSkillMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id)

  // Buscar perfis de todos os IDs únicos
  const allUserIds = Array.from(new Set([
    ...topAprovadosIds, ...topDestaquesIds, ...topVotadosIds, ...topPublicadoresIds,
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
    topDestaques: buildRanking(topDestaquesIds, topDestaquesSkillMap),
    topVotados: buildRanking(topVotadosIds, votosAutorSkill),
    topPublicadores: buildRanking(topPublicadoresIds, semanaSkillMap),
  }

  // Autores
  const autorIds = Array.from(new Set((skills ?? []).map((s: any) => s.autor_id).filter(Boolean)))
  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {}
  if (autorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email')
      .in('id', autorIds)
    profiles?.forEach((p: any) => { profileMap[p.id] = p })
  }

  const skillsWithAuthor = (skills ?? []).map((s: any) => ({
    ...s,
    profiles: profileMap[s.autor_id] ?? null,
  }))

  // Top all-time
  let topAllTime: any[] = []
  if (topAllTimeRaw && topAllTimeRaw.length > 0) {
    const ids = topAllTimeRaw.map((v: any) => v.skill_id)
    const { data: skillsData } = await (supabase as any)
      .from('skills')
      .select('id, titulo, descricao, tipo, areas_direito(nome)')
      .in('id', ids)
      .in('status', ['ativo', 'aprovado'])
    if (skillsData) {
      const votoMap = Object.fromEntries(topAllTimeRaw.map((v: any) => [v.skill_id, v.total_votos]))
      topAllTime = skillsData
        .map((s: any) => ({ ...s, total_votos: votoMap[s.id] ?? 0 }))
        .sort((a: any, b: any) => b.total_votos - a.total_votos)
    }
  }

  return (
    <SkillsClient
      initialSkills={skillsWithAuthor}
      areas={areas ?? []}
      topSemana={topSemana ?? []}
      topAllTime={topAllTime}
      destaques={destaques ?? []}
      usuariosDestaque={usuariosDestaque}
    />
  )
}
