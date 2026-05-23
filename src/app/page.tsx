import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const TIPO_LABEL: Record<string, string> = {
  llm: 'Modelo de IA', app: 'Aplicativo', extensao: 'Extensão', plataforma: 'Plataforma', outro: 'Outro',
}

export default async function HomePage() {
  const supabase = createClient()

  const [
    { count: totalPrompts },
    { count: totalFerramentas },
    { count: totalSkills },
    { data: destaquesSemana },
    { data: ferrsDestaqueSemana },
    { data: skillsDestaqueSemana },
    { data: topContribRaw },
  ] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('ferramentas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    (supabase as any).from('skills').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('destaques_semana').select('*, areas_direito(nome)').limit(4),
    (supabase as any).rpc('top_ferramentas_semana', { lim: 4 }).then((r: any) =>
      r.error
        ? (supabase as any)
            .from('ferramenta_votos_semana')
            .select('ferramenta_id, total_votos, ferramentas(id, nome, grupo, tipo, destaque, url)')
            .order('total_votos', { ascending: false })
            .limit(12)
        : r
    ),
    (supabase as any).from('skills_destaques_semana').select('*, areas_direito(nome)').limit(4),
    (supabase as any)
      .from('v_ranking_geral')
      .select('autor_id, total_prompts, total_skills, total_destaques, total_votos')
      .order('total_destaques', { ascending: false })
      .order('total_votos', { ascending: false })
      .limit(3),
  ])

  const topContribIds = (topContribRaw ?? []).map((a: any) => a.autor_id)
  const { data: topContribProfiles } = topContribIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, instituicao').in('id', topContribIds)
    : { data: [] as any[] }
  type TopContribuidor = { id: string; total_prompts: number; total_skills: number; total_destaques: number; total_votos: number; full_name: string; instituicao: string | null }
  const topContribuidores: TopContribuidor[] = (topContribRaw ?? []).map((a: any) => {
    const profile = (topContribProfiles ?? []).find((p: any) => p.id === a.autor_id)
    return {
      id: a.autor_id as string,
      total_prompts: a.total_prompts as number,
      total_skills: a.total_skills as number,
      total_destaques: a.total_destaques as number,
      total_votos: a.total_votos as number,
      full_name: (profile?.full_name ?? 'Especialista') as string,
      instituicao: (profile?.instituicao ?? null) as string | null,
    }
  })

  const ferrsMap: Record<string, { nome: string; grupo: string; tipo: string; destaque: boolean; url: string | null; votos: number }> = {}
  for (const row of (ferrsDestaqueSemana ?? [])) {
    const f = row.ferramentas ?? row
    const fid = row.ferramenta_id ?? f.id
    if (!fid) continue
    if (!ferrsMap[fid]) ferrsMap[fid] = { nome: f.nome, grupo: f.grupo, tipo: f.tipo, destaque: f.destaque, url: f.url, votos: 0 }
    ferrsMap[fid].votos += Number(row.total_votos ?? 0)
  }
  const topFerrs = Object.entries(ferrsMap)
    .sort((a, b) => b[1].votos - a[1].votos)
    .slice(0, 4)
    .map(([id, f]) => ({ id, ...f }))

  const posBadge = (i: number) =>
    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950'
    : i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950'
    : i === 2 ? 'bg-amber-700 border-amber-600 text-white'
    : 'bg-zinc-800 border-zinc-700 text-zinc-500'

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-green-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              A plataforma completa de IA para o direito brasileiro
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
              Direito e IA,{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                do começo ao fim
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              Prompts jurídicos, skills para automação, ranking de ferramentas de IA e
              conteúdo educacional — tudo em um só lugar, feito para juristas brasileiros.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link href="/prompts" className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-900/30">
                Explorar a plataforma
              </Link>
              <Link href="/signup" className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors">
                Criar conta grátis
              </Link>
            </div>
          </div>

          <div className="mt-16 flex flex-wrap gap-x-10 gap-y-4">
            {[
              { value: `+${totalPrompts ?? 500}`, label: 'prompts jurídicos' },
              { value: `+${totalFerramentas ?? 50}`, label: 'IAs e ferramentas catalogadas' },
              { value: `+${totalSkills ?? 0}`,        label: 'skills MD disponíveis' },
              { value: '100%',                         label: 'gratuito para usar' },
            ].map((s, i, arr) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-sm text-zinc-500">{s.label}</span>
                {i < arr.length - 1 && <span className="text-zinc-700 ml-8 hidden sm:inline">·</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Entenda a plataforma ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3">
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Sobre o Midori</p>
              <h2 className="text-2xl font-bold text-white mb-4">O repositório central de IA jurídica do Brasil</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                O Midori reúne prompts jurídicos, skills de automação, ranking de ferramentas de IA e
                formação continuada — quatro áreas em um único lugar. A plataforma existe para que quem
                produz conteúdo sobre IA para o direito possa construir autoridade e ser reconhecido pelos
                pares, e para que toda a comunidade jurídica saiba o que é bom, o que não presta, e encontre
                tudo com curadoria e qualidade em um só lugar.
              </p>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-3">
              {[
                { href: '/prompts', label: 'Base de Prompts', sub: `+${totalPrompts ?? 500} prompts`, accent: 'text-green-400', cls: 'border-green-500/20 hover:border-green-500/40 bg-green-500/5' },
                { href: '/ranking', label: 'Ranking de IAs', sub: `+${totalFerramentas ?? 50} ferramentas`, accent: 'text-violet-400', cls: 'border-violet-500/20 hover:border-violet-500/40 bg-violet-500/5' },
                { href: '/skills', label: 'Skills MD', sub: `+${totalSkills ?? 0} disponíveis`, accent: 'text-blue-400', cls: 'border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5' },
                { href: '/academy', label: 'Academy', sub: 'Formação continuada', accent: 'text-amber-400', cls: 'border-amber-500/20 hover:border-amber-500/40 bg-amber-500/5' },
              ].map(a => (
                <Link key={a.href} href={a.href} className={`flex flex-col gap-1 p-4 rounded-xl border transition-all ${a.cls}`}>
                  <span className={`text-xs font-semibold ${a.accent}`}>{a.label}</span>
                  <span className="text-[11px] text-zinc-500">{a.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Em destaque — bloco único ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Atualizado semanalmente</p>
              <h2 className="text-2xl font-bold text-white">Em destaque na plataforma</h2>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden grid grid-cols-1 lg:grid-cols-2">

            {/* Prompts em destaque */}
            <div className="p-6 border-b border-zinc-800 lg:border-r">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">Prompts em destaque</h3>
                    <Link href="/prompts" className="text-xs text-zinc-500 hover:text-green-400 transition-colors flex-shrink-0">Ver todos →</Link>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Os mais votados esta semana</p>
                </div>
              </div>
              {!destaquesSemana?.length
                ? <p className="text-xs text-zinc-600 italic">Nenhum destaque esta semana.</p>
                : (
                  <div className="space-y-2">
                    {destaquesSemana.map((p: any, i: number) => (
                      <Link key={p.id} href={`/prompts/${p.id}`} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${posBadge(i)}`}>{i + 1}</span>
                        <p className="flex-1 text-xs text-zinc-300 group-hover:text-green-300 transition-colors truncate">{p.titulo}</p>
                        {p.areas_direito?.nome && <span className="text-[10px] text-zinc-600 flex-shrink-0">{p.areas_direito.nome}</span>}
                      </Link>
                    ))}
                  </div>
                )
              }
            </div>

            {/* IAs mais votadas */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">IAs mais votadas</h3>
                    <Link href="/ranking" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors flex-shrink-0">Ver ranking →</Link>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Modelos e ferramentas jurídicas</p>
                </div>
              </div>
              {!topFerrs.length
                ? <p className="text-xs text-zinc-600 italic">Nenhum dado esta semana.</p>
                : (
                  <div className="space-y-2">
                    {topFerrs.map((f, i) => (
                      <Link key={f.id} href={`/ranking/${f.id}`} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${posBadge(i)}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-zinc-300 group-hover:text-violet-300 transition-colors truncate">{f.nome}</p>
                          {f.tipo && <p className="text-[10px] text-zinc-600">{TIPO_LABEL[f.tipo] ?? f.tipo}</p>}
                        </div>
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">{f.votos} votos</span>
                      </Link>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Skills MD em destaque */}
            <div className="p-6 border-b lg:border-b-0 border-zinc-800 lg:border-r">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">Skills MD em destaque</h3>
                    <Link href="/skills" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors flex-shrink-0">Ver todas →</Link>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Automações mais acessadas</p>
                </div>
              </div>
              {!skillsDestaqueSemana?.length
                ? <p className="text-xs text-zinc-600 italic">Nenhum destaque esta semana.</p>
                : (
                  <div className="space-y-2">
                    {skillsDestaqueSemana.map((s: any, i: number) => (
                      <Link key={s.id} href={`/skills/${s.id}`} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${posBadge(i)}`}>{i + 1}</span>
                        <p className="flex-1 text-xs text-zinc-300 group-hover:text-blue-300 transition-colors truncate">{s.titulo}</p>
                        {s.areas_direito?.nome && <span className="text-[10px] text-zinc-600 flex-shrink-0">{s.areas_direito.nome}</span>}
                      </Link>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Top especialistas */}
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">Top especialistas</h3>
                    <Link href="/especialistas" className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors flex-shrink-0">Ver ranking →</Link>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">Prompts + skills + votos da comunidade</p>
                </div>
              </div>
              {!topContribuidores.length
                ? <p className="text-xs text-zinc-600 italic">Nenhum dado disponível.</p>
                : (
                  <div className="space-y-2">
                    {topContribuidores.map((c: TopContribuidor, i: number) => (
                      <Link key={c.id} href={`/u/${c.id}`} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/40 transition-all">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${posBadge(i)}`}>{i + 1}</span>
                        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-[11px] font-bold text-zinc-300">{c.full_name[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-300 group-hover:text-yellow-300 transition-colors truncate">{c.full_name}</p>
                          {c.instituicao && <p className="text-[10px] text-zinc-600 truncate">{c.instituicao}</p>}
                        </div>
                        <span className="text-xs font-bold text-yellow-400 flex-shrink-0">{c.total_votos}v</span>
                      </Link>
                    ))}
                  </div>
                )
              }
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-900/40 via-zinc-900 to-emerald-900/20 border border-green-500/20 p-12 text-center">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-green-600/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium mb-6">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Torne-se referência em IA jurídica
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Construa sua reputação como especialista</h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed text-sm">
                Publique prompts e skills, acumule votos dos seus pares e apareça nos rankings de
                especialistas em IA jurídica. Sua conta é gratuita e seu perfil público é seu portfólio.
              </p>
              <div className="flex items-center gap-4 justify-center flex-wrap">
                <Link href="/signup" className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors shadow-xl shadow-green-900/30">
                  Começar agora — é grátis
                </Link>
                <Link href="/prompts" className="px-8 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors">
                  Explorar sem cadastro
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
