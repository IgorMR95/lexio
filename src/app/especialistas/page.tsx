import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

interface RankUser {
  id: string
  full_name: string
  avatar_url: string | null
  instituicao: string | null
  total: number
}

function Avatar({ u }: { u: RankUser }) {
  if (u.avatar_url) {
    return <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-zinc-300">{u.full_name[0]?.toUpperCase()}</span>
    </div>
  )
}

function RankingCard({
  title,
  desc,
  users,
  unit,
  accent,
  iconBg,
  iconPath,
}: {
  title: string
  desc: string
  users: RankUser[]
  unit: string
  accent: string
  iconBg: string
  iconPath: React.ReactNode
}) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconBg}`}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{iconPath}</svg>
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">{title}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">Nenhum dado ainda.</p>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <Link
              key={u.id}
              href={`/u/${u.id}`}
              className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${
                i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                'bg-zinc-800 border-zinc-700 text-zinc-500'
              }`}>{i + 1}</div>
              <Avatar u={u} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white group-hover:text-green-300 transition-colors truncate">{u.full_name}</p>
                {u.instituicao && <p className="text-[10px] text-zinc-600 truncate">{u.instituicao}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-bold tabular-nums ${accent}`}>{u.total}</span>
                <p className="text-[10px] text-zinc-700">{unit}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default async function EspecialistasPage() {
  const supabase = createClient()

  const [
    { data: geralRaw },
    { data: promptsRaw },
    { data: skillsRaw },
    { data: destaquesRaw },
    { data: semanaRaw },
    { data: usadosRaw },
  ] = await Promise.all([
    (supabase as any).from('v_ranking_geral').select('autor_id, total_votos').order('total_votos', { ascending: false }).limit(10),
    (supabase as any).from('v_ranking_prompt_autores').select('autor_id, total_prompts').order('total_prompts', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_skill_autores').select('autor_id, total_skills').order('total_skills', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_geral').select('autor_id, total_destaques').order('total_destaques', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_prompt_autores').select('autor_id, prompts_semana').order('prompts_semana', { ascending: false }).limit(5),
    (supabase as any).from('prompts').select('autor_id, total_copias').in('status', ['ativo', 'aprovado']),
  ])

  // Aggregate total_copias by author
  const copiasByAuthor: Record<string, number> = {}
  for (const p of (usadosRaw ?? [])) {
    if (!p.autor_id) continue
    copiasByAuthor[p.autor_id] = (copiasByAuthor[p.autor_id] ?? 0) + (Number(p.total_copias) ?? 0)
  }
  const copiasSorted = Object.entries(copiasByAuthor)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([autor_id, total_copias]) => ({ autor_id, total_copias }))

  // Collect all author IDs for profile fetch
  const allAutorIds = Array.from(new Set([
    ...(geralRaw ?? []).map((r: any) => r.autor_id),
    ...(promptsRaw ?? []).map((r: any) => r.autor_id),
    ...(skillsRaw ?? []).map((r: any) => r.autor_id),
    ...(destaquesRaw ?? []).map((r: any) => r.autor_id),
    ...(semanaRaw ?? []).map((r: any) => r.autor_id),
    ...copiasSorted.map((r) => r.autor_id),
  ].filter(Boolean)))

  const profileMap: Record<string, any> = {}
  if (allAutorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, instituicao')
      .in('id', allAutorIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
  }

  const buildRanking = (rows: any[], countField: string): RankUser[] =>
    (rows ?? []).map((r: any) => ({
      id: r.autor_id as string,
      full_name: profileMap[r.autor_id]?.full_name ?? profileMap[r.autor_id]?.email ?? 'Usuário',
      avatar_url: profileMap[r.autor_id]?.avatar_url ?? null,
      instituicao: profileMap[r.autor_id]?.instituicao ?? null,
      total: Number(r[countField] ?? 0),
    }))

  const rankingGeral = buildRanking(geralRaw ?? [], 'total_votos')
  const rankingPrompts = buildRanking(promptsRaw ?? [], 'total_prompts')
  const rankingSkills = buildRanking(skillsRaw ?? [], 'total_skills')
  const rankingDestaques = buildRanking(destaquesRaw ?? [], 'total_destaques')
  const rankingSemana = buildRanking(semanaRaw ?? [], 'prompts_semana')
  const rankingCopias: RankUser[] = copiasSorted.map((r) => ({
    id: r.autor_id,
    full_name: profileMap[r.autor_id]?.full_name ?? profileMap[r.autor_id]?.email ?? 'Usuário',
    avatar_url: profileMap[r.autor_id]?.avatar_url ?? null,
    instituicao: profileMap[r.autor_id]?.instituicao ?? null,
    total: r.total_copias,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Rankings de contribuição
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Especialistas em IA Jurídica</h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
          Quem está liderando o desenvolvimento da IA jurídica no Brasil. Rankings atualizados
          com base em prompts, skills, votos dos pares e selos de destaque editorial.
        </p>
      </div>

      {/* Ranking Geral — destaque com top 10 */}
      <div className="mb-8 p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-white">Maiores Especialistas em IA Jurídica</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Votos recebidos da comunidade — soma de prompts + skills</p>
          </div>
        </div>

        {rankingGeral.length === 0 ? (
          <p className="text-sm text-zinc-500 italic">Nenhum dado disponível ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {rankingGeral.map((u, i) => (
              <Link
                key={u.id}
                href={`/u/${u.id}`}
                className="group flex flex-col items-center text-center p-4 rounded-xl border border-yellow-500/10 hover:border-yellow-500/30 hover:bg-yellow-500/5 transition-all gap-2"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                  i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                  i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                  'bg-zinc-800 border-zinc-700 text-zinc-500'
                }`}>{i + 1}</div>
                {u.avatar_url
                  ? <img src={u.avatar_url} alt={u.full_name} className="w-10 h-10 rounded-full object-cover" />
                  : (
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-zinc-300">{u.full_name[0]?.toUpperCase()}</span>
                    </div>
                  )
                }
                <div className="min-w-0 w-full">
                  <p className="text-xs font-semibold text-white group-hover:text-yellow-300 transition-colors truncate">{u.full_name}</p>
                  {u.instituicao && <p className="text-[10px] text-zinc-600 truncate">{u.instituicao}</p>}
                  <p className="text-xs font-bold text-yellow-400 mt-1 tabular-nums">{u.total} votos</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Grade 2x2 com rankings específicos + CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RankingCard
          title="Mais Prompts Aprovados"
          desc="Usuários com mais prompts publicados e aprovados pela curadoria"
          users={rankingPrompts}
          unit="prompts"
          accent="text-green-400"
          iconBg="bg-green-500/10 border-green-500/20 text-green-400"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
        />
        <RankingCard
          title="Mais Skills MD Aprovadas"
          desc="Usuários com mais skills de automação jurídica publicadas"
          users={rankingSkills}
          unit="skills"
          accent="text-blue-400"
          iconBg="bg-blue-500/10 border-blue-500/20 text-blue-400"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
        />
        <RankingCard
          title="Mais Selos de Destaque"
          desc="Publicações marcadas como destaque editorial pelos curadores"
          users={rankingDestaques}
          unit="selos"
          accent="text-yellow-400"
          iconBg="bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
        />
        <RankingCard
          title="Mais Usados pelos Colegas"
          desc="Usuários cujos prompts foram mais copiados para uso na prática"
          users={rankingCopias}
          unit="cópias"
          accent="text-violet-400"
          iconBg="bg-violet-500/10 border-violet-500/20 text-violet-400"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />}
        />
        <RankingCard
          title="Mais Ativos esta Semana"
          desc="Quem mais publicou prompts nos últimos 7 dias"
          users={rankingSemana}
          unit="publicados"
          accent="text-emerald-400"
          iconBg="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
        />

        {/* CTA card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="font-bold text-white mb-2">Quer aparecer aqui?</h3>
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed max-w-xs">
            Publique prompts e skills, acumule votos dos pares e conquiste selos de destaque editorial.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link
              href="/dashboard/novo-prompt"
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors"
            >
              Publicar Prompt
            </Link>
            <Link
              href="/skills"
              className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
            >
              Ver Skills MD
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
