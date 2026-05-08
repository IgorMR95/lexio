import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()

  const [{ count }, { data: destaquesSemana }, { data: areasData }] = await Promise.all([
    supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ativo', 'aprovado']),
    (supabase as any)
      .from('destaques_semana')
      .select('*, areas_direito(nome)')
      .limit(5),
    supabase
      .from('areas_direito')
      .select('id, nome, slug')
      .eq('ativo', true)
      .order('ordem')
      .limit(12),
  ])

  const areas = areasData ?? []

  const perfis = [
    {
      titulo: 'Advogados',
      desc: 'Petições, contratos, pareceres e estratégias jurídicas com prompts prontos para uso imediato.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
      cor: 'from-green-700/20 to-emerald-700/5',
      badge: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    {
      titulo: 'Magistrados',
      desc: 'Sentenças, despachos e acórdãos organizados por esfera e especialidade da vara.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      cor: 'from-teal-700/20 to-cyan-700/5',
      badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    },
    {
      titulo: 'Acadêmicos',
      desc: 'Fichamentos, resenhas, artigos científicos e pesquisas jurídicas com IA.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      cor: 'from-emerald-700/20 to-green-900/5',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      titulo: 'Defensores',
      desc: 'Habeas corpus, recursos e peças da defensoria pública com fundamentação sólida.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      cor: 'from-green-900/40 to-zinc-900/5',
      badge: 'text-green-300 bg-green-500/8 border-green-500/15',
    },
  ]

  const comoFunciona = [
    {
      num: '01',
      titulo: 'Encontre o prompt certo',
      desc: 'Filtre por área do direito, tipo de peça, perfil profissional ou use a busca para encontrar exatamente o que precisa.',
    },
    {
      num: '02',
      titulo: 'Copie e adapte',
      desc: 'Cada prompt é estruturado para ser colado diretamente em qualquer IA (ChatGPT, Gemini, Claude) e adaptado ao seu caso.',
    },
    {
      num: '03',
      titulo: 'Contribua com a comunidade',
      desc: 'Publique seus próprios prompts, receba votos da comunidade jurídica e ganhe destaque na plataforma.',
    },
  ]

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-25"
          style={{ backgroundImage: 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-green-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-emerald-600/8 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {count ?? 0} prompts disponíveis gratuitamente
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6">
              Prompts jurídicos para{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                profissionais sérios
              </span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed mb-10 max-w-2xl">
              A maior base colaborativa de prompts de IA para o direito brasileiro.
              Filtros por área, categoria e perfil profissional. Curado pela comunidade.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/prompts"
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-900/30"
              >
                Explorar prompts
              </Link>
              <Link
                href="/signup"
                className="px-6 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
              >
                Criar conta grátis
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center gap-10 flex-wrap">
            {[
              { value: count ?? 0, label: 'prompts publicados' },
              { value: areas.length, label: 'áreas do direito' },
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

      {/* ── Destaques da Semana ── */}
      {destaquesSemana && destaquesSemana.length > 0 && (
        <section className="border-b border-zinc-800 bg-zinc-900/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Destaques da Semana</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Prompts mais votados nos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/prompts" className="text-xs text-zinc-500 hover:text-green-400 transition-colors flex items-center gap-1">
                Ver todos
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {destaquesSemana.map((prompt: any, i: number) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className="group relative flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-yellow-500/30 hover:bg-zinc-900/80 hover:shadow-xl hover:shadow-black/30 transition-all duration-200"
                >
                  <div className={`absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border shadow-lg ${
                    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                    i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                    i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    {i + 1}
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-2 mb-2 pr-1 mt-1">
                    {prompt.titulo}
                  </h3>

                  {prompt.descricao_curta && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">
                      {prompt.descricao_curta}
                    </p>
                  )}

                  <div className="mt-auto">
                    {prompt.areas_direito?.nome && (
                      <span className="inline-block mb-3 px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        {prompt.areas_direito.nome}
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="font-medium text-green-400">{prompt.votos_semana ?? 0}</span>
                      </div>
                      <span className="text-xs text-zinc-600 group-hover:text-yellow-400 transition-colors flex items-center gap-0.5">
                        Ver
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Para cada perfil ── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">Plataforma especializada</p>
            <h2 className="text-3xl font-bold text-white">Para cada profissional do direito</h2>
            <p className="text-zinc-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
              Prompts organizados por perfil profissional para que você encontre exatamente o que precisa.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {perfis.map(p => (
              <div
                key={p.titulo}
                className={`relative group p-6 rounded-2xl border border-zinc-800 bg-gradient-to-br ${p.cor} hover:border-zinc-600 hover:shadow-xl hover:shadow-black/30 transition-all duration-200 overflow-hidden`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 60%)' }} />
                <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center border ${p.badge} mb-4`}>
                  <span className={p.badge.split(' ')[0]}>{p.icon}</span>
                </div>
                <h3 className="font-bold text-white mb-2 relative">{p.titulo}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed relative">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-3">Simples e direto</p>
            <h2 className="text-3xl font-bold text-white">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {comoFunciona.map((item, i) => (
              <div key={i} className="relative">
                {i < comoFunciona.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%-0px)] w-full h-px bg-gradient-to-r from-zinc-700 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-5">
                    <span className="text-sm font-bold text-green-400 font-mono">{item.num}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.titulo}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Áreas do direito ── */}
      <section className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">Cobertura completa</p>
              <h2 className="text-3xl font-bold text-white">Áreas do direito</h2>
            </div>
            <Link href="/prompts" className="text-sm text-zinc-500 hover:text-green-400 transition-colors hidden sm:flex items-center gap-1">
              Ver todos os prompts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {areas.map((area: any) => (
              <Link
                key={area.id}
                href={`/prompts?area=${area.slug}`}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm text-zinc-400 hover:text-white hover:border-green-700/50 hover:bg-green-950/30 transition-all"
              >
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
                Contribua e eleve o padrão jurídico
              </h2>
              <p className="text-zinc-400 mb-8 max-w-lg mx-auto leading-relaxed">
                Crie sua conta gratuitamente, publique seus prompts, vote nos melhores
                e ajude a construir a maior base jurídica de IA em português.
              </p>
              <div className="flex items-center gap-4 justify-center flex-wrap">
                <Link
                  href="/signup"
                  className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors shadow-xl shadow-green-900/30"
                >
                  Começar agora — é grátis
                </Link>
                <Link
                  href="/prompts"
                  className="px-8 py-3 rounded-xl border border-zinc-700 text-zinc-300 text-sm font-medium hover:border-zinc-500 hover:text-white transition-colors"
                >
                  Explorar prompts
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
