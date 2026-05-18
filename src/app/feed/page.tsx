import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './FeedClient'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: seguindo } = await (supabase as any)
    .from('seguidores')
    .select('seguido_id')
    .eq('seguidor_id', user.id)

  const seguidoIds: string[] = (seguindo ?? []).map((s: any) => s.seguido_id)

  const { data: areas } = await supabase
    .from('areas_direito')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  if (seguidoIds.length === 0) {
    const usuariosSugeridos = await fetchUsuariosSugeridos(supabase, user.id)
    return (
      <FeedClient
        items={[]}
        seguidoIds={[]}
        usuariosSugeridos={usuariosSugeridos}
        areas={areas ?? []}
      />
    )
  }

  // Busca prompts e skills em paralelo
  const [
    { data: prompts },
    { data: skills },
  ] = await Promise.all([
    (supabase as any)
      .from('prompts')
      .select('id, titulo, descricao_curta, created_at, autor_id, areas_direito(id, nome), destaque')
      .in('autor_id', seguidoIds)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(40),
    (supabase as any)
      .from('skills')
      .select('id, titulo, descricao, created_at, autor_id, areas_direito(id, nome), destaque, tipo')
      .in('autor_id', seguidoIds)
      .in('status', ['ativo', 'aprovado'])
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Perfis dos autores
  const autorIds = Array.from(new Set([
    ...(prompts ?? []).map((p: any) => p.autor_id),
    ...(skills ?? []).map((s: any) => s.autor_id),
  ].filter(Boolean)))

  const { data: profiles } = autorIds.length > 0
    ? await (supabase as any).from('profiles').select('id, full_name, email').in('id', autorIds)
    : { data: [] }

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  // Votos dos prompts
  const promptIds = (prompts ?? []).map((p: any) => p.id)
  const { data: promptVotos } = promptIds.length > 0
    ? await (supabase as any).from('prompt_votos_contagem').select('prompt_id, total_votos').in('prompt_id', promptIds)
    : { data: [] }
  const promptVotosMap: Record<string, number> = {}
  for (const v of promptVotos ?? []) promptVotosMap[v.prompt_id] = v.total_votos

  // Votos das skills
  const skillIds = (skills ?? []).map((s: any) => s.id)
  const { data: skillVotos } = skillIds.length > 0
    ? await (supabase as any).from('skill_votos_contagem').select('skill_id, total_votos').in('skill_id', skillIds)
    : { data: [] }
  const skillVotosMap: Record<string, number> = {}
  for (const v of skillVotos ?? []) skillVotosMap[v.skill_id] = v.total_votos

  // Monta items unificados e ordena por data
  const items = [
    ...(prompts ?? []).map((p: any) => ({
      id: p.id,
      tipo: 'prompt' as const,
      titulo: p.titulo,
      descricao: p.descricao_curta ?? null,
      created_at: p.created_at,
      autor_id: p.autor_id,
      autor_nome: profileMap[p.autor_id]?.full_name ?? profileMap[p.autor_id]?.email ?? 'Usuário',
      area_nome: p.areas_direito?.nome ?? null,
      destaque: p.destaque ?? false,
      total_votos: promptVotosMap[p.id] ?? 0,
    })),
    ...(skills ?? []).map((s: any) => ({
      id: s.id,
      tipo: 'skill' as const,
      titulo: s.titulo,
      descricao: s.descricao ?? null,
      created_at: s.created_at,
      autor_id: s.autor_id,
      autor_nome: profileMap[s.autor_id]?.full_name ?? profileMap[s.autor_id]?.email ?? 'Usuário',
      area_nome: s.areas_direito?.nome ?? null,
      destaque: s.destaque ?? false,
      total_votos: skillVotosMap[s.id] ?? 0,
      skill_tipo: s.tipo,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const usuariosSugeridos = items.length === 0
    ? await fetchUsuariosSugeridos(supabase, user.id)
    : []

  return (
    <FeedClient
      items={items}
      seguidoIds={seguidoIds}
      usuariosSugeridos={usuariosSugeridos}
      areas={areas ?? []}
    />
  )
}

async function fetchUsuariosSugeridos(supabase: any, currentUserId: string) {
  const { data: topAutores } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .neq('id', currentUserId)
    .limit(20)

  if (!topAutores?.length) return []

  const ids = topAutores.map((p: any) => p.id)

  const [{ data: contPrompts }, { data: contSkills }] = await Promise.all([
    supabase
      .from('prompts')
      .select('autor_id')
      .in('autor_id', ids)
      .in('status', ['ativo', 'aprovado']),
    (supabase as any)
      .from('skills')
      .select('autor_id')
      .in('autor_id', ids)
      .in('status', ['ativo', 'aprovado']),
  ])

  const promptCount: Record<string, number> = {}
  for (const p of contPrompts ?? []) promptCount[p.autor_id] = (promptCount[p.autor_id] ?? 0) + 1
  const skillCount: Record<string, number> = {}
  for (const s of contSkills ?? []) skillCount[s.autor_id] = (skillCount[s.autor_id] ?? 0) + 1

  return topAutores
    .map((p: any) => ({
      ...p,
      total_prompts: promptCount[p.id] ?? 0,
      total_skills: skillCount[p.id] ?? 0,
    }))
    .filter((p: any) => p.total_prompts + p.total_skills > 0)
    .sort((a: any, b: any) => (b.total_prompts + b.total_skills) - (a.total_prompts + a.total_skills))
    .slice(0, 6)
}
