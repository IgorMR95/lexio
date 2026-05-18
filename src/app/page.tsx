import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()

  const [{ count: totalPrompts }, { count: totalFerramentas }, { data: destaquesSemana }, { data: areasData }] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).in('status', ['ativo', 'aprovado']),
    (supabase as any).from('ferramentas').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    (supabase as any).from('destaques_semana').select('*, areas_direito(nome)').limit(4),
    supabase.from('areas_direito').select('id, nome, slug').eq('ativo', true).order('ordem').limit(12),
  ])

  const areas = areasData ?? []

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
          <div className="mt-16 flex items-center gap-10 flex-wrap">
            {[
              { value: `+${totalPrompts ?? 500}`, label: 'prompts jurídicos' },
              { value: `${totalFerramentas ?? 50}`, label: 'IAs e ferramentas avaliadas' },
              { value: '100%', label: 'gratuito para usar' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-sm text-zinc-500">{s.label}</span>
                {i < 2 && <span className="text-zinc-700 ml-8">·</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── O que é o Midori ── */}
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

            {/* Base de Prompts */}
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
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-600 text-xs">+{Math.max(0, areas.length - 4)} áreas</span>
                </div>
                <p className="text-xs text-green-400 mt-5 group-hover:translate-x-1 transition-transform">Explorar prompts →</p>
              </div>
            </Link>

            {/* Ranking de IAs */}
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
                  <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] border border-violet-500/20 font-medium">{totalFerramentas ?? 50} ferramentas</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Avaliação independente de modelos de IA (ChatGPT, Claude, Gemini…) e ferramentas jurídicas
                  (Turivius, Netlex, Looplex…), votadas por advogados, magistrados e promotores.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Modelos de IA', 'Ferramentas', 'Reviews', 'Destaque editorial'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-violet-400 mt-5 group-hover:translate-x-1 transition-transform">Ver ranking →</p>
              </div>
            </Link>

            {/* Skills MD */}
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
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-medium">Automação avançada</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Arquivos de instrução estruturada (Markdown) para configurar agentes de IA com comportamento
                  especializado em tarefas jurídicas complexas — análise de contratos, due diligence, pesquisa.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Claude Projects', 'Agentes IA', 'Fluxos jurídicos', 'Reutilizável'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-500 text-xs">{tag}</span>
                  ))}
                </div>
                <p className="text-xs text-blue-400 mt-5 group-hover:translate-x-1 transition-transform">Ver skills →</p>
              </div>
            </Link>

            {/* Academy */}
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
                  Conteúdo educacional sobre IA aplicada ao direito — guias práticos, tutoriais e boas práticas
                  para juristas que querem usar IA com segurança e eficiência no dia a dia.
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

      {/* ── Destaques da Semana ── */}
      {destaquesSemana && destaquesSemana.length > 0 && (
        <section className="border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Prompts em destaque esta semana</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Os mais votados pela comunidade nos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/prompts" className="text-xs text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
                Ver todos
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destaquesSemana.map((prompt: any, i: number) => (
                <Link key={prompt.id} href={`/prompts/${prompt.id}`}
                  className="group relative flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-yellow-500/30 hover:bg-zinc-900/80 transition-all">
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow ${
                    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                    i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                    i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>{i + 1}</div>
                  <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-2 mb-2 mt-1">{prompt.titulo}</h3>
                  {prompt.descricao_curta && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">{prompt.descricao_curta}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    {prompt.areas_direito?.nome && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">{prompt.areas_direito.nome}</span>
                    )}
                    <span className="text-xs text-zinc-600 group-hover:text-yellow-400 transition-colors ml-auto flex items-center gap-0.5">
                      Ver <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Para quem é ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Plataforma especializada</p>
            <h2 className="text-3xl font-bold text-white mb-3">Feito para cada jurista</h2>
            <p className="text-zinc-500 max-w-lg mx-auto text-sm">
              Do estudante ao ministro — todos os perfis do direito brasileiro têm um lugar aqui.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { titulo: 'Advogado Privado',    cor: 'text-green-400',   bg: 'bg-green-500/8 border-green-500/15',   icon: '⚖️' },
              { titulo: 'Advogado Público',    cor: 'text-cyan-400',    bg: 'bg-cyan-500/8 border-cyan-500/15',     icon: '🏛️' },
              { titulo: 'Magistrado',          cor: 'text-teal-400',    bg: 'bg-teal-500/8 border-teal-500/15',     icon: '🔨' },
              { titulo: 'Defensor Público',    cor: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/15', icon: '🛡️' },
              { titulo: 'Promotor de Justiça', cor: 'text-lime-400',    bg: 'bg-lime-500/8 border-lime-500/15',     icon: '📢' },
              { titulo: 'Pesquisador / Mestre',cor: 'text-violet-400',  bg: 'bg-violet-500/8 border-violet-500/15', icon: '🎓' },
              { titulo: 'Concurseiro',         cor: 'text-amber-400',   bg: 'bg-amber-500/8 border-amber-500/15',   icon: '📋' },
              { titulo: 'Estudante de Direito',cor: 'text-blue-400',    bg: 'bg-blue-500/8 border-blue-500/15',     icon: '📚' },
            ].map(p => (
              <div key={p.titulo} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${p.bg} transition-colors`}>
                <span className="text-lg shrink-0">{p.icon}</span>
                <span className={`text-sm font-medium ${p.cor}`}>{p.titulo}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Áreas do direito ── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2">Cobertura completa</p>
              <h2 className="text-2xl font-bold text-white">Todas as áreas do direito</h2>
            </div>
            <Link href="/prompts" className="text-sm text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
              Ver base de prompts
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
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Comunidade jurídica
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Junte-se a quem está na vanguarda
              </h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed text-sm">
                Crie sua conta gratuitamente. Acesse todos os prompts, skills e o ranking de IAs.
                Contribua com a comunidade e ajude a construir o maior acervo jurídico de IA em português.
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
