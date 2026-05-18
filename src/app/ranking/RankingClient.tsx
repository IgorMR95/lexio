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
  perfil_ids: string[]
  uso_ids: string[]
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

interface VotoDiario {
  ferramenta_id: string
  categoria_uso_id: string
  dia: string
  total_votos: number
}

interface Props {
  ferramentas: Ferramenta[]
  categorias: Categoria[]
  votosGeral: VotoContagem[]
  votosSemana: VotoContagem[]
  votosMes: VotoContagem[]
  votosDiario: VotoDiario[]
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
}

type Periodo = 'geral' | 'mes' | 'semana'
type Aba = 'ranking' | 'graficos'

function buildVotosMap(votos: VotoContagem[]) {
  const m: Record<string, number> = {}
  for (const v of votos) m[`${v.ferramenta_id}::${v.categoria_uso_id}`] = v.total_votos
  return m
}

// Votos totais de uma ferramenta somando todas as categorias ativas
function votosTotal(ferramentaId: string, catIds: string[], votosMap: Record<string, number>) {
  return catIds.reduce((s, cid) => s + (votosMap[`${ferramentaId}::${cid}`] ?? 0), 0)
}

const PODIO_BG  = ['bg-yellow-500/10 border-yellow-500/30', 'bg-zinc-800/60 border-zinc-700', 'bg-amber-900/20 border-amber-700/30']
const PODIO_NUM = ['text-yellow-400', 'text-zinc-300', 'text-amber-500']
const PODIO_BAR = ['bg-yellow-400', 'bg-zinc-400', 'bg-amber-600']
const DEFAULT_BAR = 'bg-green-500'

const TIPO_LABEL: Record<string, string> = {
  llm: 'Modelo de linguagem', app: 'Aplicativo', extensao: 'Extensão', plataforma: 'Plataforma', outro: 'Outro',
}

const LINHA_CORES = [
  { stroke: '#a78bfa', bg: 'bg-violet-400' },
  { stroke: '#34d399', bg: 'bg-emerald-400' },
  { stroke: '#60a5fa', bg: 'bg-blue-400' },
  { stroke: '#f59e0b', bg: 'bg-amber-400' },
  { stroke: '#f472b6', bg: 'bg-pink-400' },
]

export function RankingClient({
  ferramentas,
  categorias,
  votosGeral,
  votosSemana,
  votosMes,
  votosDiario,
  meusVotos: initialMeusVotos,
  userId,
}: Props) {
  const perfis = categorias.filter(c => c.tipo_categoria === 'perfil')
  const usos   = categorias.filter(c => c.tipo_categoria === 'uso')

  const [aba, setAba]                         = useState<Aba>('ranking')
  const [grupoAtivo, setGrupoAtivo]           = useState<'modelo' | 'ferramenta'>('modelo')
  const [periodo, setPeriodo]                 = useState<Periodo>('geral')
  const [perfisAtivos, setPerfisAtivos]       = useState<string[]>([])
  const [usosAtivos, setUsosAtivos]           = useState<string[]>([])
  const [apenasDestaque, setApenasDestaque]   = useState(false)
  const [meusVotos, setMeusVotos]             = useState(initialMeusVotos)
  const [votosGeralState, setVotosGeralState] = useState(votosGeral)
  const [mostrarSugerir, setMostrarSugerir]   = useState(false)
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false)

  function togglePerfil(id: string) {
    setPerfisAtivos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function toggleUso(id: string) {
    setUsosAtivos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function limparFiltros() {
    setPerfisAtivos([])
    setUsosAtivos([])
    setApenasDestaque(false)
  }

  const votosAtivos = useMemo(() => {
    if (periodo === 'semana') return votosSemana
    if (periodo === 'mes')    return votosMes
    return votosGeralState
  }, [periodo, votosSemana, votosMes, votosGeralState])

  const votosMap = useMemo(() => buildVotosMap(votosAtivos), [votosAtivos])

  // Categorias relevantes para o cálculo de votos: as selecionadas, ou todas se nenhuma
  const catIdsParaVotos = useMemo(() => {
    const selecionadas = [...perfisAtivos, ...usosAtivos]
    return selecionadas.length > 0 ? selecionadas : categorias.map(c => c.id)
  }, [perfisAtivos, usosAtivos, categorias])

  const rankingAtual = useMemo(() => {
    return ferramentas
      .filter(f => {
        if (f.grupo !== grupoAtivo) return false
        if (apenasDestaque && !f.destaque) return false
        if (perfisAtivos.length > 0 && !perfisAtivos.some(pid => f.perfil_ids?.includes(pid))) return false
        if (usosAtivos.length > 0   && !usosAtivos.some(uid => f.uso_ids?.includes(uid)))   return false
        return true
      })
      .map(f => ({
        ...f,
        votos_total: votosTotal(f.id, catIdsParaVotos, votosMap),
      }))
      .sort((a, b) => b.votos_total - a.votos_total)
  }, [ferramentas, grupoAtivo, perfisAtivos, usosAtivos, catIdsParaVotos, votosMap])

  const maxVotos   = rankingAtual[0]?.votos_total ?? 0
  const totalVotos = votosGeralState.reduce((s, v) => s + v.total_votos, 0)
  const temFiltros = perfisAtivos.length > 0 || usosAtivos.length > 0 || apenasDestaque

  const handleVoto = async (ferramentaId: string) => {
    if (!userId || periodo !== 'geral') return
    // Vota na primeira categoria ativa (ou na primeira de todas se nenhuma selecionada)
    const catId = catIdsParaVotos[0]
    if (!catId) return
    const jaVotou = meusVotos.some(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === catId)
    const supabase = createClient()
    if (jaVotou) {
      await (supabase as any).from('ferramenta_votos').delete()
        .eq('ferramenta_id', ferramentaId).eq('categoria_uso_id', catId).eq('user_id', userId)
      setMeusVotos(prev => prev.filter(v => !(v.ferramenta_id === ferramentaId && v.categoria_uso_id === catId)))
      setVotosGeralState(prev => prev.map(v =>
        v.ferramenta_id === ferramentaId && v.categoria_uso_id === catId
          ? { ...v, total_votos: Math.max(0, v.total_votos - 1) } : v
      ))
    } else {
      await (supabase as any).from('ferramenta_votos').insert({ ferramenta_id: ferramentaId, categoria_uso_id: catId, user_id: userId })
      setMeusVotos(prev => [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: catId }])
      setVotosGeralState(prev => {
        const ex = prev.find(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === catId)
        if (ex) return prev.map(v => v.ferramenta_id === ferramentaId && v.categoria_uso_id === catId ? { ...v, total_votos: v.total_votos + 1 } : v)
        return [...prev, { ferramenta_id: ferramentaId, categoria_uso_id: catId, total_votos: 1 }]
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Ranking de IAs Jurídicas</h1>
        <p className="text-sm text-zinc-500">
          Avaliadas por advogados, magistrados, promotores e defensores · <span className="text-zinc-400">{totalVotos} votos registrados</span>
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg w-fit mb-8">
        {(['ranking', 'graficos'] as Aba[]).map(a => (
          <button key={a} onClick={() => setAba(a)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              aba === a ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}>
            {a === 'ranking' ? 'Ranking' : 'Gráficos'}
          </button>
        ))}
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-56 shrink-0 sticky top-6">
          <div className="space-y-5">

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Filtros</span>
              {temFiltros && (
                <button onClick={limparFiltros} className="text-xs text-zinc-500 hover:text-white transition-colors">Limpar</button>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Tipo</label>
              <select
                value={grupoAtivo}
                onChange={e => setGrupoAtivo(e.target.value as 'modelo' | 'ferramenta')}
                className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
              >
                <option value="modelo">Modelos de IA</option>
                <option value="ferramenta">Ferramentas</option>
              </select>
            </div>

            {/* Perfil profissional — multi-select */}
            {perfis.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-zinc-500">Perfil profissional</label>
                  {perfisAtivos.length > 0 && (
                    <button onClick={() => setPerfisAtivos([])} className="text-xs text-zinc-500 hover:text-white transition-colors">Limpar</button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {perfis.map(cat => (
                    <button key={cat.id} onClick={() => togglePerfil(cat.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                        perfisAtivos.includes(cat.id)
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                      }`}>
                      <span className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center transition-colors ${
                        perfisAtivos.includes(cat.id) ? 'bg-green-500 border-green-500' : 'border-zinc-600'
                      }`}>
                        {perfisAtivos.includes(cat.id) && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {cat.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tipo de uso — multi-select */}
            {usos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-zinc-500">Tipo de uso</label>
                  {usosAtivos.length > 0 && (
                    <button onClick={() => setUsosAtivos([])} className="text-xs text-zinc-500 hover:text-white transition-colors">Limpar</button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {usos.map(cat => (
                    <button key={cat.id} onClick={() => toggleUso(cat.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                        usosAtivos.includes(cat.id)
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                      }`}>
                      <span className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center transition-colors ${
                        usosAtivos.includes(cat.id) ? 'bg-green-500 border-green-500' : 'border-zinc-600'
                      }`}>
                        {usosAtivos.includes(cat.id) && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {cat.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Destaque */}
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Curadoria</label>
              <button
                onClick={() => setApenasDestaque(p => !p)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
                  apenasDestaque ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}>
                <span className={`w-3 h-3 rounded border shrink-0 flex items-center justify-center transition-colors ${
                  apenasDestaque ? 'bg-yellow-400 border-yellow-400' : 'border-zinc-600'
                }`}>
                  {apenasDestaque && (
                    <svg className="w-2 h-2 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                Apenas destaques ★
              </button>
            </div>

            {/* Período — só na aba ranking */}
            {aba === 'ranking' && (
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Período</label>
                <select
                  value={periodo}
                  onChange={e => setPeriodo(e.target.value as Periodo)}
                  className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                >
                  <option value="geral">Geral (todos os tempos)</option>
                  <option value="mes">Últimos 30 dias</option>
                  <option value="semana">Últimos 7 dias</option>
                </select>
              </div>
            )}

            {/* Entenda a diferença */}
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <button onClick={() => setMostrarExplicacao(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-zinc-900/60 transition-colors">
                <span className="text-xs text-zinc-400 font-medium">Entenda a diferença</span>
                <svg className={`w-3.5 h-3.5 text-zinc-600 transition-transform shrink-0 ml-2 ${mostrarExplicacao ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mostrarExplicacao && (
                <div className="px-3 pb-3 pt-2 border-t border-zinc-800 space-y-2">
                  <div>
                    <p className="text-xs font-medium text-zinc-300 mb-0.5">Modelos de IA</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">O &ldquo;cérebro&rdquo; — você conversa via chat. Ex: ChatGPT, Claude, Gemini.</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300 mb-0.5">Ferramentas</p>
                    <p className="text-xs text-zinc-500 leading-relaxed">Apps construídos sobre um modelo com funções específicas. Ex: Netlex, Turivius.</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setMostrarSugerir(true)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-colors text-left">
              + Sugerir ferramenta
            </button>

          </div>
        </aside>

        {/* ── Conteúdo principal ── */}
        <div className="flex-1 min-w-0">
          {aba === 'ranking' ? (
            <AbaRanking
              rankingAtual={rankingAtual}
              grupoAtivo={grupoAtivo}
              periodo={periodo}
              maxVotos={maxVotos}
              meusVotos={meusVotos}
              userId={userId}
              handleVoto={handleVoto}
              temFiltros={temFiltros}
              perfisAtivos={perfisAtivos}
              usosAtivos={usosAtivos}
              perfis={perfis}
              usos={usos}
              onLimparFiltros={limparFiltros}
            />
          ) : (
            <AbaGraficos
              ferramentas={ferramentas}
              categorias={categorias}
              perfisAtivos={perfisAtivos}
              usosAtivos={usosAtivos}
              grupoAtivo={grupoAtivo}
              votosGeral={votosGeralState}
              votosSemana={votosSemana}
              votosMes={votosMes}
              votosDiario={votosDiario}
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   Aba Ranking
──────────────────────────────────────────── */
function AbaRanking({
  rankingAtual, grupoAtivo, periodo, maxVotos, meusVotos, userId,
  handleVoto, temFiltros, perfisAtivos, usosAtivos, perfis, usos, onLimparFiltros,
}: {
  rankingAtual: (Ferramenta & { votos_total: number })[]
  grupoAtivo: 'modelo' | 'ferramenta'
  periodo: Periodo
  maxVotos: number
  meusVotos: { ferramenta_id: string; categoria_uso_id: string }[]
  userId: string | null
  handleVoto: (id: string) => void
  temFiltros: boolean
  perfisAtivos: string[]
  usosAtivos: string[]
  perfis: Categoria[]
  usos: Categoria[]
  apenasDestaque?: boolean
  onLimparFiltros: () => void
}) {
  // Para o botão de voto, rastreamos por ferramenta_id apenas (sem categoria específica)
  const votouSet = new Set(meusVotos.map(v => v.ferramenta_id))

  return (
    <>
      {/* Cabeçalho com filtros ativos */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold text-white">
            {grupoAtivo === 'modelo' ? 'Modelos de IA' : 'Ferramentas'}
            {temFiltros && (
              <span className="text-zinc-500 font-normal text-sm ml-2">
                · {[
                  ...perfisAtivos.map(id => perfis.find(p => p.id === id)?.nome),
                  ...usosAtivos.map(id => usos.find(u => u.id === id)?.nome),
                ].filter(Boolean).join(', ')}
              </span>
            )}
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            {periodo === 'geral' ? 'Ranking geral' : periodo === 'mes' ? 'Últimos 30 dias' : 'Últimos 7 dias'}
            {periodo !== 'geral' && <span className="text-zinc-700"> · votação disponível apenas no ranking geral</span>}
            {temFiltros && <span className="text-zinc-700"> · votos somados das categorias filtradas</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {temFiltros && (
            <button onClick={onLimparFiltros} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors border border-zinc-800 px-2.5 py-1 rounded-lg">
              ✕ Limpar filtros
            </button>
          )}
          <span className="text-xs text-zinc-600 tabular-nums">{rankingAtual.length} itens</span>
        </div>
      </div>

      {!userId && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">Faça login para votar nos favoritos da sua área</p>
          <Link href="/login" className="text-sm text-green-400 hover:underline shrink-0 font-medium">Entrar</Link>
        </div>
      )}

      {rankingAtual.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl">
          <p className="text-zinc-500 text-sm mb-3">Nenhum resultado para os filtros selecionados.</p>
          <button onClick={onLimparFiltros} className="text-xs text-green-400 hover:underline">Limpar filtros</button>
        </div>
      ) : (
        <div className="space-y-2">
          {rankingAtual.map((f, i) => {
            const jaVotou  = votouSet.has(f.id)
            const pct      = maxVotos > 0 ? (f.votos_total / maxVotos) * 100 : 0
            const temVotos = f.votos_total > 0
            const isPodio  = i < 3 && temVotos
            const barColor = isPodio ? PODIO_BAR[i] : DEFAULT_BAR

            return (
              <div key={f.id}
                className={`rounded-2xl border transition-all ${isPodio ? PODIO_BG[i] : 'border-zinc-800/60 bg-zinc-900/20 hover:border-zinc-700'}`}>
                <div className="flex items-start gap-4 px-5 py-4">
                  <div className="w-7 text-center pt-1 shrink-0">
                    <span className={`text-lg font-black leading-none ${isPodio ? PODIO_NUM[i] : 'text-zinc-700'}`}>
                      {temVotos ? i + 1 : '—'}
                    </span>
                  </div>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-base border ${
                    grupoAtivo === 'modelo' ? 'bg-violet-500/15 border-violet-500/20 text-violet-300' : 'bg-blue-500/15 border-blue-500/20 text-blue-300'
                  }`}>{f.nome[0]?.toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/ranking/${f.id}`} className="text-sm font-semibold text-white hover:text-green-300 transition-colors">
                        {f.nome}
                      </Link>
                      {f.destaque && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 shrink-0">★ Destaque</span>}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/50 shrink-0">{TIPO_LABEL[f.tipo] ?? f.tipo}</span>
                    </div>
                    {f.descricao && <p className="text-xs text-zinc-500 mb-2 leading-relaxed line-clamp-2">{f.descricao}</p>}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-zinc-800/80 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: temVotos ? `${Math.max(pct, 3)}%` : '0%' }} />
                      </div>
                      <span className="text-xs text-zinc-500 tabular-nums shrink-0 w-20 text-right">
                        {temVotos ? `${f.votos_total} ${f.votos_total === 1 ? 'voto' : 'votos'}` : 'sem votos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {f.url && (
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
                          {f.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
                        </a>
                      )}
                      <Link href={`/ranking/${f.id}`} className="text-[11px] text-zinc-600 hover:text-green-400 transition-colors ml-auto">
                        Ver review →
                      </Link>
                    </div>
                  </div>
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
                    }`}>
                    <svg className="w-4 h-4" fill={jaVotou && periodo === 'geral' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    {temVotos && <span className="text-[10px] font-semibold tabular-nums leading-none">{f.votos_total}</span>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

/* ────────────────────────────────────────────
   Aba Gráficos
──────────────────────────────────────────── */
function AbaGraficos({
  ferramentas, categorias, perfisAtivos, usosAtivos, grupoAtivo,
  votosGeral, votosSemana, votosMes, votosDiario,
}: {
  ferramentas: Ferramenta[]
  categorias: Categoria[]
  perfisAtivos: string[]
  usosAtivos: string[]
  grupoAtivo: 'modelo' | 'ferramenta'
  votosGeral: VotoContagem[]
  votosSemana: VotoContagem[]
  votosMes: VotoContagem[]
  votosDiario: VotoDiario[]
}) {
  const ferrsGrupo = ferramentas.filter(f => {
    if (f.grupo !== grupoAtivo) return false
    if (perfisAtivos.length > 0 && !perfisAtivos.some(pid => f.perfil_ids?.includes(pid))) return false
    if (usosAtivos.length > 0   && !usosAtivos.some(uid => f.uso_ids?.includes(uid)))   return false
    return true
  })

  const catIds = useMemo(() => {
    const sel = [...perfisAtivos, ...usosAtivos]
    return sel.length > 0 ? sel : categorias.map(c => c.id)
  }, [perfisAtivos, usosAtivos, categorias])

  const nomeFiltro = [
    ...perfisAtivos.map(id => categorias.find(c => c.id === id)?.nome),
    ...usosAtivos.map(id => categorias.find(c => c.id === id)?.nome),
  ].filter(Boolean).join(', ') || 'Todos'

  // Comparativo geral/mês/semana
  const comparativo = useMemo(() => {
    return ferrsGrupo
      .map(f => ({
        ...f,
        geral:  catIds.reduce((s, cid) => s + (votosGeral.find(v => v.ferramenta_id === f.id && v.categoria_uso_id === cid)?.total_votos ?? 0), 0),
        mes:    catIds.reduce((s, cid) => s + (votosMes.find(v => v.ferramenta_id === f.id && v.categoria_uso_id === cid)?.total_votos ?? 0), 0),
        semana: catIds.reduce((s, cid) => s + (votosSemana.find(v => v.ferramenta_id === f.id && v.categoria_uso_id === cid)?.total_votos ?? 0), 0),
      }))
      .filter(f => f.geral > 0)
      .sort((a, b) => b.geral - a.geral)
      .slice(0, 6)
  }, [ferrsGrupo, catIds, votosGeral, votosMes, votosSemana])

  const maxComp = Math.max(...comparativo.map(f => f.geral), 1)

  // Top 3 por categoria
  const top3PorCategoria = useMemo(() => {
    return categorias.map(cat => {
      const itens = ferrsGrupo
        .map(f => ({ ...f, votos: votosGeral.find(v => v.ferramenta_id === f.id && v.categoria_uso_id === cat.id)?.total_votos ?? 0 }))
        .filter(f => f.votos > 0)
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 3)
      return { cat, itens }
    }).filter(r => r.itens.length > 0)
  }, [ferrsGrupo, categorias, votosGeral])

  // Evolução histórica
  const top5 = useMemo(() => ferrsGrupo
    .map(f => ({ id: f.id, nome: f.nome, total: catIds.reduce((s, cid) => s + (votosGeral.find(v => v.ferramenta_id === f.id && v.categoria_uso_id === cid)?.total_votos ?? 0), 0) }))
    .filter(f => f.total > 0).sort((a, b) => b.total - a.total).slice(0, 5),
  [ferrsGrupo, catIds, votosGeral])

  const serieHistorica = useMemo(() => {
    if (top5.length === 0 || votosDiario.length === 0) return { dias: [], series: [] }
    const diasSet = new Set<string>()
    votosDiario.filter(v => catIds.includes(v.categoria_uso_id) && top5.some(t => t.id === v.ferramenta_id)).forEach(v => diasSet.add(v.dia))
    const dias = Array.from(diasSet).sort()
    if (dias.length === 0) return { dias: [], series: [] }
    const series = top5.map((t, ci) => {
      let acc = 0
      return { id: t.id, nome: t.nome, cor: LINHA_CORES[ci % LINHA_CORES.length],
        pontos: dias.map(dia => { acc += votosDiario.find(v => v.ferramenta_id === t.id && catIds.includes(v.categoria_uso_id) && v.dia === dia)?.total_votos ?? 0; return acc }) }
    })
    return { dias, series }
  }, [top5, votosDiario, catIds])

  return (
    <div className="space-y-8">
      <div className="px-4 py-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-500">
        Mostrando: <span className="text-zinc-300">{grupoAtivo === 'modelo' ? 'Modelos de IA' : 'Ferramentas'}</span>
        {' · '}<span className="text-zinc-300">{nomeFiltro}</span>
      </div>

      {/* Comparativo */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-1">Comparativo de períodos</h3>
        <p className="text-xs text-zinc-600 mb-4">Votos recebidos no total, último mês e última semana</p>
        {comparativo.length === 0 ? <EmptyChart /> : (
          <div className="space-y-3">
            {comparativo.map((f, i) => (
              <div key={f.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border ${grupoAtivo === 'modelo' ? 'bg-violet-500/15 border-violet-500/20 text-violet-300' : 'bg-blue-500/15 border-blue-500/20 text-blue-300'}`}>{f.nome[0]?.toUpperCase()}</div>
                  <span className="text-sm font-medium text-white">{f.nome}</span>
                  <span className={`ml-auto text-xs font-bold tabular-nums ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : 'text-zinc-500'}`}>#{i + 1}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Geral',   value: f.geral,  color: 'bg-green-500' },
                    { label: '30 dias', value: f.mes,    color: 'bg-blue-400' },
                    { label: '7 dias',  value: f.semana, color: 'bg-violet-400' },
                  ].map(b => (
                    <div key={b.label} className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-600 w-14 shrink-0">{b.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${b.color}`}
                          style={{ width: `${Math.max((b.value / maxComp) * 100, b.value > 0 ? 2 : 0)}%` }} />
                      </div>
                      <span className="text-[11px] text-zinc-500 tabular-nums w-8 text-right shrink-0">{b.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top 3 por categoria */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-1">Top 3 por categoria</h3>
        <p className="text-xs text-zinc-600 mb-4">As três mais votadas em cada categoria</p>
        {top3PorCategoria.length === 0 ? <EmptyChart /> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {top3PorCategoria.map(({ cat, itens }) => {
              const maxV = itens[0]?.votos ?? 1
              return (
                <div key={cat.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/20">
                  <p className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cat.tipo_categoria === 'perfil' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    {cat.nome}
                    <span className="text-zinc-700 font-normal ml-auto text-[10px]">{cat.tipo_categoria === 'perfil' ? 'Perfil' : 'Uso'}</span>
                  </p>
                  <div className="space-y-2">
                    {itens.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-2">
                        <span className={`text-xs font-black w-4 text-center shrink-0 ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-zinc-400' : 'text-amber-600'}`}>{idx + 1}</span>
                        <span className="text-xs text-zinc-300 truncate flex-1">{f.nome}</span>
                        <div className="w-20 h-1.5 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                          <div className={`h-full rounded-full ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-zinc-400' : 'bg-amber-600'}`}
                            style={{ width: `${Math.max((f.votos / maxV) * 100, 8)}%` }} />
                        </div>
                        <span className="text-[11px] text-zinc-600 tabular-nums w-6 text-right shrink-0">{f.votos}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Evolução acumulada */}
      <section>
        <h3 className="text-sm font-semibold text-white mb-1">Evolução acumulada</h3>
        <p className="text-xs text-zinc-600 mb-4">Crescimento acumulado de votos ao longo do tempo</p>
        {serieHistorica.dias.length === 0
          ? <EmptyChart mensagem="Dados históricos serão exibidos conforme os votos acumulam." />
          : <GraficoLinha dias={serieHistorica.dias} series={serieHistorica.series} />}
      </section>
    </div>
  )
}

/* ────────────────────────────────────────────
   Gráfico de linha SVG
──────────────────────────────────────────── */
function GraficoLinha({ dias, series }: { dias: string[]; series: { id: string; nome: string; pontos: number[]; cor: { stroke: string; bg: string } }[] }) {
  const W = 600, H = 180
  const PAD = { top: 12, right: 16, bottom: 28, left: 32 }
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...series.flatMap(s => s.pontos), 1)
  const x = (i: number) => PAD.left + (dias.length <= 1 ? cW / 2 : (i / (dias.length - 1)) * cW)
  const y = (v: number) => PAD.top + cH - (v / maxVal) * cH
  const yTicks = [0, 0.5, 1].map(t => Math.round(t * maxVal))
  const xStep = Math.max(1, Math.floor(dias.length / 5))
  const fmt = (iso: string) => { const [,m,d] = iso.split('-'); return `${d}/${m}` }
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
      <div className="flex flex-wrap gap-3 mb-4">
        {series.map(s => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className={`w-3 h-1.5 rounded-full inline-block ${s.cor.bg}`} />
            <span className="text-xs text-zinc-400">{s.nome}</span>
          </div>
        ))}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280 }}>
          {yTicks.map(t => (
            <g key={t}>
              <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} stroke="#27272a" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" fontSize={9} fill="#52525b">{t}</text>
            </g>
          ))}
          {dias.filter((_, i) => i % xStep === 0 || i === dias.length - 1).map(dia => (
            <text key={dia} x={x(dias.indexOf(dia))} y={H - 6} textAnchor="middle" fontSize={9} fill="#52525b">{fmt(dia)}</text>
          ))}
          {series.map(s => (
            <path key={s.id}
              d={s.pontos.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
              fill="none" stroke={s.cor.stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {series.map(s => (
            <circle key={s.id} cx={x(s.pontos.length - 1)} cy={y(s.pontos[s.pontos.length - 1])} r={3} fill={s.cor.stroke} />
          ))}
        </svg>
      </div>
    </div>
  )
}

function EmptyChart({ mensagem }: { mensagem?: string }) {
  return (
    <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
      <svg className="w-8 h-8 text-zinc-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      <p className="text-zinc-600 text-sm">{mensagem ?? 'Sem dados suficientes para este gráfico ainda.'}</p>
    </div>
  )
}

function ContatoSugestao() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Sugerir ferramenta</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">O ranking é curado pela equipe Midori para garantir qualidade e relevância para o mercado jurídico brasileiro.</p>
      </div>
      <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
        <p className="text-sm font-medium text-white">Você representa uma empresa com uma ferramenta de IA para o mundo jurídico?</p>
        <p className="text-sm text-zinc-500 leading-relaxed">Entre em contato pelo e-mail abaixo. Nossa equipe avalia a ferramenta e, se aprovada, ela é adicionada com uma descrição imparcial para que os usuários possam votar.</p>
        <a href="mailto:contato@midori.law" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors text-sm font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          contato@midori.law
        </a>
      </div>
      <p className="text-xs text-zinc-600 leading-relaxed">Plataforma independente. Inclusão não é paga. Posição determinada exclusivamente pelos votos da comunidade.</p>
    </div>
  )
}
