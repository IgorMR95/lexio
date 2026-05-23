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
    { data: areasData },
    { data: ferrsDestaqueSemana },
    { data: skillsDestaqueSemana },
    { data: topContribRaw },
  ] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('ferramentas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    (supabase as any).from('skills').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('destaques_semana').select('*, areas_direito(nome)').limit(4),
    supabase.from('areas_direito').select('id, nome, slug').eq('ativo', true).order('ordem').limit(12),
    // top ferramentas da semana agregadas por ferramenta_id
    (supabase as any).rpc('top_ferramentas_semana', { lim: 4 }).then((r: any) =>
      r.error
        // fallback: buscar direto com join
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
      full_name: (profile?.full_name ?? 'Contribuidor') as string,
      instituicao: (profile?.instituicao ?? null) as string | null,
    }
  })

  const areas = areasData ?? []

  // Agregar votos da semana por ferramenta (o join retorna múltiplas linhas por ferramenta)
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

  const perfis = [
    { titulo: 'Advogado Privado',     desc: 'Escritórios e advocacia de causa' },
    { titulo: 'Advogado Público',     desc: 'Procuradorias e consultoria estatal' },
    { titulo: 'Magistrado',           desc: 'Sentenças, despachos e acórdãos' },
    { titulo: 'Defensor Público',     desc: 'Peças em favor de hipossuficientes' },
    { titulo: 'Promotor de Justiça',  desc: 'Denúncias, ANPPs e ações civis' },
    { titulo: 'Pesquisador / Mestre', desc: 'Teses, artigos e projetos Qualis' },
    { titulo: 'Concurseiro',          desc: 'Magistratura, MP e OAB' },
    { titulo: 'Estudante de Direito', desc: 'TCC, moot courts e fichamentos' },
  ]

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

          {/* Stats */}
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

      {/* ── Quatro pilares ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Tudo sobre IA jurídica</p>
            <h2 className="text-3xl font-bold text-white mb-4">Uma plataforma, quatro pilares</h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-sm leading-relaxed">
              O Midori reúne recursos que antes estavam espalhados — prompts prontos, automações avançadas,
              avaliação independente de ferramentas e formação continuada.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/prompts" className="group relative p-7 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-green-700/40 hover:bg-zinc-900/80 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-green-600/5 rounded-full blur-2xl group-hover:bg-green-600/10 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Base de Prompts</h3>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] border border-green-500/20 font-medium">+{totalPrompts ?? 500} prompts</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  A maior coleção colaborativa de prompts jurídicos em português. Petições, contratos, pareceres,
                  recursos e muito mais — organizados por área, categoria e perfil profissional.
                </p>
                <div className="flex flex-wrap gap-2">
                  {areas.slice(0, 4).map((a: any) => (
                    <span key={a.id} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{a.nome}</span>
                  ))}
                  {areas.length > 4 && <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-600 text-xs">+{areas.length - 4} áreas</span>}
                </div>
                <p className="text-xs text-green-400 mt-5 group-hover:translate-x-1 transition-transform">Explorar prompts →</p>
              </div>
            </Link>

            <Link href="/ranking" className="group relative p-7 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-700/40 hover:bg-zinc-900/80 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Ranking de IAs Jurídicas</h3>
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] border border-violet-500/20 font-medium">+{totalFerramentas ?? 50} catalogadas</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Avaliação independente de modelos (ChatGPT, Claude, Gemini…) e ferramentas jurídicas
                  (Turivius, Netlex, Looplex…), votadas pela comunidade e com reviews editoriais.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Modelos de IA', 'Ferramentas', 'Reviews', 'Destaque editorial'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-violet-400 mt-5 group-hover:translate-x-1 transition-transform">Ver ranking →</p>
              </div>
            </Link>

            <Link href="/skills" className="group relative p-7 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-700/40 hover:bg-zinc-900/80 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Skills MD</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-medium">+{totalSkills ?? 0} disponíveis</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Arquivos de instrução estruturada para configurar agentes de IA com comportamento especializado
                  em tarefas jurídicas — análise de contratos, due diligence, pesquisa de jurisprudência.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Claude Projects', 'Agentes IA', 'Fluxos jurídicos', 'Reutilizável'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-blue-400 mt-5 group-hover:translate-x-1 transition-transform">Ver skills →</p>
              </div>
            </Link>

            <Link href="/academy" className="group relative p-7 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-amber-700/40 hover:bg-zinc-900/80 transition-all overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-600/5 rounded-full blur-2xl group-hover:bg-amber-600/10 transition-all" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Academy</h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20 font-medium">Formação continuada</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Guias práticos, tutoriais e boas práticas sobre IA aplicada ao direito — para juristas que
                  querem usar IA com segurança, ética e eficiência no cotidiano profissional.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Guias práticos', 'Tutoriais', 'Boas práticas', 'Ética em IA'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-amber-400 mt-5 group-hover:translate-x-1 transition-transform">Ir para o Academy →</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Plataforma especializada</p>
            <h2 className="text-3xl font-bold text-white mb-3">Feito para cada jurista</h2>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">
              Do estudante ao ministro — todos os perfis do direito brasileiro têm um lugar aqui.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {perfis.map(p => (
              <div key={p.titulo} className="group px-5 py-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all">
                <p className="text-sm font-semibold text-white mb-1">{p.titulo}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prompts em destaque esta semana ── */}
      {destaquesSemana && destaquesSemana.length > 0 && (
        <section className="border-b border-zinc-800 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Prompts em destaque esta semana</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Os mais votados pela comunidade nos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/prompts" className="text-xs text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
                Base de prompts
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destaquesSemana.map((prompt: any, i: number) => (
                <Link key={prompt.id} href={`/prompts/${prompt.id}`}
                  className="group relative flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-green-700/40 hover:bg-zinc-900/80 transition-all">
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow ${
                    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                    i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                    i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>{i + 1}</div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-green-300 transition-colors line-clamp-2 mb-2 mt-1">{prompt.titulo}</h3>
                  {prompt.descricao_curta && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">{prompt.descricao_curta}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    {prompt.areas_direito?.nome && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">{prompt.areas_direito.nome}</span>
                    )}
                    <span className="text-xs text-zinc-600 group-hover:text-green-400 transition-colors ml-auto flex items-center gap-0.5">
                      Ver <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── IAs em destaque esta semana ── */}
      {topFerrs.length > 0 && (
        <section className="border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">IAs mais votadas esta semana</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Modelos e ferramentas com mais votos dos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/ranking" className="text-xs text-zinc-500 hover:text-violet-400 transition-colors hidden sm:flex items-center gap-1">
                Ranking completo
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topFerrs.map((f, i) => (
                <Link key={f.id} href={`/ranking/${f.id}`}
                  className="group flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-violet-700/40 hover:bg-zinc-900/80 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm border ${
                      f.grupo === 'modelo' ? 'bg-violet-500/15 border-violet-500/20 text-violet-300' : 'bg-blue-500/15 border-blue-500/20 text-blue-300'
                    }`}>{f.nome[0]?.toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">{f.nome}</p>
                      <p className="text-[10px] text-zinc-600">{TIPO_LABEL[f.tipo] ?? f.tipo}</p>
                    </div>
                    <span className={`ml-auto text-xs font-black shrink-0 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-400' : 'text-zinc-600'}`}>#{i + 1}</span>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-800/60">
                    <span className="text-xs text-zinc-600">{f.votos} {f.votos === 1 ? 'voto' : 'votos'} esta semana</span>
                    {f.destaque && <span className="text-[10px] text-yellow-500">★ destaque</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Skills MD em destaque (condicional) ── */}
      {skillsDestaqueSemana && skillsDestaqueSemana.length > 0 && (
        <section className="border-b border-zinc-800 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Skills MD em destaque esta semana</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Automações mais acessadas nos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/skills" className="text-xs text-zinc-500 hover:text-blue-400 transition-colors hidden sm:flex items-center gap-1">
                Ver todas as skills
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {skillsDestaqueSemana.slice(0, 4).map((skill: any, i: number) => (
                <Link key={skill.id} href={`/skills/${skill.id}`}
                  className="group relative flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-700/40 hover:bg-zinc-900/80 transition-all">
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow ${
                    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                    i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                    i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>{i + 1}</div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-2 mt-1">{skill.titulo}</h3>
                  {skill.descricao && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">{skill.descricao}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    {skill.areas_direito?.nome && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">{skill.areas_direito.nome}</span>
                    )}
                    <span className="text-xs text-zinc-600 group-hover:text-blue-400 transition-colors ml-auto flex items-center gap-0.5">
                      Ver <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Maiores especialistas em IA Jurídica ── */}
      {topContribuidores.length > 0 && (
        <section className="border-b border-zinc-800 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Maiores especialistas em IA Jurídica</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Prompts + skills + votos dos pares — ranking geral de contribuição</p>
                </div>
              </div>
              <Link href="/prompts" className="text-xs text-zinc-500 hover:text-yellow-400 transition-colors hidden sm:flex items-center gap-1">
                Ver ranking completo
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topContribuidores.map((c: TopContribuidor) => {
                const designacao =
                  c.total_destaques > 0
                    ? { label: 'Referência Editorial', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
                    : (c.total_prompts + c.total_skills) >= 5 && c.total_votos >= 20
                    ? { label: 'Especialista', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                    : { label: 'Contribuidor', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
                return (
                  <Link key={c.id} href={`/u/${c.id}`}
                    className="group flex flex-col gap-3 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:border-yellow-700/30 hover:bg-zinc-900/80 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-zinc-300">{c.full_name[0]?.toUpperCase()}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${designacao.color}`}>
                        {designacao.label}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors">{c.full_name}</p>
                      {c.instituicao && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{c.instituicao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/60 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {c.total_prompts + c.total_skills} contribuições
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {c.total_votos} votos
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-600 mb-3">Publique prompts e skills para construir sua reputação em IA jurídica</p>
              <Link href="/prompts" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium hover:border-yellow-500/30 hover:text-yellow-300 transition-all">
                Ver ranking completo de especialistas →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Áreas do direito (base de prompts) ── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Base de prompts</p>
              <h2 className="text-2xl font-bold text-white">Prompts por área do direito</h2>
              <p className="text-sm text-zinc-500 mt-1">Filtre os prompts pela sua área de atuação</p>
            </div>
            <Link href="/prompts" className="text-sm text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
              Ver todos os prompts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {areas.map((area: any) => (
              <Link key={area.id} href={`/prompts?area=${area.slug}`}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 hover:text-white hover:border-green-700/50 hover:bg-green-950/30 transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-green-500 transition-colors" />
                {area.nome}
              </Link>
            ))}
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
