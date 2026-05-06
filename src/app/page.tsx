import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = createClient()
  const { count } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .in('status', ['ativo', 'aprovado'])

  const features = [
    { icon: '⚖️', title: 'Para Advogados', desc: 'Petições, contratos, pareceres e estratégias jurídicas com prompts prontos.' },
    { icon: '🏛️', title: 'Para Magistrados', desc: 'Sentenças, despachos e acórdãos organizados por esfera e especialidade.' },
    { icon: '🎓', title: 'Para Acadêmicos', desc: 'Fichamentos, resenhas, artigos e pesquisas jurídicas com IA.' },
    { icon: '🛡️', title: 'Para Defensores', desc: 'Habeas corpus, recursos e peças da defensoria pública.' },
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {count ?? 0} prompts disponíveis
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Prompts jurídicos para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
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
              className="px-6 py-3 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-100 transition-colors text-sm"
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

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-2xl font-bold text-white text-center mb-12">
          Para cada profissional do direito
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(f => (
            <div key={f.title} className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
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
                className="px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-2xl mx-auto p-10 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
          <h2 className="text-2xl font-bold text-white mb-4">
            Contribua com a comunidade jurídica
          </h2>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            Crie uma conta gratuita e compartilhe seus prompts com outros profissionais do direito.
            Juntos construímos a melhor base jurídica de prompts em português.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-zinc-950 font-semibold hover:bg-zinc-100 transition-colors text-sm"
          >
            Começar agora — é grátis
          </Link>
        </div>
      </section>
    </div>
  )
}
