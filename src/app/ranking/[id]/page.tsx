import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TIPO_LABEL: Record<string, string> = {
  llm: 'Modelo de linguagem', app: 'Aplicativo', extensao: 'Extensão',
  plataforma: 'Plataforma', outro: 'Outro',
}

export default async function FerramentaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { id } = params

  const [
    { data: ferramenta },
    { data: review },
    { data: votosGeral },
  ] = await Promise.all([
    (supabase as any).from('ferramentas').select('*').eq('id', id).eq('status', 'ativo').single(),
    (supabase as any).from('ferramenta_reviews').select('*').eq('ferramenta_id', id).single(),
    (supabase as any).from('ferramenta_votos_contagem').select('total_votos').eq('ferramenta_id', id),
  ])

  if (!ferramenta) notFound()

  const totalVotos = (votosGeral ?? []).reduce((s: number, v: any) => s + (v.total_votos ?? 0), 0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/ranking" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
          ← Ranking de IAs Jurídicas
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xl border ${
          ferramenta.grupo === 'modelo'
            ? 'bg-violet-500/15 border-violet-500/20 text-violet-300'
            : 'bg-blue-500/15 border-blue-500/20 text-blue-300'
        }`}>
          {ferramenta.nome[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-white">{ferramenta.nome}</h1>
            {ferramenta.destaque && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs border border-yellow-500/20 font-medium">
                ★ Destaque
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-zinc-500">
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/50">
              {TIPO_LABEL[ferramenta.tipo] ?? ferramenta.tipo}
            </span>
            <span>{totalVotos} {totalVotos === 1 ? 'voto' : 'votos'} no ranking</span>
            {ferramenta.url && (
              <a href={ferramenta.url} target="_blank" rel="noopener noreferrer"
                className="text-zinc-500 hover:text-white transition-colors">
                {ferramenta.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            )}
          </div>
          {ferramenta.descricao && (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{ferramenta.descricao}</p>
          )}
        </div>
      </div>

      {/* Review */}
      {review ? (
        <div className="space-y-5">
          {/* Selo recomendado */}
          {review.recomendado && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-green-500/25 bg-green-500/5">
              <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-green-300">Recomendado pela equipe Midori</p>
                <p className="text-xs text-zinc-500 mt-0.5">Esta ferramenta passou pela nossa curadoria editorial e é recomendada para uso profissional.</p>
              </div>
            </div>
          )}

          {/* Nota geral */}
          {review.nota_geral && (
            <div className="flex items-center gap-3 px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <div className="shrink-0">
                <p className="text-3xl font-black text-white tabular-nums">{review.nota_geral}<span className="text-zinc-600 text-lg font-normal">/5</span></p>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Nota da curadoria</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <svg key={n} className={`w-4 h-4 ${n <= review.nota_geral ? 'text-yellow-400' : 'text-zinc-700'}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Resumo */}
          {review.resumo && (
            <div className="px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Visão geral</p>
              <p className="text-sm text-zinc-300 leading-relaxed">{review.resumo}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Pontos positivos */}
            {review.pontos_positivos?.length > 0 && (
              <div className="px-5 py-4 rounded-xl border border-green-500/15 bg-green-500/5">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">Pontos positivos</p>
                <ul className="space-y-2">
                  {(review.pontos_positivos as string[]).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pontos negativos */}
            {review.pontos_negativos?.length > 0 && (
              <div className="px-5 py-4 rounded-xl border border-red-500/15 bg-red-500/5">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Pontos negativos</p>
                <ul className="space-y-2">
                  {(review.pontos_negativos as string[]).map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl">
          <svg className="w-8 h-8 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-zinc-500 text-sm">Review em elaboração.</p>
          <p className="text-zinc-600 text-xs mt-1">Nossa equipe está avaliando esta ferramenta.</p>
        </div>
      )}

      {/* Voltar ao ranking */}
      <div className="mt-10 pt-6 border-t border-zinc-800">
        <Link href="/ranking" className="text-sm text-zinc-500 hover:text-white transition-colors">
          ← Ver ranking completo
        </Link>
      </div>
    </div>
  )
}
