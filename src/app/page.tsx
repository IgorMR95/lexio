import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const featureIcons = {
  advogados: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  magistrados: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  academicos: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  defensores: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
}

export default async function HomePage() {
  const supabase = createClient()

  const [{ count }, { data: destaquesSemana }] = await Promise.all([
    supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ativo', 'aprovado']),
    (supabase as any)
      .from('destaques_semana')
      .select('*, areas_direito(nome), subcategorias(nome)')
      .limit(5),
  ])

  const features = [
    { key: 'advogados', title: 'Para Advogados', desc: 'Petições, contratos, pareceres e estratégias jurídicas com prompts prontos.' },
    { key: 'magistrados', title: 'Para Magistrados', desc: 'Sentenças, despachos e acórdãos organizados por esfera e especialidade.' },
    { key: 'academicos', title: 'Para Acadêmicos', desc: 'Fichamentos, resenhas, artigos e pesquisas jurídicas com IA.' },
    { key: 'defensores', title: 'Para Defensores', desc: 'Habeas corpus, recursos e peças da defensoria pública.' },
  ]

  const areas = [
    'Direito Civil', 'Processo Civil', 'Direito Penal', 'Direito do Trabalho',
    'Direito Tributário', 'Direito Constitucional', 'Direito Administrativo', 'Direito Empresarial',
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-950/30 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-green-600/8 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {count ?? 0} prompts disponíveis
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Prompts jurídicos para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
              profissionais sérios
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A maior base de prompts de IA para advogados, magistrados, defensores, promotores
            e acadêmicos do direito. Filtros por área, categoria e perfil profissional.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/prompts"
              className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors text-sm shadow-lg shadow-green-900/30"
            >
              Explorar prompts
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:border-zinc-500 hover:text-white transition-colors text-sm"
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </section>

      {/* Destaques da Semana */}
      {destaquesSemana && destaquesSemana.length > 0 && (
        <section className="border-t border-zinc-800/50 bg-zinc-900/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Destaques da Semana</h2>
                  <p className="text-xs text-zinc-500">Os prompts mais votados nos últimos 7 dias</p>
                </div>
              </div>
              <Link href="/melhores" className="text-xs text-zinc-500 hover:text-green-400 transition-colors">
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {destaquesSemana.map((prompt: any, i: number) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className="group relative p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-yellow-500/30 hover:bg-zinc-900 transition-all"
                >
                  {/* Posição */}
                  <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                    i === 0 ? 'bg-yellow-500 border-yellow-400 text-zinc-950' :
                    i === 1 ? 'bg-zinc-400 border-zinc-300 text-zinc-950' :
                    i === 2 ? 'bg-amber-700 border-amber-600 text-white' :
                    'bg-zinc-800 border-zinc-700 text-zinc-400'
                  }`}>
                    {i + 1}
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-2 mb-2 pr-1">
                    {prompt.titulo}
                  </h3>

                  {prompt.descricao_curta && (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
                      {prompt.descricao_curta}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.areas_direito?.nome && (
                      <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        {prompt.areas_direito.nome}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                      <span className="font-medium text-green-400">{prompt.votos_semana}</span>
                      <span>votos</span>
                    </div>
                    <span className="text-xs text-zinc-600 group-hover:text-yellow-400 transition-colors">Ver →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Para cada profissional do direito
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-green-900/60 hover:bg-zinc-900 transition-all group">
              <div className="w-11 h-11 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mb-4 group-hover:bg-green-500/15 transition-colors">
                {featureIcons[f.key as keyof typeof featureIcons]}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Areas */}
      <section className="border-t border-zinc-800/50 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-xl font-bold text-white text-center mb-8">Áreas do direito</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {areas.map(area => (
              <Link
                key={area}
                href={`/prompts?area=${area.toLowerCase().replace(/ /g, '-').replace('ó', 'o').replace('ú', 'u')}`}
                className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-green-700/60 hover:bg-green-950/30 transition-colors"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto p-10 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-4">
              Contribua com a comunidade jurídica
            </h2>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              Crie uma conta gratuita e compartilhe seus prompts com outros profissionais do direito.
              Juntos construímos a melhor base jurídica de prompts em português.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors text-sm shadow-lg shadow-green-900/30"
            >
              Começar agora — é grátis
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
