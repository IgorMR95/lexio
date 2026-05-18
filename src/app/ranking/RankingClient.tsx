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

interface Categoria {
  id: string
  nome: string
  slug: string
  descricao: string | null
  ordem: number
  tipo_categoria: 'perfil' | 'uso'
}

interface VotoContagem {
  ferramenta_id: string
  categoria_uso_id: string
  total_votos: number
}

interface Props {
  ferramentas: Ferramenta[]
  categorias: Categoria[]
  votosGeral: VotoContagem[]
  votosSemana: VotoContagem[]
  votosMes: VotoContagem[]
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
}

type Periodo = 'geral' | 'mes' | 'semana'
type EixoFiltro = 'perfil' | 'uso'

function buildVotosMap(votos: VotoContagem[]) {
  const m: Record<string, number> = {}
  for (const v of votos) m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
  return m
}

const PODIO_BG  = ['bg-yellow-500/10 border-yellow-500/30', 'bg-zinc-800/60 border-zinc-700', 'bg-amber-900/20 border-amber-700/30']
const PODIO_NUM = ['text-yellow-400', 'text-zinc-300', 'text-amber-500']
const PODIO_BAR = ['bg-yellow-400', 'bg-zinc-400', 'bg-amber-600']
const DEFAULT_BAR = 'bg-green-500'

const TIPO_LABEL: Record<string, string> = {
  llm: 'Modelo de linguagem',
  app: 'Aplicativo',
  extensao: 'Extensão',
  plataforma: 'Plataforma',
  outro: 'Outro',
}

export function RankingClient({
  ferramentas,
  categorias,
  votosGeral,
  votosSemana,
  votosMes,
  meusVotos: initialMeusVotos,
  userId,
}: Props) {
  const perfis = categorias.filter(c => c.tipo_categoria === 'perfil')
  const usos   = categorias.filter(c => c.tipo_categoria === 'uso')

  const [eixo, setEixo]                     = useState<EixoFiltro>('perfil')
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>(perfis[0]?.id ?? '')
  const [grupoAtivo, setGrupoAtivo]         = useState<'modelo' | 'ferramenta'>('modelo')
  const [periodo, setPeriodo]               = useState<Periodo>('geral')
  const [meusVotos, setMeusVotos]           = useState(initialMeusVotos)
  const [votosGeralState, setVotosGeralState] = useState(votosGeral)
  const [mostrarSugerir, setMostrarSugerir]   = useState(false)
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false)

  function handleEixo(novoEixo: EixoFiltro) {
    setEixo(novoEixo)
    setCategoriaAtiva(novoEixo === 'perfil' ? (perfis[0]?.id ?? '') : (usos[0]?.id ?? ''))
  }

  const votosAtivos = useMemo(() => {
    if (periodo === 'semana') return votosSemana
    if (periodo === 'mes')    return votosMes
    return votosGeralState
  }, [periodo, votosSemana, votosMes, votosGeralState])

  const votosMap = useMemo(() => buildVotosMap(votosAtivos), [votosAtivos])

  const rankingAtual = useMemo(() =>
    ferramentas
      .filter(f => f.grupo === grupoAtivo)
      .map(f => ({ ...f, votos_cat: votosMap[`${f.id}::${categoriaAtiva}`] ?? 0 }))
      .sort((a, b) => b.votos_cat - a.votos_cat),
  [ferramentas, grupoAtivo, categoriaAtiva, votosMap])

  const maxVotos   = rankingAtual[0]?.votos_cat ?? 0
  const totalVotos = votosGeralState.reduce((s, v) => s + v.total_votos, 0)

  const categoriaNomeAtiva = categorias.find(c => c.id === categoriaAtiva)?.nome ?? ''

  const handleVoto = async (ferramentaId: string) => {
    if (!userId || periodo !== 'geral') return
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
    const supabase = createClient()
    if (jaVotou) {
      await (supabase as any).from('ferramenta_votos').delete()
        .eq('ferramenta_id', ferramentaId).eq('categoria_uso_id', categoriaAtiva).eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)))
      setVotosGeralState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) } : v
      ))
    } else {
      await (supabase as any).from('ferramenta_votos').insert({ ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva }])
      setVotosGeralState(prev => {
        const ex = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva)
        if (ex) return prev.map(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === categoriaAtiva ? { ...v, total_votos: v.total_votos + 1 } : v)
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: categoriaAtiva, total_votos: 1 }]
      })
    }
  }

  if (mostrarSugerir) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => setMostrarSugerir(false)} className="text-sm text-zinc-500 hover:text-white transition-colors mb-6 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Voltar ao ranking
        </button>
        <ContatoSugestao />
      </div>
    )
  }

  const categoriasAtivas = eixo === 'perfil' ? perfis : usos

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Ranking de IAs no Direito</h1>
        <p className="text-sm text-zinc-500">
          Avaliadas por advogados, magistrados, promotores e defensores · <span className="text-zinc-400">{totalVotos} votos registrados</span>
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 space-y-6 sticky top-6">

          {/* Modelos vs Ferramentas */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Tipo</p>
            <div className="space-y-1">
              {([
                { v: 'modelo',     l: 'Modelos de IA',  sub: 'ChatGPT, Claude, Gemini…' },
                { v: 'ferramenta', l: 'Ferramentas',     sub: 'Apps e plataformas' },
              ] as { v: 'modelo' | 'ferramenta'; l: string; sub: string }[]).map(g => (
                <button
                  key={g.v}
                  onClick={() => setGrupoAtivo(g.v)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    grupoAtivo === g.v
                      ? g.v === 'modelo'
                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-transparent'
                  }`}
                >
                  <span className="font-medium block">{g.l}</span>
                  <span className="text-[11px] opacity-60 font-normal">{g.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Eixo de filtro */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Ver por</p>
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
              {(['perfil', 'uso'] as EixoFiltro[]).map((e, idx) => (
                <button
                  key={e}
                  onClick={() => handleEixo(e)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    idx === 0 ? '' : 'border-l border-zinc-800'
                  } ${
                    eixo === e ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {e === 'perfil' ? 'Perfil' : 'Uso'}
                </button>
              ))}
            </div>
          </div>

          {/* Categorias do eixo ativo */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
              {eixo === 'perfil' ? 'Perfil profissional' : 'Tipo de uso'}
            </p>
            <div className="space-y-0.5">
              {categoriasAtivas.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoriaAtiva === cat.id
                      ? 'bg-green-500/10 text-green-300 border border-green-500/20'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  {cat.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Período */}
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">Período</p>
            <div className="space-y-0.5">
              {([
                { v: 'geral',  l: 'Geral (todos os tempos)' },
                { v: 'mes',    l: 'Últimos 30 dias' },
                { v: 'semana', l: 'Últimos 7 dias' },
              ] as { v: Periodo; l: string }[]).map(p => (
                <button
                  key={p.v}
                  onClick={() => setPeriodo(p.v)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    periodo === p.v
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 border border-transparent'
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          {/* Bloco informativo: modelos vs ferramentas */}
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <button
              onClick={() => setMostrarExplicacao(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-900/50 transition-colors"
            >
              <span className="text-xs text-zinc-400 font-medium leading-snug">Entenda a diferença</span>
              <svg className={`w-3.5 h-3.5 text-zinc-600 transition-transform shrink-0 ml-2 ${mostrarExplicacao ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {mostrarExplicacao && (
              <div className="px-3 pb-3 pt-1 border-t border-zinc-800/60 space-y-2.5">
                <div>
                  <p className="text-xs font-semibold text-violet-300 mb-0.5">Modelos de IA</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    O &ldquo;cérebro&rdquo; — você conversa diretamente via chat. Ex: ChatGPT, Claude, Gemini. Versões gratuitas disponíveis.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-blue-300 mb-0.5">Ferramentas</p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Apps construídos sobre um modelo com funções específicas. Ex: Clio, Harvey. Geralmente pagos.
                  </p>
                </div>
                <p className="text-[11px] text-zinc-600 italic">
                  O modelo é o motor. A ferramenta é o carro completo.
                </p>
              </div>
            )}
          </div>

          {/* Sugerir ferramenta */}
          <button
            onClick={() => setMostrarSugerir(true)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 transition-colors text-left"
          >
            + Sugerir ferramenta
          </button>
        </aside>

        {/* ── Conteúdo principal ── */}
        <div className="flex-1 min-w-0">

          {/* Cabeçalho do ranking atual */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {grupoAtivo === 'modelo' ? 'Modelos de IA' : 'Ferramentas'}
                <span className="text-zinc-500 font-normal"> · {categoriaNomeAtiva}</span>
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                {periodo === 'geral' ? 'Ranking geral — todos os votos' : periodo === 'mes' ? 'Últimos 30 dias' : 'Últimos 7 dias'}
                {periodo !== 'geral' && <span className="text-zinc-700"> · votação disponível apenas no ranking geral</span>}
              </p>
            </div>
            <span className="text-xs text-zinc-600 tabular-nums">{rankingAtual.length} itens</span>
          </div>

          {/* Banner login */}
          {!userId && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">Faça login para votar nos favoritos da sua área</p>
              <Link href="/login" className="text-sm text-green-400 hover:underline shrink-0 font-medium">Entrar</Link>
            </div>
          )}

          {/* Lista */}
          {rankingAtual.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
              <p className="text-zinc-500 text-sm">Nenhum{grupoAtivo === 'modelo' ? ' modelo' : 'a ferramenta'} cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankingAtual.map((f, i) => {
                const jaVotou = meusVotos.some(v => v.ferramenta_id === f.id && v.categoria_uso_id === categoriaAtiva)
                const pct     = maxVotos > 0 ? (f.votos_cat / maxVotos) * 100 : 0
                const temVotos = f.votos_cat > 0
                const isPodio  = i < 3 && temVotos
                const barColor = isPodio ? PODIO_BAR[i] : DEFAULT_BAR

                return (
                  <div
                    key={f.id}
                    className={`rounded-2xl border transition-all ${isPodio ? PODIO_BG[i] : 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-start gap-4 px-5 py-4">

                      {/* Posição */}
                      <div className="w-7 text-center pt-1 shrink-0">
                        <span className={`text-lg font-black leading-none ${isPodio ? PODIO_NUM[i] : 'text-zinc-700'}`}>
                          {temVotos ? i + 1 : '—'}
                        </span>
                      </div>

                      {/* Avatar letra */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base border ${
                        grupoAtivo === 'modelo'
                          ? 'bg-violet-500/15 border-violet-500/20 text-violet-300'
                          : 'bg-blue-500/15 border-blue-500/20 text-blue-300'
                      }`}>
                        {f.nome[0]?.toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-white">{f.nome}</span>
                          {f.destaque && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">
                              Destaque
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/50 shrink-0">
                            {TIPO_LABEL[f.tipo] ?? f.tipo}
                          </span>
                        </div>

                        {f.descricao && (
                          <p className="text-xs text-zinc-500 mb-2 leading-relaxed line-clamp-2">{f.descricao}</p>
                        )}

                        {/* Barra de votos */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                              style={{ width: temVotos ? `${Math.max(pct, 3)}%` : '0%' }}
                            />
                          </div>
                          <span className="text-xs text-zinc-500 tabular-nums shrink-0 w-20 text-right">
                            {temVotos ? `${f.votos_cat} ${f.votos_cat === 1 ? 'voto' : 'votos'}` : 'sem votos'}
                          </span>
                        </div>

                        {f.url && (
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-[11px] text-zinc-700 hover:text-zinc-400 transition-colors"
                          >
                            {f.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                          </a>
                        )}
                      </div>

                      {/* Botão voto */}
                      <button
                        onClick={() => handleVoto(f.id)}
                        disabled={!userId || periodo !== 'geral'}
                        title={!userId ? 'Entre para votar' : periodo !== 'geral' ? 'Disponível apenas no ranking geral' : jaVotou ? 'Remover voto' : 'Votar'}
                        className={`shrink-0 flex flex-col items-center justify-center gap-0.5 w-12 h-12 rounded-xl border transition-all mt-0.5 ${
                          jaVotou && periodo === 'geral'
                            ? 'border-green-500/50 bg-green-500/15 text-green-400'
                            : userId && periodo === 'geral'
                              ? 'border-zinc-700 text-zinc-500 hover:border-zinc-400 hover:text-white'
                              : 'border-zinc-800 text-zinc-700 cursor-not-allowed'
                        }`}
                      >
                        <svg className="w-4 h-4" fill={jaVotou && periodo === 'geral' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        {temVotos && (
                          <span className="text-[10px] font-semibold tabular-nums leading-none">{f.votos_cat}</span>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
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
        </p>
      </div>
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <p className="text-sm font-medium text-white">Você representa uma empresa com uma ferramenta de IA para o mundo jurídico?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Entre em contato pelo e-mail abaixo. Nossa equipe avalia a ferramenta e, se aprovada, ela é adicionada com uma descrição imparcial para que os usuários possam votar.
        </p>
        <a href="mailto:contato@midori.law" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          contato@midori.law
        </a>
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed">
        Plataforma independente. Inclusão não é paga. Posição determinada exclusivamente pelos votos da comunidade.
      </p>
    </div>
  )
}
