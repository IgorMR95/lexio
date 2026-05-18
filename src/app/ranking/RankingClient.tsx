'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Ferramenta {
  id: string
  nome: string
  descricao: string | null
  url: string | null
  tipo: 'llm' | 'app' | 'extensao' | 'plataforma' | 'outro'
  grupo: 'modelo' | 'ferramenta'
  destaque: boolean
}

interface Perfil {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ordem: number
}

interface VotoContagem {
  ferramenta_id: string
  categoria_uso_id: string
  total_votos: number
}

interface Props {
  ferramentas: Ferramenta[]
  perfis: Perfil[]
  votos: VotoContagem[]
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
}

const TIPO_LABELS: Record<string, string> = {
  llm:        'Modelo de IA',
  app:        'Aplicativo',
  extensao:   'Extensão',
  plataforma: 'Plataforma',
  outro:      'Outro',
}

const TIPO_COLOR: Record<string, string> = {
  llm:        'bg-violet-500/10 text-violet-400 border-violet-500/20',
  app:        'bg-blue-500/10 text-blue-400 border-blue-500/20',
  extensao:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  plataforma: 'bg-green-500/10 text-green-400 border-green-500/20',
  outro:      'bg-zinc-800 text-zinc-400 border-zinc-700',
}

export function RankingClient({ ferramentas, perfis, votos, meusVotos: initialMeusVotos, userId }: Props) {
  const [perfilAtivo, setPerfilAtivo] = useState<string>(perfis[0]?.id ?? '')
  const [grupoAtivo, setGrupoAtivo] = useState<'modelo' | 'ferramenta'>('modelo')
  const [meusVotos, setMeusVotos] = useState(initialMeusVotos)
  const [votosState, setVotosState] = useState(votos)
  const [mostrarSugerir, setMostrarSugerir] = useState(false)

  const votosMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of votosState) {
      m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
    }
    return m
  }, [votosState])

  const totalVotosFerramenta = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of votosState) {
      m[v.ferramenta_id] = (m[v.ferramenta_id] ?? 0) + v.total_votos
    }
    return m
  }, [votosState])

  // Ferramentas do grupo ativo ordenadas por votos no perfil ativo
  const rankingAtual = useMemo(() => {
    return ferramentas
      .filter(f => f.grupo === grupoAtivo)
      .map(f => ({
        ...f,
        votos_perfil: votosMap[`${f.id}::${perfilAtivo}`] ?? 0,
      }))
      .sort((a, b) => b.votos_perfil - a.votos_perfil)
  }, [ferramentas, grupoAtivo, perfilAtivo, votosMap])

  const handleVoto = async (ferramentaId: string) => {
    if (!userId) return
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === perfilAtivo)
    const supabase = createClient()

    if (jaVotou) {
      await (supabase as any)
        .from('ferramenta_votos')
        .delete()
        .eq('ferramenta_id', ferramentaId)
        .eq('categoria_uso_id', perfilAtivo)
        .eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === perfilAtivo)))
      setVotosState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === perfilAtivo
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) }
          : v
      ))
    } else {
      await (supabase as any)
        .from('ferramenta_votos')
        .insert({ ferramenta_id: ferramentaId, categoria_uso_id: perfilAtivo, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: perfilAtivo }])
      setVotosState(prev => {
        const existing = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === perfilAtivo)
        if (existing) {
          return prev.map(v =>
            v.ferramenta_id === ferramentaId && v.categoria_uso_id === perfilAtivo
              ? { ...v, total_votos: v.total_votos + 1 } : v
          )
        }
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: perfilAtivo, total_votos: 1 }]
      })
    }
  }

  const totalVotos = votosState.reduce((s, v) => s + v.total_votos, 0)
  const perfilInfo = perfis.find(p => p.id === perfilAtivo)

  if (mostrarSugerir) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => setMostrarSugerir(false)}
          className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar ao ranking
        </button>
        <ContatoSugestao />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ranking de IAs no Direito</h1>
          <p className="text-sm text-zinc-500 mt-1">
            As melhores ferramentas de IA avaliadas por advogados, magistrados, promotores e defensores brasileiros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600">
            {ferramentas.length} ferramentas · {totalVotos} votos
          </span>
          <button
            onClick={() => setMostrarSugerir(true)}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            Sugerir ferramenta
          </button>
        </div>
      </div>

      <div className="flex gap-8 flex-col lg:flex-row">
        {/* Sidebar — perfis profissionais */}
        <aside className="lg:w-52 shrink-0">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Perfil profissional</p>
          <div className="space-y-1">
            {perfis.map(p => {
              const totalNoPerfil = votosState
                .filter(v => v.categoria_uso_id === p.id)
                .reduce((s, v) => s + v.total_votos, 0)
              return (
                <button
                  key={p.id}
                  onClick={() => setPerfilAtivo(p.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
                    perfilAtivo === p.id
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'
                  }`}
                >
                  <span>{p.nome}</span>
                  {totalNoPerfil > 0 && (
                    <span className="text-xs text-zinc-600 tabular-nums">{totalNoPerfil}</span>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Subtítulo do perfil */}
          {perfilInfo && (
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">{perfilInfo.nome}</h2>
              {perfilInfo.descricao && (
                <p className="text-sm text-zinc-500 mt-0.5">{perfilInfo.descricao}</p>
              )}
            </div>
          )}

          {/* Toggle Modelos / Ferramentas */}
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg mb-6 w-fit">
            <button
              onClick={() => setGrupoAtivo('modelo')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                grupoAtivo === 'modelo' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Melhores Modelos de IA
            </button>
            <button
              onClick={() => setGrupoAtivo('ferramenta')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                grupoAtivo === 'ferramenta' ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Melhores Ferramentas
            </button>
          </div>

          {!userId && (
            <div className="mb-4 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
              <p className="text-xs text-zinc-500">
                Vote nas melhores {grupoAtivo === 'modelo' ? 'IAs' : 'ferramentas'} para o seu perfil profissional
              </p>
              <Link href="/login" className="text-xs text-green-400 hover:underline flex-shrink-0">
                Entrar para votar
              </Link>
            </div>
          )}

          {/* Lista rankeada */}
          <div className="space-y-3">
            {rankingAtual.map((f, i) => {
              const jaVotou = meusVotos.some(v => v.ferramenta_id === f.id && v.categoria_uso_id === perfilAtivo)
              const maxVotos = rankingAtual[0]?.votos_perfil ?? 0
              const pct = maxVotos > 0 ? (f.votos_perfil / maxVotos) * 100 : 0
              const temVotos = f.votos_perfil > 0

              return (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border transition-all ${
                    i === 0 && temVotos
                      ? 'border-yellow-500/20 bg-yellow-500/5'
                      : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Posição */}
                    <div className="w-8 text-center flex-shrink-0 pt-1">
                      {temVotos ? (
                        <span className={`text-lg font-black ${
                          i === 0 ? 'text-yellow-400' :
                          i === 1 ? 'text-zinc-300' :
                          i === 2 ? 'text-amber-600' :
                          'text-zinc-700'
                        }`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="text-zinc-800 text-lg font-black">—</span>
                      )}
                    </div>

                    {/* Ícone */}
                    <FerramIcon nome={f.nome} tipo={f.tipo} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold text-white">{f.nome}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${TIPO_COLOR[f.tipo]}`}>
                          {TIPO_LABELS[f.tipo]}
                        </span>
                        {f.destaque && (
                          <span className="text-xs text-zinc-500 font-medium">Destaque</span>
                        )}
                      </div>

                      {f.descricao && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-2">{f.descricao}</p>
                      )}

                      {/* Barra de votos */}
                      {temVotos && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500/70 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-zinc-600 flex-shrink-0 tabular-nums w-20 text-right">
                            {f.votos_perfil} {f.votos_perfil === 1 ? 'voto' : 'votos'}
                          </span>
                        </div>
                      )}

                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {f.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                        </a>
                      )}
                    </div>

                    {/* Botão de voto */}
                    <button
                      onClick={() => handleVoto(f.id)}
                      disabled={!userId}
                      title={!userId ? 'Entre para votar' : jaVotou ? 'Remover voto' : 'Votar'}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border transition-all min-w-[48px] ${
                        jaVotou
                          ? 'border-green-500/40 bg-green-500/10 text-green-400'
                          : userId
                            ? 'border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-white'
                            : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill={jaVotou ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      <span className="text-xs font-semibold tabular-nums">{f.votos_perfil}</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {rankingAtual.length === 0 && (
              <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-500 text-sm">
                  Nenhum{grupoAtivo === 'modelo' ? ' modelo de IA' : 'a ferramenta'} cadastrado ainda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FerramIcon({ nome, tipo }: { nome: string; tipo: string }) {
  const bgMap: Record<string, string> = {
    llm:        'bg-violet-500/15 border-violet-500/20 text-violet-300',
    app:        'bg-blue-500/15 border-blue-500/20 text-blue-300',
    extensao:   'bg-amber-500/15 border-amber-500/20 text-amber-300',
    plataforma: 'bg-green-500/15 border-green-500/20 text-green-300',
    outro:      'bg-zinc-800 border-zinc-700 text-zinc-400',
  }
  return (
    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 font-bold text-sm ${bgMap[tipo] ?? bgMap.outro}`}>
      {nome[0]?.toUpperCase()}
    </div>
  )
}

function ContatoSugestao() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Sugerir ferramenta</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          O ranking é curado pela equipe Midori para garantir qualidade e relevância para o mercado jurídico brasileiro.
          Apenas ferramentas avaliadas pela equipe são incluídas.
        </p>
      </div>

      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <p className="text-sm font-medium text-white">Você representa uma empresa com uma ferramenta de IA para o mundo jurídico?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Entre em contato pelo e-mail abaixo para solicitar a inclusão no ranking. Nossa equipe avalia a ferramenta e, se aprovada, ela é adicionada com uma descrição imparcial para que os usuários possam votar.
        </p>
        <a
          href="mailto:contato@midori.law"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          contato@midori.law
        </a>
      </div>

      <div className="p-4 rounded-xl border border-zinc-800/50 bg-zinc-900/20">
        <p className="text-xs text-zinc-600 leading-relaxed">
          Somos uma plataforma independente. A inclusão no ranking não é paga e não representa endosso comercial. A posição de cada ferramenta é determinada exclusivamente pelos votos da comunidade de profissionais do direito.
        </p>
      </div>
    </div>
  )
}
