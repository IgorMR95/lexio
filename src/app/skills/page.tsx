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

  // Usuários destaque: top autores por número de skills publicadas
  const autorSkillCount: Record<string, number> = {}
  ;(skills ?? []).forEach((s: any) => {
    if (s.autor_id) autorSkillCount[s.autor_id] = (autorSkillCount[s.autor_id] ?? 0) + 1
  })
  const topAutorIds = Object.entries(autorSkillCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 12)
    .map(([id]) => id)

  let usuariosDestaque: any[] = []
  if (topAutorIds.length > 0) {
    const { data: topProfiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, bio, avatar_url')
      .in('id', topAutorIds)
    usuariosDestaque = (topProfiles ?? []).map((p: any) => ({
      ...p,
      total_skills: autorSkillCount[p.id] ?? 0,
    })).sort((a: any, b: any) => b.total_skills - a.total_skills)
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
