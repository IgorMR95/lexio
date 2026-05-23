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

function AvatarSm({ u }: { u: RankUser }) {
  if (u.avatar_url) {
    return <img src={u.avatar_url} alt={u.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-zinc-300">{u.full_name[0]?.toUpperCase()}</span>
    </div>
  )
}

function PosBadge({ pos }: { pos: number }) {
  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${
      pos === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
      pos === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
      pos === 2 ? 'bg-amber-700 border-amber-600 text-white' :
      'bg-zinc-800 border-zinc-700 text-zinc-500'
    }`}>{pos + 1}</div>
  )
}

// Card compacto de lista (usado nos 4 rankings por seção)
function RankingCard({
  title, desc, users, unit, accent, iconBg, iconPath,
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
              <PosBadge pos={i} />
              <AvatarSm u={u} />
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

// Mini-leaderboard horizontal (usado nos destaques de seção)
function MiniLeaderboard({
  users, unit, hoverColor,
}: {
  users: RankUser[]
  unit: string
  hoverColor: string
}) {
  if (users.length === 0) {
    return <p className="text-xs text-zinc-600 italic">Nenhum dado disponível ainda.</p>
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {users.map((u, i) => (
        <Link
          key={u.id}
          href={`/u/${u.id}`}
          className={`group flex flex-col items-center text-center p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/30 transition-all gap-1.5`}
        >
          <PosBadge pos={i} />
          {u.avatar_url
            ? <img src={u.avatar_url} alt={u.full_name} className="w-9 h-9 rounded-full object-cover" />
            : (
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                <span className="text-sm font-bold text-zinc-300">{u.full_name[0]?.toUpperCase()}</span>
              </div>
            )
          }
          <div className="min-w-0 w-full">
            <p className={`text-[11px] font-semibold text-white group-hover:${hoverColor} transition-colors truncate`}>{u.full_name}</p>
            <p className="text-[10px] font-bold text-zinc-400 tabular-nums">{u.total} {unit}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default async function EspecialistasPage() {
  const supabase = createClient()

  const [
    { data: geralRaw },
    { data: promptVotosRaw },
    { data: promptAprovRaw },
    { data: promptDestRaw },
    { data: promptSemanaRaw },
    { data: skillVotosRaw },
    { data: skillAprovRaw },
    { data: skillDestRaw },
    { data: skillSemanaRaw },
  ] = await Promise.all([
    (supabase as any).from('v_ranking_geral').select('autor_id, total_votos').order('total_votos', { ascending: false }).limit(10),
    (supabase as any).from('v_ranking_prompt_votos').select('autor_id, total_votos').order('total_votos', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_prompt_autores').select('autor_id, total_prompts').order('total_prompts', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_prompt_autores').select('autor_id, total_destaques').order('total_destaques', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_prompt_autores').select('autor_id, prompts_semana').order('prompts_semana', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_skill_votos').select('autor_id, total_votos').order('total_votos', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_skill_autores').select('autor_id, total_skills').order('total_skills', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_skill_autores').select('autor_id, total_destaques').order('total_destaques', { ascending: false }).limit(5),
    (supabase as any).from('v_ranking_skill_autores').select('autor_id, skills_semana').order('skills_semana', { ascending: false }).limit(5),
  ])

  // Collect all author IDs
  const allRaws = [geralRaw, promptVotosRaw, promptAprovRaw, promptDestRaw, promptSemanaRaw, skillVotosRaw, skillAprovRaw, skillDestRaw, skillSemanaRaw]
  const allAutorIds = Array.from(new Set(
    allRaws.flatMap(rows => (rows ?? []).map((r: any) => r.autor_id)).filter(Boolean)
  ))

  const profileMap: Record<string, any> = {}
  if (allAutorIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, instituicao')
      .in('id', allAutorIds)
    ;(profiles ?? []).forEach((p: any) => { profileMap[p.id] = p })
  }

  const build = (rows: any[], countField: string): RankUser[] =>
    (rows ?? []).map((r: any) => ({
      id: r.autor_id as string,
      full_name: profileMap[r.autor_id]?.full_name ?? profileMap[r.autor_id]?.email ?? 'Usuário',
      avatar_url: profileMap[r.autor_id]?.avatar_url ?? null,
      instituicao: profileMap[r.autor_id]?.instituicao ?? null,
      total: Number(r[countField] ?? 0),
    }))

  const rankingGeral       = build(geralRaw ?? [],       'total_votos')
  const rankingPVotos      = build(promptVotosRaw ?? [],  'total_votos')
  const rankingPAprov      = build(promptAprovRaw ?? [],  'total_prompts')
  const rankingPDest       = build(promptDestRaw ?? [],   'total_destaques')
  const rankingPSemana     = build(promptSemanaRaw ?? [], 'prompts_semana')
  const rankingSVotos      = build(skillVotosRaw ?? [],   'total_votos')
  const rankingSAprov      = build(skillAprovRaw ?? [],   'total_skills')
  const rankingSDest       = build(skillDestRaw ?? [],    'total_destaques')
  const rankingSSemana     = build(skillSemanaRaw ?? [],  'skills_semana')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

      {/* ── Header ── */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Rankings de especialistas
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Especialistas em IA Jurídica</h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
          Quem lidera a produção de conhecimento em IA jurídica no Brasil — prompts testados,
          skills de automação, votos dos pares e selos editoriais.
        </p>
      </div>

      {/* ── Entenda o ranking ── */}
      <details className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <summary className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer select-none list-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Entenda o ranking</span>
          </div>
          <svg
            className="w-4 h-4 text-zinc-500 transition-transform duration-200 group-open:rotate-180"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>

        <div className="px-6 pb-6 border-t border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
            <div>
              <h3 className="text-sm font-bold text-white mb-3">Como o ranking é calculado</h3>
              <div className="space-y-3">
                {[
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />,
                    title: 'Votos dos pares',
                    desc: 'Cada curtida recebida em prompts ou skills conta. É o principal indicador de qualidade reconhecida pela comunidade.',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
                    title: 'Selos de destaque editorial',
                    desc: 'Atribuídos pela curadoria Midori quando uma publicação é considerada excepcional. Têm peso maior que votos comuns.',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
                    title: 'Publicações aprovadas',
                    desc: 'Cada prompt ou skill aprovado pela curadoria antes de ser publicado conta para sua posição nos rankings de quantidade.',
                  },
                  {
                    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
                    title: 'Atividade recente',
                    desc: 'O ranking "Mais ativos na semana" considera apenas publicações dos últimos 7 dias — ideal para quem está produzindo agora.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-3">Como aparecer no ranking</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Publique prompts jurídicos pela página "Publicar Prompt" — cada prompt aprovado já conta para os rankings de quantidade.' },
                  { step: '2', text: 'Publique Skills MD em "Skills MD" — automações jurídicas têm ranking próprio e também somam no ranking geral.' },
                  { step: '3', text: 'Qualidade traz votos — prompts bem escritos e práticos recebem mais curtidas dos colegas, subindo no ranking de votos.' },
                  { step: '4', text: 'Destaque editorial — publicações excepcionais são marcadas pela curadoria Midori, o maior diferencial no ranking geral.' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-green-400">{item.step}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-3 flex-wrap">
                <Link href="/dashboard/novo-prompt" className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors">
                  Publicar Prompt
                </Link>
                <Link href="/dashboard/nova-skill" className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs font-medium hover:border-zinc-500 hover:text-white transition-colors">
                  Publicar Skill MD
                </Link>
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* ── Ranking Geral — top 10 ── */}
      <div className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* ── Seção: Ranking de Prompts ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ranking de Prompts</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Rankings dos principais especialistas em prompts jurídicos</p>
          </div>
          <Link href="/prompts" className="ml-auto text-xs text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
            Base de Prompts
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Melhores especialistas em Prompts */}
        <div className="p-5 rounded-2xl border border-green-500/15 bg-green-500/5">
          <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-4">Melhores especialistas em Prompts</p>
          <MiniLeaderboard users={rankingPVotos} unit="votos" hoverColor="text-green-300" />
        </div>

        {/* 2x2 grid com os 4 rankings de prompts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RankingCard
            title="Mais prompts aprovados"
            desc="Usuários com maior número de prompts publicados e aprovados"
            users={rankingPAprov}
            unit="prompts"
            accent="text-green-400"
            iconBg="bg-green-500/10 border-green-500/20 text-green-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
          <RankingCard
            title="Mais selos de destaque"
            desc="Usuários com mais prompts marcados como destaque editorial"
            users={rankingPDest}
            unit="selos"
            accent="text-yellow-400"
            iconBg="bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
          />
          <RankingCard
            title="Mais curtidas recebidas"
            desc="Usuários cujos prompts acumularam mais curtidas da comunidade"
            users={rankingPVotos}
            unit="curtidas"
            accent="text-teal-400"
            iconBg="bg-teal-500/10 border-teal-500/20 text-teal-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />}
          />
          <RankingCard
            title="Mais ativos na semana"
            desc="Usuários que mais publicaram prompts nos últimos 7 dias"
            users={rankingPSemana}
            unit="publicados"
            accent="text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
          />
        </div>
      </div>

      {/* ── Seção: Ranking de Skills MD ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ranking de Skills MD</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Rankings dos principais especialistas em automações jurídicas</p>
          </div>
          <Link href="/skills" className="ml-auto text-xs text-zinc-500 hover:text-blue-400 transition-colors hidden sm:flex items-center gap-1">
            Skills MD
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Melhores especialistas em Skills MD */}
        <div className="p-5 rounded-2xl border border-blue-500/15 bg-blue-500/5">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-4">Melhores especialistas em Skills MD</p>
          <MiniLeaderboard users={rankingSVotos} unit="votos" hoverColor="text-blue-300" />
        </div>

        {/* 2x2 grid com os 4 rankings de skills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RankingCard
            title="Mais skills aprovadas"
            desc="Usuários com maior número de skills de automação jurídica publicadas"
            users={rankingSAprov}
            unit="skills"
            accent="text-blue-400"
            iconBg="bg-blue-500/10 border-blue-500/20 text-blue-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />}
          />
          <RankingCard
            title="Mais selos de destaque"
            desc="Usuários com mais skills marcadas como destaque editorial"
            users={rankingSDest}
            unit="selos"
            accent="text-yellow-400"
            iconBg="bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />}
          />
          <RankingCard
            title="Mais curtidas recebidas"
            desc="Usuários cujas skills acumularam mais curtidas da comunidade"
            users={rankingSVotos}
            unit="curtidas"
            accent="text-teal-400"
            iconBg="bg-teal-500/10 border-teal-500/20 text-teal-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />}
          />
          <RankingCard
            title="Mais ativas na semana"
            desc="Usuários que mais publicaram skills nos últimos 7 dias"
            users={rankingSSemana}
            unit="publicadas"
            accent="text-emerald-400"
            iconBg="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            iconPath={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
          />
        </div>
      </div>

      {/* ── CTA Final ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/40 via-zinc-900 to-blue-900/20 border border-green-500/20 p-10 text-center">
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[180px] bg-green-600/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-white mb-3">Construa sua reputação em IA jurídica</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed mb-7">
            Publique seus prompts e skills, acumule votos dos seus pares e apareça nos rankings.
            Seu perfil público é seu portfólio — visível para toda a comunidade jurídica.
          </p>
          <div className="flex items-center gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard/novo-prompt"
              className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-900/30"
            >
              Publicar meu Prompt
            </Link>
            <Link
              href="/dashboard/nova-skill"
              className="px-6 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-blue-500/40 hover:text-blue-300 transition-colors"
            >
              Publicar minha Skill MD
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
