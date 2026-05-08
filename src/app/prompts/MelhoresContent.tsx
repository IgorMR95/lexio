'use client'

import Link from 'next/link'

interface Prompt {
  id: string
  titulo: string
  descricao_curta: string | null
  areas_direito?: { nome: string } | null
  subcategorias?: { nome: string } | null
}

interface DestaqueSemana extends Prompt {
  votos_semana: number
  score: number
}

interface TopAllTime extends Prompt {
  total_votos: number
}

interface Props {
  topSemana: DestaqueSemana[]
  topAllTime: TopAllTime[]
  destaques: Prompt[]
}

export function MelhoresContent({ topSemana, topAllTime, destaques }: Props) {
  const vazio = topSemana.length === 0 && topAllTime.length === 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Coluna principal */}
      <div className="lg:col-span-2 space-y-10">

        {/* Destaques da Semana */}
        {topSemana.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Destaque da Semana</h2>
                <p className="text-xs text-zinc-500">Mais votados nos últimos 7 dias</p>
              </div>
            </div>

            <div className="space-y-3">
              {topSemana.map((prompt, i) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:border-yellow-500/30 hover:bg-zinc-900 transition-all"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 border ${
                    i === 0 ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                    i === 1 ? 'bg-zinc-500/20 border-zinc-500/40 text-zinc-300' :
                    i === 2 ? 'bg-amber-700/20 border-amber-700/40 text-amber-500' :
                    'bg-zinc-800 border-zinc-700 text-zinc-500'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors line-clamp-1">
                      {prompt.titulo}
                    </h3>
                    {prompt.descricao_curta && (
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{prompt.descricao_curta}</p>
                    )}
                    {prompt.areas_direito?.nome && (
                      <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        {prompt.areas_direito.nome}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-sm font-bold text-green-400 tabular-nums">{prompt.votos_semana}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Hall da Fama */}
        {topAllTime.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Hall da Fama</h2>
                <p className="text-xs text-zinc-500">Mais votados de todos os tempos</p>
              </div>
            </div>

            <div className="space-y-2">
              {topAllTime.map((prompt, i) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.id}`}
                  className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-green-500/30 hover:bg-zinc-900 transition-all"
                >
                  <span className="text-xs text-zinc-600 w-5 text-right flex-shrink-0 tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white group-hover:text-green-300 transition-colors line-clamp-1">
                      {prompt.titulo}
                    </p>
                    {prompt.areas_direito?.nome && (
                      <p className="text-xs text-zinc-600 mt-0.5">{prompt.areas_direito.nome}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    <span className="text-xs font-semibold text-green-400 tabular-nums">{prompt.total_votos}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {vazio && (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <p className="text-zinc-400 font-medium mb-1">Nenhum voto registrado ainda</p>
            <p className="text-zinc-600 text-sm">Explore os prompts e vote nos seus favoritos.</p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h3 className="text-sm font-bold text-white">Selo Destaque</h3>
          </div>
          <p className="text-xs text-zinc-500 leading-relaxed mb-4">
            Prompts selecionados manualmente pelos administradores por qualidade excepcional.
          </p>
          {destaques.length > 0 ? (
            <div className="space-y-2">
              {destaques.map(p => (
                <Link
                  key={p.id}
                  href={`/prompts/${p.id}`}
                  className="group block p-3 rounded-lg border border-yellow-500/10 bg-yellow-500/5 hover:border-yellow-500/30 hover:bg-yellow-500/10 transition-all"
                >
                  <p className="text-xs font-medium text-white group-hover:text-yellow-300 transition-colors line-clamp-2">
                    {p.titulo}
                  </p>
                  {p.areas_direito?.nome && (
                    <p className="text-xs text-zinc-600 mt-1">{p.areas_direito.nome}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-600 italic">Nenhum prompt com selo destaque ainda.</p>
          )}
        </div>

        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30">
          <h3 className="text-sm font-bold text-white mb-3">Como funciona o ranking?</h3>
          <div className="space-y-3 text-xs text-zinc-500 leading-relaxed">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
              <p>Qualquer usuário logado pode votar em prompts que achou útil.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <p>O ranking da semana considera apenas votos dos últimos 7 dias, priorizando conteúdo recente.</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p>O Selo Destaque é atribuído manualmente por administradores a prompts de qualidade excepcional.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
